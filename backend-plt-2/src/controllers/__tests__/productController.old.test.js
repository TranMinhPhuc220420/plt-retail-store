const productController = require('../../controllers/productController');
const Product = require('../../models/Product');
const mongoose = require('mongoose');

// Mock dependencies
jest.mock('../../models/Product');

describe('ProductController', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      body: {},
      params: {},
      query: {},
      user: { _id: 'user123' }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    next = jest.fn();

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('createProduct', () => {
    it('should create a new product successfully', async () => {
      req.body = {
        productCode: 'TEST001',
        name: 'Test Product',
        description: 'Test description',
        category: 'electronics',
        price: 100000,
        retailPrice: 120000,
        storeId: 'store123'
      };

      const mockProduct = {
        _id: 'product123',
        ...req.body,
        createdAt: new Date(),
        save: jest.fn().mockResolvedValue(true)
      };

      Product.findOne.mockResolvedValue(null); // No duplicate
      Product.mockImplementation(() => mockProduct);

      await productController.createProduct(req, res);

      expect(Product.findOne).toHaveBeenCalledWith({
        productCode: 'TEST001',
        storeId: 'store123'
      });
      expect(mockProduct.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            productCode: 'TEST001',
            name: 'Test Product'
          })
        })
      );
    });

    it('should return error for duplicate product code', async () => {
      req.body = {
        productCode: 'DUPLICATE001',
        name: 'Duplicate Product',
        storeId: 'store123'
      };

      Product.findOne.mockResolvedValue({
        productCode: 'DUPLICATE001',
        storeId: 'store123'
      });

      await productController.createProduct(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('already exists')
        })
      );
    });

    it('should handle validation errors', async () => {
      req.body = {
        productCode: 'TEST002',
        name: 'Test Product',
        price: -100 // Invalid price
      };

      Product.findOne.mockResolvedValue(null);
      const mockProduct = {
        save: jest.fn().mockRejectedValue(new Error('Validation error'))
      };
      Product.mockImplementation(() => mockProduct);

      await productController.createProduct(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.any(String)
        })
      );
    });
  });

  describe('getProducts', () => {
    it('should get all products for a store', async () => {
      req.query = {
        storeId: 'store123',
        page: '1',
        limit: '10'
      };

      const mockProducts = [
        {
          _id: 'product1',
          productCode: 'PROD001',
          name: 'Product 1',
          price: 100000
        },
        {
          _id: 'product2',
          productCode: 'PROD002',
          name: 'Product 2',
          price: 200000
        }
      ];

      Product.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockProducts)
      });

      Product.countDocuments.mockResolvedValue(2);

      await productController.getProducts(req, res);

      expect(Product.find).toHaveBeenCalledWith({ storeId: 'store123' });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockProducts,
          pagination: expect.objectContaining({
            total: 2,
            page: 1,
            limit: 10
          })
        })
      );
    });

    it('should filter products by search term', async () => {
      req.query = {
        storeId: 'store123',
        search: 'laptop'
      };

      Product.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([])
      });

      Product.countDocuments.mockResolvedValue(0);

      await productController.getProducts(req, res);

      expect(Product.find).toHaveBeenCalledWith({
        storeId: 'store123',
        $or: [
          { name: { $regex: 'laptop', $options: 'i' } },
          { productCode: { $regex: 'laptop', $options: 'i' } }
        ]
      });
    });
  });

  describe('getProductById', () => {
    it('should get product by ID successfully', async () => {
      req.params.id = 'product123';

      const mockProduct = {
        _id: 'product123',
        productCode: 'PROD001',
        name: 'Product 1',
        price: 100000
      };

      Product.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockProduct)
      });

      await productController.getProductById(req, res);

      expect(Product.findById).toHaveBeenCalledWith('product123');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockProduct
        })
      );
    });

    it('should return 404 for non-existent product', async () => {
      req.params.id = 'nonexistent123';

      Product.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null)
      });

      await productController.getProductById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('not found')
        })
      );
    });

    it('should handle invalid ObjectId', async () => {
      req.params.id = 'invalid-id';

      Product.findById.mockReturnValue({
        populate: jest.fn().mockRejectedValue(new Error('Invalid ObjectId'))
      });

      await productController.getProductById(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.any(String)
        })
      );
    });
  });

  describe('updateProduct', () => {
    it('should update product successfully', async () => {
      req.params.id = 'product123';
      req.body = {
        name: 'Updated Product Name',
        price: 150000
      };

      const mockProduct = {
        _id: 'product123',
        productCode: 'PROD001',
        name: 'Updated Product Name',
        price: 150000
      };

      Product.findByIdAndUpdate.mockResolvedValue(mockProduct);

      await productController.updateProduct(req, res);

      expect(Product.findByIdAndUpdate).toHaveBeenCalledWith(
        'product123',
        req.body,
        { new: true, runValidators: true }
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockProduct
        })
      );
    });

    it('should return 404 for non-existent product', async () => {
      req.params.id = 'nonexistent123';
      req.body = { name: 'Updated Name' };

      Product.findByIdAndUpdate.mockResolvedValue(null);

      await productController.updateProduct(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('not found')
        })
      );
    });
  });

  describe('deleteProduct', () => {
    it('should delete product successfully', async () => {
      req.params.id = 'product123';

      const mockProduct = {
        _id: 'product123',
        productCode: 'PROD001',
        name: 'Product to Delete'
      };

      Product.findByIdAndDelete.mockResolvedValue(mockProduct);

      await productController.deleteProduct(req, res);

      expect(Product.findByIdAndDelete).toHaveBeenCalledWith('product123');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining('deleted successfully')
        })
      );
    });

    it('should return 404 for non-existent product', async () => {
      req.params.id = 'nonexistent123';

      Product.findByIdAndDelete.mockResolvedValue(null);

      await productController.deleteProduct(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('not found')
        })
      );
    });
  });
});
