const Store = require('../models/Store');

const storeController = {
  getAllMy: async (req, res) => {
    try {
      const stores = await Store.find({ owner: req.user.id, deleted: false });
      res.status(200).json(stores);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch stores' });
    }
  },

  getMyByCode: async (req, res) => {
    try {
      const { storeCode } = req.params;
      if (!storeCode) {
        return res.status(400).json({ error: 'store_code_is_required' });
      }

      const store = await Store.findOne({ storeCode, owner: req.user.id, deleted: false });
      if (!store) {
        return res.status(404).json({ error: 'store_not_found' });
      }
      
      res.status(200).json(store);
    } catch (error) {
      res.status(500).json({ error: 'fetch_store_failed' });
    }
  },

  createMy: async (req, res) => {
    try {
      const newStore = new Store({
        ...req.body,
        ownerId: req.user._id
      });
      
      const savedStore = await newStore.save();
      
      res.status(201).json(savedStore);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create store' });
    }
  },

  updateMy: async (req, res) => {
    try {
      const { storeCode } = req.body;
      const store = await Store.findOne({ storeCode, owner: req.user.id, deleted: false });
      if (!store) {
        return res.status(404).json({ error: 'store_not_found' });
      }
      
      Object.assign(store, req.body);
      const updatedStore = await store.save();

      res.status(200).json(updatedStore);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update store' });
    }
  },

  deleteMy: async (req, res) => {
    try {
      const { storeCode } = req.params;
      if (!storeCode) {
        return res.status(400).json({ error: 'store_code_is_required' });
      }

      const store = await Store.findOne({ storeCode, owner: req.user.id, deleted: false });
      if (!store) {
        return res.status(404).json({ error: 'store_not_found' });
      }

      store.deleted = true; // Soft delete
      await store.save();

      res.status(200).json({ message: 'store_deleted_successfully' });
    } catch (error) {
      res.status(500).json({ error: 'failed_to_delete_store' });
    }
  }
};

module.exports = storeController;
