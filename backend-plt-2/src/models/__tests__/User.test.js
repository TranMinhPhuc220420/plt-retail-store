const User = require('../../models/User');
const bcrypt = require('bcrypt');

describe('User Model', () => {
  describe('User creation', () => {
    it('should create a new user with valid data', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        role: 'admin'
      };

      const user = new User(userData);
      const savedUser = await user.save();

      expect(savedUser.username).toBe(userData.username);
      expect(savedUser.email).toBe(userData.email);
      expect(savedUser.role).toBe(userData.role);
      expect(savedUser._id).toBeDefined();
    });

    it('should hash password before saving', async () => {
      const userData = {
        username: 'testuser2',
        email: 'test2@example.com',
        password: 'password123',
        role: 'user'
      };

      const user = new User(userData);
      const savedUser = await user.save();

      expect(savedUser.password).not.toBe(userData.password);
      expect(savedUser.password.length).toBeGreaterThan(20);
    });

    it('should not save user without required fields', async () => {
      const user = new User({});
      
      await expect(user.save()).rejects.toThrow();
    });

    it('should not save user with invalid email', async () => {
      const userData = {
        username: 'testuser3',
        email: 'invalid-email',
        password: 'password123',
        role: 'user'
      };

      const user = new User(userData);
      
      await expect(user.save()).rejects.toThrow();
    });

    it('should not save user with duplicate username', async () => {
      const userData1 = {
        username: 'duplicateuser',
        email: 'test1@example.com',
        password: 'password123',
        role: 'user'
      };

      const userData2 = {
        username: 'duplicateuser',
        email: 'test2@example.com',
        password: 'password123',
        role: 'user'
      };

      const user1 = new User(userData1);
      await user1.save();

      const user2 = new User(userData2);
      
      await expect(user2.save()).rejects.toThrow();
    });
  });

  describe('User methods', () => {
    let user;

    beforeEach(async () => {
      user = new User({
        username: 'methodtest',
        email: 'methodtest@example.com',
        password: 'password123',
        role: 'user'
      });
      await user.save();
    });

    it('should validate correct password', async () => {
      const isValid = await user.comparePassword('password123');
      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const isValid = await user.comparePassword('wrongpassword');
      expect(isValid).toBe(false);
    });
  });

  describe('User validation', () => {
    it('should accept valid roles', async () => {
      const roles = ['admin', 'user', 'manager'];
      
      for (const role of roles) {
        const userData = {
          username: `user_${role}`,
          email: `${role}@example.com`,
          password: 'password123',
          role: role
        };

        const user = new User(userData);
        const savedUser = await user.save();
        
        expect(savedUser.role).toBe(role);
      }
    });

    it('should reject invalid role', async () => {
      const userData = {
        username: 'invalidrole',
        email: 'invalid@example.com',
        password: 'password123',
        role: 'invalidrole'
      };

      const user = new User(userData);
      
      await expect(user.save()).rejects.toThrow();
    });
  });
});
