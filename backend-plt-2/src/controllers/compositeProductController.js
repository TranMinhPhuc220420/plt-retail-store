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
        storeId,
        recipeId, // Recipe là bắt buộc cho composite products
        childProducts = [] // Accept childProducts from frontend
      } = req.body;

      // Validate recipe is required
      if (!recipeId) {
        return res.status(400).json({ error: 'recipe_required_for_composite_products' });
      }

      let totalCostPerServing = 0;
      let recipeCostInfo = null;
      let expiryHours = 24; // Default value

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

      // Validate that we have recipe cost
      if (totalCostPerServing <= 0) {
        return res.status(400).json({ error: 'invalid_recipe_cost_calculation' });
      }

      // Validate child products if provided
      if (childProducts && childProducts.length > 0) {
        // Validate that all child products exist and belong to the same store/owner
        const childProductIds = childProducts.map(cp => cp.productId);
        const existingProducts = await Product.find({
          _id: { $in: childProductIds },
          ownerId: req.user._id,
          storeId: storeId,
          isComposite: false, // Child products cannot be composite products
          deleted: false
        });

        if (existingProducts.length !== childProductIds.length) {
          return res.status(400).json({ 
            error: 'invalid_child_products',
            message: 'Some child products do not exist or do not belong to your store'
          });
        }

        // Validate child product data structure
        for (const childProduct of childProducts) {
          if (!childProduct.productId || 
              !childProduct.name ||
              childProduct.quantityPerServing === undefined || 
              childProduct.quantityPerServing < 0 ||
              !childProduct.unit ||
              childProduct.costPrice === undefined ||
              childProduct.costPrice < 0 ||
              childProduct.sellingPrice === undefined ||
              childProduct.sellingPrice < 0 ||
              childProduct.retailPrice === undefined ||
              childProduct.retailPrice < 0) {
            return res.status(400).json({ 
              error: 'invalid_child_product_data',
              message: 'Child product data is incomplete or invalid'
            });
          }
        }
      }

      // Calculate final pricing based on recipe cost only
      const finalSellingPrice = req.body.price || (totalCostPerServing * 1.3);
      const finalRetailPrice = req.body.retailPrice || (totalCostPerServing * 1.5);

      const compositeProduct = new Product({
        productCode,
        name,
        description,
        price: finalSellingPrice,
        retailPrice: finalRetailPrice,
        costPrice: totalCostPerServing, // Recipe cost as the base cost
        minStock: req.body.minStock || 1,
        unit: 'pice', // Default unit for composite products (required by schema)
        status: 'active',
        ownerId: req.user._id,
        storeId: storeId,
        isComposite: true,
        compositeInfo: {
          capacity: {
            quantity: capacity.quantity,
            unit: capacity.unit || 'tô' // Use specific unit for capacity
          },
          ...recipeCostInfo, // Spread recipe information
          childProducts: childProducts || [], // Use childProducts from request body
          currentStock: 0,
          expiryHours: expiryHours || 24
        }
      });

      console.log('childProducts:', childProducts);

      const savedProduct = await compositeProduct.save();

      // Populate recipe reference and child products
      await savedProduct.populate([
        {
          path: 'compositeInfo.recipeId', 
          select: 'dishName description yield ingredients'
        },
        {
          path: 'compositeInfo.childProducts.productId',
          select: 'productCode unit price retailPrice'
        }
      ]);

      // ✅ CACHE THE COMPOSITE COST
      const compositeId = savedProduct._id.toString();
      costCache.setCompositeCost(compositeId, {
        totalCostPerServing,
        capacity: capacity.quantity,
        totalCost: totalCostPerServing * capacity.quantity,
        recipeId: recipeId,
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
        hasRecipe: true,
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
      const { quantityToPrepare = 1 } = req.body; // Số batch muốn chuẩn bị

      // Validate input
      if (!quantityToPrepare || quantityToPrepare < 1 || quantityToPrepare > 10) {
        return res.status(400).json({
          error: 'invalid_quantity_to_prepare',
          message: 'Quantity to prepare must be between 1 and 10'
        });
      }

      const product = await Product.findOne({
        _id: id,
        ownerId: req.user._id,
        isComposite: true,
        deleted: false
      })
      .populate({
        path: 'compositeInfo.recipeId',
        select: 'dishName ingredients yield',
        populate: {
          path: 'ingredients.ingredientId',
          select: 'name unit stockQuantity'
        }
      });

      if (!product) {
        return res.status(404).json({ error: 'composite_product_not_found' });
      }

      // Validate composite product has valid structure
      if (!product.compositeInfo?.capacity?.quantity || product.compositeInfo.capacity.quantity <= 0) {
        return res.status(400).json({
          error: 'invalid_composite_structure',
          message: 'Composite product has invalid capacity configuration'
        });
      }

      // Validate recipe exists
      if (!product.compositeInfo?.recipeId) {
        return res.status(400).json({
          error: 'recipe_not_found',
          message: 'Composite product must have a recipe to be prepared'
        });
      }

      const recipe = product.compositeInfo.recipeId;

      // Calculate how many recipe batches we need to make
      const recipeYield = recipe.yield?.quantity || 1;
      const totalServingsNeeded = product.compositeInfo.capacity.quantity * quantityToPrepare;
      const recipeBatchesNeeded = Math.ceil(totalServingsNeeded / recipeYield);

      console.log('Preparation calculation:', {
        quantityToPrepare,
        capacityPerBatch: product.compositeInfo.capacity.quantity,
        totalServingsNeeded,
        recipeYield,
        recipeBatchesNeeded
      });

      // Calculate required ingredients and check availability
      const requiredIngredients = {};
      const unavailableIngredients = [];

      if (!recipe.ingredients || recipe.ingredients.length === 0) {
        return res.status(400).json({
          error: 'recipe_has_no_ingredients',
          message: 'Recipe must have ingredients to prepare composite product'
        });
      }

      // Check each ingredient in the recipe
      for (const recipeIngredient of recipe.ingredients) {
        const ingredient = recipeIngredient.ingredientId;

        if (!ingredient) {
          return res.status(400).json({
            error: 'ingredient_not_found',
            message: 'One or more ingredients in the recipe are no longer available'
          });
        }

        // Calculate total needed for all recipe batches
        const totalNeededPerRecipeBatch = recipeIngredient.amountUsed;
        const totalNeeded = totalNeededPerRecipeBatch * recipeBatchesNeeded;

        requiredIngredients[ingredient._id] = {
          name: ingredient.name,
          needed: totalNeeded,
          unit: ingredient.unit,
          available: ingredient.stockQuantity || 0,
          neededPerRecipeBatch: totalNeededPerRecipeBatch,
          recipeBatchesNeeded: recipeBatchesNeeded
        };

        // Check if we have enough stock
        if ((ingredient.stockQuantity || 0) < totalNeeded) {
          unavailableIngredients.push({
            name: ingredient.name,
            needed: totalNeeded,
            available: ingredient.stockQuantity || 0,
            unit: ingredient.unit,
            shortfall: totalNeeded - (ingredient.stockQuantity || 0)
          });
        }
      }

      // If ingredients are not available, return error with details
      if (unavailableIngredients.length > 0) {
        return res.status(400).json({
          error: 'insufficient_ingredients',
          message: 'Not enough ingredients to prepare the requested quantity',
          details: unavailableIngredients,
          preparationInfo: {
            quantityToPrepare,
            totalServingsNeeded,
            recipeBatchesNeeded,
            recipeYield
          }
        });
      }

      // Import Ingredient model to update stock
      const Ingredient = require('../models/Ingredient');

      // Deduct ingredients from stock
      for (const recipeIngredient of recipe.ingredients) {
        const ingredient = recipeIngredient.ingredientId;
        const totalNeeded = recipeIngredient.amountUsed * recipeBatchesNeeded;

        // Update ingredient stock
        await Ingredient.findByIdAndUpdate(ingredient._id, {
          $inc: { stockQuantity: -totalNeeded }
        });

        console.log(`Updated ingredient ${ingredient.name}: deducted ${totalNeeded} ${ingredient.unit}`);
      }

      // Update composite product stock and timestamp
      product.compositeInfo.currentStock += totalServingsNeeded;
      product.compositeInfo.lastPreparedAt = new Date();

      await product.save();

      res.status(200).json({
        message: 'composite_product_prepared_successfully',
        product: product,
        totalServingsPrepared: totalServingsNeeded,
        recipeBatchesMade: recipeBatchesNeeded,
        requiredIngredients: requiredIngredients,
        preparationDetails: {
          quantityToPrepare,
          servingsPerBatch: product.compositeInfo.capacity.quantity,
          totalServings: totalServingsNeeded,
          newStock: product.compositeInfo.currentStock,
          recipeYield,
          recipeBatchesNeeded
        }
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
        .populate({
          path: 'compositeInfo.recipeId',
          select: 'dishName description yield ingredients',
          populate: {
            path: 'ingredients.ingredientId',
            select: 'name unit'
          }
        })
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
          path: 'compositeInfo.recipeId',
          select: 'dishName description yield expiryHours ingredients',
          populate: {
            path: 'ingredients.ingredientId',
            select: 'name unit standardCost stockQuantity'
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
   * Cập nhật giá bán của sản phẩm composite
   */
  updateCompositePrice: async (req, res) => {
    try {
      const { id } = req.params;
      const { price, retailPrice } = req.body;

      if (!price && !retailPrice) {
        return res.status(400).json({ error: 'price_or_retail_price_required' });
      }

      const product = await Product.findOne({
        _id: id,
        ownerId: req.user._id,
        isComposite: true
      });

      if (!product) {
        return res.status(404).json({ error: 'composite_product_not_found' });
      }

      console.log('Updating composite product prices:', {
        compositeProductId: id,
        previousPrices: {
          price: product.price,
          retailPrice: product.retailPrice,
          costPrice: product.costPrice
        },
        newPrices: {
          price,
          retailPrice
        }
      });

      // Update composite product prices
      if (price !== undefined) {
        product.price = price;
      }
      if (retailPrice !== undefined) {
        product.retailPrice = retailPrice;
      }

      const updatedProduct = await product.save();
      await updatedProduct.populate({
        path: 'compositeInfo.recipeId',
        select: 'dishName description yield'
      });

      res.status(200).json(updatedProduct);
    } catch (error) {
      console.error('Error updating composite product price:', error);
      res.status(500).json({ error: 'failed_to_update_composite_price' });
    }
  },

  /**
   * Cập nhật giá của child products trong composite product
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
      }).populate('compositeInfo.childProducts.productId');

      if (!product) {
        return res.status(404).json({ error: 'composite_product_not_found' });
      }

      console.log('Updating child product prices:', {
        compositeProductId: id,
        childProductsToUpdate: childProducts.length
      });

      // Update child product prices
      if (product.compositeInfo && product.compositeInfo.childProducts) {
        childProducts.forEach(updateData => {
          const childProduct = product.compositeInfo.childProducts.find(
            child => child.productId._id.toString() === updateData.productId
          );
          
          if (childProduct) {
            if (updateData.sellingPrice !== undefined) {
              childProduct.sellingPrice = updateData.sellingPrice;
            }
            if (updateData.retailPrice !== undefined) {
              childProduct.retailPrice = updateData.retailPrice;
            }
            console.log(`Updated child product ${updateData.productId}:`, {
              sellingPrice: childProduct.sellingPrice,
              retailPrice: childProduct.retailPrice
            });
          }
        });

        // Calculate and update composite product prices based on child products
        const totalSellingPrice = product.compositeInfo.childProducts.reduce(
          (sum, child) => sum + parseFloat(child.sellingPrice.toString() || 0), 0
        );
        const totalRetailPrice = product.compositeInfo.childProducts.reduce(
          (sum, child) => sum + parseFloat(child.retailPrice.toString() || 0), 0
        );

        product.price = totalSellingPrice;
        product.retailPrice = totalRetailPrice;

        console.log('Updated composite prices:', {
          totalSellingPrice,
          totalRetailPrice
        });
      }

      // Ensure unit field is valid for composite products before saving
      if (!['kg', 'l', 'pice'].includes(product.unit)) {
        console.log(`Fixing invalid unit "${product.unit}" to "pice" for composite product`);
        product.unit = 'pice'; // Default valid unit for composite products
      }

      const updatedProduct = await product.save();
      await updatedProduct.populate([
        {
          path: 'compositeInfo.recipeId',
          select: 'dishName description yield'
        },
        {
          path: 'compositeInfo.childProducts.productId',
          select: 'name productCode unit'
        }
      ]);

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

      // If updating recipe, recalculate cost
      if (updateData.compositeInfo && updateData.compositeInfo.recipeId) {
        try {
          const costCalculation = await calculateRecipeIngredientCost(updateData.compositeInfo.recipeId);
          updateData.costPrice = parseFloat(costCalculation.costPerUnit.toString());
          
          // Update recipe info in compositeInfo
          updateData.compositeInfo.recipeCost = costCalculation.costPerUnit;
          updateData.compositeInfo.totalRecipeCost = costCalculation.totalCost;
        } catch (error) {
          console.error('Error recalculating recipe cost:', error);
          return res.status(400).json({ error: 'failed_to_calculate_recipe_cost' });
        }
      }

      Object.assign(product, updateData);
      const updatedProduct = await product.save();
      await updatedProduct.populate({
        path: 'compositeInfo.recipeId',
        select: 'dishName description yield ingredients'
      });

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
