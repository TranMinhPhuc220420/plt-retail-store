const jwt = require('jsonwebtoken');
const passport = require('passport');
const bcrypt = require('bcrypt');
const path = require('path');

const User = require('../models/User');
const { logError, logSuccess, logInfo } = require('../middlewares/logger');
const { blacklistToken } = require('../middlewares/verifyJWT');
const { responses } = require('../utils/responseFormatter');

const authController = {
  googleAuth: (req, res, next) => {
    passport.authenticate('google', { scope: ['profile', 'email'] }) ( req, res, next );
  },

  googleAuthCallback: (req, res, next) => {
    try {
      passport.authenticate('google', { failureRedirect: '/auth-failed' }, (err, user, info) => {
      
      if (err || !user) {
        return res.status(400).json({ message: 'authentication_failed', error: err || info });
      }

      // Here you can save the user to the database if needed
      req.logIn(user, async (err) => {
        if (err) {
          return res.status(500).json({ message: 'login_failed', error: err });
        }

        const email = user.emails && user.emails[0] ? user.emails[0].value : null;
        if (!email) {
          return res.status(400).json({ message: 'email_not_found' });
        }

        const payload = {
          googleId: user.id,
          email: email,
          username: email,
          displayName: user.displayName,
          avatar: user.photos && user.photos[0] ? user.photos[0].value : null,
          provider: user.provider,
        };

        // Insert user into database if not exists
        const userExists = await User.findOne({ username: email, email });
        if (!userExists) {
          User.create(payload);
        } else {
          // Update existing user
          await User.updateOne({ username: email, email }, {
            $set: {
              displayName: user.displayName,
              avatar: user.photos && user.photos[0] ? user.photos[0].value : null,
              provider: user.provider
            }
          });
        }

        // Create JWT token
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });

        // Set cookie HttpOnly, Secure
        res.cookie('token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 24 * 60 * 60 * 1000
        });

        res.sendFile(path.join(__dirname, '../../public', 'login-success.html'));
      });

    })(req, res, next);

    } catch (error) {
      console.info('Google Auth Callback Error:', error);
      res.status(500).json({ message: 'internal_server_error', error: error.message });
    }
  },

  register: async (req, res) => {
    try {
      const { username, password, email, fullname } = req.body;
      
      // Basic validation
      if (!username || !password || !email) {
        return res.status(400).json({
          success: false,
          error: 'missing_required_fields',
          message: 'Username, password, and email are required'
        });
      }

      const hash = await bcrypt.hash(password, 10);

      const existing = await User.findOne({ 
        $or: [{ username }, { email }] 
      });
      
      if (existing) {
        if (existing.username === username) {
          return res.status(400).json({ 
            success: false,
            error: 'username_already_exists',
            message: 'Username is already taken'
          });
        }
        if (existing.email === email) {
          return res.status(400).json({ 
            success: false,
            error: 'email_already_exists',
            message: 'Email is already registered'
          });
        }
      }

      const user = await User.create({ 
        username, 
        email, 
        password: hash, 
        displayName: fullname 
      });

      logSuccess('User Registration', 'New user registered successfully', {
        userId: user._id,
        username: user.username,
        email: user.email
      });

      res.status(201).json({ 
        success: true,
        message: 'Registration successful',
        data: {
          userId: user._id,
          username: user.username,
          email: user.email,
          displayName: user.displayName
        }
      });
    } catch (error) {
      logError('User Registration', error, { body: req.body });
      res.status(500).json({
        success: false,
        error: 'registration_failed',
        message: 'Failed to register user'
      });
    }
  },

  login: async (req, res) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return responses.badRequest(res, 'missing_credentials', null, 'Username and password are required');
      }

      const user = await User.findOne({ username });
      if (!user || !user.password) {
        return responses.badRequest(res, 'invalid_credentials', null, 'Invalid username or password');
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return responses.badRequest(res, 'invalid_credentials', null, 'Invalid username or password');
      }

      // Check if user is disabled
      if (user.disabled) {
        return responses.forbidden(res, 'account_disabled', null);
      }

      // Create JWT
      const payload = { 
        id: user._id, 
        username: user.username, 
        email: user.email,
        role: user.role
      };
      const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });

      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000
      });

      logSuccess('User Login', 'User logged in successfully', {
        userId: user._id,
        username: user.username
      });

      const userData = {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          displayName: user.displayName,
          role: user.role
        }
      };

      return responses.success(res, userData, 'login_successful');
    } catch (error) {
      return responses.serverError(res, 'login_failed', error);
    }
  },

  logout: (req, res) => {
    const token = req.cookies.token;
    
    // Add token to blacklist if it exists
    if (token) {
      blacklistToken(token);
      logInfo('User Logout', 'Token blacklisted successfully', {
        tokenPreview: token.substring(0, 20) + '...'
      });
    }

    // Clear cookies
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });
    res.clearCookie('connect.sid', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });

    return responses.success(res, { timestamp: new Date().toISOString() }, 'logout_successful');
  },

  me: async (req, res) => {
    if (!req.user) {
      return responses.unauthorized(res);
    }

    const username = req.user.username;
    const email = req.user.email;

    const user = await User.findOne({ username, email }).select('-_id username email avatar displayName provider role createdAt updatedAt');
    if (!user) {
      return responses.notFound(res, 'user_not_found');
    }
    
    return responses.success(res, user, 'user_profile_retrieved');
  },
};

module.exports = authController;
