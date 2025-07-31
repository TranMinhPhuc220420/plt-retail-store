const Joi = require('joi');

// Validation schema for stock in operation
const stockInSchema = Joi.object({
  storeCode: Joi.string().min(3).max(30).required().messages({
    'string.base': 'store_code_must_be_a_string',
    'string.empty': 'store_code_is_required',
    'string.min': 'store_code_too_short',
    'string.max': 'store_code_too_long',
    'any.required': 'store_code_is_required'
  }),
  productId: Joi.string().hex().length(24).required().messages({
    'string.base': 'product_id_must_be_a_string',
    'string.empty': 'product_id_is_required',
    'string.hex': 'product_id_must_be_valid_object_id',
    'string.length': 'product_id_must_be_24_characters',
    'any.required': 'product_id_is_required'
  }),
  quantity: Joi.number().positive().required().messages({
    'number.base': 'quantity_must_be_a_number',
    'number.positive': 'quantity_must_be_positive',
    'any.required': 'quantity_is_required'
  }),
  unit: Joi.string().min(1).max(20).required().messages({
    'string.base': 'unit_must_be_a_string',
    'string.empty': 'unit_is_required',
    'string.min': 'unit_too_short',
    'string.max': 'unit_too_long',
    'any.required': 'unit_is_required'
  }),
  note: Joi.string().max(500).allow('').optional().messages({
    'string.base': 'note_must_be_a_string',
    'string.max': 'note_too_long'
  })
});

// Validation schema for stock out operation
const stockOutSchema = Joi.object({
  storeCode: Joi.string().min(3).max(30).required().messages({
    'string.base': 'store_code_must_be_a_string',
    'string.empty': 'store_code_is_required',
    'string.min': 'store_code_too_short',
    'string.max': 'store_code_too_long',
    'any.required': 'store_code_is_required'
  }),
  productId: Joi.string().hex().length(24).required().messages({
    'string.base': 'product_id_must_be_a_string',
    'string.empty': 'product_id_is_required',
    'string.hex': 'product_id_must_be_valid_object_id',
    'string.length': 'product_id_must_be_24_characters',
    'any.required': 'product_id_is_required'
  }),
  quantity: Joi.number().positive().required().messages({
    'number.base': 'quantity_must_be_a_number',
    'number.positive': 'quantity_must_be_positive',
    'any.required': 'quantity_is_required'
  }),
  unit: Joi.string().min(1).max(20).required().messages({
    'string.base': 'unit_must_be_a_string',
    'string.empty': 'unit_is_required',
    'string.min': 'unit_too_short',
    'string.max': 'unit_too_long',
    'any.required': 'unit_is_required'
  }),
  note: Joi.string().max(500).allow('').optional().messages({
    'string.base': 'note_must_be_a_string',
    'string.max': 'note_too_long'
  })
});

// Validation schema for stock take operation
const stockTakeSchema = Joi.object({
  storeCode: Joi.string().min(3).max(30).required().messages({
    'string.base': 'store_code_must_be_a_string',
    'string.empty': 'store_code_is_required',
    'string.min': 'store_code_too_short',
    'string.max': 'store_code_too_long',
    'any.required': 'store_code_is_required'
  }),
  productId: Joi.string().hex().length(24).required().messages({
    'string.base': 'product_id_must_be_a_string',
    'string.empty': 'product_id_is_required',
    'string.hex': 'product_id_must_be_valid_object_id',
    'string.length': 'product_id_must_be_24_characters',
    'any.required': 'product_id_is_required'
  }),
  physicalCount: Joi.number().min(0).required().messages({
    'number.base': 'physical_count_must_be_a_number',
    'number.min': 'physical_count_cannot_be_negative',
    'any.required': 'physical_count_is_required'
  }),
  unit: Joi.string().min(1).max(20).required().messages({
    'string.base': 'unit_must_be_a_string',
    'string.empty': 'unit_is_required',
    'string.min': 'unit_too_short',
    'string.max': 'unit_too_long',
    'any.required': 'unit_is_required'
  }),
  note: Joi.string().max(500).allow('').optional().messages({
    'string.base': 'note_must_be_a_string',
    'string.max': 'note_too_long'
  })
});

// Middleware to validate stock in request
const validateStockIn = (req, res, next) => {
  const { error } = stockInSchema.validate(req.body);
  if (error) {
    const errorMessage = error.details[0].message;
    return res.status(400).json({ error: errorMessage });
  }
  next();
};

// Middleware to validate stock out request
const validateStockOut = (req, res, next) => {
  const { error } = stockOutSchema.validate(req.body);
  if (error) {
    const errorMessage = error.details[0].message;
    return res.status(400).json({ error: errorMessage });
  }
  next();
};

// Middleware to validate stock take request
const validateStockTake = (req, res, next) => {
  const { error } = stockTakeSchema.validate(req.body);
  if (error) {
    const errorMessage = error.details[0].message;
    return res.status(400).json({ error: errorMessage });
  }
  next();
};

module.exports = {
  validateStockIn,
  validateStockOut,
  validateStockTake
};
