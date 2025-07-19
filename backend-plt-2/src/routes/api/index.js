import { Router } from 'express';

import userRouter from './user.route.js';
import storeRouter from './store.route.js';
import productCategoryRouter from './product_category.route.js';
import { verifyJWT } from '../../middlewares/verifyJWT.js';
import { isAdmin } from '../../middlewares/isAdmin.js';

const router = Router();

// API routes
router.use('/users', verifyJWT, isAdmin, userRouter);
router.use('/stores', verifyJWT, isAdmin, storeRouter);
router.use('/product-categories', verifyJWT, isAdmin, productCategoryRouter);

export default router;