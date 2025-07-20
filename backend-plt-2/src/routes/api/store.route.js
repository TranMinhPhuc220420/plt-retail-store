// import express from 'express';

// import storeController from '../../controllers/storeController';

// // middleware to check authentication can be added here if needed
// import { verifyFormCreateStore, verifyFormUpdateStore } from '../../middlewares/verifyForm/verifyFormStore';

const express = require('express');
const storeController = require('../../controllers/storeController');
const { verifyFormCreateStore, verifyFormUpdateStore } = require('../../middlewares/verifyForm/verifyFormStore');

const router = express.Router();

// group my-store routes
router.get('/my-stores', storeController.getAllMy);
router.get('/my-store/:id', storeController.getMyById);
router.get('/my-store-by-store-code/:storeCode', storeController.getMyByByStoreCode);
router.post('/my-store', verifyFormCreateStore, storeController.createMy);
router.put('/my-store/:id', verifyFormUpdateStore, storeController.updateMy);
router.delete('/my-store/:id', storeController.deleteMy);

// export default router;
module.exports = router;
