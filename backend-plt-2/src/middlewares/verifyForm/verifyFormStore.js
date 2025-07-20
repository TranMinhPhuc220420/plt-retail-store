const Joi = require('joi');
const Store = require('../../models/Store');

const storeCreateSchema = Joi.object({
  storeCode: Joi.string().min(3).max(30).required().regex(/^[a-zA-Z0-9_-]+$/).messages({
    'string.base': 'store_code_must_be_a_string',
    'string.empty': 'store_code_is_required',
    'string.min': 'store_code_too_short',
    'string.max': 'store_code_too_long',
    'string.pattern.base': 'store_code_invalid_format'
  }),
  name: Joi.string().min(3).max(100).required().messages({
    'string.base': 'name_must_be_a_string',
    'string.empty': 'name_is_required',
    'string.min': 'name_too_short',
    'string.max': 'name_too_long',
  }),
  address: Joi.string().min(5).max(200).required().messages({
    'string.base': 'address_must_be_a_string',
    'string.empty': 'address_is_required',
    'string.min': 'address_too_short',
    'string.max': 'address_too_long'
  }),
  phone: Joi.string().optional().regex(/^\+?[0-9\s-]+$/).messages({
    'string.base': 'phone_must_be_a_string',
    'string.pattern.base': 'phone_invalid_format'
  }),
  email: Joi.string().email().optional().messages({
    'string.base': 'email_must_be_a_string',
    'string.email': 'email_invalid_format'
  }),
  description: Joi.string().optional().messages({
    'string.base': 'description_must_be_a_string'
  }),
  imageUrl: Joi.string().uri().optional().messages({
    'string.base': 'image_url_must_be_a_string',
    'string.uri': 'image_url_invalid_format'
  })
});
const storeUpdateSchema = Joi.object({
  storeCode: Joi.string().min(3).max(30).optional().regex(/^[a-zA-Z0-9]+$/).messages({
    'string.base': 'store_code_must_be_a_string',
    'string.empty': 'store_code_is_required',
    'string.min': 'store_code_too_short',
    'string.max': 'store_code_too_long',
    'string.pattern.base': 'store_code_invalid_format'
  }),
  name: Joi.string().min(3).max(100).optional().regex(/^[a-zA-Z\s]+$/).messages({
    'string.base': 'name_must_be_a_string',
    'string.empty': 'name_is_required',
    'string.min': 'name_too_short',
    'string.max': 'name_too_long',
    'string.pattern.base': 'name_invalid_format'
  }),
  address: Joi.string().min(5).max(200).optional().messages({
    'string.base': 'address_must_be_a_string',
    'string.empty': 'address_is_required',
    'string.min': 'address_too_short',
    'string.max': 'address_too_long'
  }),
  phone: Joi.string().optional().regex(/^\+?[0-9\s-]+$/).messages({
    'string.base': 'phone_must_be_a_string',
    'string.pattern.base': 'phone_invalid_format'
  }),
  email: Joi.string().email().optional().messages({
    'string.base': 'email_must_be_a_string',
    'string.email': 'email_invalid_format'
  }),
  description: Joi.string().optional().messages({
    'string.base': 'description_must_be_a_string'
  }),
  imageUrl: Joi.string().uri().optional().messages({
    'string.base': 'image_url_must_be_a_string',
    'string.uri': 'image_url_invalid_format'
  })
});

const verifyFormCreateStore = async (req, res, next) => {
  let { error } = storeCreateSchema.validate(req.body);

  if (error) {
    error = error.details[0].message;
  } else {
    // Check if storeCode already exists
    const { storeCode } = req.body;
    const storeExists = await Store.findOne({ storeCode: storeCode });
    if (storeExists) {
      error = 'store_code_already_exists';
    }
  }

  if (error) {
    return res.status(400).json({ error: error });
  }

  next();
};

const verifyFormUpdateStore = async (req, res, next) => {
  const { id } = req.params;
  let { error } = storeUpdateSchema.validate(req.body);

  if (error) {
    error = error.details[0].message;
  } else {

    // Check if storeCode already exists for another store
    const { storeCode } = req.body;
    const storeExists = await Store.findOne({ storeCode: storeCode });
    if (storeExists && id !== storeExists._id.toString()) {
      error = 'store_code_already_exists';
    }
    else {
      // Check if the store update is valid
      if (!id) {
        error = 'store_id_required';
      }

      const ownerId = req.user._id;
      if (!ownerId) {
        error = 'user_id_required';
      }
      
      const store = await Store.findOne({ _id: id, ownerId: ownerId });
      if (!store) {
        error = 'store_not_found';
      }
    }
  }

  if (error) {
    return res.status(400).json({ error: error });
  }

  next();
} 

module.exports = {
  verifyFormCreateStore,
  verifyFormUpdateStore
};