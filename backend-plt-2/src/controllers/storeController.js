const Store = require('../models/Store');

const storeController = {
  getAllMy: async (req, res) => {
    try {
      const stores = await Store.find({ owner: req.user.id });
      res.status(200).json(stores);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch stores' });
    }
  },

  getMyById: async (req, res) => {
    try {
      const store = await Store.findById(req.params.id);
      if (!store || store.owner.toString() !== req.user.id) {
        return res.status(404).json({ error: 'Store not found' });
      }
      res.status(200).json(store);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch store' });
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

      res.status(200).json(store);
    } catch (error) {
      res.status(500).json({ error: 'failed_to_fetch_store' });
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
      const { id } = req.params;
      
      const store = await Store.findById(id);
      if (!store) {
        return res.status(404).json({ error: 'Store not found' });
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
      const store = await Store.findById(req.params.id);
      if (!store || store.owner.toString() !== req.user.id) {
        return res.status(404).json({ error: 'Store not found' });
      }
      await store.remove();
      res.status(200).json({ message: 'Store deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete store' });
    }
  }
};

module.exports = storeController;
