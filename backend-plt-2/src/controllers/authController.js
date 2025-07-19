import jwt from 'jsonwebtoken';
import passport from 'passport';
import bcrypt from 'bcrypt';

import { fileURLToPath } from 'url';
import path, { join, dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import User from '../models/User.js';

const authController = {
  googleAuth: (req, res, next) => {
    passport.authenticate('google', { scope: ['profile', 'email'] }) ( req, res, next );
  },

  googleAuthCallback: (req, res, next) => {
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
  },

  register: async (req, res) => {
    const { username, password, email, fullname } = req.body;
    const hash = await bcrypt.hash(password, 10);

    const existing = await User.findOne({ username, email });
    if (existing) {
      if (existing.username === username) {
        return res.status(400).json({ error: 'username_already_exists' });
      }
      if (existing.email === email) {
        return res.status(400).json({ error: 'email_already_exists' });
      }
    }

    const user = await User.create({ username, email, password: hash, displayName: fullname });
    res.status(201).json({ message: 'Register success' });
  },

  login: async (req, res) => {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    if (!user || !user.password) return res.status(400).json({ error: 'invalid_username_or_password' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: 'invalid_username_or_password' });

    // Tạo JWT
    const payload = { id: user.id, username: user.username, email: user.email };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000
    });

    res.json({ message: 'login_success'});
  },

  me: async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ message: 'unauthorized' });
    }

    const username = req.user.username;
    const email = req.user.email;

    const user = await User.findOne({ username, email }).select('-_id username email avatar displayName provider role createdAt updatedAt');
    if (!user) {
      return res.status(404).json({ message: 'user_not_found' });
    }
    
    res.json(user);
  },
};

export default authController;
