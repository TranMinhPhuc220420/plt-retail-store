const request = require('supertest');
const app = require('../../src/app');
const User = require('../../src/models/User');
const { STAFF_ROLE, ADMIN_ROLE, USER_ROLE } = require('../../src/config/constant');

describe('Staff Role Authentication & Authorization', () => {
  let staffUser;
  let staffToken;
  let adminUser;
  let adminToken;

  beforeAll(async () => {
    // Clean up test users
    await User.deleteMany({ 
      username: { $in: ['teststaff', 'testadmin'] } 
    });

    // Create admin user
    adminUser = await User.create({
      username: 'testadmin',
      email: 'admin@test.com',
      password: '$2b$10$test.hash.for.password',
      role: ADMIN_ROLE
    });

    // Create staff user  
    staffUser = await User.create({
      username: 'teststaff',
      email: 'staff@test.com',
      password: '$2b$10$test.hash.for.password',
      role: STAFF_ROLE
    });
  });

  afterAll(async () => {
    // Clean up test users
    await User.deleteMany({ 
      username: { $in: ['teststaff', 'testadmin'] } 
    });
  });

  describe('Staff Authentication', () => {
    test('Staff user can login', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          username: 'teststaff',
          password: 'testpassword'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.role).toBe(STAFF_ROLE);
      
      // Store token for further tests
      staffToken = response.headers['set-cookie']
        .find(cookie => cookie.startsWith('token='))
        ?.split(';')[0]
        ?.split('=')[1];
    });

    test('Staff user profile contains correct role', async () => {
      const response = await request(app)
        .get('/auth/me')
        .set('Cookie', `token=${staffToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.role).toBe(STAFF_ROLE);
    });
  });

  describe('Staff Authorization', () => {
    test('Staff can access staff-specific endpoints', async () => {
      const response = await request(app)
        .get('/api/staff/profile')
        .set('Cookie', `token=${staffToken}`);

      expect(response.status).toBe(200);
    });

    test('Staff can access products (read-only)', async () => {
      const response = await request(app)
        .get('/api/products')
        .set('Cookie', `token=${staffToken}`);

      expect(response.status).toBe(200);
    });

    test('Staff can access inventory', async () => {
      const response = await request(app)
        .get('/api/inventory')
        .set('Cookie', `token=${staffToken}`);

      expect(response.status).toBe(200);
    });

    test('Staff cannot access admin-only endpoints', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Cookie', `token=${staffToken}`);

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('admin_access_required');
    });

    test('Staff cannot access supplier management', async () => {
      const response = await request(app)
        .get('/api/suppliers')
        .set('Cookie', `token=${staffToken}`);

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('admin_access_required');
    });

    test('Staff cannot access cost analysis', async () => {
      const response = await request(app)
        .get('/api/cost-analysis')
        .set('Cookie', `token=${staffToken}`);

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('admin_access_required');
    });
  });
});

module.exports = {};
