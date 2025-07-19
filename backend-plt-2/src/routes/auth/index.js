import { Router } from 'express';

import authRouter from './auth.route.js';

const router = Router();

// API routes
router.use('/auth', authRouter);

export default router;