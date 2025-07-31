const Joi = require('joi');

// Validation schema for creating ingredient
const createIngredientSchema = Joi.object({
  productCode: Joi.string().min(3).max(30).required().messages({
    'string.base': 'product_code_must_be_a_string',
    'string.empty': 'product_code_is_required',
    'string.min': 'product_code_too_short',
    'string.max': 'product_code_too_long',
    'any.required': 'product_code_is_required'
  }),
  name: Joi.string().min(2).max(100).required().messages({
    'string.base': 'name_must_be_a_string',
    'string.empty': 'name_is_required',
    'string.min': 'name_too_short',
    'string.max': 'name_too_long',
    'any.required': 'name_is_required'
  }),
  description: Joi.string().max(500).allow('').optional().messages({
    'string.base': 'description_must_be_a_string',
    'string.max': 'description_too_long'
  }),
  costPrice: Joi.number().positive().required().messages({
    'number.base': 'cost_price_must_be_a_number',
    'number.positive': 'cost_price_must_be_positive',
    'any.required': 'cost_price_is_required'
  }),
  minStock: Joi.number().min(0).required().messages({
    'number.base': 'min_stock_must_be_a_number',
    'number.min': 'min_stock_cannot_be_negative',
    'any.required': 'min_stock_is_required'
  }),
  unit: Joi.string().min(1).max(20).required().messages({
    'string.base': 'unit_must_be_a_string',
    'string.empty': 'unit_is_required',
    'string.min': 'unit_too_short',
    'string.max': 'unit_too_long',
    'any.required': 'unit_is_required'
  }),
  storeCode: Joi.string().min(3).max(30).required().messages({
    'string.base': 'store_code_must_be_a_string',
    'string.empty': 'store_code_is_required',
    'string.min': 'store_code_too_short',
    'string.max': 'store_code_too_long',
    'any.required': 'store_code_is_required'
  }),
  supplier: Joi.object({
    name: Joi.string().max(100).allow('').optional(),
    contact: Joi.string().max(50).allow('').optional(),
    email: Joi.string().email().allow('').optional(),
    address: Joi.string().max(200).allow('').optional()
  }).optional(),
  imageUrl: Joi.string().uri().allow('').optional().messages({
    'string.uri': 'image_url_must_be_valid_url'
  })
});

// Validation schema for updating ingredient
const updateIngredientSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional().messages({
    'string.base': 'name_must_be_a_string',
    'string.min': 'name_too_short',
    'string.max': 'name_too_long'
  }),
  description: Joi.string().max(500).allow('').optional().messages({
    'string.base': 'description_must_be_a_string',
    'string.max': 'description_too_long'
  }),
  costPrice: Joi.number().positive().optional().messages({
    'number.base': 'cost_price_must_be_a_number',
    'number.positive': 'cost_price_must_be_positive'
  }),
  minStock: Joi.number().min(0).optional().messages({
    'number.base': 'min_stock_must_be_a_number',
    'number.min': 'min_stock_cannot_be_negative'
  }),
  unit: Joi.string().min(1).max(20).optional().messages({
    'string.base': 'unit_must_be_a_string',
    'string.min': 'unit_too_short',
    'string.max': 'unit_too_long'
  }),
  status: Joi.string().valid('active', 'inactive').optional().messages({
    'any.only': 'status_must_be_active_or_inactive'
  }),
  supplier: Joi.object({
    name: Joi.string().max(100).allow('').optional(),
    contact: Joi.string().max(50).allow('').optional(),
    email: Joi.string().email().allow('').optional(),
    address: Joi.string().max(200).allow('').optional()
  }).optional(),
  imageUrl: Joi.string().uri().allow('').optional().messages({
    'string.uri': 'image_url_must_be_valid_url'
  })
});

// Validation schema for using ingredients for recipe
const useIngredientsForRecipeSchema = Joi.object({
  storeCode: Joi.string().min(3).max(30).required().messages({
    'string.base': 'store_code_must_be_a_string',
    'string.empty': 'store_code_is_required',
    'string.min': 'store_code_too_short',
    'string.max': 'store_code_too_long',
    'any.required': 'store_code_is_required'
  }),
  recipeId: Joi.string().hex().length(24).required().messages({
    'string.base': 'recipe_id_must_be_a_string',
    'string.empty': 'recipe_id_is_required',
    'string.hex': 'recipe_id_must_be_valid_object_id',
    'string.length': 'recipe_id_must_be_24_characters',
    'any.required': 'recipe_id_is_required'
  }),
  quantity: Joi.number().positive().required().messages({
    'number.base': 'quantity_must_be_a_number',
    'number.positive': 'quantity_must_be_positive',
    'any.required': 'quantity_is_required'
  })
});

// Middleware to validate create ingredient request
const validateCreateIngredient = (req, res, next) => {
  const { error } = createIngredientSchema.validate(req.body);
  if (error) {
    const errorMessage = error.details[0].message;
    return res.status(400).json({ error: errorMessage });
  }
  next();
};

// Middleware to validate update ingredient request
const validateUpdateIngredient = (req, res, next) => {
  const { error } = updateIngredientSchema.validate(req.body);
  if (error) {
    const errorMessage = error.details[0].message;
    return res.status(400).json({ error: errorMessage });
  }
  next();
};

// Middleware to validate use ingredients for recipe request
const validateUseIngredientsForRecipe = (req, res, next) => {
  const { error } = useIngredientsForRecipeSchema.validate(req.body);
  if (error) {
    const errorMessage = error.details[0].message;
    return res.status(400).json({ error: errorMessage });
  }
  next();
};

module.exports = {
  validateCreateIngredient,
  validateUpdateIngredient,
  validateUseIngredientsForRecipe
};
