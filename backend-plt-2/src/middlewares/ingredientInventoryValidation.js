const Joi = require('joi');

// Validation schema for ingredient stock in operation
const ingredientStockInSchema = Joi.object({
  storeCode: Joi.string().min(3).max(30).required().messages({
    'string.base': 'store_code_must_be_a_string',
    'string.empty': 'store_code_is_required',
    'string.min': 'store_code_too_short',
    'string.max': 'store_code_too_long',
    'any.required': 'store_code_is_required'
  }),
  ingredientId: Joi.string().hex().length(24).required().messages({
    'string.base': 'ingredient_id_must_be_a_string',
    'string.empty': 'ingredient_id_is_required',
    'string.hex': 'ingredient_id_must_be_valid_object_id',
    'string.length': 'ingredient_id_must_be_24_characters',
    'any.required': 'ingredient_id_is_required'
  }),
  warehouseId: Joi.string().hex().length(24).required().messages({
    'string.base': 'warehouse_id_must_be_a_string',
    'string.empty': 'warehouse_id_is_required',
    'string.hex': 'warehouse_id_must_be_valid_object_id',
    'string.length': 'warehouse_id_must_be_24_characters',
    'any.required': 'warehouse_id_is_required'
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
  }),
  batchNumber: Joi.string().max(100).allow('').optional().messages({
    'string.base': 'batch_number_must_be_a_string',
    'string.max': 'batch_number_too_long'
  }),
  expirationDate: Joi.date().optional().messages({
    'date.base': 'expiration_date_must_be_a_valid_date'
  }),
  supplierId: Joi.string().hex().length(24).optional().messages({
    'string.base': 'supplier_id_must_be_a_string',
    'string.hex': 'supplier_id_must_be_valid_object_id',
    'string.length': 'supplier_id_must_be_24_characters'
  }),
  referenceNumber: Joi.string().max(100).allow('').optional().messages({
    'string.base': 'reference_number_must_be_a_string',
    'string.max': 'reference_number_too_long'
  }),
  costPerUnit: Joi.number().positive().optional().messages({
    'number.base': 'cost_per_unit_must_be_a_number',
    'number.positive': 'cost_per_unit_must_be_positive'
  }),
  temperatureCondition: Joi.string().valid('frozen', 'refrigerated', 'room_temp').optional().messages({
    'string.base': 'temperature_condition_must_be_a_string',
    'any.only': 'temperature_condition_must_be_frozen_refrigerated_or_room_temp'
  }),
  qualityCheck: Joi.object({
    passed: Joi.boolean().default(true),
    notes: Joi.string().max(500).allow('').default(''),
    checkedBy: Joi.string().hex().length(24).optional(),
    checkDate: Joi.date().default(Date.now)
  }).optional()
});

// Validation schema for ingredient stock out operation
const ingredientStockOutSchema = Joi.object({
  storeCode: Joi.string().min(3).max(30).required().messages({
    'string.base': 'store_code_must_be_a_string',
    'string.empty': 'store_code_is_required',
    'string.min': 'store_code_too_short',
    'string.max': 'store_code_too_long',
    'any.required': 'store_code_is_required'
  }),
  ingredientId: Joi.string().hex().length(24).required().messages({
    'string.base': 'ingredient_id_must_be_a_string',
    'string.empty': 'ingredient_id_is_required',
    'string.hex': 'ingredient_id_must_be_valid_object_id',
    'string.length': 'ingredient_id_must_be_24_characters',
    'any.required': 'ingredient_id_is_required'
  }),
  warehouseId: Joi.string().hex().length(24).required().messages({
    'string.base': 'warehouse_id_must_be_a_string',
    'string.empty': 'warehouse_id_is_required',
    'string.hex': 'warehouse_id_must_be_valid_object_id',
    'string.length': 'warehouse_id_must_be_24_characters',
    'any.required': 'warehouse_id_is_required'
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
  }),
  batchNumber: Joi.string().max(100).allow('').optional().messages({
    'string.base': 'batch_number_must_be_a_string',
    'string.max': 'batch_number_too_long'
  }),
  recipeId: Joi.string().hex().length(24).optional().messages({
    'string.base': 'recipe_id_must_be_a_string',
    'string.hex': 'recipe_id_must_be_valid_object_id',
    'string.length': 'recipe_id_must_be_24_characters'
  }),
  temperatureCondition: Joi.string().valid('frozen', 'refrigerated', 'room_temp').optional().messages({
    'string.base': 'temperature_condition_must_be_a_string',
    'any.only': 'temperature_condition_must_be_frozen_refrigerated_or_room_temp'
  })
});

