const Joi = require('joi');
const ProductCategory = require('../../models/ProductCategory');
const Store = require('../../models/Store');

const productCategoryCreateSchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().allow('').optional(),
  storeCode: Joi.string().required(),
});
const productCategoryCreateBulkSchema = Joi.object({
  categories: Joi.array().items(
    Joi.object({
      name: Joi.string().required(),
      description: Joi.string().allow('').optional(),
    })
  ).required().messages({
    'array.base': 'categories_must_be_an_array',
    'array.empty': 'categories_array_cannot_be_empty',
    'any.required': 'categories_required'
  }),
  storeCode: Joi.string().required().messages({'any.required': 'store_code_required'})
});
const productCategoryUpdateSchema = Joi.object({
  name: Joi.string().optional(),
  description: Joi.string().allow('').optional(),
  storeCode: Joi.string().optional(),
});

const verifyFormCreateProductCategory = async (req, res, next) => {
  let { error } = productCategoryCreateSchema.validate(req.body);

  if (error) {
    error = error.details[0].message;
  }

  if (error) {
    return res.status(400).json({ error: error });
  }

  const { storeCode } = req.body;
  const store = await Store.findOne({ storeCode, ownerId: req.user._id, deleted: false });
  if (!store) return res.status(404).json({ error: 'store_not_found' });

  req.body.storeId = store._id; // Set storeId for further processing
  req.body.ownerId = req.user._id; // Set ownerId for further processing

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

  const { storeCode } = req.body;
  const store = await Store.findOne({ storeCode, ownerId: req.user._id, deleted: false });
  if (!store) {
    return res.status(404).json({ error: 'store_not_found' });
  }

  req.body.categories = req.body.categories.map(category => ({
    ...category,
    storeId: store._id,
    ownerId: req.user._id
  })); // Set storeId and ownerId for each category

  next();
};

const verifyFormUpdateProductCategory = async (req, res, next) => {
  const { id } = req.params;
  let { error } = productCategoryUpdateSchema.validate(req.body);

  if (error) {
    error = error.details[0].message;
  }

  if (error) {
    return res.status(400).json({ error: error });
  }

  if (!id) return res.status(400).json({ error: 'product_category_id_required' });

  const { storeCode } = req.body;
  const store = await Store.findOne({ storeCode, ownerId: req.user._id, deleted: false });
  if (!store) return res.status(404).json({ error: 'store_not_found' });
  
  const category = await ProductCategory.findOne({ _id: id, storeId: store._id, ownerId: req.user._id, deleted: false });
  if (!category) return res.status(404).json({ error: 'product_category_not_found' });

  req.item_update = category;

  next();
}

module.exports = {
  verifyFormCreateProductCategory,
  verifyFormCreateProductCategoryBulk,
  verifyFormUpdateProductCategory
};