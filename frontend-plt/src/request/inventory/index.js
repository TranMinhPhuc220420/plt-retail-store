import { deleteApi, getApi, postApi, putApi } from "@/request";

/**
 * Stock In Operation - Receive inventory into warehouse
 * @param {Object} stockInData - { storeCode, productId, quantity, unit, note }
 */
export const stockIn = async (stockInData) => {
  try {
    const response = await postApi('/inventory/stock-in', stockInData);
    return response.data;
  } catch (error) {
    let msgError = error.response?.data?.error;
    throw msgError || 'MSG_STOCK_IN_FAILED';
  }
};

/**
 * Stock Out Operation - Issue inventory from warehouse
 * @param {Object} stockOutData - { storeCode, productId, quantity, unit, note }
 */
export const stockOut = async (stockOutData) => {
  try {
    const response = await postApi('/inventory/stock-out', stockOutData);
    return response.data;
  } catch (error) {
    let msgError = error.response?.data?.error;
    throw msgError || 'MSG_STOCK_OUT_FAILED';
  }
};

/**
 * Stock Take Operation - Perform physical inventory count and adjustment
 * @param {Object} stockTakeData - { storeCode, productId, physicalCount, unit, note }
 */
export const stockTake = async (stockTakeData) => {
  try {
    const response = await postApi('/inventory/stock-take', stockTakeData);
    return response.data;
  } catch (error) {
    let msgError = error.response?.data?.error;
    throw msgError || 'MSG_STOCK_TAKE_FAILED';
  }
};

/**
 * Get stock balance for specific product in store
 * @param {string} storeCode - Store code
 * @param {string} productId - Product ID
 */
export const getStockBalance = async (storeCode, productId) => {
  try {
    const response = await getApi(`/inventory/balance/${storeCode}/${productId}`);
    return response.data;
  } catch (error) {
    let msgError = error.response?.data?.error;
    throw msgError || 'MSG_GET_STOCK_BALANCE_FAILED';
  }
};

/**
 * Get all stock balances for a store
 * @param {string} storeCode - Store code
 */
export const getAllStockBalances = async (storeCode) => {
  try {
    const response = await getApi(`/inventory/balances/${storeCode}`);
    return response.data;
  } catch (error) {
    let msgError = error.response?.data?.error;
    throw msgError || 'MSG_GET_STOCK_BALANCES_FAILED';
  }
};

/**
 * Get transaction history with filtering and pagination
 * @param {string} storeCode - Store code
 * @param {Object} filters - { productId, type, startDate, endDate, page, limit }
 */
export const getTransactionHistory = async (storeCode, filters = {}) => {
  try {
    const queryParams = new URLSearchParams();
    
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
        queryParams.append(key, filters[key]);
      }
    });
    
    const queryString = queryParams.toString();
    const url = `/inventory/transactions/${storeCode}${queryString ? `?${queryString}` : ''}`;
    
    const response = await getApi(url);
    return response.data;
  } catch (error) {
    let msgError = error.response?.data?.error;
    throw msgError || 'MSG_GET_TRANSACTION_HISTORY_FAILED';
  }
};

/**
 * Get low stock report for a store
 * @param {string} storeCode - Store code
 */
export const getLowStockReport = async (storeCode) => {
  try {
    const response = await getApi(`/inventory/low-stock/${storeCode}`);
    return response.data;
  } catch (error) {
    let msgError = error.response?.data?.error;
    throw msgError || 'MSG_GET_LOW_STOCK_REPORT_FAILED';
  }
};
