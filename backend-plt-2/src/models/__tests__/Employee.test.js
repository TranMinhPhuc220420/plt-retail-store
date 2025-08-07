const request = require('supertest');
const app = require('../../app');
const Employee = require('../../models/Employee');
const Store = require('../../models/Store');
const User = require('../../models/User');
const { MANAGER_ROLE, STAFF_ROLE } = require('../../config/constant');

// Mock data
const mockStore = {
  _id: '507f1f77bcf86cd799439011',
  storeCode: 'ST001',
  name: 'Test Store',
  address: '123 Test Street',
  deleted: false,
  ownerId: '507f1f77bcf86cd799439012'
};

const mockOwner = {
  _id: '507f1f77bcf86cd799439012',
  username: 'testowner',
  email: 'owner@test.com',
  role: 'admin'
};

const mockManager = {
  _id: '507f1f77bcf86cd799439013',
  employeeCode: 'ST001-EMP-0001',
  firstName: 'John',
  lastName: 'Manager',
  email: 'manager@test.com',
  phone: '+84123456789',
  role: MANAGER_ROLE,
  department: 'management',
  storeId: '507f1f77bcf86cd799439011',
  ownerId: '507f1f77bcf86cd799439012',
  isActive: true,
  deleted: false
};

const mockStaff = {
  _id: '507f1f77bcf86cd799439014',
  employeeCode: 'ST001-EMP-0002',
  firstName: 'Jane',
  lastName: 'Staff',
  email: 'staff@test.com',
  phone: '+84123456788',
  role: STAFF_ROLE,
  department: 'sales',
  storeId: '507f1f77bcf86cd799439011',
  ownerId: '507f1f77bcf86cd799439012',
  managerId: '507f1f77bcf86cd799439013',
  isActive: true,
  deleted: false
};

