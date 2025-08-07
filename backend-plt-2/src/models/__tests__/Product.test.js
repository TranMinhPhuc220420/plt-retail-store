const Product = require('../../models/Product');
const mongoose = require('mongoose');

describe('Product Model', () => {
  describe('Product creation', () => {
    it('should create a new product with valid data', async () => {
      const productData = {
        productCode: 'TEST001',
        name: 'Test Product',
        description: 'Test product description',
        category: 'electronics',
        price: 100000,
        retailPrice: 120000,
        storeId: new mongoose.Types.ObjectId(),
        stock: {
          quantity: 50,
          unit: 'piece'
        }
      };

      const product = new Product(productData);
      const savedProduct = await product.save();

      expect(savedProduct.productCode).toBe(productData.productCode);
      expect(savedProduct.name).toBe(productData.name);
      expect(savedProduct.price).toBe(productData.price);
      expect(savedProduct.stock.quantity).toBe(productData.stock.quantity);
      expect(savedProduct._id).toBeDefined();
    });

    it('should not save product without required fields', async () => {
      const product = new Product({});
      
      await expect(product.save()).rejects.toThrow();
    });

    it('should not save product with negative price', async () => {
      const productData = {
        productCode: 'TEST002',
        name: 'Test Product 2',
        description: 'Test product description',
        category: 'electronics',
        price: -100,
        retailPrice: 120000,
        storeId: new mongoose.Types.ObjectId()
      };

      const product = new Product(productData);
      
      await expect(product.save()).rejects.toThrow();
    });

    it('should set default values correctly', async () => {
      const productData = {
        productCode: 'TEST003',
        name: 'Test Product 3',
        category: 'electronics',
        price: 100000,
        storeId: new mongoose.Types.ObjectId()
      };

      const product = new Product(productData);
      const savedProduct = await product.save();

      expect(savedProduct.isActive).toBe(true);
      expect(savedProduct.stock.quantity).toBe(0);
      expect(savedProduct.createdAt).toBeDefined();
    });
  });

  describe('Product validation', () => {
    it('should validate product code uniqueness within store', async () => {
      const storeId = new mongoose.Types.ObjectId();
      
      const productData1 = {
        productCode: 'DUPLICATE001',
        name: 'Test Product 1',
        category: 'electronics',
        price: 100000,
        storeId: storeId
      };

      const productData2 = {
        productCode: 'DUPLICATE001',
        name: 'Test Product 2',
        category: 'electronics',
        price: 200000,
        storeId: storeId
      };

      const product1 = new Product(productData1);
      await product1.save();

      const product2 = new Product(productData2);
      
      await expect(product2.save()).rejects.toThrow();
    });

    it('should allow same product code in different stores', async () => {
      const storeId1 = new mongoose.Types.ObjectId();
      const storeId2 = new mongoose.Types.ObjectId();
      
      const productData1 = {
        productCode: 'SAME001',
        name: 'Test Product 1',
        category: 'electronics',
        price: 100000,
        storeId: storeId1
      };

      const productData2 = {
        productCode: 'SAME001',
        name: 'Test Product 2',
        category: 'electronics',
        price: 200000,
        storeId: storeId2
      };

      const product1 = new Product(productData1);
      const savedProduct1 = await product1.save();

      const product2 = new Product(productData2);
      const savedProduct2 = await product2.save();

      expect(savedProduct1.productCode).toBe(savedProduct2.productCode);
      expect(savedProduct1.storeId).not.toEqual(savedProduct2.storeId);
    });
  });

  describe('Product methods', () => {
    let product;

    beforeEach(async () => {
      product = new Product({
        productCode: 'METHOD001',
        name: 'Method Test Product',
        category: 'electronics',
        price: 100000,
        retailPrice: 120000,
        storeId: new mongoose.Types.ObjectId(),
        stock: {
          quantity: 100,
          unit: 'piece'
        }
      });
      await product.save();
    });

    it('should calculate profit margin correctly', () => {
      const profitMargin = ((product.retailPrice - product.price) / product.price) * 100;
      expect(profitMargin).toBe(20);
    });

    it('should update stock quantity', async () => {
      const newQuantity = 75;
      product.stock.quantity = newQuantity;
      const updatedProduct = await product.save();

      expect(updatedProduct.stock.quantity).toBe(newQuantity);
    });

    it('should handle stock deduction', async () => {
      const deductionAmount = 10;
      const originalQuantity = product.stock.quantity;
      
      product.stock.quantity -= deductionAmount;
      const updatedProduct = await product.save();

      expect(updatedProduct.stock.quantity).toBe(originalQuantity - deductionAmount);
    });
  });
});
