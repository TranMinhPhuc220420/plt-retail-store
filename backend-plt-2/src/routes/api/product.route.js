const express = require('express');
const productController = require('../../controllers/productController');
const { verifyFormCreateStore, verifyFormUpdateStore } = require('../../middlewares/verifyForm/verifyFormStore');
const { verifyFormCreateProduct, verifyFormCreateProductBulk, verifyFormUpdateProduct } = require('../../middlewares/verifyForm/verifyFormProduct');

const router = express.Router();

// group my-store routes
router.get('/my-products', productController.getAllMy);
router.get('/my-products/:id', productController.getMyById);
router.post('/my-products', verifyFormCreateStore, productController.createMy);
router.put('/my-products/:id', verifyFormUpdateStore, productController.updateMy);
router.delete('/my-products/:id', productController.deleteMy);

router.get('/my-products-stores/:storeCode', productController.getAllMyInStore);
router.post('/my-products-stores', verifyFormCreateProduct, productController.createMyInStore);
router.put('/my-products-stores/:id', verifyFormUpdateProduct, productController.updateMyInStore);
router.delete('/my-products-stores/:id', productController.deleteMyInStore);

// export default router;
module.exports = router;
