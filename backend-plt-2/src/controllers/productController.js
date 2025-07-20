const Product = require('../models/Product');
const Store = require('../models/Store');

const productController = {
  getAllMy: async (req, res) => {
    try {
      const products = await Product.find({ owner: req.user.id });
      res.status(200).json(products);
    } catch (error) {
      res.status(500).json({ error: 'failed_to_fetch_products' });
    }
  },

  getMyById: async (req, res) => {
    try {
      const { id } = req.params;
      const product = await Product.findOne({ _id: id, ownerId: req.user._id });
      if (!product) {
        return res.status(404).json({ error: 'product_not_found' });
      }
      res.status(200).json(product);
    } catch (error) {
      res.status(500).json({ error: 'failed_to_fetch_product' });
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

      const products = await Product.findOne({ storeId: store._id, ownerId: req.user._id });
      res.status(200).json(products);
      
    } catch (error) {
      res.status(500).json({ error: 'failed_to_fetch_product' });
    }
  },

  createMy: async (req, res) => {
    try {
      const newProduct = new Product({
        ...req.body,
        ownerId: req.user._id
      });
      const savedProduct = await newProduct.save();
      res.status(201).json(savedProduct);
    } catch (error) {
      res.status(500).json({ error: 'failed_to_create_store' });
    }
  },

  updateMy: async (req, res) => {
    try {
      const { id } = req.params;
      
      const product = await Product.findOne({ _id: id, ownerId: req.user._id });
      if (!product) {
        return res.status(404).json({ error: 'product_not_found' });
      }
      
      Object.assign(product, req.body);
      const updatedProduct = await product.save();

      res.status(200).json(updatedProduct);
    } catch (error) {
      res.status(500).json({ error: 'failed_to_update_store' });
    }
  },

  deleteMy: async (req, res) => {
    try {
      const { id } = req.params;
      const product = await Product.findOne({ _id: id, ownerId: req.user._id });
      if (!product) {
        return res.status(404).json({ error: 'product_not_found' });
      }

      await product.deleteOne();
      res.status(200).json({ message: 'product_deleted_successfully' });
      
    } catch (error) {
      res.status(500).json({ error: 'failed_to_delete_product' });
    }
  },


  getAllMyInStore: async (req, res) => {
    try {
      const { storeCode } = req.params;
      if (!storeCode) {
        return res.status(400).json({ error: 'store_code_required' });
      }
      const store = await Store.findOne({ storeCode, ownerId: req.user._id });
      if (!store) {
        return res.status(404).json({ error: 'store_not_found' });
      }

      let products = await Product.find({ storeId: store._id, ownerId: req.user._id });
      res.status(200).json(products);

    } catch (error) {
      res.status(500).json({ error: 'failed_to_fetch_products' });
    }
  },

  createMyInStore: async (req, res) => {
    try {
      const newProduct = new Product({
        ...req.body,
        ownerId: req.user._id
      });
      const savedProduct = await newProduct.save();
      res.status(201).json(savedProduct);
    } catch (error) {
      console.log(error);
      
      res.status(500).json({ error: 'failed_to_create_store' });
    }
  },

  updateMyInStore: async (req, res) => {
    try {
      const { id, storeId } = req.params;
      
      const store = await Store.findOne({ _id: storeId, ownerId: req.user._id });
      if (!store) {
        return res.status(404).json({ error: 'store_not_found' });
      }
      
      const product = await Product.findOne({ _id: id, ownerId: req.user._id, storeId: store._id });
      if (!product) {
        return res.status(404).json({ error: 'product_not_found' });
      }
      
      Object.assign(product, req.body);
      const updatedProduct = await product.save();

      res.status(200).json(updatedProduct);
    } catch (error) {
      res.status(500).json({ error: 'failed_to_update_store' });
    }
  },

  deleteMyInStore: async (req, res) => {
    try {
      const { id, storeId } = req.params;
      if (!storeId) {
        return res.status(400).json({ error: 'store_id_required' });
      }

      const store = await Store.findOne({ _id: storeId, ownerId: req.user._id });
      if (!store) {
        return res.status(404).json({ error: 'store_not_found' });
      }

      const product = await Product.findOne({ _id: id, ownerId: req.user._id, storeId: store._id });
      if (!product) {
        return res.status(404).json({ error: 'product_not_found' });
      }

      await product.deleteOne();
      res.status(200).json({ message: 'product_deleted_successfully' });
      
    } catch (error) {
      res.status(500).json({ error: 'failed_to_delete_product' });
    }
  },
};

module.exports = productController;
