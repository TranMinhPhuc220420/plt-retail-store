const mongoose = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Employee = require('../models/Employee');
const Store = require('../models/Store');
const StockBalance = require('../models/StockBalance');

// Helper function to serialize Order objects for frontend
const serializeOrderForResponse = (order) => {
  const orderObj = order.toObject ? order.toObject() : order;
  
  return {
    ...orderObj,
    subtotal: parseFloat(orderObj.subtotal?.toString() || 0),
    totalAmount: parseFloat(orderObj.totalAmount?.toString() || 0),
    taxAmount: parseFloat(orderObj.taxAmount?.toString() || 0),
    discountAmount: parseFloat(orderObj.discountAmount?.toString() || 0),
    items: orderObj.items?.map(item => ({
      ...item,
      unitPrice: parseFloat(item.unitPrice?.toString() || 0),
      totalPrice: parseFloat(item.totalPrice?.toString() || 0)
    })) || []
  };
};

// Get all orders with pagination and filters
const getOrders = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      paymentStatus,
      employeeId,
      startDate,
      endDate,
      search
    } = req.query;

    const skip = (page - 1) * limit;
    let query = { deleted: false };

    // Apply filters
    if (status) query.status = status;
    if (paymentStatus) query.paymentStatus = paymentStatus;
    if (employeeId) query.employeeId = employeeId;
    
    // Date range filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    // Search by order number or customer name
    if (search) {
      query.$or = [
        { orderNumber: new RegExp(search, 'i') },
        { customerName: new RegExp(search, 'i') }
      ];
    }

    const orders = await Order.find(query)
      .populate('employeeId', 'name email')
      .populate('storeId', 'name address')
      .populate('items.productId', 'name imageUrl')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Order.countDocuments(query);

    res.json({
      success: true,
      data: orders.map(order => serializeOrderForResponse(order)),
      pagination: {
        current: parseInt(page),
        total,
        pageSize: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách đơn hàng',
      error: error.message
    });
  }
};

// Get order by ID
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findOne({ _id: id, deleted: false })
      .populate('employeeId', 'name email')
      .populate('storeId', 'name address phone')
      .populate('items.productId', 'name imageUrl unit');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng'
      });
    }

    res.json({
      success: true,
      data: serializeOrderForResponse(order)
    });
  } catch (error) {
    console.error('Get order by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin đơn hàng',
      error: error.message
    });
  }
};

