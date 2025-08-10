const authController = require('../../controllers/authController');
const User = require('../../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

// Mock dependencies
jest.mock('../../models/User');
jest.mock('jsonwebtoken');
jest.mock('bcrypt');
jest.mock('../../middlewares/logger');
jest.mock('../../middlewares/verifyJWT');
jest.mock('../../utils/responseFormatter');

describe('AuthController', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      body: {},
      params: {},
      query: {},
      user: null,
      headers: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      cookie: jest.fn().mockReturnThis()
    };
    next = jest.fn();

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('register', () => {
    beforeEach(() => {
      req.body = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        role: 'user'
      };
    });

    it('should register a new user successfully', async () => {
      const mockUser = {
        _id: 'user123',
        username: 'testuser',
        email: 'test@example.com',
        role: 'user',
        save: jest.fn().mockResolvedValue(true)
      };

      User.findOne.mockResolvedValue(null); // No existing user
      bcrypt.hash.mockResolvedValue('hashedPassword123');
      User.mockImplementation(() => mockUser);
      jwt.sign.mockReturnValue('mockToken123');

      await authController.register(req, res);

      expect(User.findOne).toHaveBeenCalledTimes(2); // Check username and email
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(User).toHaveBeenCalledWith({
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedPassword123',
        role: 'user'
      });
      expect(mockUser.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should return error for existing username', async () => {
      const existingUser = { username: 'testuser' };
      User.findOne.mockResolvedValueOnce(existingUser); // Username exists

      await authController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'username_already_exists' })
      );
    });

    it('should return error for existing email', async () => {
      const existingUser = { email: 'test@example.com' };
      User.findOne
        .mockResolvedValueOnce(null) // Username doesn't exist
        .mockResolvedValueOnce(existingUser); // Email exists

      await authController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'email_already_exists' })
      );
    });

    it('should handle validation errors', async () => {
      req.body.password = '123'; // Too short

      User.findOne.mockResolvedValue(null);
      bcrypt.hash.mockResolvedValue('hashedPassword');
      
      const mockUser = {
        save: jest.fn().mockRejectedValue(new Error('Validation failed'))
      };
      User.mockImplementation(() => mockUser);

      await authController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'validation_failed' })
      );
    });
  });

  describe('login', () => {
    beforeEach(() => {
      req.body = {
        identifier: 'testuser', // Can be username or email
        password: 'password123'
      };
    });

    it('should login user with username successfully', async () => {
      const mockUser = {
        _id: 'user123',
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedPassword123',
        role: 'user',
        disabled: false,
        deleted: false
      };

      User.findOne.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockReturnValue('mockToken123');

      await authController.login(req, res);

      expect(User.findOne).toHaveBeenCalledWith({
        $or: [
          { username: 'testuser' },
          { email: 'testuser' }
        ],
        deleted: false
      });
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashedPassword123');
      expect(jwt.sign).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should login user with email successfully', async () => {
      req.body.identifier = 'test@example.com';
      
      const mockUser = {
        _id: 'user123',
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedPassword123',
        role: 'user',
        disabled: false,
        deleted: false
      };

      User.findOne.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockReturnValue('mockToken123');

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return error for non-existent user', async () => {
      User.findOne.mockResolvedValue(null);

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'invalid_credentials' })
      );
    });

    it('should return error for wrong password', async () => {
      const mockUser = {
        _id: 'user123',
        username: 'testuser',
        password: 'hashedPassword123',
        disabled: false,
        deleted: false
      };

      User.findOne.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(false);

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'invalid_credentials' })
      );
    });

    it('should return error for disabled user', async () => {
      const mockUser = {
        _id: 'user123',
        username: 'testuser',
        password: 'hashedPassword123',
        disabled: true,
        deleted: false
      };

      User.findOne.mockResolvedValue(mockUser);

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'account_disabled' })
      );
    });

    it('should return error for deleted user', async () => {
      const mockUser = {
        _id: 'user123',
        username: 'testuser',
        password: 'hashedPassword123',
        disabled: false,
        deleted: true
      };

      User.findOne.mockResolvedValue(mockUser);

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'invalid_credentials' })
      );
    });
  });

  describe('logout', () => {
    beforeEach(() => {
      req.headers.authorization = 'Bearer mockToken123';
    });

    it('should logout user successfully', async () => {
      await authController.logout(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'logout_successful' })
      );
    });

    it('should handle logout without token', async () => {
      req.headers.authorization = undefined;

      await authController.logout(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'logout_successful' })
      );
    });
  });

  describe('me', () => {
    beforeEach(() => {
      req.user = {
        _id: 'user123',
        username: 'testuser',
        email: 'test@example.com',
        role: 'user'
      };
    });

    it('should get user profile successfully', async () => {
      const mockUser = {
        _id: 'user123',
        username: 'testuser',
        email: 'test@example.com',
        role: 'user',
        firstName: 'Test',
        lastName: 'User'
      };

      User.findById.mockResolvedValue(mockUser);

      await authController.me(req, res);

      expect(User.findById).toHaveBeenCalledWith('user123');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockUser);
    });

    it('should return error for non-existent user', async () => {
      User.findById.mockResolvedValue(null);

      await authController.me(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'user_not_found' })
      );
    });

    it('should handle database errors', async () => {
      User.findById.mockRejectedValue(new Error('Database error'));

      await authController.me(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'internal_server_error' })
      );
    });
  });

  describe('getAccessToken', () => {
    beforeEach(() => {
      req.user = {
        _id: 'user123',
        username: 'testuser',
        email: 'test@example.com',
        role: 'user'
      };
    });

    it('should generate access token successfully', async () => {
      jwt.sign.mockReturnValue('newAccessToken123');

      await authController.getAccessToken(req, res);

      expect(jwt.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'user123',
          username: 'testuser'
        }),
        expect.any(String),
        expect.objectContaining({ expiresIn: expect.any(String) })
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ 
          accessToken: 'newAccessToken123',
          message: 'access_token_generated'
        })
      );
    });

    it('should handle token generation errors', async () => {
      jwt.sign.mockImplementation(() => {
        throw new Error('JWT Error');
      });

      await authController.getAccessToken(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'token_generation_failed' })
      );
    });
  });
});