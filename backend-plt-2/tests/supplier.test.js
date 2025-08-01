const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const User = require('../src/models/User');
const Store = require('../src/models/Store');
const Supplier = require('../src/models/Supplier');

describe('Supplier API', () => {
  let authToken;
  let testUser;
  let testStore;

  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/plt-test');
  });

  beforeEach(async () => {
    // Clean up database
    await User.deleteMany({});
    await Store.deleteMany({});
    await Supplier.deleteMany({});

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

    // Login to get auth token
    const loginResponse = await request(app)
      .post('/auth/login')
      .send({
        username: 'testuser',
        password: 'password123'
      });

    authToken = loginResponse.body.token;
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('POST /api/suppliers/my-suppliers-stores', () => {
    it('should create a new supplier successfully', async () => {
      const supplierData = {
        supplierCode: 'SUP001',
        name: 'Test Supplier',
        description: 'A test supplier',
        contactInfo: {
          email: 'supplier@test.com',
          phone: '+1234567890',
          contactPerson: {
            name: 'John Doe',
            title: 'Sales Manager'
          }
        },
        storeCode: 'TEST001'
      };

      const response = await request(app)
        .post('/api/suppliers/my-suppliers-stores')
        .set('Authorization', `Bearer ${authToken}`)
        .send(supplierData)
        .expect(201);

      expect(response.body).toHaveProperty('_id');
      expect(response.body.supplierCode).toBe('SUP001');
      expect(response.body.name).toBe('Test Supplier');
      expect(response.body.ownerId).toBe(testUser._id.toString());
    });

    it('should return 400 if supplier code already exists', async () => {
      // Create first supplier
      const supplier1 = new Supplier({
        supplierCode: 'SUP001',
        name: 'Existing Supplier',
        ownerId: testUser._id,
        storeId: testStore._id
      });
      await supplier1.save();

      const supplierData = {
        supplierCode: 'SUP001',
        name: 'Test Supplier',
        storeCode: 'TEST001'
      };

      const response = await request(app)
        .post('/api/suppliers/my-suppliers-stores')
        .set('Authorization', `Bearer ${authToken}`)
        .send(supplierData)
        .expect(400);

      expect(response.body.error).toBe('supplier_code_already_exists');
    });

    it('should return 400 for invalid supplier data', async () => {
      const invalidData = {
        supplierCode: '', // Empty code
        name: 'Test Supplier',
        storeCode: 'TEST001'
      };

      const response = await request(app)
        .post('/api/suppliers/my-suppliers-stores')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/suppliers/my-suppliers-stores/:storeCode', () => {
    it('should fetch all suppliers for a store', async () => {
      // Create test suppliers
      const supplier1 = new Supplier({
        supplierCode: 'SUP001',
        name: 'Supplier 1',
        ownerId: testUser._id,
        storeId: testStore._id
      });

      const supplier2 = new Supplier({
        supplierCode: 'SUP002',
        name: 'Supplier 2',
        ownerId: testUser._id,
        storeId: testStore._id
      });

      await Promise.all([supplier1.save(), supplier2.save()]);

      const response = await request(app)
        .get('/api/suppliers/my-suppliers-stores/TEST001')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body[0].supplierCode).toBe('SUP002'); // Should be sorted by createdAt desc
      expect(response.body[1].supplierCode).toBe('SUP001');
    });

    it('should return empty array if no suppliers exist', async () => {
      const response = await request(app)
        .get('/api/suppliers/my-suppliers-stores/TEST001')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveLength(0);
    });
  });

  describe('GET /api/suppliers/my-suppliers/:id', () => {
    it('should fetch supplier by ID', async () => {
      const supplier = new Supplier({
        supplierCode: 'SUP001',
        name: 'Test Supplier',
        ownerId: testUser._id,
        storeId: testStore._id
      });
      await supplier.save();

      const response = await request(app)
        .get(`/api/suppliers/my-suppliers/${supplier._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body._id).toBe(supplier._id.toString());
      expect(response.body.supplierCode).toBe('SUP001');
    });

    it('should return 404 if supplier not found', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      
      const response = await request(app)
        .get(`/api/suppliers/my-suppliers/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.error).toBe('supplier_not_found');
    });
  });

  describe('PUT /api/suppliers/my-suppliers-stores/:id', () => {
    it('should update supplier successfully', async () => {
      const supplier = new Supplier({
        supplierCode: 'SUP001',
        name: 'Original Name',
        ownerId: testUser._id,
        storeId: testStore._id
      });
      await supplier.save();

      const updateData = {
        name: 'Updated Name',
        description: 'Updated description',
        storeCode: 'TEST001'
      };

      const response = await request(app)
        .put(`/api/suppliers/my-suppliers-stores/${supplier._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.name).toBe('Updated Name');
      expect(response.body.description).toBe('Updated description');
    });
  });

  describe('DELETE /api/suppliers/my-suppliers-stores/:id', () => {
    it('should soft delete supplier successfully', async () => {
      const supplier = new Supplier({
        supplierCode: 'SUP001',
        name: 'Test Supplier',
        ownerId: testUser._id,
        storeId: testStore._id
      });
      await supplier.save();

      const response = await request(app)
        .delete(`/api/suppliers/my-suppliers-stores/${supplier._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.message).toBe('supplier_deleted_successfully');

      // Verify supplier is soft deleted
      const deletedSupplier = await Supplier.findById(supplier._id);
      expect(deletedSupplier.deleted).toBe(true);
    });
  });

  describe('POST /api/suppliers/my-suppliers-stores-bulk', () => {
    it('should create multiple suppliers successfully', async () => {
      const suppliersData = {
        storeCode: 'TEST001',
        suppliers: [
          {
            supplierCode: 'SUP001',
            name: 'Supplier 1',
            description: 'First supplier'
          },
          {
            supplierCode: 'SUP002',
            name: 'Supplier 2',
            description: 'Second supplier'
          }
        ]
      };

      const response = await request(app)
        .post('/api/suppliers/my-suppliers-stores-bulk')
        .set('Authorization', `Bearer ${authToken}`)
        .send(suppliersData)
        .expect(201);

      expect(response.body).toHaveLength(2);
      expect(response.body[0].supplierCode).toBe('SUP001');
      expect(response.body[1].supplierCode).toBe('SUP002');
    });

    it('should return 400 for duplicate codes in batch', async () => {
      const suppliersData = {
        storeCode: 'TEST001',
        suppliers: [
          {
            supplierCode: 'SUP001',
            name: 'Supplier 1'
          },
          {
            supplierCode: 'SUP001', // Duplicate
            name: 'Supplier 2'
          }
        ]
      };

      const response = await request(app)
        .post('/api/suppliers/my-suppliers-stores-bulk')
        .set('Authorization', `Bearer ${authToken}`)
        .send(suppliersData)
        .expect(400);

      expect(response.body.error).toBe('duplicate_supplier_codes_in_batch');
    });
  });

  describe('DELETE /api/suppliers/my-suppliers-stores-bulk', () => {
    it('should delete multiple suppliers successfully', async () => {
      const supplier1 = new Supplier({
        supplierCode: 'SUP001',
        name: 'Supplier 1',
        ownerId: testUser._id,
        storeId: testStore._id
      });

      const supplier2 = new Supplier({
        supplierCode: 'SUP002',
        name: 'Supplier 2',
        ownerId: testUser._id,
        storeId: testStore._id
      });

      await Promise.all([supplier1.save(), supplier2.save()]);

      const deleteData = {
        supplierIds: [supplier1._id.toString(), supplier2._id.toString()]
      };

      const response = await request(app)
        .delete('/api/suppliers/my-suppliers-stores-bulk')
        .set('Authorization', `Bearer ${authToken}`)
        .send(deleteData)
        .expect(200);

      expect(response.body.message).toBe('suppliers_deleted_successfully');
      expect(response.body.deletedCount).toBe(2);
    });
  });
});
