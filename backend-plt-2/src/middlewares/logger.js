/**
 * Centralized logging middleware for PLT Retail Store
 * Provides structured logging and error handling
 */

const morgan = require('morgan');

// Custom log format
const logFormat = ':method :url :status :response-time ms - :res[content-length]';

/**
 * Request logger middleware
 */
const requestLogger = morgan(logFormat, {
  skip: (req, res) => {
    // Skip logging for health check endpoints
    return req.url === '/health' || req.url === '/ping';
  }
});

/**
 * Structured error logging function
 * @param {string} context - Context where error occurred
 * @param {Error} error - Error object
 * @param {Object} metadata - Additional metadata
 */
const logError = (context, error, metadata = {}) => {
  const timestamp = new Date().toISOString();
  const errorLog = {
    timestamp,
    context,
    error: {
      name: error.name,
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    },
    metadata
  };
  
  console.error('🚨 ERROR:', JSON.stringify(errorLog, null, 2));
};

/**
 * Structured info logging function
 * @param {string} context - Context of the log
 * @param {string} message - Log message
 * @param {Object} metadata - Additional metadata
 */
const logInfo = (context, message, metadata = {}) => {
  const timestamp = new Date().toISOString();
  const infoLog = {
    timestamp,
    context,
    message,
    metadata
  };
  
  console.log('ℹ️ INFO:', JSON.stringify(infoLog, null, 2));
};

/**
 * Structured success logging function
 * @param {string} context - Context of the log
 * @param {string} message - Log message
 * @param {Object} metadata - Additional metadata
 */
const logSuccess = (context, message, metadata = {}) => {
  const timestamp = new Date().toISOString();
  const successLog = {
    timestamp,
    context,
    message,
    metadata
  };
  
  console.log('✅ SUCCESS:', JSON.stringify(successLog, null, 2));
};

/**
 * Express error handling middleware
 */
const errorHandler = (err, req, res, next) => {
  logError('Express Error Handler', err, {
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Default error response
  let statusCode = 500;
  let errorResponse = {
    success: false,
    error: 'internal_server_error',
    message: 'An unexpected error occurred'
  };

  // Handle specific error types
  if (err.name === 'ValidationError') {
    statusCode = 400;
    errorResponse.error = 'validation_error';
    errorResponse.message = err.message;
  } else if (err.name === 'CastError') {
    statusCode = 400;
    errorResponse.error = 'invalid_id';
    errorResponse.message = 'Invalid ID format';
  } else if (err.code === 11000) {
    statusCode = 409;
    errorResponse.error = 'duplicate_key';
    errorResponse.message = 'Resource already exists';
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    errorResponse.error = 'invalid_token';
    errorResponse.message = 'Invalid authentication token';
  }

  // Add timestamp
  errorResponse.timestamp = new Date().toISOString();

  res.status(statusCode).json(errorResponse);
};

/**
 * 404 handler middleware
 */
const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    error: 'route_not_found',
    message: `Route ${req.method} ${req.url} not found`,
    timestamp: new Date().toISOString()
  });
};

module.exports = {
  requestLogger,
  errorHandler,
  notFoundHandler,
  logError,
  logInfo,
  logSuccess
};
