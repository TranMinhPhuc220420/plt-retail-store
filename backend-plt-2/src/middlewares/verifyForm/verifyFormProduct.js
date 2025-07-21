const Joi = require('joi');
const Product = require('../../models/Product');
const Store = require('../../models/Store');

const productCreateSchema = Joi.object({
  productCode: Joi.string().min(3).max(30).required().regex(/^[a-zA-Z0-9_-]+$/).messages({
    'string.base': 'product_code_must_be_a_string',
    'string.empty': 'product_code_is_required',
    'string.min': 'product_code_too_short',
    'string.max': 'product_code_too_long',
    'string.pattern.base': 'product_code_invalid_format'
  }),
  name: Joi.string().min(1).max(100).required().messages({
    'string.base': 'product_name_must_be_a_string',
    'string.empty': 'product_name_is_required',
    'string.min': 'product_name_too_short',
    'string.max': 'product_name_too_long'
  }),
  description: Joi.string().allow('').max(500).messages({
    'string.base': 'product_description_must_be_a_string',
    'string.max': 'product_description_too_long'
  }),
  imageUrl: Joi.string().uri().allow('').messages({
    'string.uri': 'product_image_url_invalid'
  }),
  price: Joi.number().precision(2).required().messages({
    'number.base': 'product_price_must_be_a_number',
    'any.required': 'product_price_is_required'
  }),
  retailPrice: Joi.number().precision(2).required().messages({
    'number.base': 'product_retail_price_must_be_a_number',
    'any.required': 'product_retail_price_is_required'
  }),
  costPrice: Joi.number().precision(2).required().messages({
    'number.base': 'product_cost_price_must_be_a_number',
    'any.required': 'product_cost_price_is_required'
  }),
  minStock: Joi.number().integer().min(0).required().messages({
    'number.base': 'product_min_stock_must_be_a_number',
    'number.integer': 'product_min_stock_must_be_integer',
    'number.min': 'product_min_stock_minimum_is_0',
    'any.required': 'product_min_stock_is_required'
  }),
  unit: Joi.string().min(1).max(20).required().messages({
    'string.base': 'product_unit_must_be_a_string',
    'string.empty': 'product_unit_is_required',
    'string.min': 'product_unit_too_short',
    'string.max': 'product_unit_too_long'
  }),
  status: Joi.string().required().messages({
    'any.only': 'product_status_invalid',
    'any.required': 'product_status_is_required'
  }),
  storeCode: Joi.string().required().messages({
    'string.base': 'product_store_id_must_be_a_string',
    'any.required': 'product_store_id_is_required'
  }),
  categories: Joi.array().items(Joi.string()).messages({
    'array.base': 'product_categories_must_be_an_array',
    'string.base': 'product_category_id_must_be_a_string'
  })
});
const productCreateBulkSchema = Joi.object({
  products: Joi.array().items(productCreateSchema).required().messages({
    'array.base': 'products_must_be_an_array',
    'array.empty': 'products_array_cannot_be_empty',
    'any.required': 'products_required'
  }),
  storeCode: Joi.string().required().messages({
    'string.base': 'product_store_id_must_be_a_string',
    'any.required': 'product_store_id_is_required'
  })
});
const productUpdateSchema = Joi.object({
  productCode: Joi.string().min(3).max(30).regex(/^[a-zA-Z0-9_-]+$/).messages({
    'string.base': 'product_code_must_be_a_string',
    'string.empty': 'product_code_is_required',
    'string.min': 'product_code_too_short',
    'string.max': 'product_code_too_long',
    'string.pattern.base': 'product_code_invalid_format'
  }),
  name: Joi.string().min(1).max(100).messages({
    'string.base': 'product_name_must_be_a_string',
    'string.empty': 'product_name_is_required',
    'string.min': 'product_name_too_short',
    'string.max': 'product_name_too_long'
  }),
  description: Joi.string().allow('').max(500).messages({
    'string.base': 'product_description_must_be_a_string',
    'string.max': 'product_description_too_long'
  }),
  imageUrl: Joi.string().uri().allow('').messages({
    'string.uri': 'product_image_url_invalid'
  }),
  price: Joi.number().precision(2).messages({
    'number.base': 'product_price_must_be_a_number'
  }),
  retailPrice: Joi.number().precision(2).messages({
    'number.base': 'product_retail_price_must_be_a_number'
  }),
  costPrice: Joi.number().precision(2).messages({
    'number.base': 'product_cost_price_must_be_a_number'
  }),
  minStock: Joi.number().integer().min(0).messages({
    'number.base': 'product_min_stock_must_be_a_number',
    'number.integer': 'product_min_stock_must_be_integer',
    'number.min': 'product_min_stock_minimum_is_0'
  }),
  unit: Joi.string().min(1).max(20).messages({
    'string.base': 'product_unit_must_be_a_string',
    'string.empty': 'product_unit_is_required',
    'string.min': 'product_unit_too_short',
    'string.max': 'product_unit_too_long'
  }),
  status: Joi.string().required().messages({
    'any.only': 'product_status_invalid'
  }),
  storeCode: Joi.string().messages({
    'string.base': 'product_store_code_must_be_a_string',
    'any.required': 'product_store_code_is_required'
  }),
  categories: Joi.array().items(Joi.string()).messages({
    'array.base': 'product_categories_must_be_an_array',
    'string.base': 'product_category_id_must_be_a_string'
  })
}).min(1).messages({
  'object.min': 'at_least_one_field_must_be_provided'
});

const verifyFormCreateProduct = async (req, res, next) => {
  let { error } = productCreateSchema.validate(req.body);

  if (error) {
    error = error.details[0].message;
  }

  if (error) {
    return res.status(400).json({ error: error });
  }

  const { storeCode, productCode } = req.body;
  const store = await Store.findOne({ storeCode, ownerId: req.user._id });
  if (!store) {
    return res.status(404).json({ error: 'store_not_found' });
  }

  const existingProduct = await Product.findOne({ productCode, storeId: store._id, ownerId: req.user._id });
  if (existingProduct) {
    return res.status(400).json({ error: 'product_code_already_exists' });
  }

  req.body.storeId = store._id; // Set storeId from storeCode

  next();
};

const verifyFormCreateProductBulk = async (req, res, next) => {
  let { error } = productCreateBulkSchema.validate(req.body);

  if (error) {
    error = error.details[0].message;
  }

  if (error) {
    return res.status(400).json({ error: error });
  }

  next();
};

const verifyFormUpdateProduct = async (req, res, next) => {
  const { id } = req.params;
  let { error } = productUpdateSchema.validate(req.body);

  if (error) {
    error = error.details[0].message;
  } else {
    // Check if the  exists
    if (!id) {
      error = 'product_id_required';
    }

    const ownerId = req.user._id;
    if (!ownerId) {
      error = 'user_id_required';
    }
    
    const product = await Product.findOne({ _id: id, ownerId: ownerId });
    if (!product) {
      error = 'product_not_found';
    }
  }

  if (error) {
    return res.status(400).json({ error: error });
  }

  next();
}

module.exports = {
  verifyFormCreateProduct,
  verifyFormCreateProductBulk,
  verifyFormUpdateProduct
};