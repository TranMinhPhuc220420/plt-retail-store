import Joi from "joi";
import ProductCategory from "../../models/ProductCategory.js";

const productCategoryCreateSchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().optional(),
  storeId: Joi.string().required(),
  products: Joi.array().items(Joi.string()).optional()
});
const productCategoryUpdateSchema = Joi.object({
  name: Joi.string().optional(),
  description: Joi.string().optional(),
  storeId: Joi.string().optional(),
  products: Joi.array().items(Joi.string()).optional()
});

export const verifyFormCreateProductCategory = async (req, res, next) => {
  let { error } = productCategoryCreateSchema.validate(req.body);

  if (error) {
    error = error.details[0].message;
  }

  if (error) {
    return res.status(400).json({ error: error });
  }

  next();
};

export const verifyFormUpdateProductCategory = async (req, res, next) => {
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