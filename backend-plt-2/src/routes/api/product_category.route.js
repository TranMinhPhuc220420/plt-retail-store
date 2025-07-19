import express from 'express';

import productCategoryController from '../../controllers/productCategoryController.js';

// middleware to check authentication can be added here if needed
import { verifyFormCreateStore, verifyFormUpdateStore } from '../../middlewares/verifyForm/verifyFormStore.js';
import { verifyFormCreateProductCategory, verifyFormUpdateProductCategory } from '../../middlewares/verifyForm/verifyFormProductCategory.js';

const router = express.Router();

// group my-store routes
router.get('/my-categories', productCategoryController.getAllMy);
router.get('/my-categories/:id', productCategoryController.getMyById);
router.post('/my-categories', verifyFormCreateStore, productCategoryController.createMy);
router.put('/my-categories/:id', verifyFormUpdateStore, productCategoryController.updateMy);
router.delete('/my-categories/:id', productCategoryController.deleteMy);

router.get('/my-categories-stores/:storeCode', productCategoryController.getAllMyInStore);
router.post('/my-categories-stores', verifyFormCreateProductCategory, productCategoryController.createMyInStore);
router.put('/my-categories-stores/:id', verifyFormUpdateProductCategory, productCategoryController.updateMyInStore);
router.delete('/my-categories-stores/:id', productCategoryController.deleteMyInStore);

export default router;
