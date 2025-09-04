const express = require('express');
const router = express.Router();
const {
  getOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  cancelOrder,
  getSalesStatistics,
  createDemoOrder
} = require('../../controllers/order.controller');

// Middleware để xác thực (có thể thêm sau)
// const { authenticateToken, authorizeRoles } = require('../middlewares/auth');

/**
 * @route GET /api/orders
 * @desc Get all orders with pagination and filters
 * @access Private
 */
router.get('/', getOrders);

/**
 * @route GET /api/orders/statistics
 * @desc Get sales statistics
 * @access Private
 */
router.get('/statistics', getSalesStatistics);

/**
 * @route GET /api/orders/:id
 * @desc Get order by ID
 * @access Private
 */
router.get('/:id', getOrderById);

/**
 * @route POST /api/orders
 * @desc Create new order
 * @access Private
 */
router.post('/', createOrder);

/**
 * @route POST /api/orders/demo
 * @desc Create demo order (for testing)
 * @access Public
 */
router.post('/demo', createDemoOrder);

/**
 * @route PUT /api/orders/:id/status
 * @desc Update order status
 * @access Private
 */
router.put('/:id/status', updateOrderStatus);

/**
 * @route PUT /api/orders/:id/cancel
 * @desc Cancel order
 * @access Private
 */
router.put('/:id/cancel', cancelOrder);

module.exports = router;
