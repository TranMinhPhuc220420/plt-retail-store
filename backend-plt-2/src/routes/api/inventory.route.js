const express = require('express');
const inventoryController = require('../../controllers/inventoryController');
const { validateStockIn, validateStockOut, validateStockTake } = require('../../middlewares/inventoryValidation');

const router = express.Router();

// Stock In Operations
// POST /api/inventory/stock-in - Receive inventory into warehouse
router.post('/stock-in', validateStockIn, inventoryController.stockIn);

// Stock Out Operations  
// POST /api/inventory/stock-out - Issue inventory from warehouse
router.post('/stock-out', validateStockOut, inventoryController.stockOut);

// Stock Take Operations
// POST /api/inventory/stock-take - Perform physical inventory count and adjustment
router.post('/stock-take', validateStockTake, inventoryController.stockTake);

// Stock Balance Queries
// GET /api/inventory/balance/:storeCode/:productId - Get stock balance for specific product in store
router.get('/balance/:storeCode/:productId', inventoryController.getStockBalance);

// GET /api/inventory/balances/:storeCode - Get all stock balances for a store
router.get('/balances/:storeCode', inventoryController.getAllStockBalances);

// Transaction History
// GET /api/inventory/transactions/:storeCode - Get transaction history with filtering and pagination
// Query parameters: productId, type (in/out/adjustment), startDate, endDate, page, limit
router.get('/transactions/:storeCode', inventoryController.getTransactionHistory);

// Reports
// GET /api/inventory/low-stock/:storeCode - Get low stock report for a store
router.get('/low-stock/:storeCode', inventoryController.getLowStockReport);

module.exports = router;
