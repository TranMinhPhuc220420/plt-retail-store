const { Router } = require('express');
const supplierController = require('../../controllers/supplierController');
const { 
  verifyFormCreateSupplier, 
  verifyFormUpdateSupplier, 
  verifyFormCreateSupplierBulk 
} = require('../../middlewares/verifyForm/verifyFormSupplier');

const router = Router();

// Routes for supplier management
// GET /api/suppliers/my-suppliers-stores/:storeCode - Get all suppliers in a store
router.get('/my-suppliers-stores/:storeCode', supplierController.getAllMyInStore);

// GET /api/suppliers/my-suppliers/:id - Get supplier by ID
router.get('/my-suppliers/:id', supplierController.getMyById);

// POST /api/suppliers/my-suppliers-stores - Create new supplier in store
router.post('/my-suppliers-stores', verifyFormCreateSupplier, supplierController.createMyInStore);

// POST /api/suppliers/my-suppliers-stores-bulk - Create multiple suppliers in store
router.post('/my-suppliers-stores-bulk', verifyFormCreateSupplierBulk, supplierController.createMyInStoreBulk);

// PUT /api/suppliers/my-suppliers-stores/:id - Update supplier
router.put('/my-suppliers-stores/:id', verifyFormUpdateSupplier, supplierController.updateMyInStore);

// DELETE /api/suppliers/my-suppliers-stores/:id - Delete supplier (soft delete)
router.delete('/my-suppliers-stores/:id', supplierController.deleteMyInStore);

// DELETE /api/suppliers/my-suppliers-stores-bulk - Delete multiple suppliers (soft delete)
router.delete('/my-suppliers-stores-bulk', supplierController.deleteMyInStoreBulk);

// GET /api/suppliers/my-suppliers/:id/performance - Get supplier performance metrics
router.get('/my-suppliers/:id/performance', supplierController.getSupplierPerformance);

// PUT /api/suppliers/my-suppliers/:id/performance - Update supplier performance (internal use)
router.put('/my-suppliers/:id/performance', supplierController.updateSupplierPerformance);

module.exports = router;
