const express = require('express');
const router = express.Router();
const salesAccountController = require('../../controllers/salesAccountController');
const {
  validateSalesAccountCreation,
  validateSalesAccountUpdate,
  validatePasswordReset,
  validateStoreId,
  validateEmployeeId
} = require('../../middlewares/salesAccountValidation');

/**
 * Sales Account Management Routes
 * These routes are for admin/manager to manage sales accounts
 * Protected by verifyJWT and isAdminOrStaff middlewares
 */

// Get all sales accounts for a store
router.get('/stores/:storeId/accounts', 
  validateStoreId,
  salesAccountController.getSalesAccounts
);

// Create new sales account for an employee
router.post('/stores/:storeId/accounts', 
  validateSalesAccountCreation,
  salesAccountController.createSalesAccount
);

// Update sales account permissions
router.put('/stores/:storeId/accounts/:employeeId', 
  validateSalesAccountUpdate,
  salesAccountController.updateSalesAccount
);

// Toggle sales account status (active/inactive)
router.patch('/stores/:storeId/accounts/:employeeId/toggle-status',
  validateStoreId,
  validateEmployeeId,
  salesAccountController.toggleSalesAccountStatus
);

// Reset sales account password
router.patch('/stores/:storeId/accounts/:employeeId/reset-password',
  validatePasswordReset,
  salesAccountController.resetSalesPassword
);

// Delete sales account (remove sales access)
router.delete('/stores/:storeId/accounts/:employeeId',
  validateStoreId,
  validateEmployeeId,
  salesAccountController.deleteSalesAccount
);

module.exports = router;