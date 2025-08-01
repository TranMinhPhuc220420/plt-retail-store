const express = require('express');
const ingredientInventoryController = require('../../controllers/ingredientInventoryController');
const { 
  validateIngredientStockIn, 
  validateIngredientStockOut, 
  validateIngredientStockTake 
} = require('../../middlewares/ingredientInventoryValidation');

const router = express.Router();

// Stock In Operations for Ingredients
// POST /api/ingredient-inventory/stock-in - Receive ingredients into warehouse
router.post('/stock-in', validateIngredientStockIn, ingredientInventoryController.stockIn);

// Stock Out Operations for Ingredients
// POST /api/ingredient-inventory/stock-out - Issue ingredients from warehouse
router.post('/stock-out', validateIngredientStockOut, ingredientInventoryController.stockOut);

// Stock Take Operations for Ingredients
// POST /api/ingredient-inventory/stock-take - Perform physical ingredient inventory count and adjustment
router.post('/stock-take', validateIngredientStockTake, ingredientInventoryController.stockTake);

// Stock Balance Queries for Ingredients
// GET /api/ingredient-inventory/balance/:storeCode/:ingredientId/:warehouseId - Get stock balance for specific ingredient in warehouse
router.get('/balance/:storeCode/:ingredientId/:warehouseId', ingredientInventoryController.getStockBalance);

// GET /api/ingredient-inventory/balances/:storeCode - Get all ingredient stock balances for a store
// Query parameters: warehouseId, lowStock, expiring, expired
router.get('/balances/:storeCode', ingredientInventoryController.getAllStockBalances);

// Transaction History for Ingredients
// GET /api/ingredient-inventory/transactions/:storeCode - Get ingredient transaction history with filtering and pagination
// Query parameters: ingredientId, warehouseId, type (in/out/adjustment/transfer/expired/damaged), 
//                   startDate, endDate, batchNumber, page, limit
router.get('/transactions/:storeCode', ingredientInventoryController.getTransactionHistory);

// Reports for Ingredients
// GET /api/ingredient-inventory/low-stock/:storeCode - Get low stock report for ingredients in a store
// Query parameters: warehouseId
router.get('/low-stock/:storeCode', ingredientInventoryController.getLowStockReport);

// GET /api/ingredient-inventory/expiring/:storeCode - Get expiring ingredients report for a store
// Query parameters: warehouseId, days (default: 7)
router.get('/expiring/:storeCode', ingredientInventoryController.getExpiringIngredientsReport);

module.exports = router;