// Validation schema for ingredient stock take operation
const ingredientStockTakeSchema = Joi.object({
  storeCode: Joi.string().min(3).max(30).required().messages({
    'string.base': 'store_code_must_be_a_string',
    'string.empty': 'store_code_is_required',
    'string.min': 'store_code_too_short',
    'string.max': 'store_code_too_long',
    'any.required': 'store_code_is_required'
  }),
  ingredientId: Joi.string().hex().length(24).required().messages({
    'string.base': 'ingredient_id_must_be_a_string',
    'string.empty': 'ingredient_id_is_required',
    'string.hex': 'ingredient_id_must_be_valid_object_id',
    'string.length': 'ingredient_id_must_be_24_characters',
    'any.required': 'ingredient_id_is_required'
  }),
  warehouseId: Joi.string().hex().length(24).required().messages({
    'string.base': 'warehouse_id_must_be_a_string',
    'string.empty': 'warehouse_id_is_required',
    'string.hex': 'warehouse_id_must_be_valid_object_id',
    'string.length': 'warehouse_id_must_be_24_characters',
    'any.required': 'warehouse_id_is_required'
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
  }),
  batchNumber: Joi.string().max(100).allow('').optional().messages({
    'string.base': 'batch_number_must_be_a_string',
    'string.max': 'batch_number_too_long'
  })
});

// Validation schema for ingredient creation/update
const ingredientSchema = Joi.object({
  ingredientCode: Joi.string().min(3).max(50).required().messages({
    'string.base': 'ingredient_code_must_be_a_string',
    'string.empty': 'ingredient_code_is_required',
    'string.min': 'ingredient_code_too_short',
    'string.max': 'ingredient_code_too_long',
    'any.required': 'ingredient_code_is_required'
  }),
  name: Joi.string().min(1).max(100).required().messages({
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
  category: Joi.string().max(50).optional().messages({
    'string.base': 'category_must_be_a_string',
    'string.max': 'category_too_long'
  }),
  unit: Joi.string().min(1).max(20).required().messages({
    'string.base': 'unit_must_be_a_string',
    'string.empty': 'unit_is_required',
    'string.min': 'unit_too_short',
    'string.max': 'unit_too_long',
    'any.required': 'unit_is_required'
  }),
  minStock: Joi.number().min(0).optional().messages({
    'number.base': 'min_stock_must_be_a_number',
    'number.min': 'min_stock_cannot_be_negative'
  }),
  maxStock: Joi.number().min(0).optional().messages({
    'number.base': 'max_stock_must_be_a_number',
    'number.min': 'max_stock_cannot_be_negative'
  }),
  standardCost: Joi.number().positive().optional().messages({
    'number.base': 'standard_cost_must_be_a_number',
    'number.positive': 'standard_cost_must_be_positive'
  }),
  warehouseId: Joi.string().hex().length(24).required().messages({
    'string.base': 'warehouse_id_must_be_a_string',
    'string.empty': 'warehouse_id_is_required',
    'string.hex': 'warehouse_id_must_be_valid_object_id',
    'string.length': 'warehouse_id_must_be_24_characters',
    'any.required': 'warehouse_id_is_required'
  }),
  defaultSupplierId: Joi.string().hex().length(24).optional().messages({
    'string.base': 'default_supplier_id_must_be_a_string',
    'string.hex': 'default_supplier_id_must_be_valid_object_id',
    'string.length': 'default_supplier_id_must_be_24_characters'
  }),
  properties: Joi.object({
    storageTemp: Joi.string().valid('frozen', 'refrigerated', 'room_temp').optional(),
    shelfLifeDays: Joi.number().positive().optional(),
    allergens: Joi.array().items(Joi.string()).optional(),
    nutritionalInfo: Joi.object({
      calories: Joi.number().min(0).optional(),
      protein: Joi.number().min(0).optional(),
      carbohydrates: Joi.number().min(0).optional(),
      fat: Joi.number().min(0).optional(),
      fiber: Joi.number().min(0).optional(),
      sodium: Joi.number().min(0).optional()
    }).optional(),
    specialHandling: Joi.string().max(500).allow('').optional()
  }).optional(),
  status: Joi.string().valid('active', 'inactive', 'discontinued').optional().messages({
    'string.base': 'status_must_be_a_string',
    'any.only': 'status_must_be_active_inactive_or_discontinued'
  }),
  imageUrl: Joi.string().uri().optional().messages({
    'string.base': 'image_url_must_be_a_string',
    'string.uri': 'image_url_must_be_a_valid_url'
  })
});

// Middleware functions
const validateIngredientStockIn = (req, res, next) => {
  const { error } = ingredientStockInSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      error: 'validation_failed',
      message: error.details[0].message,
      field: error.details[0].path[0]
    });
  }
  next();
};

const validateIngredientStockOut = (req, res, next) => {
  const { error } = ingredientStockOutSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      error: 'validation_failed',
      message: error.details[0].message,
      field: error.details[0].path[0]
    });
  }
  next();
};

const validateIngredientStockTake = (req, res, next) => {
  const { error } = ingredientStockTakeSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      error: 'validation_failed',
      message: error.details[0].message,
      field: error.details[0].path[0]
    });
  }
  next();
};

const validateIngredient = (req, res, next) => {
  const { error } = ingredientSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      error: 'validation_failed',
      message: error.details[0].message,
      field: error.details[0].path[0]
    });
  }
  next();
};

module.exports = {
  validateIngredientStockIn,
  validateIngredientStockOut,
  validateIngredientStockTake,
  validateIngredient,
  ingredientStockInSchema,
  ingredientStockOutSchema,
  ingredientStockTakeSchema,
  ingredientSchema
};
