const { body, param } = require('express-validator');

/**
 * Validation middleware for sales account operations
 */

const validateSalesAccountCreation = [
  param('storeId')
    .isMongoId()
    .withMessage('Valid store ID is required'),

  body('employeeId')
    .isMongoId()
    .withMessage('Valid employee ID is required'),
  
  body('username')
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores')
    .trim(),
  
  body('password')
    .isLength({ min: 6, max: 100 })
    .withMessage('Password must be between 6 and 100 characters'),
  
  body('posPermissions.canApplyDiscount')
    .optional()
    .isBoolean()
    .withMessage('canApplyDiscount must be boolean'),
  
  body('posPermissions.maxDiscountPercent')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Discount percentage must be between 0 and 100'),

  body('posPermissions.canProcessReturn')
    .optional()
    .isBoolean()
    .withMessage('canProcessReturn must be boolean'),

  body('posPermissions.canVoidTransaction')
    .optional()
    .isBoolean()
    .withMessage('canVoidTransaction must be boolean'),

  body('posPermissions.canOpenCashDrawer')
    .optional()
    .isBoolean()
    .withMessage('canOpenCashDrawer must be boolean')
];

const validateSalesAccountUpdate = [
  param('storeId')
    .isMongoId()
    .withMessage('Valid store ID is required'),

  param('employeeId')
    .isMongoId()
    .withMessage('Valid employee ID is required'),

  body('posPermissions.canApplyDiscount')
    .optional()
    .isBoolean()
    .withMessage('canApplyDiscount must be boolean'),
  
  body('posPermissions.maxDiscountPercent')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Discount percentage must be between 0 and 100'),

  body('posPermissions.canProcessReturn')
    .optional()
    .isBoolean()
    .withMessage('canProcessReturn must be boolean'),

  body('posPermissions.canVoidTransaction')
    .optional()
    .isBoolean()
    .withMessage('canVoidTransaction must be boolean'),

  body('posPermissions.canOpenCashDrawer')
    .optional()
    .isBoolean()
    .withMessage('canOpenCashDrawer must be boolean')
];

const validatePasswordReset = [
  param('storeId')
    .isMongoId()
    .withMessage('Valid store ID is required'),

  param('employeeId')
    .isMongoId()
    .withMessage('Valid employee ID is required'),

  body('newPassword')
    .isLength({ min: 6, max: 100 })
    .withMessage('New password must be between 6 and 100 characters')
];

const validateSalesLogin = [
  body('storeCode')
    .notEmpty()
    .withMessage('Store code is required')
    .trim(),
  
  body('username')
    .notEmpty()
    .withMessage('Username is required')
    .trim(),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

const validateStoreId = [
  param('storeId')
    .isMongoId()
    .withMessage('Valid store ID is required')
];

const validateEmployeeId = [
  param('employeeId')
    .isMongoId()
    .withMessage('Valid employee ID is required')
];

module.exports = {
  validateSalesAccountCreation,
  validateSalesAccountUpdate,
  validatePasswordReset,
  validateSalesLogin,
  validateStoreId,
  validateEmployeeId
};