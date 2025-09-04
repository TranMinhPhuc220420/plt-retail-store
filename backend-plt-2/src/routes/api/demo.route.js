const express = require('express');
const router = express.Router();
const { createDemoOrder } = require('../../controllers/order.controller');

/**
 * @route POST /api/demo/orders
 * @desc Create demo order (for testing without authentication)
 * @access Public
 */
router.post('/orders', createDemoOrder);

module.exports = router;
