import { Router } from 'express';

import StorePictureRouter from './store.route.js';

import { verifyJWT } from '../../middlewares/verifyJWT.js';

const router = Router();

// API routes
router.use('/stores', verifyJWT, StorePictureRouter);

export default router;