const jwt = require('jsonwebtoken');
const { logError } = require('./../middlewares/logger');

// In-memory token blacklist (in production, use Redis or database)
const tokenBlacklist = new Set();

/**
 * Add token to blacklist
 * @param {string} token - JWT token to blacklist
 */
const blacklistToken = (token) => {
  tokenBlacklist.add(token);
};

/**
 * Check if token is blacklisted
 * @param {string} token - JWT token to check
 * @returns {boolean} - True if token is blacklisted
 */
const isTokenBlacklisted = (token) => {
  return tokenBlacklist.has(token);
};

/**
 * JWT verification middleware
 */
const verifyJWT = (req, res, next) => {
  const token = req.cookies.token;
  
  if (!token) {
    return res.status(401).json({ 
      success: false,
      error: 'unauthorized',
      message: 'Access token is required'
    });
  }

  // Check if token is blacklisted
  if (isTokenBlacklisted(token)) {
    return res.status(401).json({ 
      success: false,
      error: 'token_blacklisted',
      message: 'Token has been invalidated'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Add additional security checks
    if (!decoded.username && !decoded.email) {
      return res.status(401).json({ 
        success: false,
        error: 'invalid_token_payload',
        message: 'Token payload is invalid'
      });
    }

    req.user = decoded;
    next();
  } catch (err) {
    logError('JWT Verification', err, { token: token.substring(0, 20) + '...' });
    
    let errorMessage = 'Invalid token';
    if (err.name === 'TokenExpiredError') {
      errorMessage = 'Token has expired';
    } else if (err.name === 'JsonWebTokenError') {
      errorMessage = 'Token is malformed';
    }

    return res.status(401).json({ 
      success: false,
      error: 'invalid_token',
      message: errorMessage
    });
  }
};

module.exports = verifyJWT;
module.exports.blacklistToken = blacklistToken;
module.exports.isTokenBlacklisted = isTokenBlacklisted;