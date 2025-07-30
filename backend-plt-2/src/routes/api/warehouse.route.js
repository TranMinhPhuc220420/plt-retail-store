const express = require('express');
const warehouseController = require('../../controllers/warehouseController');

const router = express.Router();

// GET /api/warehouses/all - Fetch all warehouses
router.get('/all', warehouseController.getAll);

// GET /api/warehouses/detail/:id - Fetch warehouse details by ID
router.get('/detail/:id', warehouseController.getById);

// POST /api/warehouses/delete/:id - Delete a warehouse by ID
router.post('/delete/:id', warehouseController.delete);

// GET /api/warehouses/my-warehouses-stores/:storeCode - Fetch all warehouses owned by the user based on store code
router.get('/my-warehouses-stores/:storeCode', warehouseController.getAllMyInStore);

// POST /api/warehouses/my-warehouses-stores - Create a new warehouse for the user
router.post('/my-warehouses-stores', warehouseController.createMyInStore);

// GET /api/warehouses/my-warehouse/:id - Fetch details of a specific warehouse owned by the user
router.get('/my-warehouse/:id', warehouseController.getByIdMyInStore);

// PUT /api/warehouses/my-warehouses-stores/:warehouseId - Update a specific warehouse owned by the user
router.put('/my-warehouses-stores/:warehouseId', warehouseController.updateMyInStore);

// DELETE /api/warehouses/my-warehouses-stores/:warehouseId - Delete a specific warehouse owned by the user by ID
router.delete('/my-warehouses-stores/:warehouseId', warehouseController.deleteMyInStore);

module.exports = router;
