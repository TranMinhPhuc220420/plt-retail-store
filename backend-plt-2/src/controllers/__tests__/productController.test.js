const productController = require('../../controllers/productController');
const Product = require('../../models/Product');
const Store = require('../../models/Store');
const Recipe = require('../../models/Recipe');

// Mock dependencies
jest.mock('../../models/Product');
jest.mock('../../models/Store');
jest.mock('../../models/Recipe');

describe('ProductController', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      body: {},
      params: {},
      query: {},
      user: { _id: 'user123', id: 'user123' }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    next = jest.fn();

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('getAllMy', () => {
    it('should get all products for user successfully', async () => {
      const mockProducts = [
        { _id: 'product1', name: 'Product 1', ownerId: 'user123' },
        { _id: 'product2', name: 'Product 2', ownerId: 'user123' }
      ];

      const mockFind = {
        populate: jest.fn().mockReturnThis()
      };
      mockFind.populate.mockResolvedValue(mockProducts);
      Product.find.mockReturnValue(mockFind);

      await productController.getAllMy(req, res);

      expect(Product.find).toHaveBeenCalledWith({ ownerId: 'user123' });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockProducts);
    });

    it('should handle errors when fetching products', async () => {
      const mockFind = {
        populate: jest.fn().mockReturnThis()
      };
      mockFind.populate.mockRejectedValue(new Error('Database error'));
      Product.find.mockReturnValue(mockFind);

      await productController.getAllMy(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'failed_to_fetch_products' });
    });
  });

  describe('getMyById', () => {
    beforeEach(() => {
      req.params.id = 'product123';
    });

    it('should get product by ID successfully', async () => {
      const mockProduct = { _id: 'product123', name: 'Test Product', ownerId: 'user123' };
      
      const mockFindById = {
        populate: jest.fn().mockResolvedValue(mockProduct)
      };
      Product.findById.mockReturnValue(mockFindById);

      await productController.getMyById(req, res);

      expect(Product.findById).toHaveBeenCalledWith('product123');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockProduct);
    });

    it('should return 404 for non-existent product', async () => {
      const mockFindById = {
        populate: jest.fn().mockResolvedValue(null)
      };
      Product.findById.mockReturnValue(mockFindById);

      await productController.getMyById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'product_not_found' });
    });

    it('should handle database errors', async () => {
      const mockFindById = {
        populate: jest.fn().mockRejectedValue(new Error('Database error'))
      };
      Product.findById.mockReturnValue(mockFindById);

      await productController.getMyById(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'failed_to_fetch_product' });
    });
  });

  describe('createMy', () => {
    beforeEach(() => {
      req.body = {
        productCode: 'PROD001',
        name: 'Test Product',
        price: '10.00',
        retailPrice: '15.00',
        costPrice: '8.00',
        minStock: 10,
        unit: 'kg',
        status: 'active'
      };
    });

    it('should create a new product successfully', async () => {
      const mockProduct = { 
        _id: 'newProduct123', 
        ...req.body, 
        ownerId: 'user123',
        save: jest.fn().mockResolvedValue(true)
      };

      Product.mockImplementation(() => mockProduct);

      await productController.createMy(req, res);

      expect(Product).toHaveBeenCalledWith({
        ...req.body,
        ownerId: 'user123'
      });
      expect(mockProduct.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(mockProduct);
    });

    it('should handle product creation errors', async () => {
      const mockProduct = { 
        save: jest.fn().mockRejectedValue(new Error('Validation error'))
      };
      Product.mockImplementation(() => mockProduct);

      await productController.createMy(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'failed_to_create_product' });
    });
  });

  describe('updateMy', () => {
    beforeEach(() => {
      req.params.id = 'product123';
      req.body = {
        name: 'Updated Product',
        price: '12.00'
      };
    });

    it('should update product successfully', async () => {
      const mockProduct = { 
        _id: 'product123', 
        name: 'Old Product',
        ownerId: 'user123',
        save: jest.fn().mockResolvedValue(true)
      };

      Product.findById.mockResolvedValue(mockProduct);

      await productController.updateMy(req, res);

      expect(Product.findById).toHaveBeenCalledWith('product123');
      expect(mockProduct.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockProduct);
    });

    it('should return 404 for non-existent product', async () => {
      Product.findById.mockResolvedValue(null);

      await productController.updateMy(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'product_not_found' });
    });
  });

  describe('deleteMy', () => {
    beforeEach(() => {
      req.params.id = 'product123';
    });

    it('should delete product successfully', async () => {
      const mockProduct = { 
        _id: 'product123',
        ownerId: 'user123',
        deleted: false,
        save: jest.fn().mockResolvedValue(true)
      };

      Product.findById.mockResolvedValue(mockProduct);

      await productController.deleteMy(req, res);

      expect(Product.findById).toHaveBeenCalledWith('product123');
      expect(mockProduct.deleted).toBe(true);
      expect(mockProduct.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: 'product_deleted_successfully' });
    });

    it('should return 404 for non-existent product', async () => {
      Product.findById.mockResolvedValue(null);

      await productController.deleteMy(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'product_not_found' });
    });

    it('should return 404 for already deleted product', async () => {
      const mockProduct = { 
        _id: 'product123',
        ownerId: 'user123',
        deleted: true
      };

      Product.findById.mockResolvedValue(mockProduct);

      await productController.deleteMy(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'product_not_found' });
    });
  });

  describe('getAllMyInStore', () => {
    beforeEach(() => {
      req.params.storeCode = 'STORE001';
    });

    it('should get all products in store successfully', async () => {
      const mockStore = { _id: 'store123', storeCode: 'STORE001' };
      const mockProducts = [
        { _id: 'product1', name: 'Product 1', storeId: 'store123' }
      ];

      Store.findOne.mockResolvedValue(mockStore);
      
      const mockFind = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        skip: jest.fn().mockResolvedValue(mockProducts)
      };
      Product.find.mockReturnValue(mockFind);
      Product.countDocuments.mockResolvedValue(1);

      await productController.getAllMyInStore(req, res);

      expect(Store.findOne).toHaveBeenCalledWith({ storeCode: 'STORE001' });
      expect(Product.find).toHaveBeenCalledWith({
        storeId: 'store123',
        ownerId: 'user123',
        deleted: false
      });
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 404 for non-existent store', async () => {
      Store.findOne.mockResolvedValue(null);

      await productController.getAllMyInStore(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'store_not_found' });
    });
  });

  describe('createMyInStore', () => {
    beforeEach(() => {
      req.params.storeCode = 'STORE001';
      req.body = {
        productCode: 'PROD001',
        name: 'Test Product',
        price: '10.00'
      };
    });

    it('should create product in store successfully', async () => {
      const mockStore = { _id: 'store123', storeCode: 'STORE001' };
      const mockProduct = { 
        _id: 'newProduct123',
        ...req.body,
        storeId: 'store123',
        ownerId: 'user123',
        save: jest.fn().mockResolvedValue(true)
      };

      Store.findOne.mockResolvedValue(mockStore);
      Product.mockImplementation(() => mockProduct);

      await productController.createMyInStore(req, res);

      expect(Store.findOne).toHaveBeenCalledWith({ storeCode: 'STORE001' });
      expect(Product).toHaveBeenCalledWith({
        ...req.body,
        storeId: 'store123',
        ownerId: 'user123'
      });
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });
});