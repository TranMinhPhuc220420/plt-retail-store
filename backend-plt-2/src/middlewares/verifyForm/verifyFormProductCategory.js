const Joi = require('joi');
const ProductCategory = require('../../models/ProductCategory');

const productCategoryCreateSchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().optional(),
  storeId: Joi.string().required(),
  products: Joi.array().items(Joi.string()).optional()
});
const productCategoryCreateBulkSchema = Joi.object({
  categories: Joi.array().items(
    Joi.object({
      name: Joi.string().required(),
      description: Joi.string().optional(),
      products: Joi.array().items(Joi.string()).optional()
    })
  ).required().messages({
    'array.base': 'categories_must_be_an_array',
    'array.empty': 'categories_array_cannot_be_empty',
    'any.required': 'categories_required'
  }),
  storeId: Joi.string().required().messages({'any.required': 'store_id_required'})
});
const productCategoryUpdateSchema = Joi.object({
  name: Joi.string().optional(),
  description: Joi.string().optional(),
  storeId: Joi.string().optional(),
  products: Joi.array().items(Joi.string()).optional()
});

const verifyFormCreateProductCategory = async (req, res, next) => {
  let { error } = productCategoryCreateSchema.validate(req.body);

  if (error) {
    error = error.details[0].message;
  }

  if (error) {
    return res.status(400).json({ error: error });
  }

  next();
};

const verifyFormCreateProductCategoryBulk = async (req, res, next) => {
  let { error } = productCategoryCreateBulkSchema.validate(req.body);

  if (error) {
    error = error.details[0].message;
  }

  if (error) {
    return res.status(400).json({ error: error });
  }

  next();
};

const verifyFormUpdateProductCategory = async (req, res, next) => {
  const { id } = req.params;
  let { error } = productCategoryUpdateSchema.validate(req.body);

  if (error) {
    error = error.details[0].message;
  } else {
    // Check if the category exists
    if (!id) {
      error = 'product_category_id_required';
    }

    const ownerId = req.user._id;
    if (!ownerId) {
      error = 'user_id_required';
    }
    
    const category = await ProductCategory.findById(id);
    if (!category) {
      error = 'product_category_not_found';
    }
  }

  if (error) {
    return res.status(400).json({ error: error });
  }

  next();
}

module.exports = {
  verifyFormCreateProductCategory,
  verifyFormCreateProductCategoryBulk,
  verifyFormUpdateProductCategory
};