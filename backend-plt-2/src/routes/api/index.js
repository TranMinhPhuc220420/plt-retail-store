const { Router } = require('express');

// import userRouter from './user.route';
// import storeRouter from './store.route';
// import productCategoryRouter from './product_category.route';
// import { verifyJWT } from '../../middlewares/verifyJWT';
// import { isAdmin } from '../../middlewares/isAdmin';

const userRouter = require('./user.route');
const storeRouter = require('./store.route');
const productCategoryRouter = require('./product_category.route');
const verifyJWT = require('../../middlewares/verifyJWT');
const isAdmin = require('../../middlewares/isAdmin');

const router = Router();

// API routes
router.use('/users', verifyJWT, isAdmin, userRouter);
router.use('/stores', verifyJWT, isAdmin, storeRouter);
router.use('/product-categories', verifyJWT, isAdmin, productCategoryRouter);

// export default router;
module.exports = router;