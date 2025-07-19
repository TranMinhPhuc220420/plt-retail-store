import ProductCategory from '../models/ProductCategory.js';
import Store from '../models/Store.js';

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
      console.log(error);
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
      await productCategory.remove();
      res.status(200).json({ message: 'Product category deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete product category' });
    }
  },

  getAllMyInStore: async (req, res) => {
    try {
      console.log(req.params);
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
      console.log(error);
      res.status(500).json({ error: 'Failed to create product category' });
    }
  },

  updateMyInStore: async (req, res) => {
    try {
      const { id } = req.params;
      const { storeCode } = req.body;

      if (!storeCode) {
        return res.status(400).json({ error: 'Store ID is required' });
      }
      const store = await Store.findOne({ storeCode, owner: req.user.id });
      if (!store) {
        return res.status(404).json({ error: 'Store not found or you do not own this store' });
      }

      const productCategory = await ProductCategory.findById(id);
      if (!productCategory || productCategory.storeId.toString() !== store._id.toString()) {
        return res.status(404).json({ error: 'Product category not found in this store' });
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
      const productCategory = await ProductCategory.findById(req.params.id);
      if (!productCategory || productCategory.owner.toString() !== req.user.id) {
        return res.status(404).json({ error: 'Product category not found' });
      }
      await productCategory.remove();
      res.status(200).json({ message: 'Product category deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete product category' });
    }
  }
};

export default productCategoryController;
