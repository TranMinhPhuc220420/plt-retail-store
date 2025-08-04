const IngredientStockTransaction = require('../models/IngredientStockTransaction');
const IngredientStockBalance = require('../models/IngredientStockBalance');
const Ingredient = require('../models/Ingredient');
const Store = require('../models/Store');
const Warehouse = require('../models/Warehouse');
const Supplier = require('../models/Supplier');
const mongoose = require('mongoose');
const costUpdateManager = require('../utils/costUpdateManager'); // ✅ THÊM COST UPDATE MANAGER

const ingredientInventoryController = {
  
  /**
   * Stock In Operation - Receive ingredients into warehouse
   * Creates a transaction record and updates stock balance
   */
  stockIn: async (req, res) => {
    try {
      const { 
        storeCode, 
        ingredientId, 
        warehouseId,
        quantity, 
        unit, 
        note,
        batchNumber,
        expirationDate,
        supplierId,
        referenceNumber,
        costPerUnit,
        temperatureCondition,
        qualityCheck
      } = req.body;
      
      const userId = req.user._id;
      const ownerId = req.user._id;
      
      // Validate required fields
      if (!storeCode || !ingredientId || !warehouseId || !quantity || !unit) {
        return res.status(400).json({ 
          error: 'missing_required_fields',
          message: 'storeCode, ingredientId, warehouseId, quantity, and unit are required'
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
      
      // Verify ingredient exists and belongs to owner
      const ingredient = await Ingredient.findOne({ 
        _id: ingredientId, 
        ownerId, 
        storeId: store._id,
        deleted: false 
      });
      
      if (!ingredient) {
        return res.status(404).json({ error: 'ingredient_not_found' });
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
      const stockTransaction = new IngredientStockTransaction({
        type: 'in',
        ingredientId,
        storeId: store._id,
        warehouseId,
        quantity,
        unit,
        userId,
        ownerId,
        note: note || `Stock in - ${quantity} ${unit} added`,
        date: new Date(),
        batchNumber,
        expirationDate: expirationDate ? new Date(expirationDate) : null,
        supplierId,
        referenceNumber,
        costPerUnit,
        temperatureCondition: temperatureCondition || 'room_temp',
        qualityCheck: qualityCheck || { passed: true, notes: '', checkedBy: userId, checkDate: new Date() }
      });
      
      await stockTransaction.save();
      
      // Update or create stock balance using atomic operations to prevent race conditions
      let stockBalance = await IngredientStockBalance.findOne({
        ingredientId,
        storeId: store._id,
        warehouseId,
        batchNumber: batchNumber || null,
        expirationDate: expirationDate ? new Date(expirationDate) : null
      });
      
      if (stockBalance) {
        // Calculate new cost information if provided
        let updateFields = {
          $inc: { quantity: quantity },
          $set: {
            lastTransactionDate: new Date(),
            lastTransactionId: stockTransaction._id
          }
        };
        
        if (costPerUnit) {
          const currentQuantity = stockBalance.quantity;
          const totalCurrentCost = stockBalance.costPerUnit ? stockBalance.costPerUnit * currentQuantity : 0;
          const newCost = costPerUnit * quantity;
          const newTotalQuantity = currentQuantity + quantity;
          const newCostPerUnit = (totalCurrentCost + newCost) / newTotalQuantity;
          
          updateFields.$set.costPerUnit = newCostPerUnit;
          updateFields.$set.totalCost = newCostPerUnit * newTotalQuantity;
        }
        
        stockBalance = await IngredientStockBalance.findOneAndUpdate(
          {
            ingredientId,
            storeId: store._id,
            warehouseId,
            batchNumber: batchNumber || null,
            expirationDate: expirationDate ? new Date(expirationDate) : null
          },
          updateFields,
          { new: true }
        );
      } else {
        // Create new balance record
        stockBalance = new IngredientStockBalance({
          ingredientId,
          storeId: store._id,
          warehouseId,
          quantity,
          unit,
          minStock: ingredient.minStock || 0,
          maxStock: ingredient.maxStock || null,
          ownerId,
          lastTransactionDate: new Date(),
          lastTransactionId: stockTransaction._id,
          expirationDate: expirationDate ? new Date(expirationDate) : null,
          batchNumber,
          supplierId,
          costPerUnit,
          totalCost: costPerUnit ? costPerUnit * quantity : null,
          metadata: {
            temperature: temperatureCondition || ingredient.properties?.storageTemp || 'room_temp',
            allergens: ingredient.properties?.allergens || [],
            nutritionalInfo: ingredient.properties?.nutritionalInfo || {}
          }
        });
        await stockBalance.save();
      }
      
      // Update ingredient's total stock quantity (for backward compatibility)
      const oldCost = parseFloat(ingredient.averageCost?.toString() || ingredient.standardCost?.toString() || 0);
      ingredient.stockQuantity += quantity;
      
      // ✅ UPDATE AVERAGE COST IF NEW COST PROVIDED
      if (costPerUnit) {
        const totalCurrentValue = oldCost * (ingredient.stockQuantity - quantity);
        const newValue = costPerUnit * quantity;
        const newAverageCost = (totalCurrentValue + newValue) / ingredient.stockQuantity;
        
        ingredient.averageCost = mongoose.Types.Decimal128.fromString(newAverageCost.toString());
        
        // ✅ TRIGGER REAL-TIME COST UPDATES
        await costUpdateManager.onIngredientCostChange(ingredientId, {
          oldCost,
          newCost: newAverageCost,
          changeType: 'STOCK_IN',
          quantity,
          batchNumber
        });
      }
      
      await ingredient.save();
      
      // Populate transaction for response
      const populatedTransaction = await IngredientStockTransaction.findById(stockTransaction._id)
        .populate('ingredientId', 'name ingredientCode category')
        .populate('storeId', 'name storeCode')
        .populate('warehouseId', 'name address')
        .populate('userId', 'username displayName')
        .populate('supplierId', 'name contactInfo');
      
      res.status(201).json({
        transaction: populatedTransaction,
        balance: stockBalance,
        message: 'ingredient_stock_in_successful'
      });
      
    } catch (error) {
      console.error('Ingredient stock in error:', error);
      res.status(500).json({ error: 'ingredient_stock_in_failed' });
    }
  },
  
  /**
   * Stock Out Operation - Issue ingredients from warehouse
   * Creates a transaction record and decreases stock balance
   */
  stockOut: async (req, res) => {
    try {
      const { 
        storeCode, 
        ingredientId, 
        warehouseId,
        quantity, 
        unit, 
        note,
        batchNumber,
        recipeId,
        temperatureCondition
      } = req.body;
      
      const userId = req.user._id;
      const ownerId = req.user._id;
      
      // Validate required fields
      if (!storeCode || !ingredientId || !warehouseId || !quantity || !unit) {
        return res.status(400).json({ 
          error: 'missing_required_fields',
          message: 'storeCode, ingredientId, warehouseId, quantity, and unit are required'
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
      
      // Verify ingredient exists and belongs to owner
      const ingredient = await Ingredient.findOne({ 
        _id: ingredientId, 
        ownerId, 
        storeId: store._id,
        deleted: false 
      });
      
      if (!ingredient) {
        return res.status(404).json({ error: 'ingredient_not_found' });
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
      
      // Check current stock balance - prioritize FIFO (first expiring first)
      let stockBalance;
      
      if (batchNumber) {
        // Specific batch requested
        stockBalance = await IngredientStockBalance.findOne({
          ingredientId,
          storeId: store._id,
          warehouseId,
          batchNumber,
          deleted: false
        });
      } else {
        // Find the batch that expires first (FIFO)
        stockBalance = await IngredientStockBalance.findOne({
          ingredientId,
          storeId: store._id,
          warehouseId,
          quantity: { $gte: quantity },
          deleted: false
        }).sort({ expirationDate: 1, createdAt: 1 });
      }
      
      if (!stockBalance || stockBalance.quantity < quantity) {
        const available = stockBalance ? stockBalance.quantity : 0;
        return res.status(400).json({ 
          error: 'insufficient_stock',
          message: `Insufficient stock. Available: ${available}, Requested: ${quantity}`,
          availableStock: available
        });
      }
      
      // Create stock transaction record
      const stockTransaction = new IngredientStockTransaction({
        type: 'out',
        ingredientId,
        storeId: store._id,
        warehouseId,
        quantity,
        unit,
        userId,
        ownerId,
        note: note || `Stock out - ${quantity} ${unit} issued`,
        date: new Date(),
        batchNumber: stockBalance.batchNumber,
        expirationDate: stockBalance.expirationDate,
        recipeId,
        temperatureCondition: temperatureCondition || stockBalance.metadata?.temperature || 'room_temp'
      });
      
      await stockTransaction.save();
      
      // Update stock balance using atomic operations to prevent race conditions
      const updatedStockBalance = await IngredientStockBalance.findOneAndUpdate(
        {
          _id: stockBalance._id,
          quantity: { $gte: quantity } // Ensure sufficient stock
        },
        {
          $inc: { quantity: -quantity },
          $set: {
            lastTransactionDate: new Date(),
            lastTransactionId: stockTransaction._id,
            deleted: { $cond: { if: { $eq: [{ $subtract: ['$quantity', quantity] }, 0] }, then: true, else: false } }
          }
        },
        { new: true }
      );
      
      if (!updatedStockBalance) {
        // Rollback transaction if stock update failed
        await IngredientStockTransaction.findByIdAndDelete(stockTransaction._id);
        
        // Re-check current stock to provide accurate error message
        const currentBalance = await IngredientStockBalance.findById(stockBalance._id);
        const available = currentBalance ? currentBalance.quantity : 0;
        
        return res.status(400).json({
          error: 'insufficient_stock',
          message: `Insufficient stock. Available: ${available}, Requested: ${quantity}`,
          availableStock: available
        });
      }
      
      // Update ingredient's total stock quantity (for backward compatibility) using atomic operation
      await Ingredient.findOneAndUpdate(
        { _id: ingredientId },
        { $inc: { stockQuantity: -quantity } },
        { new: true }
      );
      
      // Populate transaction for response
      const populatedTransaction = await IngredientStockTransaction.findById(stockTransaction._id)
        .populate('ingredientId', 'name ingredientCode category')
        .populate('storeId', 'name storeCode')
        .populate('warehouseId', 'name address')
        .populate('userId', 'username displayName')
        .populate('recipeId', 'name description');
      
      res.status(200).json({
        transaction: populatedTransaction,
        balance: stockBalance,
        message: 'ingredient_stock_out_successful'
      });
      
    } catch (error) {
      console.error('Ingredient stock out error:', error);
      res.status(500).json({ error: 'ingredient_stock_out_failed' });
    }
  },
  
  /**
   * Stock Take Operation - Perform physical count and adjustment
   * Creates adjustment transaction and updates stock balance
   */
  stockTake: async (req, res) => {
    try {
      const { 
        storeCode, 
        ingredientId, 
        warehouseId,
        physicalCount, 
        unit, 
        note,
        batchNumber
      } = req.body;
      
      const userId = req.user._id;
      const ownerId = req.user._id;
      
      // Validate required fields
      if (!storeCode || !ingredientId || !warehouseId || physicalCount === undefined || !unit) {
        return res.status(400).json({ 
          error: 'missing_required_fields',
          message: 'storeCode, ingredientId, warehouseId, physicalCount, and unit are required'
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
      
      // Verify ingredient exists
      const ingredient = await Ingredient.findOne({ 
        _id: ingredientId, 
        ownerId, 
        storeId: store._id,
        deleted: false 
      });
      
      if (!ingredient) {
        return res.status(404).json({ error: 'ingredient_not_found' });
      }
      
      // Find stock balance
      const query = {
        ingredientId,
        storeId: store._id,
        warehouseId,
        deleted: false
      };
      
      if (batchNumber) {
        query.batchNumber = batchNumber;
      }
      
      const stockBalance = await IngredientStockBalance.findOne(query);
      
      if (!stockBalance) {
        return res.status(404).json({ error: 'stock_balance_not_found' });
      }
      
      const previousQuantity = stockBalance.quantity;
      const adjustmentQuantity = physicalCount - previousQuantity;
      
      // Only create transaction if there's a difference
      if (adjustmentQuantity !== 0) {
        const stockTransaction = new IngredientStockTransaction({
          type: 'adjustment',
          ingredientId,
          storeId: store._id,
          warehouseId,
          quantity: adjustmentQuantity,
          unit,
          userId,
          ownerId,
          note: note || `Stock take adjustment - Physical count: ${physicalCount}, System count: ${previousQuantity}`,
          date: new Date(),
          previousQuantity,
          newQuantity: physicalCount,
          batchNumber: stockBalance.batchNumber,
          expirationDate: stockBalance.expirationDate
        });
        
        await stockTransaction.save();
        
        // Update stock balance
        stockBalance.quantity = physicalCount;
        stockBalance.lastTransactionDate = new Date();
        stockBalance.lastTransactionId = stockTransaction._id;
        await stockBalance.save();
        
        // Update ingredient's total stock quantity
        ingredient.stockQuantity = Math.max(0, ingredient.stockQuantity + adjustmentQuantity);
        await ingredient.save();
        
        // Populate transaction for response
        const populatedTransaction = await IngredientStockTransaction.findById(stockTransaction._id)
          .populate('ingredientId', 'name ingredientCode category')
          .populate('storeId', 'name storeCode')
          .populate('warehouseId', 'name address')
          .populate('userId', 'username displayName');
        
        res.status(200).json({
          transaction: populatedTransaction,
          balance: stockBalance,
          adjustment: {
            previousQuantity,
            newQuantity: physicalCount,
            adjustmentQuantity
          },
          message: 'ingredient_stock_take_successful'
        });
      } else {
        res.status(200).json({
          balance: stockBalance,
          adjustment: {
            previousQuantity,
            newQuantity: physicalCount,
            adjustmentQuantity: 0
          },
          message: 'no_adjustment_needed'
        });
      }
      
    } catch (error) {
      console.error('Ingredient stock take error:', error);
      res.status(500).json({ error: 'ingredient_stock_take_failed' });
    }
  },
  
  /**
   * Get stock balance for specific ingredient in warehouse
   */
  getStockBalance: async (req, res) => {
    try {
      const { storeCode, ingredientId, warehouseId } = req.params;
      const { batchNumber } = req.query;
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
      
      const query = {
        ingredientId,
        storeId: store._id,
        warehouseId,
        deleted: false
      };
      
      if (batchNumber) {
        query.batchNumber = batchNumber;
      }
      
      const stockBalances = await IngredientStockBalance.find(query)
        .populate('ingredientId', 'name ingredientCode category unit minStock maxStock')
        .populate('storeId', 'name storeCode')
        .populate('warehouseId', 'name address')
        .populate('supplierId', 'name contactInfo')
        .sort({ expirationDate: 1, createdAt: 1 });
      
      if (stockBalances.length === 0) {
        return res.status(404).json({ error: 'stock_balance_not_found' });
      }
      
      // Calculate total quantity across all batches
      const totalQuantity = stockBalances.reduce((sum, balance) => sum + balance.quantity, 0);
      
      res.status(200).json({
        stockBalances,
        totalQuantity,
        message: 'stock_balance_retrieved'
      });
      
    } catch (error) {
      console.error('Get ingredient stock balance error:', error);
      res.status(500).json({ error: 'failed_to_get_stock_balance' });
    }
  },
  
  /**
   * Get all stock balances for a store
   */
  getAllStockBalances: async (req, res) => {
    try {
      const { storeCode } = req.params;
      const { warehouseId, lowStock, expiring, expired } = req.query;
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
      
      const query = {
        storeId: store._id,
        ownerId,
        deleted: false,
        quantity: { $gt: 0 } // Only show balances with stock
      };
      
      if (warehouseId) {
        query.warehouseId = warehouseId;
      }
      
      let stockBalances = await IngredientStockBalance.find(query)
        .populate('ingredientId', 'name ingredientCode category unit minStock maxStock')
        .populate('storeId', 'name storeCode')
        .populate('warehouseId', 'name address')
        .populate('supplierId', 'name contactInfo')
        .sort({ 'ingredientId.name': 1, expirationDate: 1 });
      
      // Apply filters
      if (lowStock === 'true') {
        stockBalances = stockBalances.filter(balance => 
          balance.quantity <= (balance.minStock || balance.ingredientId?.minStock || 0)
        );
      }
      
      if (expiring === 'true') {
        const warningDate = new Date();
        warningDate.setDate(warningDate.getDate() + 7); // 7 days warning
        stockBalances = stockBalances.filter(balance => 
          balance.expirationDate && balance.expirationDate <= warningDate && balance.expirationDate > new Date()
        );
      }
      
      if (expired === 'true') {
        stockBalances = stockBalances.filter(balance => 
          balance.expirationDate && balance.expirationDate <= new Date()
        );
      }
      
      res.status(200).json({
        stockBalances,
        count: stockBalances.length,
        message: 'stock_balances_retrieved'
      });
      
    } catch (error) {
      console.error('Get all ingredient stock balances error:', error);
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
        ingredientId, 
        warehouseId,
        type, 
        startDate, 
        endDate, 
        batchNumber,
        page = 1, 
        limit = 20 
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
      
      const query = {
        storeId: store._id,
        ownerId,
        deleted: false
      };
      
      // Add filters
      if (ingredientId) query.ingredientId = ingredientId;
      if (warehouseId) query.warehouseId = warehouseId;
      if (type) query.type = type;
      if (batchNumber) query.batchNumber = batchNumber;
      
      if (startDate || endDate) {
        query.date = {};
        if (startDate) query.date.$gte = new Date(startDate);
        if (endDate) query.date.$lte = new Date(endDate);
      }
      
      const skip = (parseInt(page) - 1) * parseInt(limit);
      
      const [transactions, totalCount] = await Promise.all([
        IngredientStockTransaction.find(query)
          .populate('ingredientId', 'name ingredientCode category')
          .populate('storeId', 'name storeCode')
          .populate('warehouseId', 'name address')
          .populate('userId', 'username displayName')
          .populate('supplierId', 'name contactInfo')
          .populate('recipeId', 'name description')
          .sort({ date: -1 })
          .skip(skip)
          .limit(parseInt(limit)),
        IngredientStockTransaction.countDocuments(query)
      ]);
      
      res.status(200).json({
        transactions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          totalCount,
          totalPages: Math.ceil(totalCount / parseInt(limit))
        },
        message: 'transaction_history_retrieved'
      });
      
    } catch (error) {
      console.error('Get ingredient transaction history error:', error);
      res.status(500).json({ error: 'failed_to_get_transaction_history' });
    }
  },
  
  /**
   * Get low stock report for a store
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
      
      const aggregationPipeline = [
        {
          $match: {
            storeId: store._id,
            ownerId,
            deleted: false,
            quantity: { $gt: 0 }
          }
        }
      ];
      
      if (warehouseId) {
        aggregationPipeline[0].$match.warehouseId = new mongoose.Types.ObjectId(warehouseId);
      }
      
      aggregationPipeline.push(
        {
          $lookup: {
            from: 'ingredients',
            localField: 'ingredientId',
            foreignField: '_id',
            as: 'ingredient'
          }
        },
        {
          $unwind: '$ingredient'
        },
        {
          $addFields: {
            isLowStock: {
              $lte: ['$quantity', { $ifNull: ['$minStock', '$ingredient.minStock'] }]
            }
          }
        },
        {
          $match: {
            isLowStock: true
          }
        },
        {
          $lookup: {
            from: 'warehouses',
            localField: 'warehouseId',
            foreignField: '_id',
            as: 'warehouse'
          }
        },
        {
          $unwind: '$warehouse'
        },
        {
          $project: {
            ingredientId: 1,
            ingredientName: '$ingredient.name',
            ingredientCode: '$ingredient.ingredientCode',
            category: '$ingredient.category',
            currentStock: '$quantity',
            minStock: { $ifNull: ['$minStock', '$ingredient.minStock'] },
            unit: 1,
            warehouseName: '$warehouse.name',
            batchNumber: 1,
            expirationDate: 1,
            lastTransactionDate: 1
          }
        },
        {
          $sort: {
            ingredientName: 1,
            expirationDate: 1
          }
        }
      );
      
      const lowStockItems = await IngredientStockBalance.aggregate(aggregationPipeline);
      
      res.status(200).json({
        lowStockItems,
        count: lowStockItems.length,
        message: 'low_stock_report_generated'
      });
      
    } catch (error) {
      console.error('Get ingredient low stock report error:', error);
      res.status(500).json({ error: 'failed_to_generate_low_stock_report' });
    }
  },
  
  /**
   * Get expiring ingredients report
   */
  getExpiringIngredientsReport: async (req, res) => {
    try {
      const { storeCode } = req.params;
      const { warehouseId, days = 7 } = req.query;
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
      
      const warningDate = new Date();
      warningDate.setDate(warningDate.getDate() + parseInt(days));
      
      const query = {
        storeId: store._id,
        ownerId,
        deleted: false,
        quantity: { $gt: 0 },
        expirationDate: {
          $lte: warningDate,
          $gte: new Date()
        }
      };
      
      if (warehouseId) {
        query.warehouseId = warehouseId;
      }
      
      const expiringItems = await IngredientStockBalance.find(query)
        .populate('ingredientId', 'name ingredientCode category')
        .populate('warehouseId', 'name address')
        .sort({ expirationDate: 1 });
      
      res.status(200).json({
        expiringItems,
        count: expiringItems.length,
        warningDays: parseInt(days),
        message: 'expiring_ingredients_report_generated'
      });
      
    } catch (error) {
      console.error('Get expiring ingredients report error:', error);
      res.status(500).json({ error: 'failed_to_generate_expiring_report' });
    }
  }
};

module.exports = ingredientInventoryController;
