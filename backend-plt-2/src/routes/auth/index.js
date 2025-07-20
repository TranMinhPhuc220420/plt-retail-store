// import { Router } from 'express';

// import authRouter from './auth.route';

const { Router } = require('express');
const authRouter = require('./auth.route');

const router = Router();

// API routes
router.use('/auth', authRouter);

// export default router;
module.exports = router;