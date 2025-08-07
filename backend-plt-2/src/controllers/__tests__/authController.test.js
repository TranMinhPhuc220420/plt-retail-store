const authController = require('../../controllers/authController');
const User = require('../../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

// Mock dependencies
jest.mock('jsonwebtoken');
jest.mock('../../models/User');

describe('AuthController', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      body: {},
      user: {},
      session: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      cookie: jest.fn().mockReturnThis(),
      redirect: jest.fn().mockReturnThis()
    };
    next = jest.fn();

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      req.body = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        role: 'user'
      };

      User.findOne.mockResolvedValue(null); // User doesn't exist
      User.create.mockResolvedValue({
        _id: 'user123',
        username: 'testuser',
        email: 'test@example.com',
        role: 'user'
      });

      await authController.register(req, res);

      expect(User.findOne).toHaveBeenCalledWith({
        $or: [
          { username: 'testuser' },
          { email: 'test@example.com' }
        ]
      });
      expect(User.create).toHaveBeenCalledWith(req.body);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.any(String)
        })
      );
    });

    it('should return error if user already exists', async () => {
      req.body = {
        username: 'existinguser',
        email: 'existing@example.com',
        password: 'password123',
        role: 'user'
      };

      User.findOne.mockResolvedValue({
        username: 'existinguser',
        email: 'existing@example.com'
      });

      await authController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('already exists')
        })
      );
    });

    it('should handle registration errors', async () => {
      req.body = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        role: 'user'
      };

      User.findOne.mockResolvedValue(null);
      User.create.mockRejectedValue(new Error('Database error'));

      await authController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.any(String)
        })
      );
    });
  });

  describe('login', () => {
    it('should login user with valid credentials', async () => {
      req.body = {
        username: 'testuser',
        password: 'password123'
      };

      const mockUser = {
        _id: 'user123',
        username: 'testuser',
        email: 'test@example.com',
        role: 'user',
        comparePassword: jest.fn().mockResolvedValue(true)
      };

      User.findOne.mockResolvedValue(mockUser);
      jwt.sign.mockReturnValue('mock-jwt-token');

      await authController.login(req, res);

      expect(User.findOne).toHaveBeenCalledWith({ username: 'testuser' });
      expect(mockUser.comparePassword).toHaveBeenCalledWith('password123');
      expect(jwt.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user123',
          username: 'testuser'
        }),
        expect.any(String),
        expect.objectContaining({ expiresIn: expect.any(String) })
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          token: 'mock-jwt-token'
        })
      );
    });

    it('should return error for invalid username', async () => {
      req.body = {
        username: 'nonexistent',
        password: 'password123'
      };

      User.findOne.mockResolvedValue(null);

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Invalid')
        })
      );
    });

    it('should return error for invalid password', async () => {
      req.body = {
        username: 'testuser',
        password: 'wrongpassword'
      };

      const mockUser = {
        _id: 'user123',
        username: 'testuser',
        comparePassword: jest.fn().mockResolvedValue(false)
      };

      User.findOne.mockResolvedValue(mockUser);

      await authController.login(req, res);

      expect(mockUser.comparePassword).toHaveBeenCalledWith('wrongpassword');
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Invalid')
        })
      );
    });
  });

  describe('logout', () => {
    it('should logout user successfully', async () => {
      req.headers = {
        authorization: 'Bearer mock-jwt-token'
      };

      await authController.logout(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining('Logout successful')
        })
      );
    });

    it('should handle logout without token', async () => {
      req.headers = {};

      await authController.logout(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining('Logout successful')
        })
      );
    });
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      req.user = {
        _id: 'user123',
        username: 'testuser',
        email: 'test@example.com',
        role: 'user'
      };

      await authController.getProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            _id: 'user123',
            username: 'testuser',
            email: 'test@example.com',
            role: 'user'
          })
        })
      );
    });

    it('should handle missing user', async () => {
      req.user = null;

      await authController.getProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('User not found')
        })
      );
    });
  });
});
