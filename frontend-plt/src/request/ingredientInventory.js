import { deleteApi, get, getApi, post, postApi, putApi } from "@/request";

/**
 * Ingredient Inventory Stock In Operation
 * @param {Object} stockInData - Stock in data
 * @param {string} stockInData.storeCode - Store code
 * @param {string} stockInData.ingredientId - Ingredient ID
 * @param {string} stockInData.warehouseId - Warehouse ID
 * @param {number} stockInData.quantity - Quantity to stock in
 * @param {string} stockInData.unit - Unit of measurement
 * @param {string} [stockInData.note] - Optional note
 * @param {string} [stockInData.batchNumber] - Optional batch number
 * @param {Date} [stockInData.expirationDate] - Optional expiration date
 * @param {string} [stockInData.supplierId] - Optional supplier ID
 * @param {string} [stockInData.referenceNumber] - Optional reference number
 * @param {number} [stockInData.costPerUnit] - Optional cost per unit
 * @param {string} [stockInData.temperatureCondition] - Storage temperature condition
 * @param {Object} [stockInData.qualityCheck] - Quality check information
 */
export const ingredientStockIn = async (stockInData) => {
  try {
    const response = await postApi('/ingredient-inventory/stock-in', stockInData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || error.message || 'Failed to perform ingredient stock in');
  }
};

/**
 * Ingredient Inventory Stock Out Operation
 * @param {Object} stockOutData - Stock out data
 * @param {string} stockOutData.storeCode - Store code
 * @param {string} stockOutData.ingredientId - Ingredient ID
 * @param {string} stockOutData.warehouseId - Warehouse ID
 * @param {number} stockOutData.quantity - Quantity to stock out
 * @param {string} stockOutData.unit - Unit of measurement
 * @param {string} [stockOutData.note] - Optional note
 * @param {string} [stockOutData.batchNumber] - Optional batch number
 * @param {string} [stockOutData.reason] - Reason for stock out
 * @param {string} [stockOutData.recipeId] - Recipe ID if used for production
 * @param {string} [stockOutData.orderId] - Order ID if used for order fulfillment
 */
export const ingredientStockOut = async (stockOutData) => {
  try {
    const response = await postApi('/ingredient-inventory/stock-out', stockOutData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || error.message || 'Failed to perform ingredient stock out');
  }
};

/**
 * Ingredient Inventory Stock Take Operation
 * @param {Object} stockTakeData - Stock take data
 * @param {string} stockTakeData.storeCode - Store code
 * @param {string} stockTakeData.ingredientId - Ingredient ID
 * @param {string} stockTakeData.warehouseId - Warehouse ID
 * @param {number} stockTakeData.physicalCount - Physical count of the ingredient
 * @param {string} stockTakeData.unit - Unit of measurement
 * @param {string} [stockTakeData.note] - Optional note about the stock take
 * @param {string} [stockTakeData.batchNumber] - Optional batch number
 */
export const ingredientStockTake = async (stockTakeData) => {
  try {
    const response = await postApi('/ingredient-inventory/stock-take', stockTakeData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || error.message || 'Failed to perform ingredient stock take');
  }
};

/**
 * Get ingredient stock balance for specific ingredient in warehouse
 * @param {string} storeCode - Store code
 * @param {string} ingredientId - Ingredient ID
 * @param {string} warehouseId - Warehouse ID
 */
export const getIngredientStockBalance = async (storeCode, ingredientId, warehouseId) => {
  try {
    const response = await getApi(`/ingredient-inventory/balance/${storeCode}/${ingredientId}/${warehouseId}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || error.message || 'Failed to fetch ingredient stock balance');
  }
};

/**
 * Get all ingredient stock balances for a store
 * @param {string} storeCode - Store code
 * @param {Object} params - Query parameters
 * @param {string} [params.warehouseId] - Filter by warehouse ID
 * @param {boolean} [params.lowStock] - Filter for low stock items
 * @param {boolean} [params.expiring] - Filter for expiring items
 * @param {boolean} [params.expired] - Filter for expired items
 * @param {number} [params.page] - Page number for pagination
 * @param {number} [params.limit] - Items per page
 */
export const getAllIngredientStockBalances = async (storeCode, params = {}) => {
  try {
    const url = `/ingredient-inventory/balances/${storeCode}`;
    const response = await getApi(url, params);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || error.message || 'Failed to fetch ingredient stock balances');
  }
};

/**
 * Get ingredient transaction history with filtering and pagination
 * @param {string} storeCode - Store code
 * @param {Object} params - Query parameters
 * @param {string} [params.ingredientId] - Filter by ingredient ID
 * @param {string} [params.warehouseId] - Filter by warehouse ID
 * @param {string} [params.type] - Filter by transaction type (in/out/adjustment/transfer/expired/damaged)
 * @param {string} [params.startDate] - Start date for date range filter
 * @param {string} [params.endDate] - End date for date range filter
 * @param {string} [params.batchNumber] - Filter by batch number
 * @param {number} [params.page] - Page number for pagination
 * @param {number} [params.limit] - Items per page
 */
export const getIngredientTransactionHistory = async (storeCode, params = {}) => {
  try {
    const url = `/ingredient-inventory/transactions/${storeCode}`;
    const response = await getApi(url, params);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || error.message || 'Failed to fetch ingredient transaction history');
  }
};

/**
 * Get low stock report for ingredients in a store
 * @param {string} storeCode - Store code
 * @param {Object} params - Query parameters
 * @param {string} [params.warehouseId] - Filter by warehouse ID
 */
export const getIngredientLowStockReport = async (storeCode, params = {}) => {
  try {
    const url = `/ingredient-inventory/low-stock/${storeCode}`;
    const response = await getApi(url, params);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || error.message || 'Failed to fetch ingredient low stock report');
  }
};

/**
 * Get expiring ingredients report for a store
 * @param {string} storeCode - Store code
 * @param {Object} params - Query parameters
 * @param {string} [params.warehouseId] - Filter by warehouse ID
 * @param {number} [params.days] - Number of days to check for expiring items (default: 7)
 */
export const getExpiringIngredientsReport = async (storeCode, params = {}) => {
  try {
    const url = `/ingredient-inventory/expiring/${storeCode}`;
    const response = await getApi(url, params);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || error.message || 'Failed to fetch expiring ingredients report');
  }
};
