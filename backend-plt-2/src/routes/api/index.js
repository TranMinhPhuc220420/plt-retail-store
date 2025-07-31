const { Router } = require('express');

const verifyJWT = require('../../middlewares/verifyJWT');
const isAdmin = require('../../middlewares/isAdmin');

const userRouter = require('./user.route');
const storeRouter = require('./store.route');
const productCategoryRouter = require('./product_category.route');
const productRouter = require('./product.route');

const warehouseRouter = require('./warehouse.route');
const ingredientRouter = require('./ingredient.route');
const recipeRouter = require('./recipe.route');
const unitRouter = require('./unit.route');

const router = Router();

// API routes
router.use('/users', verifyJWT, isAdmin, userRouter);
router.use('/stores', verifyJWT, isAdmin, storeRouter);
router.use('/product-categories', verifyJWT, isAdmin, productCategoryRouter);
router.use('/products', verifyJWT, isAdmin, productRouter);

router.use('/warehouses', verifyJWT, isAdmin, warehouseRouter);
router.use('/ingredients', verifyJWT, isAdmin, ingredientRouter);
router.use('/recipes', verifyJWT, isAdmin, recipeRouter);
router.use('/units', verifyJWT, unitRouter); // Unit utilities available to all authenticated users

// export default router;
module.exports = router;