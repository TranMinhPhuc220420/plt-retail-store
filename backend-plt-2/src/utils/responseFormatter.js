const { logError, logSuccess, logInfo } = require('./../middlewares/logger');

/**
 * Standard API response formatter
 * Provides consistent response structure across all endpoints
 */

const formatSuccessResponse = (res, statusCode, data, message = 'success') => {
  const response = {
    success: true,
    message,
    data
  };

  logSuccess(message, 'API Success Response', {
    statusCode,
    dataType: Array.isArray(data) ? 'array' : typeof data,
    dataCount: Array.isArray(data) ? data.length : 1
  });

  return res.status(statusCode).json(response);
};

const formatErrorResponse = (res, statusCode, message, error = null, details = null) => {
  const response = {
    success: false,
    message,
    error: process.env.NODE_ENV === 'development' ? error : null,
    details
  };

  logError(message, error, {
    statusCode,
    details,
    endpoint: res.req?.originalUrl || 'unknown'
  });

  return res.status(statusCode).json(response);
};

const formatValidationErrorResponse = (res, errors) => {
  const response = {
    success: false,
    message: 'validation_failed',
    errors: errors
  };

  logError('Validation Failed', errors, {
    statusCode: 400,
    endpoint: res.req?.originalUrl || 'unknown'
  });

  return res.status(400).json(response);
};

// Common HTTP status codes with standard messages
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500
};

// Standard response messages
const MESSAGES = {
  // Success messages
  SUCCESS: 'success',
  CREATED: 'resource_created_successfully',
  UPDATED: 'resource_updated_successfully',
  DELETED: 'resource_deleted_successfully',
  RETRIEVED: 'resource_retrieved_successfully',
  
  // Error messages
  INTERNAL_ERROR: 'internal_server_error',
  VALIDATION_FAILED: 'validation_failed',
  UNAUTHORIZED: 'unauthorized',
  FORBIDDEN: 'access_forbidden',
  NOT_FOUND: 'resource_not_found',
  ALREADY_EXISTS: 'resource_already_exists',
  
  // Authentication messages
  LOGIN_SUCCESS: 'login_successful',
  LOGIN_FAILED: 'login_failed',
  LOGOUT_SUCCESS: 'logout_successful',
  TOKEN_INVALID: 'token_invalid',
  TOKEN_EXPIRED: 'token_expired',
  
  // Specific resource messages
  USER_NOT_FOUND: 'user_not_found',
  STORE_NOT_FOUND: 'store_not_found',
  PRODUCT_NOT_FOUND: 'product_not_found',
  INGREDIENT_NOT_FOUND: 'ingredient_not_found',
  WAREHOUSE_NOT_FOUND: 'warehouse_not_found'
};

// Convenience methods for common responses
const responses = {
  success: (res, data, message = MESSAGES.SUCCESS) => 
    formatSuccessResponse(res, HTTP_STATUS.OK, data, message),
  
  created: (res, data, message = MESSAGES.CREATED) => 
    formatSuccessResponse(res, HTTP_STATUS.CREATED, data, message),
  
  updated: (res, data, message = MESSAGES.UPDATED) => 
    formatSuccessResponse(res, HTTP_STATUS.OK, data, message),
  
  deleted: (res, message = MESSAGES.DELETED) => 
    formatSuccessResponse(res, HTTP_STATUS.OK, null, message),
  
  badRequest: (res, message = 'bad_request', error = null, details = null) => 
    formatErrorResponse(res, HTTP_STATUS.BAD_REQUEST, message, error, details),
  
  unauthorized: (res, message = MESSAGES.UNAUTHORIZED, error = null) => 
    formatErrorResponse(res, HTTP_STATUS.UNAUTHORIZED, message, error),
  
  forbidden: (res, message = MESSAGES.FORBIDDEN, error = null) => 
    formatErrorResponse(res, HTTP_STATUS.FORBIDDEN, message, error),
  
  notFound: (res, message = MESSAGES.NOT_FOUND, error = null) => 
    formatErrorResponse(res, HTTP_STATUS.NOT_FOUND, message, error),
  
  conflict: (res, message = MESSAGES.ALREADY_EXISTS, error = null) => 
    formatErrorResponse(res, HTTP_STATUS.CONFLICT, message, error),
  
  validationError: (res, errors) => 
    formatValidationErrorResponse(res, errors),
  
  serverError: (res, message = MESSAGES.INTERNAL_ERROR, error = null) => 
    formatErrorResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, message, error)
};

module.exports = {
  formatSuccessResponse,
  formatErrorResponse,
  formatValidationErrorResponse,
  HTTP_STATUS,
  MESSAGES,
  responses
};
