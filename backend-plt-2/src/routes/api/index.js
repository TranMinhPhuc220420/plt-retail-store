const { Router } = require('express');

const verifyJWT = require('../../middlewares/verifyJWT');
const isAdmin = require('../../middlewares/isAdmin');

const userRouter = require('./user.route');
const storeRouter = require('./store.route');
const productCategoryRouter = require('./product_category.route');
const productRouter = require('./product.route');

const router = Router();

// API routes
router.use('/users', verifyJWT, isAdmin, userRouter);
router.use('/stores', verifyJWT, isAdmin, storeRouter);
router.use('/product-categories', verifyJWT, isAdmin, productCategoryRouter);
router.use('/products', verifyJWT, isAdmin, productRouter);

// export default router;
module.exports = router;