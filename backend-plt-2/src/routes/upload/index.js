// import { Router } from 'express';

// import StoreUploadRouter from './store.route';

// import { verifyJWT } from '../../middlewares/verifyJWT';
// import { isAdmin } from '../../middlewares/isAdmin';

const { Router } = require('express');
const StoreUploadRouter = require('./store.route');
const verifyJWT = require('../../middlewares/verifyJWT');
const isAdmin = require('../../middlewares/isAdmin');

const router = Router();

// API routes
router.use('/stores', verifyJWT, isAdmin, StoreUploadRouter);

// export default router;
module.exports = router;