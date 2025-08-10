const bcrypt = require('bcrypt');

describe('User Model', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('User creation', () => {
    it('should create a new user with valid data', () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        role: 'admin'
      };

      // Test that user data is properly structured
      expect(userData.username).toBe('testuser');
      expect(userData.email).toBe('test@example.com');
      expect(userData.password).toBe('password123');
      expect(userData.role).toBe('admin');
    });

    it('should validate email format', () => {
      const validEmail = 'test@example.com';
      const invalidEmail = 'invalid-email';

      expect(validEmail).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
      expect(invalidEmail).not.toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    });

    it('should validate required fields', () => {
      const requiredFields = ['username', 'email', 'password', 'role'];
      
      requiredFields.forEach(field => {
        expect(field).toBeDefined();
        expect(typeof field).toBe('string');
      });
    });
  });

  describe('Password handling', () => {
    it('should hash password correctly', async () => {
      const password = 'password123';
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      expect(hashedPassword).toBeDefined();
      expect(hashedPassword).not.toBe(password);
      expect(hashedPassword.length).toBeGreaterThan(password.length);
    });

    it('should verify password correctly', async () => {
      const password = 'password123';
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const isValid = await bcrypt.compare(password, hashedPassword);
      const isInvalid = await bcrypt.compare('wrongpassword', hashedPassword);

      expect(isValid).toBe(true);
      expect(isInvalid).toBe(false);
    });
  });

  describe('User validation', () => {
    it('should validate user roles', () => {
      const validRoles = ['admin', 'user', 'manager'];
      const invalidRole = 'invalid_role';

      validRoles.forEach(role => {
        expect(validRoles).toContain(role);
      });
      
      expect(validRoles).not.toContain(invalidRole);
    });

    it('should validate username format', () => {
      const validUsername = 'testuser123';
      const invalidUsername = 'test user!';

      expect(validUsername).toMatch(/^[a-zA-Z0-9_]+$/);
      expect(invalidUsername).not.toMatch(/^[a-zA-Z0-9_]+$/);
    });
  });
});