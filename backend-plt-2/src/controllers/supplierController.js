const Supplier = require('../models/Supplier');
const Store = require('../models/Store');

const supplierController = {
  // Get all suppliers owned by the user in a specific store
  getAllMyInStore: async (req, res) => {
    try {
      const { storeCode } = req.params;
      
      // Find the store
      const store = await Store.findOne({ 
        storeCode, 
        ownerId: req.user._id, 
        deleted: false 
      });
      
      if (!store) {
        return res.status(404).json({ error: 'store_not_found' });
      }

      const suppliers = await Supplier.find({ 
        storeId: store._id, 
        ownerId: req.user._id, 
        deleted: false 
      }).sort({ createdAt: -1 });

      res.status(200).json(suppliers);
    } catch (error) {
      console.error('Failed to fetch suppliers:', error);
      res.status(500).json({ error: 'failed_to_fetch_suppliers' });
    }
  },

  // Get supplier by ID
  getMyById: async (req, res) => {
    try {
      const { id } = req.params;
      
      const supplier = await Supplier.findOne({
        _id: id,
        ownerId: req.user._id,
        deleted: false
      }).populate('storeId', 'name storeCode');

      if (!supplier) {
        return res.status(404).json({ error: 'supplier_not_found' });
      }

      res.status(200).json(supplier);
    } catch (error) {
      console.error('Failed to fetch supplier:', error);
      res.status(500).json({ error: 'failed_to_fetch_supplier' });
    }
  },

  // Create new supplier in store
  createMyInStore: async (req, res) => {
    try {
      const newSupplier = new Supplier({
        ...req.body,
        ownerId: req.user._id,
        storeId: req.body.storeId // Set by validation middleware
      });

      const savedSupplier = await newSupplier.save();
      res.status(201).json(savedSupplier);
    } catch (error) {
      console.error('Failed to create supplier:', error);
      if (error.code === 11000) {
        return res.status(400).json({ error: 'supplier_code_already_exists' });
      }
      res.status(500).json({ error: 'failed_to_create_supplier' });
    }
  },

  // Update supplier
  updateMyInStore: async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = { ...req.body };
      
      // Remove fields that shouldn't be updated directly
      delete updateData.ownerId;
      delete updateData._id;
      delete updateData.createdAt;
      delete updateData.updatedAt;

      const updatedSupplier = await Supplier.findOneAndUpdate(
        { 
          _id: id, 
          ownerId: req.user._id, 
          deleted: false 
        },
        updateData,
        { 
          new: true, 
          runValidators: true 
        }
      );

      if (!updatedSupplier) {
        return res.status(404).json({ error: 'supplier_not_found' });
      }

      res.status(200).json(updatedSupplier);
    } catch (error) {
      console.error('Failed to update supplier:', error);
      if (error.code === 11000) {
        return res.status(400).json({ error: 'supplier_code_already_exists' });
      }
      res.status(500).json({ error: 'failed_to_update_supplier' });
    }
  },

  // Soft delete supplier
  deleteMyInStore: async (req, res) => {
    try {
      const { id } = req.params;

      const supplier = await Supplier.findOneAndUpdate(
        { 
          _id: id, 
          ownerId: req.user._id, 
          deleted: false 
        },
        { deleted: true },
        { new: true }
      );

      if (!supplier) {
        return res.status(404).json({ error: 'supplier_not_found' });
      }

      res.status(200).json({ message: 'supplier_deleted_successfully' });
    } catch (error) {
      console.error('Failed to delete supplier:', error);
      res.status(500).json({ error: 'failed_to_delete_supplier' });
    }
  },

  // Bulk delete suppliers
  deleteMyInStoreBulk: async (req, res) => {
    try {
      const { supplierIds } = req.body;

      if (!supplierIds || !Array.isArray(supplierIds) || supplierIds.length === 0) {
        return res.status(400).json({ error: 'supplier_ids_required' });
      }

      const result = await Supplier.updateMany(
        { 
          _id: { $in: supplierIds }, 
          ownerId: req.user._id, 
          deleted: false 
        },
        { deleted: true }
      );

      res.status(200).json({ 
        message: 'suppliers_deleted_successfully', 
        deletedCount: result.modifiedCount 
      });
    } catch (error) {
      console.error('Failed to bulk delete suppliers:', error);
      res.status(500).json({ error: 'failed_to_delete_suppliers' });
    }
  },

  // Create multiple suppliers (bulk)
  createMyInStoreBulk: async (req, res) => {
    try {
      const { suppliers } = req.body;
      const { storeId } = req.body; // Set by validation middleware

      const suppliersToCreate = suppliers.map(supplier => ({
        ...supplier,
        ownerId: req.user._id,
        storeId: storeId
      }));

      const savedSuppliers = await Supplier.insertMany(suppliersToCreate);
      res.status(201).json(savedSuppliers);
    } catch (error) {
      console.error('Failed to create suppliers in bulk:', error);
      if (error.code === 11000) {
        return res.status(400).json({ error: 'supplier_code_already_exists' });
      }
      res.status(500).json({ error: 'failed_to_create_suppliers' });
    }
  },

  // Get supplier performance metrics
  getSupplierPerformance: async (req, res) => {
    try {
      const { id } = req.params;

      const supplier = await Supplier.findOne({
        _id: id,
        ownerId: req.user._id,
        deleted: false
      });

      if (!supplier) {
        return res.status(404).json({ error: 'supplier_not_found' });
      }

      const performanceData = {
        ...supplier.performance,
        deliveryPerformance: supplier.deliveryPerformance,
        overallPerformance: supplier.overallPerformance
      };

      res.status(200).json(performanceData);
    } catch (error) {
      console.error('Failed to fetch supplier performance:', error);
      res.status(500).json({ error: 'failed_to_fetch_performance' });
    }
  },

  // Update supplier performance (internal use)
  updateSupplierPerformance: async (req, res) => {
    try {
      const { id } = req.params;
      const { performance } = req.body;

      const updatedSupplier = await Supplier.findOneAndUpdate(
        { 
          _id: id, 
          ownerId: req.user._id, 
          deleted: false 
        },
        { performance },
        { 
          new: true, 
          runValidators: true 
        }
      );

      if (!updatedSupplier) {
        return res.status(404).json({ error: 'supplier_not_found' });
      }

      res.status(200).json(updatedSupplier.performance);
    } catch (error) {
      console.error('Failed to update supplier performance:', error);
      res.status(500).json({ error: 'failed_to_update_performance' });
    }
  }
};

module.exports = supplierController;