// Create new order
const createOrder = async (req, res) => {
  try {
    const {
      customerName = 'Khách lẻ',
      customerPhone,
      customerEmail,
      items,
      taxRate = 0,
      discountRate = 0,
      paymentMethod = 'cash',
      paymentDetails = {},
      notes,
      employeeId,
      storeCode
    } = req.body;

    // Validate required fields
    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Đơn hàng phải có ít nhất một sản phẩm'
      });
    }

    if (!storeCode) {
      return res.status(400).json({
        success: false,
        message: 'invalid_store_code'
      });
    }

    // Validate employee exists
    // const employee = await Employee.findById(employeeId);
    // if (!employee) {
    //   return res.status(404).json({
    //     success: false,
    //     message: 'not_found_employee'
    //   });
    // }

    // Validate store exists  
    const store = await Store.findOne({ storeCode: storeCode, ownerId: req.user._id });
    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'not_found_store'
      });
    }

    const storeId = store._id;

    // Validate and prepare order items
    const orderItems = [];
    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Không tìm thấy sản phẩm với ID: ${item.productId}`
        });
      }

      // Always check stock availability for production orders
      const stockBalance = await StockBalance.findOne({
        productId: item.productId,
        storeId: storeId
      });

      if (!stockBalance || stockBalance.quantity < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Không đủ hàng trong kho cho sản phẩm: ${product.name}. Tồn kho: ${stockBalance?.quantity || 0}, Yêu cầu: ${item.quantity}`
        });
      }

      const unitPrice = parseFloat(product.retailPrice.toString());
      const totalPrice = unitPrice * item.quantity;

      orderItems.push({
        productId: item.productId,
        productName: product.name,
        productCode: product.productCode,
        quantity: item.quantity,
        unitPrice: mongoose.Types.Decimal128.fromString(String(unitPrice)),
        totalPrice: mongoose.Types.Decimal128.fromString(String(totalPrice)),
        unit: product.unit
      });
    }

    // Calculate totals
    const subtotal = orderItems.reduce((sum, item) => {
      const itemTotal = parseFloat(item.totalPrice.toString());
      return sum + itemTotal;
    }, 0);
    const taxAmount = (subtotal * taxRate) / 100;
    const discountAmount = (subtotal * discountRate) / 100;
    const totalAmount = subtotal + taxAmount - discountAmount;

    // Generate order number
    const date = new Date();
    const dateString = date.toISOString().slice(0, 10).replace(/-/g, '');
    const timestamp = Date.now().toString().slice(-4);
    const orderNumber = `ORD${dateString}${timestamp}`;

    // Process payment details and convert amounts to Decimal128
    const processedPaymentDetails = paymentDetails ? {
      cashAmount: paymentDetails.cashAmount ? mongoose.Types.Decimal128.fromString(String(paymentDetails.cashAmount)) : mongoose.Types.Decimal128.fromString('0'),
      cardAmount: paymentDetails.cardAmount ? mongoose.Types.Decimal128.fromString(String(paymentDetails.cardAmount)) : mongoose.Types.Decimal128.fromString('0'),
      transferAmount: paymentDetails.transferAmount ? mongoose.Types.Decimal128.fromString(String(paymentDetails.transferAmount)) : mongoose.Types.Decimal128.fromString('0'),
      changeAmount: paymentDetails.changeAmount ? mongoose.Types.Decimal128.fromString(String(paymentDetails.changeAmount)) : mongoose.Types.Decimal128.fromString('0')
    } : {
      cashAmount: mongoose.Types.Decimal128.fromString(String(totalAmount)),
      cardAmount: mongoose.Types.Decimal128.fromString('0'),
      transferAmount: mongoose.Types.Decimal128.fromString('0'),
      changeAmount: mongoose.Types.Decimal128.fromString('0')
    };

    // Create order with validated data
    const orderData = {
      orderNumber,
      customerName,
      customerPhone,
      customerEmail,
      items: orderItems,
      subtotal: mongoose.Types.Decimal128.fromString(String(subtotal)),
      taxAmount: mongoose.Types.Decimal128.fromString(String(taxAmount)),
      taxRate,
      discountAmount: mongoose.Types.Decimal128.fromString(String(discountAmount)),
      discountRate,
      totalAmount: mongoose.Types.Decimal128.fromString(String(totalAmount)),
      paymentMethod,
      paymentDetails: processedPaymentDetails,
      paymentStatus: 'paid',
      status: 'completed',
      notes,
      employeeId: req.user._id,
      employeeName: req.user._id,
      storeId: store._id,
      ownerId: store.ownerId
    };

    const order = new Order(orderData);
    await order.save();

    // Always update stock balances for production orders
    for (const item of orderItems) {
      await StockBalance.findOneAndUpdate(
        { productId: item.productId, storeId: orderData.storeId },
        { $inc: { quantity: -item.quantity } },
        { new: true }
      );
    }

    // Try to populate order for response, but handle errors gracefully
    try {
      await order.populate([
        { path: 'employeeId', select: 'name email' },
        { path: 'storeId', select: 'name address phone' },
        { path: 'items.productId', select: 'name imageUrl unit' }
      ]);
    } catch (populateError) {
      console.warn('Could not populate order fields:', populateError.message);
      // Continue without population
    }

    res.status(201).json({
      success: true,
      message: 'Tạo đơn hàng thành công',
      data: serializeOrderForResponse(order)
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo đơn hàng',
      error: error.message
    });
  }
};

// Update order status
const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, paymentStatus } = req.body;

    const order = await Order.findOne({ _id: id, deleted: false });
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng'
      });
    }

    if (status) order.status = status;
    if (paymentStatus) order.paymentStatus = paymentStatus;

    if (status === 'completed') {
      order.completedAt = new Date();
    }

    await order.save();

    res.json({
      success: true,
      message: 'Cập nhật trạng thái đơn hàng thành công',
      data: serializeOrderForResponse(order)
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật trạng thái đơn hàng',
      error: error.message
    });
  }
};

// Cancel order
const cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const order = await Order.findOne({ _id: id, deleted: false });
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng'
      });
    }

    if (order.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Không thể hủy đơn hàng đã hoàn thành'
      });
    }

    order.status = 'cancelled';
    order.notes = reason ? `${order.notes || ''}\nLý do hủy: ${reason}` : order.notes;

    // Restore stock if order was confirmed
    if (order.status === 'confirmed') {
      for (const item of order.items) {
        await StockBalance.findOneAndUpdate(
          { productId: item.productId, storeId: order.storeId },
          { $inc: { quantity: item.quantity } }
        );
      }
    }

    await order.save();

    res.json({
      success: true,
      message: 'Hủy đơn hàng thành công',
      data: serializeOrderForResponse(order)
    });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi hủy đơn hàng',
      error: error.message
    });
  }
};

