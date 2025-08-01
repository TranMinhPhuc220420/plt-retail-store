const Ingredient = require('../models/Ingredient');
const IngredientStockBalance = require('../models/IngredientStockBalance');
const Warehouse = require('../models/Warehouse');
const Store = require('../models/Store');
const Supplier = require('../models/Supplier');

const ingredientController = {
  // Get all ingredients with optional filtering by ownerId and storeCode
  getAll: async (req, res) => {
    try {
      const ownerId = req.user?._id || req.query.ownerId;
      const { storeCode, category, status, warehouseId } = req.query;
      const filter = { deleted: false };
      
      // Add owner filter if available
      if (ownerId) filter.ownerId = ownerId;
      
      // Look up store by storeCode if provided
      if (storeCode) {
        const store = await Store.findOne({ storeCode, deleted: false });
        if (!store) {
          return res.status(404).json({ error: 'store_not_found' });
        }
        filter.storeId = store._id;
      }
      
      // Add additional filters
      if (category) filter.category = category;
      if (status) filter.status = status;
      if (warehouseId) filter.warehouseId = warehouseId;
      
      const ingredients = await Ingredient.find(filter)
        .populate('warehouseId', 'name address')
        .populate('ownerId', 'name email')
        .populate('storeId', 'name storeCode')
        .populate('defaultSupplierId', 'name contactInfo')
        .sort({ name: 1 });
      
      // Optionally include current stock levels from IngredientStockBalance
      const ingredientsWithStock = await Promise.all(ingredients.map(async (ingredient) => {
        const stockBalances = await IngredientStockBalance.find({
          ingredientId: ingredient._id,
          deleted: false,
          quantity: { $gt: 0 }
        });
        
        const totalStock = stockBalances.reduce((sum, balance) => sum + balance.quantity, 0);
        const isLowStock = totalStock <= (ingredient.minStock || 0);
        
        return {
          ...ingredient.toObject(),
          currentStock: totalStock,
          stockBalances: stockBalances.length,
          isLowStock
        };
      }));
      
      res.status(200).json(ingredientsWithStock);
    } catch (error) {
      console.error('Get all ingredients error:', error);
      res.status(500).json({ error: 'failed_to_fetch_ingredients' });
    }
  },

  // Get ingredient by ID with owner and store verification using storeCode
  getById: async (req, res) => {
    try {
      const { id } = req.params;
      const ownerId = req.user?._id || req.query.ownerId;
      const { storeCode, includeStock } = req.query;
      const filter = { _id: id, deleted: false };
      
      // Add owner filter if available
      if (ownerId) filter.ownerId = ownerId;
      
      // Look up store by storeCode if provided
      if (storeCode) {
        const store = await Store.findOne({ storeCode, deleted: false });
        if (!store) {
          return res.status(404).json({ error: 'store_not_found' });
        }
        filter.storeId = store._id;
      }
      
      const ingredient = await Ingredient.findOne(filter)
        .populate('warehouseId', 'name address manager')
        .populate('ownerId', 'name email')
        .populate('storeId', 'name storeCode')
        .populate('defaultSupplierId', 'name contactInfo');
      
      if (!ingredient) {
        return res.status(404).json({ error: 'ingredient_not_found' });
      }
      
      let result = ingredient.toObject();
      
      // Include stock information if requested
      if (includeStock === 'true') {
        const stockBalances = await IngredientStockBalance.find({
          ingredientId: ingredient._id,
          deleted: false
        })
        .populate('warehouseId', 'name address')
        .populate('supplierId', 'name contactInfo')
        .sort({ expirationDate: 1, createdAt: 1 });
        
        const totalStock = stockBalances.reduce((sum, balance) => sum + balance.quantity, 0);
        const lowStockBalances = stockBalances.filter(balance => 
          balance.quantity <= (balance.minStock || ingredient.minStock || 0)
        );
        const expiringBalances = stockBalances.filter(balance => {
          if (!balance.expirationDate) return false;
          const warningDate = new Date();
          warningDate.setDate(warningDate.getDate() + 7);
          return balance.expirationDate <= warningDate;
        });
        
        result.stockInfo = {
          totalStock,
          stockBalances,
          lowStockBalances,
          expiringBalances,
          isLowStock: totalStock <= (ingredient.minStock || 0)
        };
      }
      
      res.status(200).json(result);
    } catch (error) {
      console.error('Get ingredient by ID error:', error);
      res.status(500).json({ error: 'failed_to_fetch_ingredient' });
    }
  },

  // Get ingredients by warehouse ID with optional owner and store filtering using storeCode
  getByWarehouse: async (req, res) => {
    try {
      const { warehouseId } = req.params;
      const ownerId = req.user?._id || req.query.ownerId;
      const { storeCode, includeStock } = req.query;
      const filter = { 
        warehouseId, 
        deleted: false 
      };
      
      // Add owner filter if available
      if (ownerId) filter.ownerId = ownerId;
      
      // Look up store by storeCode if provided
      if (storeCode) {
        const store = await Store.findOne({ storeCode, deleted: false });
        if (!store) {
          return res.status(404).json({ error: 'store_not_found' });
        }
        filter.storeId = store._id;
      }
      
      const ingredients = await Ingredient.find(filter)
        .populate('ownerId', 'name email')
        .populate('storeId', 'name storeCode')
        .populate('defaultSupplierId', 'name contactInfo')
        .sort({ name: 1 });
      
      let result = ingredients;
      
      // Include stock information if requested
      if (includeStock === 'true') {
        result = await Promise.all(ingredients.map(async (ingredient) => {
          const stockBalances = await IngredientStockBalance.find({
            ingredientId: ingredient._id,
            warehouseId,
            deleted: false
          });
          
          const totalStock = stockBalances.reduce((sum, balance) => sum + balance.quantity, 0);
          
          return {
            ...ingredient.toObject(),
            stockInfo: {
              totalStock,
              stockBalances: stockBalances.length,
              isLowStock: totalStock <= (ingredient.minStock || 0)
            }
          };
        }));
      }
      
      res.status(200).json(result);
    } catch (error) {
      console.error('Get ingredients by warehouse error:', error);
      res.status(500).json({ error: 'failed_to_fetch_ingredients_by_warehouse' });
    }
  },

  // Create new ingredient with enhanced inventory support
  create: async (req, res) => {
    try {
      const ownerId = req.user?._id || req.body.ownerId;
      const { 
        ingredientCode,
        name, 
        description,
        category,
        unit, 
        minStock,
        maxStock,
        standardCost,
        warehouseId, 
        storeCode,
        properties,
        defaultSupplierId,
        status,
        imageUrl
      } = req.body;
      
      // Look up store by storeCode to get storeId
      let storeId = null;
      if (storeCode) {
        const store = await Store.findOne({ storeCode, deleted: false });
        if (!store) {
          return res.status(404).json({ error: 'store_not_found' });
        }
        storeId = store._id;
      }
      
      // Verify warehouse exists and belongs to same owner/store if specified
      const warehouseFilter = { _id: warehouseId, deleted: false };
      if (ownerId) warehouseFilter.ownerId = ownerId;
      if (storeId) warehouseFilter.storeId = storeId;
      
      const warehouse = await Warehouse.findOne(warehouseFilter);
      if (!warehouse) {
        return res.status(404).json({ error: 'warehouse_not_found' });
      }
      
      const newIngredient = new Ingredient({
        ingredientCode,
        name,
        description,
        category,
        unit,
        minStock,
        maxStock,
        standardCost,
        stockQuantity: 0, // Initialize with 0, will be managed through inventory transactions
        warehouseId,
        ownerId,
        storeId,
        properties,
        defaultSupplierId,
        status: status || 'active',
        imageUrl
      });
      
      const savedIngredient = await newIngredient.save();
      
      // Populate for response
      const populatedIngredient = await Ingredient.findById(savedIngredient._id)
        .populate('warehouseId', 'name address')
        .populate('ownerId', 'name email')
        .populate('storeId', 'name storeCode')
        .populate('defaultSupplierId', 'name contactInfo');
      
      res.status(201).json(populatedIngredient);
    } catch (error) {
      console.error('Create ingredient error:', error);
      if (error.code === 11000) {
        res.status(400).json({ error: 'ingredient_code_already_exists' });
      } else {
        res.status(500).json({ error: 'failed_to_create_ingredient' });
      }
    }
  },

  // Update ingredient by ID with owner and store verification using storeCode
  update: async (req, res) => {
    try {
      const { id } = req.params;
      const ownerId = req.user?._id || req.body.ownerId;
      const updateData = req.body;
      const { storeCode } = req.query;
      const filter = { _id: id, deleted: false };
      
      // Add owner filter if available
      if (ownerId) filter.ownerId = ownerId;
      
      // Look up store by storeCode if provided in query
      if (storeCode) {
        const store = await Store.findOne({ storeCode, deleted: false });
        if (!store) {
          return res.status(404).json({ error: 'store_not_found' });
        }
        filter.storeId = store._id;
      }
      
      const ingredient = await Ingredient.findOne(filter);
      if (!ingredient) {
        return res.status(404).json({ error: 'ingredient_not_found' });
      }
      
      // If changing warehouse, verify new warehouse exists and belongs to same owner/store
      if (updateData.warehouseId && updateData.warehouseId !== ingredient.warehouseId.toString()) {
        const newWarehouseFilter = { _id: updateData.warehouseId, deleted: false };
        if (ingredient.ownerId) newWarehouseFilter.ownerId = ingredient.ownerId;
        if (ingredient.storeId) newWarehouseFilter.storeId = ingredient.storeId;
        
        const newWarehouse = await Warehouse.findOne(newWarehouseFilter);
        if (!newWarehouse) {
          return res.status(404).json({ error: 'new_warehouse_not_found' });
        }
      }
      
      // Remove fields that shouldn't be directly updated
      delete updateData.ownerId;
      delete updateData.storeId;
      delete updateData.stockQuantity; // This should be managed through inventory transactions
      delete updateData.deleted;
      
      const updatedIngredient = await Ingredient.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      )
      .populate('warehouseId', 'name address')
      .populate('ownerId', 'name email')
      .populate('storeId', 'name storeCode')
      .populate('defaultSupplierId', 'name contactInfo');
      
      res.status(200).json(updatedIngredient);
    } catch (error) {
      console.error('Update ingredient error:', error);
      if (error.code === 11000) {
        res.status(400).json({ error: 'ingredient_code_already_exists' });
      } else {
        res.status(500).json({ error: 'failed_to_update_ingredient' });
      }
    }
  },

  // Soft delete ingredient by ID with owner and store verification using storeCode
  delete: async (req, res) => {
    try {
      const { id } = req.params;
      const ownerId = req.user?._id || req.query.ownerId;
      const { storeCode } = req.query;
      const filter = { _id: id, deleted: false };
      
      // Add owner filter if available
      if (ownerId) filter.ownerId = ownerId;
      
      // Look up store by storeCode if provided
      if (storeCode) {
        const store = await Store.findOne({ storeCode, deleted: false });
        if (!store) {
          return res.status(404).json({ error: 'store_not_found' });
        }
        filter.storeId = store._id;
      }
      
      const ingredient = await Ingredient.findOne(filter);
      
      if (!ingredient) {
        return res.status(404).json({ error: 'ingredient_not_found' });
      }
      
      // Check if ingredient has active stock balances
      const activeStockBalances = await IngredientStockBalance.find({
        ingredientId: ingredient._id,
        deleted: false,
        quantity: { $gt: 0 }
      });
      
      if (activeStockBalances.length > 0) {
        return res.status(400).json({ 
          error: 'cannot_delete_ingredient_with_stock',
          message: 'Cannot delete ingredient with active stock balances'
        });
      }
      
      // Soft delete the ingredient
      ingredient.deleted = true;
      ingredient.status = 'discontinued';
      await ingredient.save();
      
      // Also soft delete any zero-quantity stock balances
      await IngredientStockBalance.updateMany(
        { ingredientId: ingredient._id },
        { deleted: true }
      );
      
      res.status(200).json({ message: 'ingredient_deleted_successfully' });
    } catch (error) {
      console.error('Delete ingredient error:', error);
      res.status(500).json({ error: 'failed_to_delete_ingredient' });
    }
  }
};

module.exports = ingredientController;
