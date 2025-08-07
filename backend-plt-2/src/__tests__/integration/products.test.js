const request = require('supertest');
const app = require('../../app');
const User = require('../../models/User');
const Store = require('../../models/Store');
const Product = require('../../models/Product');
const jwt = require('jsonwebtoken');

describe('Products API Integration Tests', () => {
  let authToken;
  let testUser;
  let testStore;

  beforeEach(async () => {
    // Create test user
    testUser = new User({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      role: 'admin'
    });
    await testUser.save();

    // Create test store
    testStore = new Store({
      storeCode: 'TEST001',
      name: 'Test Store',
      address: '123 Test St',
      ownerId: testUser._id
    });
    await testStore.save();

    // Generate auth token
    authToken = jwt.sign(
      { userId: testUser._id, username: testUser.username },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
  });

  describe('POST /api/products', () => {
    it('should create a new product', async () => {
      const productData = {
        productCode: 'PROD001',
        name: 'Test Product',
        description: 'Test product description',
        category: 'electronics',
        price: 100000,
        retailPrice: 120000,
        storeId: testStore._id.toString()
      };

      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send(productData)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('productCode', productData.productCode);
      expect(response.body.data).toHaveProperty('name', productData.name);
      expect(response.body.data).toHaveProperty('price', productData.price);
    });

    it('should return error for duplicate product code in same store', async () => {
      // Create first product
      const product1 = new Product({
        productCode: 'DUPLICATE001',
        name: 'First Product',
        category: 'electronics',
        price: 100000,
        storeId: testStore._id
      });
      await product1.save();

      // Try to create second product with same code
      const productData = {
        productCode: 'DUPLICATE001',
        name: 'Second Product',
        category: 'electronics',
        price: 200000,
        storeId: testStore._id.toString()
      };

      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send(productData)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toContain('already exists');
    });

    it('should return error without authentication', async () => {
      const productData = {
        productCode: 'UNAUTH001',
        name: 'Unauthorized Product',
        category: 'electronics',
        price: 100000,
        storeId: testStore._id.toString()
      };

      const response = await request(app)
        .post('/api/products')
        .send(productData)
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/products', () => {
    beforeEach(async () => {
      // Create test products
      const products = [
        {
          productCode: 'PROD001',
          name: 'Product 1',
          category: 'electronics',
          price: 100000,
          storeId: testStore._id
        },
        {
          productCode: 'PROD002',
          name: 'Product 2',
          category: 'clothing',
          price: 50000,
          storeId: testStore._id
        },
        {
          productCode: 'LAPTOP001',
          name: 'Gaming Laptop',
          category: 'electronics',
          price: 15000000,
          storeId: testStore._id
        }
      ];

      await Product.insertMany(products);
    });

    it('should get all products for a store', async () => {
      const response = await request(app)
        .get('/api/products')
        .query({ storeId: testStore._id.toString() })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveLength(3);
      expect(response.body).toHaveProperty('pagination');
      expect(response.body.pagination.total).toBe(3);
    });

    it('should filter products by search term', async () => {
      const response = await request(app)
        .get('/api/products')
        .query({ 
          storeId: testStore._id.toString(),
          search: 'laptop'
        })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].name).toContain('Laptop');
    });

    it('should filter products by category', async () => {
      const response = await request(app)
        .get('/api/products')
        .query({ 
          storeId: testStore._id.toString(),
          category: 'electronics'
        })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data.every(p => p.category === 'electronics')).toBe(true);
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/products')
        .query({ 
          storeId: testStore._id.toString(),
          page: 1,
          limit: 2
        })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(2);
      expect(response.body.pagination.total).toBe(3);
    });
  });

  describe('GET /api/products/:id', () => {
    let testProduct;

    beforeEach(async () => {
      testProduct = new Product({
        productCode: 'SINGLE001',
        name: 'Single Product',
        category: 'electronics',
        price: 100000,
        storeId: testStore._id
      });
      await testProduct.save();
    });

    it('should get product by ID', async () => {
      const response = await request(app)
        .get(`/api/products/${testProduct._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('_id', testProduct._id.toString());
      expect(response.body.data).toHaveProperty('productCode', 'SINGLE001');
      expect(response.body.data).toHaveProperty('name', 'Single Product');
    });

    it('should return 404 for non-existent product', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      
      const response = await request(app)
        .get(`/api/products/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toContain('not found');
    });

    it('should return 400 for invalid ObjectId', async () => {
      const response = await request(app)
        .get('/api/products/invalid-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('PUT /api/products/:id', () => {
    let testProduct;

    beforeEach(async () => {
      testProduct = new Product({
        productCode: 'UPDATE001',
        name: 'Product to Update',
        category: 'electronics',
        price: 100000,
        storeId: testStore._id
      });
      await testProduct.save();
    });

    it('should update product successfully', async () => {
      const updateData = {
        name: 'Updated Product Name',
        price: 150000,
        description: 'Updated description'
      };

      const response = await request(app)
        .put(`/api/products/${testProduct._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('name', updateData.name);
      expect(response.body.data).toHaveProperty('price', updateData.price);
      expect(response.body.data).toHaveProperty('description', updateData.description);
    });

    it('should return 404 for non-existent product', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      
      const response = await request(app)
        .put(`/api/products/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Updated Name' })
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toContain('not found');
    });
  });

  describe('DELETE /api/products/:id', () => {
    let testProduct;

    beforeEach(async () => {
      testProduct = new Product({
        productCode: 'DELETE001',
        name: 'Product to Delete',
        category: 'electronics',
        price: 100000,
        storeId: testStore._id
      });
      await testProduct.save();
    });

    it('should delete product successfully', async () => {
      const response = await request(app)
        .delete(`/api/products/${testProduct._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.message).toContain('deleted successfully');

      // Verify product is deleted
      const deletedProduct = await Product.findById(testProduct._id);
      expect(deletedProduct).toBeNull();
    });

    it('should return 404 for non-existent product', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      
      const response = await request(app)
        .delete(`/api/products/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toContain('not found');
    });
  });
});
