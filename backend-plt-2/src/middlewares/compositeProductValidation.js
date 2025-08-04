const { body, validationResult } = require('express-validator');

const validateCreateComposite = [
  body('productCode')
    .notEmpty()
    .withMessage('Product code is required')
    .isLength({ min: 3, max: 50 })
    .withMessage('Product code must be between 3 and 50 characters'),
  
  body('name')
    .notEmpty()
    .withMessage('Product name is required')
    .isLength({ min: 3, max: 100 })
    .withMessage('Product name must be between 3 and 100 characters'),
  
  body('capacity.quantity')
    .isInt({ min: 1 })
    .withMessage('Capacity quantity must be a positive integer'),
  
  body('capacity.unit')
    .notEmpty()
    .withMessage('Capacity unit is required'),

  // Recipe is required for composite products
  body('recipeId')
    .notEmpty()
    .withMessage('Recipe ID is required for composite products')
    .isMongoId()
    .withMessage('Invalid recipe ID'),
  
  // Child products are optional now (can create composite with just recipe)
  body('childProducts')
    .optional()
    .isArray()
    .withMessage('Child products must be an array'),
  
  body('childProducts.*.productId')
    .if(body('childProducts').exists())
    .notEmpty()
    .withMessage('Child product ID is required')
    .isMongoId()
    .withMessage('Invalid child product ID'),
  
  body('childProducts.*.costPrice')
    .if(body('childProducts').exists())
    .isFloat({ min: 0 })
    .withMessage('Child product cost price must be greater than or equal to 0'),

  body('childProducts.*.sellingPrice')
    .if(body('childProducts').exists())
    .isFloat({ min: 0 })
    .withMessage('Child product selling price must be greater than or equal to 0'),

  body('childProducts.*.retailPrice')
    .if(body('childProducts').exists())
    .isFloat({ min: 0 })
    .withMessage('Child product retail price must be greater than or equal to 0'),
  
  body('storeId')
    .notEmpty()
    .withMessage('Store ID is required')
    .isMongoId()
    .withMessage('Invalid store ID'),
  
  body('expiryHours')
    .optional()
    .isInt({ min: 1, max: 168 }) // Max 1 week
    .withMessage('Expiry hours must be between 1 and 168 hours'),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'validation_failed',
        details: errors.array()
      });
    }
    next();
  }
];

const validateUpdateComposite = [
  body('name')
    .optional()
    .isLength({ min: 3, max: 100 })
    .withMessage('Product name must be between 3 and 100 characters'),
  
  body('capacity.quantity')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Capacity quantity must be a positive integer'),
  
  body('capacity.unit')
    .optional()
    .notEmpty()
    .withMessage('Capacity unit cannot be empty'),

  // Recipe update is optional
  body('recipeId')
    .optional()
    .isMongoId()
    .withMessage('Invalid recipe ID'),
  
  // Child products are optional for updates
  body('compositeInfo.childProducts')
    .optional()
    .isArray()
    .withMessage('Child products must be an array'),
  
  body('compositeInfo.childProducts.*.productId')
    .if(body('compositeInfo.childProducts').exists())
    .isMongoId()
    .withMessage('Invalid child product ID'),
  
  body('compositeInfo.childProducts.*.costPrice')
    .if(body('compositeInfo.childProducts').exists())
    .isFloat({ min: 0 })
    .withMessage('Child product cost price must be greater than or equal to 0'),

  body('compositeInfo.childProducts.*.sellingPrice')
    .if(body('compositeInfo.childProducts').exists())
    .isFloat({ min: 0 })
    .withMessage('Child product selling price must be greater than or equal to 0'),

  body('compositeInfo.childProducts.*.retailPrice')
    .if(body('compositeInfo.childProducts').exists())
    .isFloat({ min: 0 })
    .withMessage('Child product retail price must be greater than or equal to 0'),
  
  body('compositeInfo.expiryHours')
    .optional()
    .isInt({ min: 1, max: 168 })
    .withMessage('Expiry hours must be between 1 and 168 hours'),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'validation_failed',
        details: errors.array()
      });
    }
    next();
  }
];

const validatePrepareComposite = [
  body('quantityToPrepare')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('Quantity to prepare must be between 1 and 10 batches'),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'validation_failed',
        details: errors.array()
      });
    }
    next();
  }
];

const validateServeComposite = [
  body('quantityToServe')
    .isInt({ min: 1 })
    .withMessage('Quantity to serve must be a positive integer'),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'validation_failed',
        details: errors.array()
      });
    }
    next();
  }
];

module.exports = {
  validateCreateComposite,
  validateUpdateComposite,
  validatePrepareComposite,
  validateServeComposite
};
