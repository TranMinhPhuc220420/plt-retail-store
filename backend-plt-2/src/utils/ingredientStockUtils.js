/**
 * Utility functions for ingredient stock management
 */
const IngredientStockBalance = require('../models/IngredientStockBalance');

/**
 * Calculate total available stock for an ingredient across all balances
 * @param {string} ingredientId - Ingredient ID
 * @param {string} storeId - Store ID
 * @param {string} ownerId - Owner ID
 * @returns {Promise<number>} Total available stock quantity
 */
async function getTotalIngredientStock(ingredientId, storeId, ownerId) {
  try {
    const stockBalances = await IngredientStockBalance.find({
      ingredientId,
      storeId,
      ownerId,
      deleted: false,
      quantity: { $gt: 0 }
    });

    return stockBalances.reduce((total, balance) => total + balance.quantity, 0);
  } catch (error) {
    console.error('Error calculating total ingredient stock:', error);
    return 0;
  }
}

/**
 * Get ingredient stock balances with detailed information
 * @param {string} ingredientId - Ingredient ID
 * @param {string} storeId - Store ID
 * @param {string} ownerId - Owner ID
 * @param {Object} options - Additional options
 * @returns {Promise<Array>} Array of stock balances
 */
async function getIngredientStockBalances(ingredientId, storeId, ownerId, options = {}) {
  try {
    const query = {
      ingredientId,
      storeId,
      ownerId,
      deleted: false
    };

    // Only include positive quantities unless specifically requested
    if (!options.includeZero) {
      query.quantity = { $gt: 0 };
    }

    let stockBalances = IngredientStockBalance.find(query);

    // Sort by expiration date (FIFO) unless specified otherwise
    if (options.sortBy === 'newest') {
      stockBalances = stockBalances.sort({ createdAt: -1 });
    } else {
      stockBalances = stockBalances.sort({ expirationDate: 1, createdAt: 1 });
    }

    return await stockBalances.exec();
  } catch (error) {
    console.error('Error getting ingredient stock balances:', error);
    return [];
  }
}

/**
 * Check if sufficient stock is available for a list of ingredient requirements
 * @param {Array} ingredientRequirements - Array of {ingredientId, quantity, storeId, ownerId}
 * @returns {Promise<Object>} Result with availability status and details
 */
async function checkIngredientAvailability(ingredientRequirements) {
  try {
    const results = {
      isAvailable: true,
      details: [],
      unavailable: []
    };

    for (const requirement of ingredientRequirements) {
      const totalStock = await getTotalIngredientStock(
        requirement.ingredientId,
        requirement.storeId,
        requirement.ownerId
      );

      const detail = {
        ingredientId: requirement.ingredientId,
        ingredientName: requirement.ingredientName,
        required: requirement.quantity,
        available: totalStock,
        sufficient: totalStock >= requirement.quantity,
        shortfall: Math.max(0, requirement.quantity - totalStock)
      };

      results.details.push(detail);

      if (!detail.sufficient) {
        results.isAvailable = false;
        results.unavailable.push(detail);
      }
    }

    return results;
  } catch (error) {
    console.error('Error checking ingredient availability:', error);
    return {
      isAvailable: false,
      details: [],
      unavailable: [],
      error: error.message
    };
  }
}

/**
 * Deduct ingredients from stock using FIFO method
 * @param {Array} ingredientUsage - Array of ingredient usage requirements
 * @param {Object} transaction - Transaction details (reason, reference, etc.)
 * @returns {Promise<Array>} Array of transaction records created
 */
async function deductIngredientsFromStock(ingredientUsage, transaction) {
  try {
    const IngredientStockTransaction = require('../models/IngredientStockTransaction');
    const transactions = [];

    console.log('deductIngredientsFromStock called with:', {
      ingredientUsageCount: ingredientUsage.length,
      transactionDetails: transaction,
      ingredientUsage: ingredientUsage.map(u => ({
        ingredientId: u.ingredientId,
        quantity: u.quantity,
        storeId: u.storeId,
        ownerId: u.ownerId,
        userId: u.userId
      }))
    });

    for (const usage of ingredientUsage) {
      const stockBalances = await getIngredientStockBalances(
        usage.ingredientId,
        usage.storeId,
        usage.ownerId,
        { sortBy: 'fifo' }
      );

      let remainingToDeduct = usage.quantity;

      // Process stock balances in FIFO order
      for (const balance of stockBalances) {
        if (remainingToDeduct <= 0) break;

        const deductFromThisBalance = Math.min(balance.quantity, remainingToDeduct);

        // Update stock balance
        const updatedBalance = await IngredientStockBalance.findByIdAndUpdate(
          balance._id,
          { 
            $inc: { quantity: -deductFromThisBalance },
            lastTransactionDate: new Date()
          },
          { new: true }
        );

        // Create transaction record
        const transactionData = {
          type: 'out',
          ingredientId: usage.ingredientId,
          storeId: usage.storeId,
          warehouseId: balance.warehouseId,
          quantity: -deductFromThisBalance,
          unit: balance.unit,
          userId: usage.ownerId || usage.userId,
          ownerId: usage.ownerId || usage.userId,
          date: new Date(),
          note: `Deducted for composite product preparation - ${transaction.reason || 'No reason specified'}`,
          batchNumber: balance.batchNumber,
          expirationDate: balance.expirationDate
        };
        
        console.log('Creating transaction with data:', transactionData);
        
        const transactionRecord = await IngredientStockTransaction.create(transactionData);

        transactions.push(transactionRecord);
        remainingToDeduct -= deductFromThisBalance;

        console.log(`Deducted ${deductFromThisBalance} ${balance.unit} of ingredient ${usage.ingredientId} from balance ${balance._id}`);
      }

      if (remainingToDeduct > 0) {
        console.warn(`Could not deduct full amount for ingredient ${usage.ingredientId}. Remaining: ${remainingToDeduct}`);
      }
    }

    return transactions;
  } catch (error) {
    console.error('Error deducting ingredients from stock:', error);
    throw error;
  }
}

module.exports = {
  getTotalIngredientStock,
  getIngredientStockBalances,
  checkIngredientAvailability,
  deductIngredientsFromStock
};