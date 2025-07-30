const Ingredient = require('../models/Ingredient');
const Warehouse = require('../models/Warehouse');
const Store = require('../models/Store');

const ingredientController = {
  // Get all ingredients with optional filtering by ownerId and storeCode
  getAll: async (req, res) => {
    try {
      const ownerId = req.user?._id || req.query.ownerId;
      const { storeCode } = req.query;
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
      
      const ingredients = await Ingredient.find(filter)
        .populate('warehouseId', 'name address')
        .populate('ownerId', 'name email')
        .populate('storeId', 'name storeCode')
        .sort({ createdAt: -1 });
      res.status(200).json(ingredients);
    } catch (error) {
      res.status(500).json({ error: 'failed_to_fetch_ingredients' });
    }
  },

  // Get ingredient by ID with owner and store verification using storeCode
  getById: async (req, res) => {
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
      
      const ingredient = await Ingredient.findOne(filter)
        .populate('warehouseId', 'name address manager')
        .populate('ownerId', 'name email')
        .populate('storeId', 'name storeCode');
      
      if (!ingredient) {
        return res.status(404).json({ error: 'ingredient_not_found' });
      }
      
      res.status(200).json(ingredient);
    } catch (error) {
      res.status(500).json({ error: 'failed_to_fetch_ingredient' });
    }
  },

  // Get ingredients by warehouse ID with optional owner and store filtering using storeCode
  getByWarehouse: async (req, res) => {
    try {
      const { warehouseId } = req.params;
      const ownerId = req.user?._id || req.query.ownerId;
      const { storeCode } = req.query;
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
        .sort({ name: 1 });
      
      res.status(200).json(ingredients);
    } catch (error) {
      res.status(500).json({ error: 'failed_to_fetch_warehouse_ingredients' });
    }
  },

  // Create new ingredient with ownerId and storeCode lookup
  create: async (req, res) => {
    try {
      const ownerId = req.user?._id || req.body.ownerId;
      const { name, unit, stockQuantity, warehouseId, storeCode } = req.body;
      
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
        name,
        unit,
        stockQuantity,
        warehouseId,
        ownerId,
        storeId
      });
      
      const savedIngredient = await newIngredient.save();
      
      // Add ingredient reference to warehouse
      warehouse.ingredients.push(savedIngredient._id);
      await warehouse.save();
      
      res.status(201).json(savedIngredient);
    } catch (error) {
      res.status(500).json({ error: 'failed_to_create_ingredient' });
    }
  },

  // Update ingredient by ID with owner and store verification using storeCode
  update: async (req, res) => {
    try {
      const { id } = req.params;
      const ownerId = req.user?._id || req.body.ownerId;
      const { name, unit, stockQuantity, warehouseId, storeCode: queryStoreCode } = req.body;
      const filter = { _id: id, deleted: false };
      
      // Add owner filter if available
      if (ownerId) filter.ownerId = ownerId;
      
      // Look up store by storeCode if provided in query
      if (queryStoreCode) {
        const store = await Store.findOne({ storeCode: queryStoreCode, deleted: false });
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
      if (warehouseId && warehouseId !== ingredient.warehouseId.toString()) {
        const newWarehouseFilter = { _id: warehouseId, deleted: false };
        if (ingredient.ownerId) newWarehouseFilter.ownerId = ingredient.ownerId;
        if (ingredient.storeId) newWarehouseFilter.storeId = ingredient.storeId;
        
        const newWarehouse = await Warehouse.findOne(newWarehouseFilter);
        if (!newWarehouse) {
          return res.status(404).json({ error: 'new_warehouse_not_found' });
        }
        
        // Remove from old warehouse and add to new warehouse
        const oldWarehouse = await Warehouse.findById(ingredient.warehouseId);
        if (oldWarehouse) {
          oldWarehouse.ingredients.pull(ingredient._id);
          await oldWarehouse.save();
        }
        
        newWarehouse.ingredients.push(ingredient._id);
        await newWarehouse.save();
      }
      
      // Update fields if provided
      if (name !== undefined) ingredient.name = name;
      if (unit !== undefined) ingredient.unit = unit;
      if (stockQuantity !== undefined) ingredient.stockQuantity = stockQuantity;
      if (warehouseId !== undefined) ingredient.warehouseId = warehouseId;
      
      const updatedIngredient = await ingredient.save();
      res.status(200).json(updatedIngredient);
    } catch (error) {
      res.status(500).json({ error: 'failed_to_update_ingredient' });
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
      
      // Remove ingredient reference from warehouse
      const warehouse = await Warehouse.findById(ingredient.warehouseId);
      if (warehouse) {
        warehouse.ingredients.pull(ingredient._id);
        await warehouse.save();
      }
      
      ingredient.deleted = true;
      await ingredient.save();
      
      res.status(200).json({ message: 'ingredient_deleted_successfully' });
    } catch (error) {
      res.status(500).json({ error: 'failed_to_delete_ingredient' });
    }
  }
};

module.exports = ingredientController;
