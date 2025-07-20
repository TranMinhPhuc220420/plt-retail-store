// import { Router } from 'express';

// import StorePictureRouter from './store.route';

// import { verifyJWT } from '../../middlewares/verifyJWT';

const { Router } = require('express');
const StorePictureRouter = require('./store.route');
const verifyJWT = require('../../middlewares/verifyJWT');

const router = Router();

// API routes
router.use('/stores', verifyJWT, StorePictureRouter);

// export default router;
module.exports = router;