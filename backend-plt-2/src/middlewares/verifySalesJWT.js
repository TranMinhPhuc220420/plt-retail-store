const jwt = require('jsonwebtoken');
const { responses } = require('../utils/responseFormatter');

/**
 * Sales JWT verification middleware
 * Verifies JWT token for sales staff authentication
 */
const verifySalesJWT = (req, res, next) => {
  const token = req.cookies.sales_token;
  
  if (!token) {
    return responses.unauthorized(res, 'sales_token_required', null, 'Sales access token is required');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Verify it's a sales token
    if (decoded.type !== 'sales_account') {
      return responses.unauthorized(res, 'invalid_sales_token', null, 'Invalid sales token type');
    }

    // Add additional security checks
    if (!decoded.employeeId || !decoded.storeId) {
      return responses.unauthorized(res, 'invalid_token_payload', null, 'Sales token payload is invalid');
    }

    req.salesAccount = decoded;
    next();
  } catch (err) {
    let errorMessage = 'Invalid sales token';
    let errorCode = 'invalid_sales_token';
    
    if (err.name === 'TokenExpiredError') {
      errorMessage = 'Sales token has expired';
      errorCode = 'sales_token_expired';
    } else if (err.name === 'JsonWebTokenError') {
      errorMessage = 'Sales token is malformed';
      errorCode = 'malformed_sales_token';
    }

    return responses.unauthorized(res, errorCode, null, errorMessage);
  }
};

module.exports = verifySalesJWT;