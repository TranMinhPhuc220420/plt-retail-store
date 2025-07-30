const Warehouse = require('../models/Warehouse');
const Store = require('../models/Store');

const warehouseController = {
  // Get all warehouses with optional filtering by storeCode, ownerId from req.user
  getAll: async (req, res) => {
    try {
      const { storeCode } = req.query;
      const ownerId = req.user?._id; // ownerId from authenticated user
      const filter = { deleted: false };

      if (ownerId) filter.ownerId = ownerId;

      // Look up store by storeCode if provided
      if (storeCode) {
        const store = await Store.findOne({ storeCode, deleted: false });
        if (!store) {
          return res.status(404).json({ error: 'store_not_found' });
        }
        filter.storeId = store._id;
      }

      const warehouses = await Warehouse.find(filter)
        .populate('ingredients', 'name unit stockQuantity')
        .populate('ownerId', 'name email')
        .populate('storeId', 'name storeCode')
        .sort({ createdAt: -1 });
      res.status(200).json(warehouses);
    } catch (error) {
      res.status(500).json({ error: 'failed_to_fetch_warehouses' });
    }
  },

  // Get warehouse by ID with owner and store verification using storeCode, ownerId from req.user
  getById: async (req, res) => {
    try {
      const { id } = req.params;
      const { storeCode } = req.query;
      const ownerId = req.user?._id; // ownerId from authenticated user
      const filter = { _id: id, deleted: false };

      if (ownerId) filter.ownerId = ownerId;

      // Look up store by storeCode if provided
      if (storeCode) {
        const store = await Store.findOne({ storeCode, deleted: false });
        if (!store) {
          return res.status(404).json({ error: 'store_not_found' });
        }
        filter.storeId = store._id;
      }

      const warehouse = await Warehouse.findOne(filter)
        .populate('ingredients', 'name unit stockQuantity')
        .populate('ownerId', 'name email')
        .populate('storeId', 'name storeCode');

      if (!warehouse) {
        return res.status(404).json({ error: 'warehouse_not_found' });
      }

      res.status(200).json(warehouse);
    } catch (error) {
      res.status(500).json({ error: 'failed_to_fetch_warehouse' });
    }
  },

  // Create new warehouse with ownerId from req.user and storeCode lookup
  create: async (req, res) => {
    try {
      const { name, address, manager, storeCode } = req.body;
      const ownerId = req.user?._id; // ownerId from authenticated user

      // Look up store by storeCode to get storeId
      let storeId = null;
      if (storeCode) {
        const store = await Store.findOne({ storeCode, deleted: false });
        if (!store) {
          return res.status(404).json({ error: 'store_not_found' });
        }
        storeId = store._id;
      }

      const newWarehouse = new Warehouse({
        name,
        address,
        manager,
        ownerId,
        storeId
      });

      const savedWarehouse = await newWarehouse.save();
      res.status(201).json(savedWarehouse);
    } catch (error) {
      res.status(500).json({ error: 'failed_to_create_warehouse' });
    }
  },

  // Update warehouse by ID with owner and store verification using storeCode, ownerId from req.user
  update: async (req, res) => {
    try {
      const { id } = req.params;
      const { storeCode: queryStoreCode } = req.query;
      const { name, address, manager } = req.body;
      const ownerId = req.user?._id; // ownerId from authenticated user
      const filter = { _id: id, deleted: false };

      if (ownerId) filter.ownerId = ownerId;

      // Look up store by storeCode if provided in query
      if (queryStoreCode) {
        const store = await Store.findOne({ storeCode: queryStoreCode, deleted: false });
        if (!store) {
          return res.status(404).json({ error: 'store_not_found' });
        }
        filter.storeId = store._id;
      }

      const warehouse = await Warehouse.findOne(filter);
      if (!warehouse) {
        return res.status(404).json({ error: 'warehouse_not_found' });
      }

      // Update fields if provided
      if (name !== undefined) warehouse.name = name;
      if (address !== undefined) warehouse.address = address;
      if (manager !== undefined) warehouse.manager = manager;

      const updatedWarehouse = await warehouse.save();
      res.status(200).json(updatedWarehouse);
    } catch (error) {
      res.status(500).json({ error: 'failed_to_update_warehouse' });
    }
  },

  // Soft delete warehouse by ID with owner and store verification using storeCode, ownerId from req.user
  delete: async (req, res) => {
    try {
      const { id } = req.params;
      const { storeCode } = req.query;
      const ownerId = req.user?._id; // ownerId from authenticated user
      const filter = { _id: id, deleted: false };

      if (ownerId) filter.ownerId = ownerId;

      // Look up store by storeCode if provided
      if (storeCode) {
        const store = await Store.findOne({ storeCode, deleted: false });
        if (!store) {
          return res.status(404).json({ error: 'store_not_found' });
        }
        filter.storeId = store._id;
      }

      const warehouse = await Warehouse.findOne(filter);

      if (!warehouse) {
        return res.status(404).json({ error: 'warehouse_not_found' });
      }

      warehouse.deleted = true;
      await warehouse.save();

      res.status(200).json({ message: 'warehouse_deleted_successfully' });
    } catch (error) {
      res.status(500).json({ error: 'failed_to_delete_warehouse' });
    }
  },

  // Get all warehouses in a specific store for authenticated user
  getAllMyInStore: async (req, res) => {
    try {
      const { storeCode } = req.params;
      const ownerId = req.user?._id; // Assuming user is authenticated and stored in req.user
      
      if (!ownerId) {
        return res.status(401).json({ error: 'user_not_authenticated' });
      }
      
      // Look up store by storeCode
      const store = await Store.findOne({ storeCode, deleted: false });
      if (!store) {
        return res.status(404).json({ error: 'store_not_found' });
      }
      
      const warehouses = await Warehouse.find({
        ownerId,
        storeId: store._id,
        deleted: false
      })
        .populate('ingredients', 'name unit stockQuantity')
        .populate('ownerId', 'name email')
        .populate('storeId', 'name storeCode')
        .sort({ createdAt: -1 });
        
      res.status(200).json(warehouses);
    } catch (error) {
      res.status(500).json({ error: 'failed_to_fetch_my_warehouses' });
    }
  },

  // Create new warehouse for authenticated user in their store
  createMyInStore: async (req, res) => {
    try {
      const { name, address, storeCode } = req.body;
      const ownerId = req.user?._id; // Assuming user is authenticated and stored in req.user
      
      if (!ownerId) {
        return res.status(401).json({ error: 'user_not_authenticated' });
      }
      
      if (!name || !address || !storeCode) {
        return res.status(400).json({ error: 'missing_required_fields' });
      }
      
      // Look up store by storeCode to get storeId
      const store = await Store.findOne({ storeCode, deleted: false });
      if (!store) {
        return res.status(404).json({ error: 'store_not_found' });
      }
      
      // Verify that the user owns this store
      if (store.ownerId.toString() !== ownerId.toString()) {
        return res.status(403).json({ error: 'not_authorized_for_this_store' });
      }
      
      const newWarehouse = new Warehouse({
        name,
        address,
        ownerId,
        storeId: store._id
      });
      
      const savedWarehouse = await newWarehouse.save();
      
      // Populate the response
      const populatedWarehouse = await Warehouse.findById(savedWarehouse._id)
        .populate('ownerId', 'name email')
        .populate('storeId', 'name storeCode');
      
      res.status(201).json(populatedWarehouse);
    } catch (error) {
      res.status(500).json({ error: 'failed_to_create_warehouse' });
    }
  },

  // Get specific warehouse details for authenticated user
  getByIdMyInStore: async (req, res) => {
    try {
      const { id } = req.params;
      const ownerId = req.user?._id; // Assuming user is authenticated and stored in req.user
      
      if (!ownerId) {
        return res.status(401).json({ error: 'user_not_authenticated' });
      }
      
      const warehouse = await Warehouse.findOne({
        _id: id,
        ownerId,
        deleted: false
      })
        .populate('ingredients', 'name unit stockQuantity')
        .populate('ownerId', 'name email')
        .populate('storeId', 'name storeCode');
      
      if (!warehouse) {
        return res.status(404).json({ error: 'warehouse_not_found' });
      }
      
      res.status(200).json(warehouse);
    } catch (error) {
      res.status(500).json({ error: 'failed_to_fetch_warehouse' });
    }
  },

  // Update warehouse for authenticated user
  updateMyInStore: async (req, res) => {
    try {
      const { warehouseId } = req.params;
      const { name, address } = req.body;
      const ownerId = req.user?._id; // Assuming user is authenticated and stored in req.user
      
      if (!ownerId) {
        return res.status(401).json({ error: 'user_not_authenticated' });
      }
      
      const warehouse = await Warehouse.findOne({
        _id: warehouseId,
        ownerId,
        deleted: false
      });
      
      if (!warehouse) {
        return res.status(404).json({ error: 'warehouse_not_found' });
      }
      
      // Update fields if provided
      if (name !== undefined) warehouse.name = name;
      if (address !== undefined) warehouse.address = address;
      
      const updatedWarehouse = await warehouse.save();
      
      // Populate the response
      const populatedWarehouse = await Warehouse.findById(updatedWarehouse._id)
        .populate('ownerId', 'name email')
        .populate('storeId', 'name storeCode');
      
      res.status(200).json(populatedWarehouse);
    } catch (error) {
      res.status(500).json({ error: 'failed_to_update_warehouse' });
    }
  },

  // Delete warehouse for authenticated user
  deleteMyInStore: async (req, res) => {
    try {
      const { warehouseId } = req.params;
      const ownerId = req.user?._id; // Assuming user is authenticated and stored in req.user
      
      if (!ownerId) {
        return res.status(401).json({ error: 'user_not_authenticated' });
      }
      
      const warehouse = await Warehouse.findOne({
        _id: warehouseId,
        ownerId,
        deleted: false
      });
      
      if (!warehouse) {
        return res.status(404).json({ error: 'warehouse_not_found' });
      }
      
      warehouse.deleted = true;
      await warehouse.save();
      
      res.status(200).json({ message: 'warehouse_deleted_successfully' });
    } catch (error) {
      res.status(500).json({ error: 'failed_to_delete_warehouse' });
    }
  }
};

module.exports = warehouseController;
