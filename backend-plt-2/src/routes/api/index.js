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
const inventoryRouter = require('./inventory.route');
const ingredientInventoryRouter = require('./ingredientInventory.route');
const supplierRouter = require('./supplier.route');
const productRecipeRouter = require('./product_recipe.route');
const compositeProductRouter = require('./compositeProducts');
const costAnalysisRouter = require('./costAnalysis'); // ✅ THÊM COST ANALYSIS ROUTER

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
router.use('/inventory', verifyJWT, isAdmin, inventoryRouter); // Product inventory management routes
router.use('/ingredient-inventory', verifyJWT, isAdmin, ingredientInventoryRouter); // Ingredient inventory management routes
router.use('/suppliers', verifyJWT, isAdmin, supplierRouter); // Supplier management routes
router.use('/', verifyJWT, isAdmin, productRecipeRouter); // Product-Recipe relationship management routes
router.use('/composite-products', verifyJWT, isAdmin, compositeProductRouter); // Composite product management routes (JWT verification included in route)
router.use('/cost-analysis', verifyJWT, isAdmin, costAnalysisRouter); // ✅ Cost analysis and management routes

// export default router;
module.exports = router;