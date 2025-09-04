const StockTransaction = require('../models/StockTransaction');
const StockBalance = require('../models/StockBalance');
const Product = require('../models/Product');
const Store = require('../models/Store');
const Warehouse = require('../models/Warehouse');
const mongoose = require('mongoose');

const inventoryController = {
  
  /**
   * Stock In Operation - Receive inventory into warehouse
   * Creates a transaction record and updates stock balance
   */
  stockIn: async (req, res) => {
    try {
      const { storeCode, productId, warehouseId, quantity, unit, note } = req.body;
      const userId = req.user._id;
      const ownerId = req.user._id;
      
      // Validate required fields
      if (!storeCode || !productId || !warehouseId || !quantity || !unit) {
        return res.status(400).json({ 
          error: 'missing_required_fields',
          message: 'storeCode, productId, warehouseId, quantity, and unit are required'
        });
      }
      
      if (quantity <= 0) {
        return res.status(400).json({ 
          error: 'invalid_quantity',
          message: 'Quantity must be greater than 0'
        });
      }
      
      // Find store by storeCode
      const store = await Store.findOne({ 
        storeCode, 
        ownerId, 
        deleted: false 
      });
      
      if (!store) {
        return res.status(404).json({ error: 'store_not_found' });
      }
      
      // Verify product exists and belongs to owner
      const product = await Product.findOne({ 
        _id: productId, 
        ownerId, 
        storeId: store._id,
        deleted: false 
      });
      
      if (!product) {
        return res.status(404).json({ error: 'product_not_found' });
      }
      
      // Verify warehouse exists and belongs to owner
      const warehouse = await Warehouse.findOne({
        _id: warehouseId,
        ownerId,
        storeId: store._id,
        deleted: false
      });
      
      if (!warehouse) {
        return res.status(404).json({ error: 'warehouse_not_found' });
      }
      
      // Create stock transaction record
      const stockTransaction = new StockTransaction({
        type: 'in',
        productId,
        storeId: store._id,
        warehouseId,
        quantity,
        unit,
        userId,
        ownerId,
        note: note || `Stock in - ${quantity} ${unit} added`,
        date: new Date()
      });
      
      await stockTransaction.save();
      
      // Update or create stock balance using atomic operations to prevent race conditions
      let stockBalance = await StockBalance.findOneAndUpdate(
        {
          productId,
          storeId: store._id,
          warehouseId
        },
        {
          $inc: { quantity: quantity },
          $set: {
            lastTransactionDate: new Date(),
            lastTransactionId: stockTransaction._id
          }
        },
        { 
          new: true,
          upsert: false
        }
      );
      
      if (!stockBalance) {
        // Create new balance record if doesn't exist
        stockBalance = new StockBalance({
          productId,
          storeId: store._id,
          warehouseId,
          quantity,
          unit,
          ownerId,
          lastTransactionDate: new Date(),
          lastTransactionId: stockTransaction._id
        });
        await stockBalance.save();
      }
      
      // Populate transaction for response
      const populatedTransaction = await StockTransaction.findById(stockTransaction._id)
        .populate('productId', 'name productCode')
        .populate('storeId', 'name storeCode')
        .populate('warehouseId', 'name address')
        .populate('userId', 'username displayName');
      
      res.status(201).json({
        transaction: populatedTransaction,
        balance: stockBalance,
        message: 'stock_in_successful'
      });
      
    } catch (error) {
      console.error('Stock in error:', error);
      res.status(500).json({ error: 'stock_in_failed' });
    }
  },
  
  /**
   * Stock Out Operation - Issue inventory from warehouse
   * Creates a transaction record and decreases stock balance
   */
  stockOut: async (req, res) => {
    try {
      const { storeCode, productId, warehouseId, quantity, unit, note } = req.body;
      const userId = req.user._id;
      const ownerId = req.user._id;
      
      // Validate required fields
      if (!storeCode || !productId || !warehouseId || !quantity || !unit) {
        return res.status(400).json({ 
          error: 'missing_required_fields',
          message: 'storeCode, productId, warehouseId, quantity, and unit are required'
        });
      }
      
      if (quantity <= 0) {
        return res.status(400).json({ 
          error: 'invalid_quantity',
          message: 'Quantity must be greater than 0'
        });
      }
      
      // Find store by storeCode
      const store = await Store.findOne({ 
        storeCode, 
        ownerId, 
        deleted: false 
      });
      
      if (!store) {
        return res.status(404).json({ error: 'store_not_found' });
      }
      
      // Verify product exists and belongs to owner
      const product = await Product.findOne({ 
        _id: productId, 
        ownerId, 
        storeId: store._id,
        deleted: false 
      });
      
      if (!product) {
        return res.status(404).json({ error: 'product_not_found' });
      }
      
      // Verify warehouse exists
      const warehouse = await Warehouse.findOne({
        _id: warehouseId,
        ownerId,
        storeId: store._id,
        deleted: false
      });
      
      if (!warehouse) {
        return res.status(404).json({ error: 'warehouse_not_found' });
      }
      
      // Create stock transaction record first
      const stockTransaction = new StockTransaction({
        type: 'out',
        productId,
        storeId: store._id,
        warehouseId,
        quantity,
        unit,
        userId,
        ownerId,
        note: note || `Stock out - ${quantity} ${unit} issued`,
        date: new Date()
      });
      
      await stockTransaction.save();
      
      // Update stock balance using atomic operations to prevent race conditions
      const updatedStockBalance = await StockBalance.findOneAndUpdate(
        {
          productId,
          storeId: store._id,
          warehouseId,
          quantity: { $gte: quantity } // Ensure sufficient stock
        },
        {
          $inc: { quantity: -quantity },
          $set: {
            lastTransactionDate: new Date(),
            lastTransactionId: stockTransaction._id
          }
        },
        { new: true }
      );
      
      if (!updatedStockBalance) {
        // Rollback transaction if stock update failed
        await StockTransaction.findByIdAndDelete(stockTransaction._id);
        
        // This means either stock balance doesn't exist or insufficient stock
        const currentBalance = await StockBalance.findOne({
          productId,
          storeId: store._id,
          warehouseId
        });
        const available = currentBalance ? currentBalance.quantity : 0;
        
        return res.status(400).json({ 
          error: 'insufficient_stock',
          message: `Insufficient stock. Available: ${available}, Requested: ${quantity}`,
          availableStock: available
        });
      }
      
      // Populate transaction for response
      const populatedTransaction = await StockTransaction.findById(stockTransaction._id)
        .populate('productId', 'name productCode')
        .populate('storeId', 'name storeCode')
        .populate('warehouseId', 'name address')
        .populate('userId', 'username displayName');
      
      res.status(201).json({
        transaction: populatedTransaction,
        balance: updatedStockBalance,
        message: 'stock_out_successful'
      });
      
    } catch (error) {
      console.error('Stock out error:', error);
      res.status(500).json({ error: 'stock_out_failed' });
    }
  },
  
  /**
   * Stock Take Operation - Physical count audit and adjustment
   * Compares physical count with system balance and creates adjustment if needed
   */
  stockTake: async (req, res) => {
    try {
      const { storeCode, productId, warehouseId, physicalCount, unit, note } = req.body;
      const userId = req.user._id;
      const ownerId = req.user._id;
      
      // Validate required fields
      if (!storeCode || !productId || !warehouseId || physicalCount === undefined || !unit) {
        return res.status(400).json({ 
          error: 'missing_required_fields',
          message: 'storeCode, productId, warehouseId, physicalCount, and unit are required'
        });
      }
      
      if (physicalCount < 0) {
        return res.status(400).json({ 
          error: 'invalid_physical_count',
          message: 'Physical count cannot be negative'
        });
      }
      
      // Find store by storeCode
      const store = await Store.findOne({ 
        storeCode, 
        ownerId, 
        deleted: false 
      });
      
      if (!store) {
        return res.status(404).json({ error: 'store_not_found' });
      }
      
      // Verify product exists and belongs to owner
      const product = await Product.findOne({ 
        _id: productId, 
        ownerId, 
        storeId: store._id,
        deleted: false 
      });
      
      if (!product) {
        return res.status(404).json({ error: 'product_not_found' });
      }
      
      // Verify warehouse exists
      const warehouse = await Warehouse.findOne({
        _id: warehouseId,
        ownerId,
        storeId: store._id,
        deleted: false
      });
      
      if (!warehouse) {
        return res.status(404).json({ error: 'warehouse_not_found' });
      }
      
      // Get current stock balance
      let stockBalance = await StockBalance.findOne({
        productId,
        storeId: store._id,
        warehouseId
      });
      
      const systemQuantity = stockBalance ? stockBalance.quantity : 0;
      const difference = physicalCount - systemQuantity;
      
      // Only create transaction if there's a difference
      if (difference !== 0) {
        // Create adjustment transaction
        const stockTransaction = new StockTransaction({
          type: 'adjustment',
          productId,
          storeId: store._id,
          warehouseId,
          quantity: difference, // Positive for increase, negative for decrease
          unit,
          userId,
          ownerId,
          previousQuantity: systemQuantity,
          newQuantity: physicalCount,
          note: note || `Stock take adjustment - Physical: ${physicalCount}, System: ${systemQuantity}, Difference: ${difference}`,
          date: new Date()
        });
        
        await stockTransaction.save();
        
        // Update or create stock balance
        if (stockBalance) {
          stockBalance.quantity = physicalCount;
          stockBalance.lastTransactionDate = new Date();
          stockBalance.lastTransactionId = stockTransaction._id;
          await stockBalance.save();
        } else {
          stockBalance = new StockBalance({
            productId,
            storeId: store._id,
            warehouseId,
            quantity: physicalCount,
            unit,
            ownerId,
            lastTransactionDate: new Date(),
            lastTransactionId: stockTransaction._id
          });
          await stockBalance.save();
        }
        
        // Populate transaction for response
        const populatedTransaction = await StockTransaction.findById(stockTransaction._id)
          .populate('productId', 'name productCode')
          .populate('storeId', 'name storeCode')
          .populate('warehouseId', 'name address')
          .populate('userId', 'username displayName');
        
        res.status(201).json({
          transaction: populatedTransaction,
          balance: stockBalance,
          adjustmentMade: true,
          difference,
          message: 'stock_take_completed_with_adjustment'
        });
      } else {
        // No difference, just update last transaction date
        if (stockBalance) {
          stockBalance.lastTransactionDate = new Date();
          await stockBalance.save();
        }
        
        res.status(200).json({
          balance: stockBalance,
          adjustmentMade: false,
          difference: 0,
          message: 'stock_take_completed_no_adjustment_needed'
        });
      }
      
    } catch (error) {
      console.error('Stock take error:', error);
      res.status(500).json({ error: 'stock_take_failed' });
    }
  },
  
  /**
   * Get stock balance for specific product in store
   */
  /**
   * Get stock balance for specific product in warehouse
   */
  getStockBalance: async (req, res) => {
    try {
      const { storeCode, productId, warehouseId } = req.params;
      const ownerId = req.user._id;
      
      // Find store by storeCode
      const store = await Store.findOne({ 
        storeCode, 
        ownerId, 
        deleted: false 
      });
      
      if (!store) {
        return res.status(404).json({ error: 'store_not_found' });
      }
      
      // Get stock balance
      const stockBalance = await StockBalance.findOne({
        productId,
        storeId: store._id,
        warehouseId,
        deleted: false
      })
      .populate('productId', 'name productCode unit minStock maxStock')
      .populate('storeId', 'name storeCode')
      .populate('warehouseId', 'name address')
      .populate('lastTransactionId', 'type date note');
      
      if (!stockBalance) {
        return res.status(404).json({ 
          error: 'stock_balance_not_found',
          message: 'No stock balance found for this product in this store'
        });
      }
      
      res.status(200).json(stockBalance);
      
    } catch (error) {
      console.error('Get stock balance error:', error);
      res.status(500).json({ error: 'failed_to_get_stock_balance' });
    }
  },
  
  /**
   * Get all stock balances for a store
   */
  getAllStockBalances: async (req, res) => {
    try {
      const { storeCode } = req.params;
      const { warehouseId } = req.query;
      const ownerId = req.user._id;
      
      // Find store by storeCode
      const store = await Store.findOne({ 
        storeCode, 
        ownerId, 
        deleted: false 
      });
      
      if (!store) {
        return res.status(404).json({ error: 'store_not_found' });
      }
      
      // Build query for stock balances
      const query = {
        storeId: store._id,
        deleted: false
      };
      
      if (warehouseId) {
        query.warehouseId = warehouseId;
      }
      
      // Get all stock balances for the store
      const stockBalances = await StockBalance.find(query)
      .populate('productId', 'name productCode unit minStock maxStock')
      .populate('storeId', 'name storeCode')
      .populate('warehouseId', 'name address')
      .populate('lastTransactionId', 'type date note')
      .sort({ 'productId.name': 1 });
      
      // DEBUG: Log the response structure
      console.log('🔍 DEBUG getAllStockBalances - Sample response:');
      if (stockBalances.length > 0) {
        console.log('Sample record:', JSON.stringify(stockBalances[0], null, 2));
        console.log('ProductId structure:', {
          minStock: stockBalances[0].productId?.minStock,
          maxStock: stockBalances[0].productId?.maxStock,
          name: stockBalances[0].productId?.name
        });
      }
      
      res.status(200).json(stockBalances);
      
    } catch (error) {
      console.error('Get all stock balances error:', error);
      res.status(500).json({ error: 'failed_to_get_stock_balances' });
    }
  },
  
  /**
   * Get transaction history with filtering and pagination
   */
  getTransactionHistory: async (req, res) => {
    try {
      const { storeCode } = req.params;
      const { 
        productId,
        warehouseId, 
        type, 
        startDate, 
        endDate, 
        page = 1, 
        limit = 50 
      } = req.query;
      const ownerId = req.user._id;
      
      // Find store by storeCode
      const store = await Store.findOne({ 
        storeCode, 
        ownerId, 
        deleted: false 
      });
      
      if (!store) {
        return res.status(404).json({ error: 'store_not_found' });
      }
      
      // Build filter query
      const filter = {
        storeId: store._id,
        ownerId,
        deleted: false
      };
      
      if (productId) {
        filter.productId = productId;
      }
      
      if (warehouseId) {
        filter.warehouseId = warehouseId;
      }
      
      if (type && ['in', 'out', 'adjustment'].includes(type)) {
        filter.type = type;
      }
      
      if (startDate || endDate) {
        filter.date = {};
        if (startDate) {
          filter.date.$gte = new Date(startDate);
        }
        if (endDate) {
          filter.date.$lte = new Date(endDate);
        }
      }
      
      // Calculate pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);
      
      // Get transactions with pagination
      const transactions = await StockTransaction.find(filter)
        .populate('productId', 'name productCode unit minStock maxStock')
        .populate('storeId', 'name storeCode')
        .populate('warehouseId', 'name address')
        .populate('userId', 'username displayName')
        .sort({ date: -1 })
        .skip(skip)
        .limit(parseInt(limit));
      
      // Get total count for pagination
      const totalCount = await StockTransaction.countDocuments(filter);
      
      res.status(200).json({
        transactions,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / parseInt(limit)),
          totalCount,
          limit: parseInt(limit)
        }
      });
      
    } catch (error) {
      console.error('Get transaction history error:', error);
      res.status(500).json({ error: 'failed_to_get_transaction_history' });
    }
  },
  
  /**
   * Get low stock report - products below minimum stock level
   */
  getLowStockReport: async (req, res) => {
    try {
      const { storeCode } = req.params;
      const { warehouseId } = req.query;
      const ownerId = req.user._id;
      
      // Find store by storeCode
      const store = await Store.findOne({ 
        storeCode, 
        ownerId, 
        deleted: false 
      });
      
      if (!store) {
        return res.status(404).json({ error: 'store_not_found' });
      }
      
      // Build query for stock balances
      const query = {
        storeId: store._id,
        deleted: false
      };
      
      if (warehouseId) {
        query.warehouseId = warehouseId;
      }
      
      // Get all stock balances with product details
      const stockBalances = await StockBalance.find(query)
      .populate('productId', 'name productCode unit minStock maxStock')
      .populate('storeId', 'name storeCode')
      .populate('warehouseId', 'name address');
      
      // Filter for low stock items
      const lowStockItems = stockBalances.filter(balance => {
        return balance.productId && 
               balance.productId.minStock && 
               balance.quantity <= balance.productId.minStock;
      });
      
      res.status(200).json({
        lowStockItems,
        totalLowStockItems: lowStockItems.length,
        storeInfo: {
          name: store.name,
          storeCode: store.storeCode
        }
      });
      
    } catch (error) {
      console.error('Get low stock report error:', error);
      res.status(500).json({ error: 'failed_to_get_low_stock_report' });
    }
  }
};

module.exports = inventoryController;