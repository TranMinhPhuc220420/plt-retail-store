const Product = require('../models/Product');
const Store = require('../models/Store');
const Recipe = require('../models/Recipe');
const {
  calculateProductCostFromRecipe,
  getCostBreakdown,
  updateProductPricingBasedOnCost
} = require('../utils/costCalculation');
const {
  checkProductionFeasibility,
  createProductionTransaction
} = require('../utils/inventoryIntegration');
const {
  validateChildProductUpdate
} = require('../utils/productUtils');

const productController = {
  getAllMy: async (req, res) => {
    try {
      const products = await Product.find({ ownerId: req.user.id })
        .populate('recipes', 'dishName description')
        .populate('defaultRecipeId', 'dishName description')
        .populate('productCategory', 'name');
      res.status(200).json(products);
    } catch (error) {
      res.status(500).json({ error: 'failed_to_fetch_products' });
    }
  },

  getMyById: async (req, res) => {
    try {
      const { id } = req.params;
      const product = await Product.findOne({ _id: id, ownerId: req.user._id });
      if (!product) {
        return res.status(404).json({ error: 'product_not_found' });
      }
      res.status(200).json(product);
    } catch (error) {
      res.status(500).json({ error: 'failed_to_fetch_product' });
    }
  },

  getMyByByStoreCode: async (req, res) => {
    try {
      const { storeCode } = req.params;
      if (!storeCode) {
        return res.status(400).json({ error: 'store_code_required' });
      }

      const store = await Store.findOne({ storeCode, ownerId: req.user._id });
      if (!store) {
        return res.status(404).json({ error: 'store_not_found' });
      }

      const products = await Product.find({ storeId: store._id, ownerId: req.user._id })
        .populate('recipes', 'dishName description')
        .populate('defaultRecipeId', 'dishName description')
        .populate('productCategory', 'name');
      res.status(200).json(products);

    } catch (error) {
      res.status(500).json({ error: 'failed_to_fetch_product' });
    }
  },

  createMy: async (req, res) => {
    try {
      const newProduct = new Product({
        ...req.body,
        ownerId: req.user._id
      });
      const savedProduct = await newProduct.save();
      res.status(201).json(savedProduct);
    } catch (error) {
      res.status(500).json({ error: 'failed_to_create_store' });
    }
  },

  updateMy: async (req, res) => {
    try {
      const { id } = req.params;

      const product = await Product.findOne({ _id: id, ownerId: req.user._id });
      if (!product) {
        return res.status(404).json({ error: 'product_not_found' });
      }

      // Validate child product restrictions
      const validation = await validateChildProductUpdate(id, req.user._id, req.body);
      if (!validation.canUpdate) {
        return res.status(400).json({ 
          error: 'child_product_restricted_fields',
          message: `Cannot update fields [${validation.restrictedFields.join(', ')}] for child product of composite "${validation.compositeProductName}". These fields are managed by the composite product.`,
          restrictedFields: validation.restrictedFields,
          compositeProductName: validation.compositeProductName
        });
      }

      Object.assign(product, req.body);
      const updatedProduct = await product.save();

      res.status(200).json(updatedProduct);
    } catch (error) {
      res.status(500).json({ error: 'failed_to_update_store' });
    }
  },

  deleteMy: async (req, res) => {
    try {
      const { id } = req.params;
      const product = await Product.findOne({ _id: id, ownerId: req.user._id });
      if (!product) {
        return res.status(404).json({ error: 'product_not_found' });
      }

      await product.deleteOne();
      res.status(200).json({ message: 'product_deleted_successfully' });

    } catch (error) {
      res.status(500).json({ error: 'failed_to_delete_product' });
    }
  },


  getAllMyInStore: async (req, res) => {
    try {
      const { storeCode } = req.params;
      if (!storeCode) {
        return res.status(400).json({ error: 'store_code_required' });
      }
      const store = await Store.findOne({ storeCode, ownerId: req.user._id, deleted: false });
      if (!store) {
        return res.status(404).json({ error: 'store_not_found' });
      }

      let products = await Product.find({
        storeId: store._id, ownerId: req.user._id, deleted: false,
        $or: [
          { isComposite: { $exists: false } }, // Sản phẩm cũ chưa có field isComposite
          { isComposite: false } // Sản phẩm thường
        ]
      });
      res.status(200).json(products);

    } catch (error) {
      res.status(500).json({ error: 'failed_to_fetch_products' });
    }
  },

  // POS specific endpoint - Get both regular and composite products optimized for POS
  getPOSProducts: async (req, res) => {
    try {
      const { storeCode } = req.params;
      if (!storeCode) {
        return res.status(400).json({ error: 'store_code_required' });
      }
      
      const store = await Store.findOne({ storeCode, ownerId: req.user._id, deleted: false });
      if (!store) {
        return res.status(404).json({ error: 'store_not_found' });
      }

      // Get all products (both regular and composite)
      const products = await Product.find({
        storeId: store._id, 
        ownerId: req.user._id, 
        deleted: false
        // Remove status filter - some products might not have status field or might be inactive but still sellable
      })
      .populate({
        path: 'compositeInfo.childProducts.productId',
        select: 'name productCode unit imageUrl description'
      })
      .populate({
        path: 'compositeInfo.recipeId',
        select: 'dishName description'
      })
      .lean(); // Use lean for better performance

      // Get actual stock balances from StockBalance collection
      const StockBalance = require('../models/StockBalance');
      const stockBalances = await StockBalance.find({
        storeId: store._id,
        deleted: false
      });
      
      // Create a map of productId to total stock quantity
      const stockMap = {};
      stockBalances.forEach(balance => {
        const productId = balance.productId.toString();
        if (!stockMap[productId]) {
          stockMap[productId] = 0;
        }
        stockMap[productId] += balance.quantity;
      });

      console.log('🔍 Found products:', products.length);
      console.log('🔍 Stock balances found:', stockBalances.length);
      console.log('🔍 Products breakdown:', {
        total: products.length,
        composite: products.filter(p => p.isComposite).length,
        regular: products.filter(p => !p.isComposite).length
      });

      // Find all product IDs that are child products of composite products
      const childProductIds = new Set();
      products.forEach(product => {
        if (product.isComposite && product.compositeInfo && product.compositeInfo.childProducts) {
          product.compositeInfo.childProducts.forEach(child => {
            if (child.productId) {
              // Handle both populated object and string ID cases
              const childId = typeof child.productId === 'object' ? child.productId._id : child.productId;
              childProductIds.add(childId.toString());
              console.log(`🔍 Adding child product ID to exclude: ${childId} (from composite "${product.name}")`);
            }
          });
        }
      });

      console.log('🔍 Child product IDs to exclude:', Array.from(childProductIds));

      // Filter out regular products that are child products of composite products
      const filteredProducts = products.filter(product => {
        // Keep composite products always
        if (product.isComposite) return true;
        
        // For regular products, only keep them if they're NOT child products
        const isChildProduct = childProductIds.has(product._id.toString());
        if (isChildProduct) {
          console.log(`🔍 Excluding regular product "${product.name}" (ID: ${product._id}) as it's a child of composite product`);
          return false;
        }
        console.log(`🔍 Keeping regular product "${product.name}" (ID: ${product._id}) as it's standalone`);
        return true;
      });

      console.log('🔍 After filtering child products:', {
        original: products.length,
        filtered: filteredProducts.length,
        excluded: products.length - filteredProducts.length
      });

      // Process products for POS optimization
      const posProducts = [];
      
      filteredProducts.forEach(product => {
        if (product.isComposite && product.compositeInfo) {
          // For composite products, calculate effective selling price
          let effectivePOSPrice = product.retailPrice;
          
          // If composite has child products, use their total selling price as POS price
          if (product.compositeInfo.childProducts && product.compositeInfo.childProducts.length > 0) {
            const childSellingTotal = product.compositeInfo.childProducts.reduce((total, child) => {
              return total + (parseFloat(child.sellingPrice?.toString() || '0') || 0);
            }, 0);
            
            // Use child products selling price if available, otherwise fallback to retail price
            if (childSellingTotal > 0) {
              effectivePOSPrice = childSellingTotal;
            }
          }

          // Create individual POS items for each child product with composite pricing
          if (product.compositeInfo.childProducts && product.compositeInfo.childProducts.length > 0) {
            // Determine stock for composite products
            let compositeStock = 0;
            
            // Priority 1: Use prepared stock if available (already cooked/prepared items)
            const preparedStock = product.compositeInfo.currentStock || 0;
            
            // Priority 2: Calculate potential stock from raw materials
            let maxPossibleCompositeStock = Infinity;
            product.compositeInfo.childProducts.forEach(childInfo => {
              if (childInfo.productId) {
                const childProductId = typeof childInfo.productId === 'object' ? childInfo.productId._id : childInfo.productId;
                const availableChildStock = stockMap[childProductId.toString()] || 0;
                const requiredPerComposite = childInfo.quantityPerServing || childInfo.quantity || 1;
                
                // Calculate how many composites this child product can support
                const possibleFromThisChild = Math.floor(availableChildStock / requiredPerComposite);
                maxPossibleCompositeStock = Math.min(maxPossibleCompositeStock, possibleFromThisChild);
                
                console.log(`🔢 Child "${childInfo.productId.name}": available=${availableChildStock}, required=${requiredPerComposite}, can make=${possibleFromThisChild} composites`);
              }
            });
            
            // If no child products found or calculation failed, use 0
            if (maxPossibleCompositeStock === Infinity) {
              maxPossibleCompositeStock = 0;
            }
            
            // Use prepared stock + potential stock from raw materials
            compositeStock = preparedStock + maxPossibleCompositeStock;
            
            console.log(`🍽️ Composite "${product.name}" stock calculation:`, {
              preparedStock,
              maxPossibleFromRaw: maxPossibleCompositeStock,
              totalAvailableStock: compositeStock
            });
            
            product.compositeInfo.childProducts.forEach(childInfo => {
              if (childInfo.productId) {
                const childProduct = childInfo.productId;
                
                // DEBUG: Log child product info including imageUrl
                console.log(`🖼️  Child product "${childProduct.name}":`, {
                  imageUrl: childProduct.imageUrl,
                  description: childProduct.description,
                  unit: childProduct.unit
                });
                
                // Create a POS item that looks like the child product but priced as composite
                posProducts.push({
                  ...childProduct,
                  // Keep child product identity
                  _id: product._id, // Use composite ID for cart/ordering
                  originalChildId: childProduct._id, // Store original child ID for reference
                  name: childProduct.name,
                  productCode: childProduct.productCode,
                  imageUrl: childProduct.imageUrl,
                  description: childProduct.description,
                  unit: childProduct.unit,
                  
                  // Use composite product pricing and info
                  posPrice: effectivePOSPrice,
                  retailPrice: effectivePOSPrice,
                  price: effectivePOSPrice,
                  
                  // Composite product metadata
                  posType: 'composite-child',
                  posDisplayName: childProduct.name,
                  posDescription: `Từ combo "${product.name}" • ${childInfo.quantityPerServing || childInfo.quantity || 1} ${childProduct.unit}`,
                  posStock: compositeStock, // Use total available stock (prepared + can be made)
                  posMaxStock: product.compositeInfo.capacity?.quantity || 1,
                  
                  // Composite reference
                  compositeProductId: product._id,
                  compositeProductName: product.name,
                  quantityPerServing: childInfo.quantityPerServing || childInfo.quantity || 1,
                  
                  // Child products info for cart display
                  childProductsInfo: [],
                  
                  // Inherit composite product's other fields
                  ownerId: product.ownerId,
                  storeId: product.storeId,
                  categories: product.categories,
                  status: product.status
                });
              }
            });
          }
        } else {
          // For regular products (only standalone products, not child products)
          // Get actual stock from StockBalance collection
          const actualStock = stockMap[product._id.toString()] || 0;
          
          posProducts.push({
            ...product,
            posPrice: product.retailPrice,
            posType: 'regular',
            posDisplayName: product.name,
            posDescription: `Sản phẩm • ${product.unit}`,
            posStock: actualStock, // Use actual stock from StockBalance
            posMaxStock: null,
            childProductsInfo: []
          });
        }
      });

      // Sort: composite-child products first, then regular products
      posProducts.sort((a, b) => {
        if (a.posType === 'composite-child' && b.posType === 'regular') return -1;
        if (a.posType === 'regular' && b.posType === 'composite-child') return 1;
        return a.name.localeCompare(b.name);
      });

      console.log('🔍 Final POS products:', {
        total: posProducts.length,
        regular: posProducts.filter(p => p.posType === 'regular').length,
        compositeChild: posProducts.filter(p => p.posType === 'composite-child').length,
        stockInfo: {
          regularWithStock: posProducts.filter(p => p.posType === 'regular' && p.posStock > 0).length,
          compositeChildWithStock: posProducts.filter(p => p.posType === 'composite-child' && p.posStock > 0).length,
          outOfStock: posProducts.filter(p => p.posStock <= 0).length
        },
        products: posProducts.map(p => ({ 
          name: p.name, 
          posType: p.posType,
          price: p.posPrice,
          imageUrl: p.imageUrl,
          compositeReference: p.compositeProductName || 'N/A',
          posStock: p.posStock, // Add stock info to debug output
          stockStatus: p.posStock > 0 ? 'IN_STOCK' : 'OUT_OF_STOCK'
        }))
      });

      res.status(200).json(posProducts);

    } catch (error) {
      console.error('Error fetching POS products:', error);
      res.status(500).json({ error: 'failed_to_fetch_pos_products' });
    }
  },

  createMyInStore: async (req, res) => {
    try {
      const newProduct = new Product({
        ...req.body,
        ownerId: req.user._id
      });

      const savedProduct = await newProduct.save();
      res.status(201).json(savedProduct);

    } catch (error) {
      console.log(error);

      res.status(500).json({ error: 'failed_to_create_store' });
    }
  },

  updateMyInStore: async (req, res) => {
    try {
      const { id } = req.params;
      const { storeCode } = req.body;

      const store = await Store.findOne({ storeCode, ownerId: req.user._id, deleted: false });
      if (!store) {
        return res.status(404).json({ error: 'store_not_found' });
      }

      const product = await Product.findOne({ _id: id, ownerId: req.user._id, storeId: store._id, deleted: false });
      if (!product) {
        return res.status(404).json({ error: 'product_not_found' });
      }

      // Validate child product restrictions
      const validation = await validateChildProductUpdate(id, req.user._id, req.body);
      if (!validation.canUpdate) {
        return res.status(400).json({ 
          error: 'child_product_restricted_fields',
          message: `Cannot update fields [${validation.restrictedFields.join(', ')}] for child product of composite "${validation.compositeProductName}". These fields are managed by the composite product.`,
          restrictedFields: validation.restrictedFields,
          compositeProductName: validation.compositeProductName
        });
      }

      Object.assign(product, req.body);
      const updatedProduct = await product.save();

      res.status(200).json(updatedProduct);
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: 'failed_to_update_store' });
    }
  },

  deleteMyInStore: async (req, res) => {
    try {
      const { id } = req.params;
      const { storeCode } = req.query;

      if (!storeCode) {
        return res.status(400).json({ error: 'store_code_required' });
      }

      const store = await Store.findOne({ storeCode, ownerId: req.user._id, deleted: false });
      if (!store) {
        return res.status(404).json({ error: 'store_not_found' });
      }

      const product = await Product.findOne({ _id: id, ownerId: req.user._id, storeId: store._id, deleted: false });
      if (!product) {
        return res.status(404).json({ error: 'product_not_found' });
      }

      product.deleted = true;
      await product.save();

      res.status(200).json({ message: 'product_deleted_successfully' });

    } catch (error) {
      res.status(500).json({ error: 'failed_to_delete_product' });
    }
  },

  // Link recipe to product
  linkRecipeToProduct: async (req, res) => {
    try {
      const { productId, recipeId } = req.params;
      const { setAsDefault } = req.body;

      const product = await Product.findOne({
        _id: productId,
        ownerId: req.user._id,
        deleted: false
      });

      if (!product) {
        return res.status(404).json({ error: 'product_not_found' });
      }

      const recipe = await Recipe.findOne({
        _id: recipeId,
        ownerId: req.user._id,
        storeId: product.storeId,
        deleted: false
      });

      if (!recipe) {
        return res.status(404).json({ error: 'recipe_not_found' });
      }

      // Add recipe to product if not already linked
      const updateProduct = {};
      if (!product.recipes.includes(recipeId)) {
        updateProduct.$addToSet = { recipes: recipeId };
      }

      // Set as default if requested or if no default exists
      if (setAsDefault || !product.defaultRecipeId) {
        updateProduct.defaultRecipeId = recipeId;
      }

      if (Object.keys(updateProduct).length > 0) {
        await Product.findByIdAndUpdate(productId, updateProduct);
      }

      // Add product to recipe if not already linked
      if (!recipe.products.includes(productId)) {
        await Recipe.findByIdAndUpdate(recipeId, {
          $addToSet: { products: productId }
        });
      }

      const updatedProduct = await Product.findById(productId)
        .populate('recipes', 'dishName description')
        .populate('defaultRecipeId', 'dishName description');

      res.status(200).json({
        message: 'recipe_linked_successfully',
        product: updatedProduct
      });

    } catch (error) {
      console.error('Link recipe error:', error);
      res.status(500).json({ error: 'failed_to_link_recipe' });
    }
  },

  // Unlink recipe from product
  unlinkRecipeFromProduct: async (req, res) => {
    try {
      const { productId, recipeId } = req.params;

      const product = await Product.findOne({
        _id: productId,
        ownerId: req.user._id,
        deleted: false
      });

      if (!product) {
        return res.status(404).json({ error: 'product_not_found' });
      }

      // Remove recipe from product
      const updateProduct = {
        $pull: { recipes: recipeId }
      };

      // If this was the default recipe, clear it
      if (product.defaultRecipeId?.toString() === recipeId) {
        updateProduct.defaultRecipeId = null;
      }

      await Product.findByIdAndUpdate(productId, updateProduct);

      // Remove product from recipe
      await Recipe.findByIdAndUpdate(recipeId, {
        $pull: { products: productId }
      });

      const updatedProduct = await Product.findById(productId)
        .populate('recipes', 'dishName description')
        .populate('defaultRecipeId', 'dishName description');

      res.status(200).json({
        message: 'recipe_unlinked_successfully',
        product: updatedProduct
      });

    } catch (error) {
      console.error('Unlink recipe error:', error);
      res.status(500).json({ error: 'failed_to_unlink_recipe' });
    }
  },

  // Set default recipe for product
  setDefaultRecipe: async (req, res) => {
    try {
      const { productId, recipeId } = req.params;

      const product = await Product.findOne({
        _id: productId,
        ownerId: req.user._id,
        deleted: false
      });

      if (!product) {
        return res.status(404).json({ error: 'product_not_found' });
      }

      // Check if recipe is linked to product
      if (!product.recipes.includes(recipeId)) {
        return res.status(400).json({ error: 'recipe_not_linked_to_product' });
      }

      await Product.findByIdAndUpdate(productId, {
        defaultRecipeId: recipeId
      });

      const updatedProduct = await Product.findById(productId)
        .populate('recipes', 'dishName description')
        .populate('defaultRecipeId', 'dishName description');

      res.status(200).json({
        message: 'default_recipe_set_successfully',
        product: updatedProduct
      });

    } catch (error) {
      console.error('Set default recipe error:', error);
      res.status(500).json({ error: 'failed_to_set_default_recipe' });
    }
  },

  // Get product with recipes
  getProductWithRecipes: async (req, res) => {
    try {
      const { productId } = req.params;

      const product = await Product.findOne({
        _id: productId,
        ownerId: req.user._id,
        deleted: false
      })
        .populate({
          path: 'recipes',
          select: 'dishName description ingredients yield costPerUnit',
          populate: {
            path: 'ingredients.ingredientId',
            select: 'name unit standardCost'
          }
        })
        .populate('defaultRecipeId', 'dishName description ingredients yield costPerUnit');

      if (!product) {
        return res.status(404).json({ error: 'product_not_found' });
      }

      res.status(200).json(product);

    } catch (error) {
      console.error('Get product with recipes error:', error);
      res.status(500).json({ error: 'failed_to_fetch_product_recipes' });
    }
  },

  // Calculate product cost
  calculateProductCost: async (req, res) => {
    try {
      const { productId } = req.params;
      const { recipeId } = req.query;

      const costCalculation = await calculateProductCostFromRecipe(productId, recipeId);
      res.status(200).json(costCalculation);

    } catch (error) {
      console.error('Calculate product cost error:', error);
      res.status(500).json({ error: 'failed_to_calculate_cost' });
    }
  },

  // Get cost breakdown
  getCostBreakdown: async (req, res) => {
    try {
      const { productId } = req.params;

      const costBreakdown = await getCostBreakdown(productId);
      res.status(200).json(costBreakdown);

    } catch (error) {
      console.error('Get cost breakdown error:', error);
      res.status(500).json({ error: 'failed_to_get_cost_breakdown' });
    }
  },

  // Update product pricing based on cost
  updateProductPricing: async (req, res) => {
    try {
      const { productId } = req.params;
      const { updateCostPrice, updateRetailPrice, profitMarginPercent } = req.body;

      const result = await updateProductPricingBasedOnCost(productId, {
        updateCostPrice,
        updateRetailPrice,
        profitMarginPercent
      });

      res.status(200).json({
        message: 'pricing_updated_successfully',
        result
      });

    } catch (error) {
      console.error('Update product pricing error:', error);
      res.status(500).json({ error: 'failed_to_update_pricing' });
    }
  },

  // Check production feasibility
  checkProductionFeasibility: async (req, res) => {
    try {
      const { productId } = req.params;
      const { quantity, recipeId } = req.query;

      const feasibilityCheck = await checkProductionFeasibility(
        productId,
        parseInt(quantity),
        recipeId
      );

      res.status(200).json(feasibilityCheck);

    } catch (error) {
      console.error('Check production feasibility error:', error);
      res.status(500).json({ error: 'failed_to_check_feasibility' });
    }
  },

  // Create production
  createProduction: async (req, res) => {
    try {
      const { productId } = req.params;
      const { recipeId, quantity, notes, updateProductStock } = req.body;

      const productionResult = await createProductionTransaction(
        productId,
        recipeId,
        quantity,
        {
          userId: req.user._id,
          storeId: req.body.storeId,
          ownerId: req.user._id,
          notes,
          updateProductStock
        }
      );

      res.status(201).json({
        message: 'production_completed_successfully',
        production: productionResult
      });

    } catch (error) {
      console.error('Create production error:', error);
      res.status(500).json({ error: 'failed_to_create_production' });
    }
  },

  // Lấy danh sách sản phẩm thường (không phải composite) để làm child products
  getRegularProductsForComposite: async (req, res) => {
    try {
      const { storeCode } = req.params;

      let filter = {
        ownerId: req.user._id,
        deleted: false,
        $or: [
          { isComposite: { $exists: false } }, // Sản phẩm cũ chưa có field isComposite
          { isComposite: false } // Sản phẩm thường
        ]
      };

      if (storeCode) {
        const store = await Store.findOne({ storeCode, ownerId: req.user._id });
        if (!store) {
          return res.status(404).json({ error: 'store_not_found' });
        }
        filter.storeId = store._id;
      }

      const products = await Product.find(filter)
        .select('_id name unit costPrice retailPrice description')
        .sort('name');

      res.status(200).json(products);
    } catch (error) {
      console.error('Error fetching regular products:', error);
      res.status(500).json({ error: 'failed_to_fetch_regular_products' });
    }
  },

  // Kiểm tra xem sản phẩm có phải child product không
  checkChildProductStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { checkIfChildProduct } = require('../utils/productUtils');

      const result = await checkIfChildProduct(id, req.user._id);
      
      res.status(200).json({
        isChildProduct: result.isChildProduct,
        compositeProduct: result.compositeProduct ? {
          _id: result.compositeProduct._id,
          name: result.compositeProduct.name,
          productCode: result.compositeProduct.productCode
        } : null
      });
    } catch (error) {
      console.error('Error checking child product status:', error);
      res.status(500).json({ error: 'failed_to_check_child_product_status' });
    }
  },
};

module.exports = productController;
