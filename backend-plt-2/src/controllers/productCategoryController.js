const ProductCategory = require('../models/ProductCategory');
const Store = require('../models/Store');

const productCategoryController = {
  getAllMy: async (req, res) => {
    try {
      const productCategories = await ProductCategory.find({ ownerId: req.user._id, deleted: false });
      res.status(200).json(productCategories);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch product categories' });
    }
  },

  getMyById: async (req, res) => {
    try {
      const productCategory = await ProductCategory.findById(req.params.id);
      if (!productCategory || productCategory.owner.toString() !== req.user.id) {
        return res.status(404).json({ error: 'Product category not found' });
      }
      res.status(200).json(productCategory);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch product category' });
    }
  },

  
  createMy: async (req, res) => {
    try {
      const newProductCategory = new ProductCategory({
        ...req.body,
        ownerId: req.user._id
      });
      const savedProductCategory = await newProductCategory.save();
      res.status(201).json(savedProductCategory);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create product category' });
    }
  },

  updateMy: async (req, res) => {
    try {
      const { id } = req.params;
      
      const productCategory = await ProductCategory.findById(id);
      if (!productCategory) {
        return res.status(404).json({ error: 'Product category not found' });
      }
      
      Object.assign(productCategory, req.body);
      const updatedProductCategory = await productCategory.save();

      res.status(200).json(updatedProductCategory);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update product category' });
    }
  },

  deleteMy: async (req, res) => {
    try {
      const productCategory = await ProductCategory.findById(req.params.id);
      if (!productCategory || productCategory.owner.toString() !== req.user.id) {
        return res.status(404).json({ error: 'Product category not found' });
      }
      await productCategory.deleteOne();
      res.status(200).json({ message: 'Product category deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete product category' });
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

      // Fetch product categories for the store
      const productCategories = await ProductCategory.find({ storeId: store._id, ownerId: req.user._id, deleted: false });
      res.status(200).json(productCategories);

    } catch (error) {
      console.info(error);
      res.status(500).json({ error: 'Failed to fetch product categories' });
    }
  },

  createMyInStore: async (req, res) => {
    try {
      const { storeId, ownerId } = req.body;
      if (!storeId) return res.status(400).json({ error: 'store_id_required' });
      if (!ownerId) return res.status(400).json({ error: 'owner_id_required' });

      const newProductCategory = new ProductCategory({
        ...req.body,
      });
      const savedProductCategory = await newProductCategory.save();

      res.status(201).json(savedProductCategory);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create product category' });
    }
  },

  createMyInStoreBulk: async (req, res) => {
    try {
      const { categories } = req.body;
      if (!categories || !Array.isArray(categories) || categories.length === 0) {
        return res.status(400).json({ error: 'categories_required' });
      }
      
      const savedProductCategories = await ProductCategory.insertMany(categories);
      res.status(201).json(savedProductCategories);

    } catch (error) {
      res.status(500).json({ error: 'failed_to_create_product_categories_bulk' });
    }
  },

  updateMyInStore: async (req, res) => {
    try {
      if (!req.item_update) {
        return res.status(400).json({ error: 'product_category_not_found' });
      }

      Object.assign(req.item_update, req.body);
      const updatedProductCategory = await req.item_update.save();

      res.status(200).json(updatedProductCategory);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update product category' });
    }
  },

  deleteMyInStore: async (req, res) => {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({ error: 'product_category_id_required' });
      }

      const productCategory = await ProductCategory.findOne({ _id: id, ownerId: req.user._id, deleted: false });
      if (!productCategory) {
        return res.status(404).json({ error: 'product_category_not_found' });
      }
      
      productCategory.deleted = true; // Soft delete
      await productCategory.save();
      
      res.status(200).json({ message: 'product_category_deleted_successfully' });
    } catch (error) {
      res.status(500).json({ error: 'failed_to_delete_product_category' });
    }
  },

  deleteMyInStoreBulk: async (req, res) => {
    try {
      const { ids } = req.query;
      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: 'product_category_ids_required' });
      }

      const productCategories = await ProductCategory.find({ _id: { $in: ids }, ownerId: req.user._id, deleted: false });
      if (productCategories.length === 0) {
        return res.status(404).json({ error: 'product_categories_not_found' });
      }

      await ProductCategory.updateMany({ _id: { $in: ids } }, { deleted: true }); // Soft delete

      res.status(200).json({ message: 'product_categories_deleted_successfully' });
    } catch (error) {
      res.status(500).json({ error: 'failed_to_delete_product_categories_bulk' });
    }
  }
};

module.exports = productCategoryController;
