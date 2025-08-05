const Product = require('../models/Product');
const Recipe = require('../models/Recipe');
const Store = require('../models/Store');
const { checkStockBalances } = require('../utils/checkStockBalances');
const { calculateRecipeIngredientCost } = require('../utils/costCalculation_FIXED');
const costCache = require('../utils/costCache'); // ✅ THÊM CACHE SUPPORT
const costUpdateManager = require('../utils/costUpdateManager'); // ✅ THÊM UPDATE MANAGER
const websocketManager = require('../utils/websocketManager'); // ✅ THÊM WEBSOCKET SUPPORT

const compositeProductController = {
  /**
   * Tạo sản phẩm composite mới
   */
  createComposite: async (req, res) => {
    try {
      const { 
        productCode, 
        name, 
        description, 
        capacity, 
        childProducts, 
        storeId,
        recipeId // Thêm recipeId để chọn công thức
      } = req.body;

      // Validate child products exist (if provided)
      let totalCostPerServing = 0;
      let recipeCostInfo = null;
      let expiryHours = 24; // Default value

      if (recipeId) {
        // Tính toán chi phí từ công thức
        try {
          const recipe = await Recipe.findById(recipeId).populate('ingredients.ingredientId');
          if (!recipe) {
            return res.status(404).json({ error: 'recipe_not_found' });
          }

          // Verify recipe belongs to same owner and store
          if (recipe.ownerId.toString() !== req.user._id.toString() || 
              recipe.storeId.toString() !== storeId) {
            return res.status(403).json({ error: 'recipe_access_denied' });
          }

          // Get expiry hours from recipe
          expiryHours = recipe.expiryHours || 24;

          const costCalculation = await calculateRecipeIngredientCost(recipeId);
          recipeCostInfo = {
            recipeId: recipeId,
            recipeCost: costCalculation.costPerUnit,
            recipeYield: {
              quantity: recipe.yield?.quantity || 1,
              unit: recipe.yield?.unit || 'phần'
            },
            totalRecipeCost: costCalculation.totalCost
          };
          
          // Chi phí mỗi phần phục vụ từ công thức
          totalCostPerServing = parseFloat(costCalculation.costPerUnit.toString());
        } catch (error) {
          console.error('Error calculating recipe cost:', error);
          return res.status(400).json({ error: 'failed_to_calculate_recipe_cost' });
        }
      }

      // Add child products revenue if provided
      let totalChildProductsRevenue = { sellingPrice: 0, retailPrice: 0 };
      if (childProducts && childProducts.length > 0) {
        const childProductIds = childProducts.map(cp => cp.productId);
        const existingProducts = await Product.find({ 
          _id: { $in: childProductIds }, 
          ownerId: req.user._id,
          storeId: storeId
        });

        if (existingProducts.length !== childProductIds.length) {
          return res.status(400).json({ error: 'some_child_products_not_found' });
        }

        // Calculate total revenue from child products
        for (const childProduct of childProducts) {
          if (childProduct.sellingPrice) {
            totalChildProductsRevenue.sellingPrice += parseFloat(childProduct.sellingPrice);
          }
          if (childProduct.retailPrice) {
            totalChildProductsRevenue.retailPrice += parseFloat(childProduct.retailPrice);
          }
        }
      }

      // Validate that we have recipe cost (recipe is required for composite products)
      if (!recipeId || totalCostPerServing <= 0) {
        return res.status(400).json({ error: 'recipe_required_for_composite_products' });
      }

      // Calculate final pricing: combine recipe cost with child products revenue
      const finalSellingPrice = req.body.price || 
        (totalCostPerServing * 1.3 + totalChildProductsRevenue.sellingPrice);
      const finalRetailPrice = req.body.retailPrice || 
        (totalCostPerServing * 1.5 + totalChildProductsRevenue.retailPrice);

      const compositeProduct = new Product({
        productCode,
        name,
        description,
        price: finalSellingPrice,
        retailPrice: finalRetailPrice,
        costPrice: totalCostPerServing, // Keep recipe cost as the base cost
        minStock: req.body.minStock || 1,
        unit: capacity.unit || 'tô',
        status: 'active',
        ownerId: req.user._id,
        storeId: storeId,
        isComposite: true,
        compositeInfo: {
          capacity: {
            quantity: capacity.quantity,
            unit: capacity.unit
          },
          ...recipeCostInfo, // Spread recipe information if available
          childProducts: childProducts || [],
          currentStock: 0,
          expiryHours: expiryHours || 24
        }
      });

      const savedProduct = await compositeProduct.save();
      
      // Populate references
      if (childProducts && childProducts.length > 0) {
        await savedProduct.populate('compositeInfo.childProducts.productId', 'name unit costPrice');
      }
      if (recipeId) {
        await savedProduct.populate('compositeInfo.recipeId', 'dishName description yield');
      }
      
      // ✅ CACHE THE COMPOSITE COST
      const compositeId = savedProduct._id.toString();
      costCache.setCompositeCost(compositeId, {
        totalCostPerServing,
        capacity: capacity.quantity,
        totalCost: totalCostPerServing * capacity.quantity,
        childProducts: childProducts?.length || 0,
        recipeId: recipeId || null,
        recipeCost: recipeCostInfo?.totalRecipeCost || null,
        markup: {
          price: savedProduct.price,
          retailPrice: savedProduct.retailPrice
        }
      });

      // ✅ BROADCAST COMPOSITE CREATION
      websocketManager.broadcast({
        type: 'COMPOSITE_PRODUCT_CREATED',
        compositeId,
        name: savedProduct.name,
        totalCost: totalCostPerServing * capacity.quantity,
        capacity: capacity.quantity,
        hasRecipe: !!recipeId,
        storeId: storeId
      }, storeId);
      
      res.status(201).json(savedProduct);
    } catch (error) {
      console.error('Error creating composite product:', error);
      res.status(500).json({ error: 'failed_to_create_composite_product' });
    }
  },

  /**
   * Chuẩn bị sản phẩm composite (nấu nồi mới)
   */
  prepareComposite: async (req, res) => {
    try {
      const { id } = req.params;
      const { quantityToPrepare } = req.body; // Số batch muốn chuẩn bị

      const product = await Product.findOne({ 
        _id: id, 
        ownerId: req.user._id, 
        isComposite: true 
      }).populate('compositeInfo.childProducts.productId');

      if (!product) {
        return res.status(404).json({ error: 'composite_product_not_found' });
      }

      // Kiểm tra xem có đủ nguyên liệu để chuẩn bị không
      const requiredIngredients = {};
      for (const childProduct of product.compositeInfo.childProducts) {
        const childProd = childProduct.productId;
        const totalNeeded = childProduct.quantityPerServing * 
                          product.compositeInfo.capacity.quantity * 
                          (quantityToPrepare || 1);
        
        requiredIngredients[childProd._id] = {
          name: childProd.name,
          needed: totalNeeded,
          unit: childProduct.unit,
          available: 0 // Sẽ cập nhật từ inventory
        };
      }

      // TODO: Kiểm tra inventory thực tế ở đây
      
      // Cập nhật stock và thời gian chuẩn bị
      const totalServings = product.compositeInfo.capacity.quantity * (quantityToPrepare || 1);
      product.compositeInfo.currentStock += totalServings;
      product.compositeInfo.lastPreparedAt = new Date();

      await product.save();

      res.status(200).json({
        message: 'composite_product_prepared_successfully',
        product: product,
        totalServingsPrepared: totalServings,
        requiredIngredients: requiredIngredients
      });
    } catch (error) {
      console.error('Error preparing composite product:', error);
      res.status(500).json({ error: 'failed_to_prepare_composite_product' });
    }
  },

  /**
   * Phục vụ sản phẩm composite (giảm stock)
   */
  serveComposite: async (req, res) => {
    try {
      const { id } = req.params;
      const { quantityToServe } = req.body;

      const product = await Product.findOne({ 
        _id: id, 
        ownerId: req.user._id, 
        isComposite: true 
      });

      if (!product) {
        return res.status(404).json({ error: 'composite_product_not_found' });
      }

      // Kiểm tra hết hạn
      if (product.compositeInfo.lastPreparedAt) {
        const hoursElapsed = (new Date() - product.compositeInfo.lastPreparedAt) / (1000 * 60 * 60);
        if (hoursElapsed > product.compositeInfo.expiryHours) {
          return res.status(400).json({ 
            error: 'composite_product_expired',
            hoursElapsed: hoursElapsed,
            expiryHours: product.compositeInfo.expiryHours
          });
        }
      }

      // Kiểm tra stock
      if (product.compositeInfo.currentStock < quantityToServe) {
        return res.status(400).json({ 
          error: 'insufficient_stock',
          available: product.compositeInfo.currentStock,
          requested: quantityToServe
        });
      }

      // Giảm stock
      product.compositeInfo.currentStock -= quantityToServe;
      await product.save();

      res.status(200).json({
        message: 'composite_product_served_successfully',
        served: quantityToServe,
        remainingStock: product.compositeInfo.currentStock
      });
    } catch (error) {
      console.error('Error serving composite product:', error);
      res.status(500).json({ error: 'failed_to_serve_composite_product' });
    }
  },

  /**
   * Lấy danh sách sản phẩm composite
   */
  getMyComposites: async (req, res) => {
    try {
      const { storeCode } = req.params;
      
      let filter = { ownerId: req.user._id, isComposite: true, deleted: false };
      
      if (storeCode) {
        const store = await Store.findOne({ storeCode, ownerId: req.user._id });
        if (!store) {
          return res.status(404).json({ error: 'store_not_found' });
        }
        filter.storeId = store._id;
      }

      const compositeProducts = await Product.find(filter)
        .populate('compositeInfo.childProducts.productId', 'name unit costPrice')
        .sort('-updatedAt');

      // Thêm thông tin về trạng thái hết hạn
      const productsWithStatus = compositeProducts.map(product => {
        let status = 'fresh';
        if (product.compositeInfo.lastPreparedAt) {
          const hoursElapsed = (new Date() - product.compositeInfo.lastPreparedAt) / (1000 * 60 * 60);
          if (hoursElapsed > product.compositeInfo.expiryHours) {
            status = 'expired';
          } else if (hoursElapsed > product.compositeInfo.expiryHours * 0.8) {
            status = 'expiring_soon';
          }
        }
        
        return {
          ...product.toJSON(),
          statusInfo: {
            status,
            hoursElapsed: product.compositeInfo.lastPreparedAt ? 
              (new Date() - product.compositeInfo.lastPreparedAt) / (1000 * 60 * 60) : 0
          }
        };
      });

      res.status(200).json(productsWithStatus);
    } catch (error) {
      console.error('Error fetching composite products:', error);
      res.status(500).json({ error: 'failed_to_fetch_composite_products' });
    }
  },

  /**
   * Lấy chi tiết sản phẩm composite để edit
   */
  getCompositeDetails: async (req, res) => {
    try {
      const { id } = req.params;
      const { storeCode } = req.query;
      
      let filter = { _id: id, ownerId: req.user._id, isComposite: true, deleted: false };
      
      if (storeCode) {
        const store = await Store.findOne({ storeCode, ownerId: req.user._id });
        if (!store) {
          return res.status(404).json({ error: 'store_not_found' });
        }
        filter.storeId = store._id;
      }

      const compositeProduct = await Product.findOne(filter)
        .populate({
          path: 'compositeInfo.childProducts.productId',
          select: 'name unit costPrice retailPrice description'
        })
        .populate({
          path: 'compositeInfo.recipeId',
          select: 'dishName description yield expiryHours ingredients',
          populate: {
            path: 'ingredients.ingredientId',
            select: 'name unit standardCost'
          }
        });

      if (!compositeProduct) {
        return res.status(404).json({ error: 'composite_product_not_found' });
      }

      // Add status information
      let status = 'fresh';
      if (compositeProduct.compositeInfo.lastPreparedAt) {
        const hoursElapsed = (new Date() - compositeProduct.compositeInfo.lastPreparedAt) / (1000 * 60 * 60);
        if (hoursElapsed > compositeProduct.compositeInfo.expiryHours) {
          status = 'expired';
        } else if (hoursElapsed > compositeProduct.compositeInfo.expiryHours * 0.8) {
          status = 'expiring_soon';
        }
      }

      const result = {
        ...compositeProduct.toJSON(),
        statusInfo: {
          status,
          hoursElapsed: compositeProduct.compositeInfo.lastPreparedAt ? 
            (new Date() - compositeProduct.compositeInfo.lastPreparedAt) / (1000 * 60 * 60) : 0
        }
      };

      res.status(200).json(result);
    } catch (error) {
      console.error('Error fetching composite product details:', error);
      res.status(500).json({ error: 'failed_to_fetch_composite_details' });
    }
  },

  /**
   * Cập nhật chỉ giá bán của sản phẩm con trong composite product
   */
  updateChildProductPrices: async (req, res) => {
    try {
      const { id } = req.params;
      const { childProducts } = req.body;

      if (!childProducts || !Array.isArray(childProducts)) {
        return res.status(400).json({ error: 'child_products_array_required' });
      }

      const product = await Product.findOne({ 
        _id: id, 
        ownerId: req.user._id, 
        isComposite: true 
      });

      if (!product) {
        return res.status(404).json({ error: 'composite_product_not_found' });
      }

      // Validate và cập nhật giá của child products
      for (const childUpdate of childProducts) {
        const existingChildIndex = product.compositeInfo.childProducts.findIndex(
          cp => cp.productId.toString() === childUpdate.productId
        );

        if (existingChildIndex !== -1) {
          // Chỉ cập nhật sellingPrice và retailPrice
          if (childUpdate.sellingPrice !== undefined) {
            product.compositeInfo.childProducts[existingChildIndex].sellingPrice = childUpdate.sellingPrice;
          }
          if (childUpdate.retailPrice !== undefined) {
            product.compositeInfo.childProducts[existingChildIndex].retailPrice = childUpdate.retailPrice;
          }
        }
      }

      const updatedProduct = await product.save();
      await updatedProduct.populate('compositeInfo.childProducts.productId', 'name unit costPrice');

      res.status(200).json(updatedProduct);
    } catch (error) {
      console.error('Error updating child product prices:', error);
      res.status(500).json({ error: 'failed_to_update_child_product_prices' });
    }
  },

  /**
   * Cập nhật sản phẩm composite
   */
  updateComposite: async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const product = await Product.findOne({ 
        _id: id, 
        ownerId: req.user._id, 
        isComposite: true 
      });

      if (!product) {
        return res.status(404).json({ error: 'composite_product_not_found' });
      }

      // Nếu cập nhật child products, cần validate và tính lại cost
      if (updateData.compositeInfo && updateData.compositeInfo.childProducts) {
        const childProductIds = updateData.compositeInfo.childProducts.map(cp => cp.productId);
        const existingProducts = await Product.find({ 
          _id: { $in: childProductIds }, 
          ownerId: req.user._id 
        });

        if (existingProducts.length !== childProductIds.length) {
          return res.status(400).json({ error: 'some_child_products_not_found' });
        }

        // Tính lại cost
        let totalCostPerServing = 0;
        for (const childProduct of updateData.compositeInfo.childProducts) {
          const product = existingProducts.find(p => p._id.toString() === childProduct.productId);
          if (product) {
            totalCostPerServing += parseFloat(product.costPrice) * childProduct.quantityPerServing;
          }
        }
        updateData.costPrice = totalCostPerServing;
      }

      Object.assign(product, updateData);
      const updatedProduct = await product.save();
      await updatedProduct.populate('compositeInfo.childProducts.productId', 'name unit costPrice');

      res.status(200).json(updatedProduct);
    } catch (error) {
      console.error('Error updating composite product:', error);
      res.status(500).json({ error: 'failed_to_update_composite_product' });
    }
  },

  /**
   * Tính toán giá cho sản phẩm composite từ recipe
   */
  calculatePriceFromRecipe: async (req, res) => {
    try {
      const { recipeId, capacity } = req.body;
      
      console.log('calculatePriceFromRecipe - Received data:', { recipeId, capacity, bodyKeys: Object.keys(req.body) });

      if (!recipeId) {
        return res.status(400).json({ error: 'recipe_id_required' });
      }

      // Validate ObjectId format
      if (!recipeId.match(/^[0-9a-fA-F]{24}$/)) {
        console.log('Invalid ObjectId format:', recipeId);
        return res.status(400).json({ error: 'invalid_recipe_id_format' });
      }

      if (!capacity || !capacity.quantity || !capacity.unit) {
        return res.status(400).json({ error: 'capacity_information_required' });
      }

      // Kiểm tra recipe tồn tại và thuộc về user
      const recipe = await Recipe.findOne({
        _id: recipeId,
        ownerId: req.user._id,
        deleted: false
      }).populate('ingredients.ingredientId', 'name unit standardCost averageCost');

      if (!recipe) {
        return res.status(404).json({ error: 'recipe_not_found' });
      }

      // Tính toán chi phí từ recipe
      const costCalculation = await calculateRecipeIngredientCost(recipeId);
      
      // Chi phí mỗi phần phục vụ
      const costPerServing = parseFloat(costCalculation.costPerUnit.toString());
      
      // Tổng chi phí cho toàn bộ capacity
      const totalCapacityCost = costPerServing * capacity.quantity;
      
      // Đề xuất giá với các mức markup khác nhau
      const response = {
        costPerServing: costPerServing,
        totalRecipeCost: totalCapacityCost,
        recipeYield: recipe.yield || capacity.quantity,
        capacity: {
          quantity: capacity.quantity,
          unit: capacity.unit
        },
        suggestedPrice: totalCapacityCost * 1.3, // 30% markup for wholesale
        suggestedRetailPrice: totalCapacityCost * 1.5, // 50% markup for retail
        recipeInfo: {
          id: recipe._id,
          name: recipe.dishName,
          description: recipe.description,
          yield: recipe.yield,
          totalRecipeCost: costCalculation.totalCost,
          costBreakdown: costCalculation.costBreakdown
        }
      };

      res.status(200).json(response);
    } catch (error) {
      console.error('Error calculating price from recipe:', error);
      res.status(500).json({ error: 'failed_to_calculate_price_from_recipe' });
    }
  },

  /**
   * Xóa sản phẩm composite
   */
  deleteComposite: async (req, res) => {
    try {
      const { id } = req.params;

      const product = await Product.findOne({ 
        _id: id, 
        ownerId: req.user._id, 
        isComposite: true 
      });

      if (!product) {
        return res.status(404).json({ error: 'composite_product_not_found' });
      }

      product.deleted = true;
      await product.save();

      res.status(200).json({ message: 'composite_product_deleted_successfully' });
    } catch (error) {
      console.error('Error deleting composite product:', error);
      res.status(500).json({ error: 'failed_to_delete_composite_product' });
    }
  }
};

module.exports = compositeProductController;