describe('Employee Controller', () => {
  let token;

  beforeAll(async () => {
    // Mock authentication token
    token = 'mock-jwt-token';
  });

  beforeEach(async () => {
    // Clear database
    await Employee.deleteMany({});
    await Store.deleteMany({});
    await User.deleteMany({});

    // Insert mock data
    await User.create(mockOwner);
    await Store.create(mockStore);
  });

  afterAll(async () => {
    // Clean up
    await Employee.deleteMany({});
    await Store.deleteMany({});
    await User.deleteMany({});
  });

  describe('POST /api/employees', () => {
    it('should create a new employee', async () => {
      const newEmployee = {
        firstName: 'Test',
        lastName: 'Employee',
        email: 'test@example.com',
        phone: '+84123456777',
        role: MANAGER_ROLE,
        department: 'sales',
        storeId: mockStore._id,
        ownerId: mockOwner._id,
        salary: {
          amount: 15000000,
          currency: 'VND',
          type: 'monthly'
        },
        contractType: 'full-time'
      };

      const response = await request(app)
        .post('/api/employees')
        .set('Authorization', `Bearer ${token}`)
        .send(newEmployee)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.firstName).toBe(newEmployee.firstName);
      expect(response.body.data.lastName).toBe(newEmployee.lastName);
      expect(response.body.data.role).toBe(newEmployee.role);
      expect(response.body.data.employeeCode).toMatch(/ST001-EMP-\d{4}/);
    });

    it('should validate required fields', async () => {
      const incompleteEmployee = {
        firstName: 'Test'
        // Missing required fields
      };

      const response = await request(app)
        .post('/api/employees')
        .set('Authorization', `Bearer ${token}`)
        .send(incompleteEmployee)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    it('should not allow duplicate employee codes', async () => {
      await Employee.create(mockManager);

      const duplicateEmployee = {
        ...mockManager,
        _id: undefined,
        email: 'different@email.com'
      };

      const response = await request(app)
        .post('/api/employees')
        .set('Authorization', `Bearer ${token}`)
        .send(duplicateEmployee)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already exists');
    });
  });

  describe('GET /api/employees/store/:storeId', () => {
    beforeEach(async () => {
      await Employee.create([mockManager, mockStaff]);
    });

    it('should get all employees for a store', async () => {
      const response = await request(app)
        .get(`/api/employees/store/${mockStore._id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.docs).toHaveLength(2);
      expect(response.body.data.totalDocs).toBe(2);
    });

    it('should filter employees by role', async () => {
      const response = await request(app)
        .get(`/api/employees/store/${mockStore._id}?role=${MANAGER_ROLE}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.docs).toHaveLength(1);
      expect(response.body.data.docs[0].role).toBe(MANAGER_ROLE);
    });

    it('should search employees by name', async () => {
      const response = await request(app)
        .get(`/api/employees/store/${mockStore._id}?search=John`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.docs).toHaveLength(1);
      expect(response.body.data.docs[0].firstName).toBe('John');
    });

    it('should paginate results', async () => {
      const response = await request(app)
        .get(`/api/employees/store/${mockStore._id}?page=1&limit=1`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.docs).toHaveLength(1);
      expect(response.body.data.totalPages).toBe(2);
      expect(response.body.data.hasNextPage).toBe(true);
    });
  });

  describe('GET /api/employees/:id', () => {
    beforeEach(async () => {
      await Employee.create(mockManager);
    });

    it('should get a single employee', async () => {
      const response = await request(app)
        .get(`/api/employees/${mockManager._id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data._id).toBe(mockManager._id);
      expect(response.body.data.firstName).toBe(mockManager.firstName);
    });

    it('should return 404 for non-existent employee', async () => {
      const nonExistentId = '507f1f77bcf86cd799439999';
      
      const response = await request(app)
        .get(`/api/employees/${nonExistentId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Employee not found');
    });
  });

  describe('PUT /api/employees/:id', () => {
    beforeEach(async () => {
      await Employee.create(mockManager);
    });

    it('should update an employee', async () => {
      const updateData = {
        firstName: 'Updated',
        department: 'kitchen',
        salary: {
          amount: 20000000,
          currency: 'VND',
          type: 'monthly'
        }
      };

      const response = await request(app)
        .put(`/api/employees/${mockManager._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.firstName).toBe('Updated');
      expect(response.body.data.department).toBe('kitchen');
      expect(response.body.data.salary.amount).toBe(20000000);
    });

    it('should not allow updating protected fields', async () => {
      const updateData = {
        employeeCode: 'HACKED-CODE',
        ownerId: '507f1f77bcf86cd799439999',
        firstName: 'Updated'
      };

      const response = await request(app)
        .put(`/api/employees/${mockManager._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.firstName).toBe('Updated');
      expect(response.body.data.employeeCode).toBe(mockManager.employeeCode); // Should not change
      expect(response.body.data.ownerId).toBe(mockManager.ownerId); // Should not change
    });
  });

  describe('PATCH /api/employees/:id/status', () => {
    beforeEach(async () => {
      await Employee.create(mockManager);
    });

    it('should activate/deactivate an employee', async () => {
      const response = await request(app)
        .patch(`/api/employees/${mockManager._id}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({ isActive: false })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isActive).toBe(false);
    });

    it('should validate isActive field', async () => {
      const response = await request(app)
        .patch(`/api/employees/${mockManager._id}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({ isActive: 'invalid' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('DELETE /api/employees/:id', () => {
    beforeEach(async () => {
      await Employee.create(mockManager);
    });

    it('should soft delete an employee', async () => {
      const response = await request(app)
        .delete(`/api/employees/${mockManager._id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Employee deleted successfully');

      // Verify soft delete
      const deletedEmployee = await Employee.findById(mockManager._id);
      expect(deletedEmployee.deleted).toBe(true);
      expect(deletedEmployee.isActive).toBe(false);
      expect(deletedEmployee.terminationDate).toBeDefined();
    });
  });

  describe('GET /api/employees/store/:storeId/managers', () => {
    beforeEach(async () => {
      await Employee.create([mockManager, mockStaff]);
    });

    it('should get only managers for a store', async () => {
      const response = await request(app)
        .get(`/api/employees/store/${mockStore._id}/managers`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].role).toBe(MANAGER_ROLE);
    });
  });

  describe('GET /api/employees/manager/:managerId/staff', () => {
    beforeEach(async () => {
      await Employee.create([mockManager, mockStaff]);
    });

    it('should get staff under a manager', async () => {
      const response = await request(app)
        .get(`/api/employees/manager/${mockManager._id}/staff`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].role).toBe(STAFF_ROLE);
      expect(response.body.data[0].managerId).toBe(mockManager._id);
    });
  });

  describe('GET /api/employees/store/:storeId/stats', () => {
    beforeEach(async () => {
      await Employee.create([mockManager, mockStaff]);
    });

    it('should get employee statistics', async () => {
      const response = await request(app)
        .get(`/api/employees/store/${mockStore._id}/stats`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.overview.total).toBe(2);
      expect(response.body.data.overview.active).toBe(2);
      expect(response.body.data.overview.managers).toBe(1);
      expect(response.body.data.overview.staff).toBe(1);
      expect(response.body.data.departments).toBeDefined();
    });
  });
});

module.exports = {
  mockStore,
  mockOwner,
  mockManager,
  mockStaff
};
