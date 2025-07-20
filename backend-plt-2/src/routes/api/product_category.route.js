// import express from 'express';

// import productCategoryController from '../../controllers/productCategoryController';

// // middleware to check authentication can be added here if needed
// import { verifyFormCreateStore, verifyFormUpdateStore } from '../../middlewares/verifyForm/verifyFormStore';
// import { verifyFormCreateProductCategory, verifyFormUpdateProductCategory } from '../../middlewares/verifyForm/verifyFormProductCategory';

const express = require('express');
const productCategoryController = require('../../controllers/productCategoryController');
const { verifyFormCreateStore, verifyFormUpdateStore } = require('../../middlewares/verifyForm/verifyFormStore');
const { verifyFormCreateProductCategory, verifyFormCreateProductCategoryBulk, verifyFormUpdateProductCategory } = require('../../middlewares/verifyForm/verifyFormProductCategory');

const router = express.Router();

// group my-store routes
router.get('/my-categories', productCategoryController.getAllMy);
router.get('/my-categories/:id', productCategoryController.getMyById);
router.post('/my-categories', verifyFormCreateStore, productCategoryController.createMy);
router.put('/my-categories/:id', verifyFormUpdateStore, productCategoryController.updateMy);
router.delete('/my-categories/:id', productCategoryController.deleteMy);

router.get('/my-categories-stores/:storeCode', productCategoryController.getAllMyInStore);
router.post('/my-categories-stores', verifyFormCreateProductCategory, productCategoryController.createMyInStore);
router.post('/my-categories-stores-bulk', verifyFormCreateProductCategoryBulk, productCategoryController.createMyInStoreBulk);
router.put('/my-categories-stores/:id', verifyFormUpdateProductCategory, productCategoryController.updateMyInStore);
router.delete('/my-categories-stores/:id', productCategoryController.deleteMyInStore);
router.delete('/my-categories-stores-bulk', productCategoryController.deleteMyInStoreBulk);

// export default router;
module.exports = router;
