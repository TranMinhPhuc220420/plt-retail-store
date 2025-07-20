const ProductCategory = require('../models/ProductCategory');
const Store = require('../models/Store');

const productCategoryController = {
  getAllMy: async (req, res) => {
    try {
      const productCategories = await ProductCategory.find({ owner: req.user.id });
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
        return res.status(400).json({ error: 'Store ID is required' });
      }
      const store = await Store.findOne({ storeCode, owner: req.user.id });
      if (!store) {
        return res.status(404).json({ error: 'Store not found or you do not own this store' });
      }

      // Fetch product categories for the store
      const productCategories = await ProductCategory.find({ storeId: store._id, owner: req.user.id });
      res.status(200).json(productCategories);

    } catch (error) {
      console.info(error);
      res.status(500).json({ error: 'Failed to fetch product categories' });
    }
  },

  createMyInStore: async (req, res) => {
    try {
      const { storeId } = req.body;
      if (!storeId) {
        return res.status(400).json({ error: 'store_id_required' });
      }
      const store = await Store.findById(storeId);
      if (!store) {
        return res.status(404).json({ error: 'store_not_found' });
      }

      const newProductCategory = new ProductCategory({
        ...req.body,
        storeId: store._id,
        ownerId: req.user._id
      });
      const savedProductCategory = await newProductCategory.save();
      res.status(201).json(savedProductCategory);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create product category' });
    }
  },

  createMyInStoreBulk: async (req, res) => {
    try {
      const { storeId, categories } = req.body;
      
      const store = await Store.findOne({ _id: storeId, owner: req.user.id });
      if (!store) {
        return res.status(404).json({ error: 'store_not_found' });
      }

      const productCategories = categories.map(category => ({
        ...category,
        storeId: store._id,
        ownerId: req.user._id
      }));

      const savedProductCategories = await ProductCategory.insertMany(productCategories);
      res.status(201).json(savedProductCategories);

    } catch (error) {
      res.status(500).json({ error: 'failed_to_create_product_categories_bulk' });
    }
  },

  updateMyInStore: async (req, res) => {
    try {
      const { id } = req.params;
      const { storeId } = req.body;

      if (!storeId) {
        return res.status(400).json({ error: 'store_id_require'});
      }

      // Find owned store
      const store = await Store.findOne({ _id: storeId, owner: req.user.id });
      if (!store) {
        return res.status(404).json({ error: 'store_not_found' });
      }

      const productCategory = await ProductCategory.findOne({ _id: id, storeId: store._id, owner: req.user.id });
      if (!productCategory) {
        return res.status(404).json({ error: 'product_category_not_found' });
      }

      Object.assign(productCategory, req.body);
      const updatedProductCategory = await productCategory.save();

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

      const productCategory = await ProductCategory.findOne({ _id: id, owner: req.user.id });
      if (!productCategory) {
        return res.status(404).json({ error: 'product_category_not_found' });
      }
      
      await productCategory.deleteOne();
      
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

      const productCategories = await ProductCategory.find({ _id: { $in: ids }, owner: req.user.id });
      if (productCategories.length === 0) {
        return res.status(404).json({ error: 'product_categories_not_found' });
      }

      await ProductCategory.deleteMany({ _id: { $in: ids }, owner: req.user.id });

      res.status(200).json({ message: 'product_categories_deleted_successfully' });
    } catch (error) {
      res.status(500).json({ error: 'failed_to_delete_product_categories_bulk' });
    }
  }
};

module.exports = productCategoryController;
