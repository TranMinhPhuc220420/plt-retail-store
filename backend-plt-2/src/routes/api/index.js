const { Router } = require('express');

const verifyJWT = require('../../middlewares/verifyJWT');
const isAdmin = require('../../middlewares/isAdmin');
const isStaff = require('../../middlewares/isStaff');
const isAdminOrStaff = require('../../middlewares/isAdminOrStaff');

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
const employeeRouter = require('./employee.route'); // ✅ THÊM EMPLOYEE ROUTER
const orderRouter = require('./order.route'); // ✅ THÊM ORDER ROUTER
const demoRouter = require('./demo.route'); // ✅ THÊM DEMO ROUTER
const salesAccountRouter = require('./salesAccount.route'); // ✅ THÊM SALES ACCOUNT ROUTER

const router = Router();

// API routes
router.use('/users', verifyJWT, userRouter);
router.use('/stores', verifyJWT, isAdminOrStaff, storeRouter); // Staff can view stores
router.use('/product-categories', verifyJWT, isAdminOrStaff, productCategoryRouter); // Staff can view categories
router.use('/products', verifyJWT, isAdminOrStaff, productRouter); // Staff can view products

router.use('/warehouses', verifyJWT, isAdmin, warehouseRouter);
router.use('/ingredients', verifyJWT, isAdminOrStaff, ingredientRouter); // Staff can view ingredients
router.use('/recipes', verifyJWT, isAdminOrStaff, recipeRouter); // Staff can view recipes
router.use('/units', verifyJWT, unitRouter); // Unit utilities available to all authenticated users
router.use('/inventory', verifyJWT, isAdminOrStaff, inventoryRouter); // Staff can manage inventory for sales
router.use('/ingredient-inventory', verifyJWT, isAdmin, ingredientInventoryRouter); // Admin only
router.use('/suppliers', verifyJWT, isAdmin, supplierRouter); // Admin only
router.use('/', verifyJWT, isAdmin, productRecipeRouter); // Admin only
router.use('/composite-products', verifyJWT, isAdminOrStaff, compositeProductRouter); // Staff can view composite products
router.use('/cost-analysis', verifyJWT, isAdmin, costAnalysisRouter); // Admin only
router.use('/employees', verifyJWT, isAdminOrStaff, employeeRouter); // ✅ Employee management routes
router.use('/orders', verifyJWT, isAdminOrStaff, orderRouter); // ✅ Order management routes - Staff can create and view orders
router.use('/sales-accounts', verifyJWT, isAdminOrStaff, salesAccountRouter); // ✅ Sales Account management routes

// Demo routes (no authentication required)
router.use('/demo', demoRouter); // ✅ Demo routes for testing

// export default router;
module.exports = router;