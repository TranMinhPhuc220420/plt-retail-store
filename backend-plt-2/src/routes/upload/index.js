const { Router } = require('express');
const verifyJWT = require('../../middlewares/verifyJWT');
const isAdmin = require('../../middlewares/isAdmin');

const StoreUploadRouter = require('./store.route');
const ProductUploadRouter = require('./product.route');
const EmployeeUploadRouter = require('./employees.route');
const AvatarUploadRouter = require('./avatar.route');

const router = Router();

// API routes
router.use('/stores', verifyJWT, isAdmin, StoreUploadRouter);
router.use('/products', verifyJWT, isAdmin, ProductUploadRouter);
router.use('/employees', verifyJWT, isAdmin, EmployeeUploadRouter);
router.use('/avatars', verifyJWT, AvatarUploadRouter);

// export default router;
module.exports = router;