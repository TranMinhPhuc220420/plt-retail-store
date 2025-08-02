const Store = require('../models/Store');
const { responses } = require('../utils/responseFormatter');

const storeController = {
  getAllMy: async (req, res) => {
    try {
      const stores = await Store.find({ ownerId: req.user._id, deleted: false });
      return responses.success(res, stores, 'stores_retrieved_successfully');
    } catch (error) {
      return responses.serverError(res, 'failed_to_fetch_stores', error);
    }
  },

  getMyByCode: async (req, res) => {
    try {
      const { storeCode } = req.params;
      if (!storeCode) {
        return responses.badRequest(res, 'store_code_required');
      }

      const store = await Store.findOne({ storeCode, ownerId: req.user._id, deleted: false });
      if (!store) {
        return responses.notFound(res, 'store_not_found');
      }
      
      return responses.success(res, store, 'store_retrieved_successfully');
    } catch (error) {
      return responses.serverError(res, 'failed_to_fetch_store', error);
    }
  },

  createMy: async (req, res) => {
    try {
      const newStore = new Store({
        ...req.body,
        ownerId: req.user._id
      });
      
      const savedStore = await newStore.save();
      
      return responses.created(res, savedStore, 'store_created_successfully');
    } catch (error) {
      return responses.serverError(res, 'failed_to_create_store', error);
    }
  },

  updateMy: async (req, res) => {
    try {
      const { storeCode } = req.body;
      const store = await Store.findOne({ storeCode, ownerId: req.user._id, deleted: false });
      if (!store) {
        return responses.notFound(res, 'store_not_found');
      }
      
      Object.assign(store, req.body);
      const updatedStore = await store.save();

      return responses.updated(res, updatedStore, 'store_updated_successfully');
    } catch (error) {
      return responses.serverError(res, 'failed_to_update_store', error);
    }
  },

  deleteMy: async (req, res) => {
    try {
      const { storeCode } = req.params;
      if (!storeCode) {
        return responses.badRequest(res, 'store_code_required');
      }

      const store = await Store.findOne({ storeCode, ownerId: req.user._id, deleted: false });
      if (!store) {
        return responses.notFound(res, 'store_not_found');
      }

      store.deleted = true; // Soft delete
      await store.save();

      return responses.deleted(res, 'store_deleted_successfully');
    } catch (error) {
      return responses.serverError(res, 'failed_to_delete_store', error);
    }
  }
};

module.exports = storeController;
