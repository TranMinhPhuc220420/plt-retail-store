import { Router } from 'express';

import StoreUploadRouter from './store.route.js';

import { verifyJWT } from '../../middlewares/verifyJWT.js';
import { isAdmin } from '../../middlewares/isAdmin.js';

const router = Router();

// API routes
router.use('/stores', verifyJWT, isAdmin, StoreUploadRouter);

export default router;