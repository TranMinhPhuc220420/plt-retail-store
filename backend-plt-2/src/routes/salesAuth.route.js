const express = require('express');
const router = express.Router();
const salesAccountController = require('../controllers/salesAccountController');
const verifySalesJWT = require('../middlewares/verifySalesJWT');
const { validateSalesLogin } = require('../middlewares/salesAccountValidation');

/**
 * Sales Authentication Routes
 * These routes handle authentication for sales staff
 * No admin middleware required - these are public sales endpoints
 */

// Sales staff login
router.post('/login', 
  validateSalesLogin,
  salesAccountController.salesLogin
);

// Sales staff logout
router.post('/logout', 
  salesAccountController.salesLogout
);

// Get sales account profile (requires sales authentication)
router.get('/me', 
  verifySalesJWT,
  salesAccountController.getSalesProfile
);

module.exports = router;