const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const app = require('../../../app');
const User = require('../../../models/User');

describe('User Profile API', () => {
  let testUser;
  let authToken;
  let authCookie;

  beforeEach(async () => {
    // Create test user
    const hashedPassword = await bcrypt.hash('password123', 10);
    testUser = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: hashedPassword,
      firstName: 'Test',
      lastName: 'User'
    });

    // Generate auth token
    authToken = jwt.sign(
      { 
        id: testUser._id,
        username: testUser.username,
        email: testUser.email 
      },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );

    authCookie = `token=${authToken}`;
  });

  afterEach(async () => {
    await User.deleteMany({});
  });

  describe('GET /api/users/profile/me', () => {
    it('should get current user profile', async () => {
      const response = await request(app)
        .get('/api/users/profile/me')
        .set('Cookie', authCookie);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe('test@example.com');
      expect(response.body.data.password).toBeUndefined();
    });

    it('should return 401 without auth token', async () => {
      const response = await request(app)
        .get('/api/users/profile/me');

      expect(response.status).toBe(401);
    });
  });

  describe('PUT /api/users/profile/me', () => {
    it('should update user profile', async () => {
      const updateData = {
        firstName: 'Updated',
        lastName: 'Name',
        phoneNumber: '0901234567',
        address: '123 Test Street'
      };

      const response = await request(app)
        .put('/api/users/profile/me')
        .set('Cookie', authCookie)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.firstName).toBe('Updated');
      expect(response.body.data.lastName).toBe('Name');
    });

    it('should validate phone number format', async () => {
      const updateData = {
        phoneNumber: 'invalid-phone'
      };

      const response = await request(app)
        .put('/api/users/profile/me')
        .set('Cookie', authCookie)
        .send(updateData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/users/profile/change-password', () => {
    it('should change password with valid current password', async () => {
      const passwordData = {
        currentPassword: 'password123',
        newPassword: 'NewPassword123',
        confirmPassword: 'NewPassword123'
      };

      const response = await request(app)
        .put('/api/users/profile/change-password')
        .set('Cookie', authCookie)
        .send(passwordData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should reject with wrong current password', async () => {
      const passwordData = {
        currentPassword: 'wrongpassword',
        newPassword: 'NewPassword123',
        confirmPassword: 'NewPassword123'
      };

      const response = await request(app)
        .put('/api/users/profile/change-password')
        .set('Cookie', authCookie)
        .send(passwordData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should validate password strength', async () => {
      const passwordData = {
        currentPassword: 'password123',
        newPassword: 'weak',
        confirmPassword: 'weak'
      };

      const response = await request(app)
        .put('/api/users/profile/change-password')
        .set('Cookie', authCookie)
        .send(passwordData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });
});
