const express = require('express');
const storeController = require('../../controllers/storeController');
const { verifyFormCreateStore, verifyFormUpdateStore } = require('../../middlewares/verifyForm/verifyFormStore');

const router = express.Router();

// group my-store routes
router.get('/my-stores', storeController.getAllMy);
router.get('/my-store/:storeCode', storeController.getMyByCode);
router.post('/my-store', verifyFormCreateStore, storeController.createMy);
router.put('/my-store/:storeCode', verifyFormUpdateStore, storeController.updateMy);
router.delete('/my-store/:storeCode', storeController.deleteMy);

// export default router;
module.exports = router;