// Get sales statistics
const getSalesStatistics = async (req, res) => {
  try {
    const { storeId, startDate, endDate, period = 'day' } = req.query;

    let dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }

    let matchQuery = {
      deleted: false,
      status: 'completed',
      paymentStatus: 'paid',
      ...dateFilter
    };

    if (storeId) matchQuery.storeId = storeId;

    // Group by period
    let groupStage;
    if (period === 'day') {
      groupStage = {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: { $toDouble: '$totalAmount' } },
          averageOrderValue: { $avg: { $toDouble: '$totalAmount' } }
        }
      };
    } else if (period === 'month') {
      groupStage = {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: { $toDouble: '$totalAmount' } },
          averageOrderValue: { $avg: { $toDouble: '$totalAmount' } }
        }
      };
    }

    const statistics = await Order.aggregate([
      { $match: matchQuery },
      groupStage,
      { $sort: { '_id.year': -1, '_id.month': -1, '_id.day': -1 } }
    ]);

    // Get overall statistics
    const overall = await Order.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: { $toDouble: '$totalAmount' } },
          averageOrderValue: { $avg: { $toDouble: '$totalAmount' } }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        statistics,
        overall: overall[0] || { totalOrders: 0, totalRevenue: 0, averageOrderValue: 0 }
      }
    });
  } catch (error) {
    console.error('Get sales statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thống kê bán hàng',
      error: error.message
    });
  }
};

// Demo endpoint for testing without authentication
const createDemoOrder = async (req, res) => {
  try {
    const {
      customerName = 'Khách Demo',
      customerPhone,
      items = []
    } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Đơn hàng phải có ít nhất một sản phẩm'
      });
    }

    // Create simplified order items without stock check
    const orderItems = items.map((item, index) => ({
      productId: new mongoose.Types.ObjectId(), // Tạo ObjectId hợp lệ
      productName: item.productName || `Demo Product ${index + 1}`,
      productCode: item.productCode || `DEMO-${String(index + 1).padStart(3, '0')}`,
      quantity: item.quantity || 1,
      unitPrice: mongoose.Types.Decimal128.fromString(String(item.unitPrice || 10000)),
      totalPrice: mongoose.Types.Decimal128.fromString(String((item.unitPrice || 10000) * (item.quantity || 1))),
      unit: item.unit || 'cái'
    }));

    // Calculate totals manually to ensure they're set
    let subtotal = 0;
    orderItems.forEach(item => {
      subtotal += parseFloat(item.totalPrice.toString());
    });

    const taxRate = 0;
    const discountRate = 0;
    const taxAmount = (subtotal * taxRate) / 100;
    const discountAmount = (subtotal * discountRate) / 100;
    const totalAmount = subtotal + taxAmount - discountAmount;

    // Generate order number manually
    const date = new Date();
    const dateString = date.toISOString().slice(0, 10).replace(/-/g, '');
    const timestamp = Date.now().toString().slice(-4);
    const orderNumber = `ORD${dateString}${timestamp}`;

    // Create demo order with explicit required fields
    const order = new Order({
      orderNumber,
      customerName,
      customerPhone,
      items: orderItems,
      subtotal: mongoose.Types.Decimal128.fromString(String(subtotal)),
      taxAmount: mongoose.Types.Decimal128.fromString(String(taxAmount)),
      taxRate,
      discountAmount: mongoose.Types.Decimal128.fromString(String(discountAmount)),
      discountRate,
      totalAmount: mongoose.Types.Decimal128.fromString(String(totalAmount)),
      paymentMethod: 'cash',
      paymentStatus: 'paid',
      status: 'completed',
      employeeName: 'Demo Employee',
      notes: 'Demo order for testing'
    });

    await order.save();

    res.status(201).json({
      success: true,
      message: 'Tạo đơn hàng demo thành công',
      data: serializeOrderForResponse(order)
    });
  } catch (error) {
    console.error('Create demo order error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo đơn hàng demo',
      error: error.message
    });
  }
};

module.exports = {
  getOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  cancelOrder,
  getSalesStatistics,
  createDemoOrder
};
