const { Router } = require('express');
const verifyJWT = require('../../middlewares/verifyJWT');

const StorePictureRouter = require('./store.route');
const ProductPictureRouter = require('./product.route');
const EmployeePictureRouter = require('./employees.route');

const router = Router();

// API routes
router.use('/stores', verifyJWT, StorePictureRouter);
router.use('/products', verifyJWT, ProductPictureRouter);
router.use('/employees', verifyJWT, EmployeePictureRouter);

// export default router;
module.exports = router;