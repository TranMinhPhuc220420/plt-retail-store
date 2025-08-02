import { deleteApi, getApi, postApi, putApi } from "@/request";

/**
 * Stock In Operation - Receive inventory into warehouse
 * @param {Object} stockInData - { storeCode, productId, warehouseId, quantity, unit, note }
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
 * @param {Object} stockOutData - { storeCode, productId, warehouseId, quantity, unit, note }
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
 * @param {Object} stockTakeData - { storeCode, productId, warehouseId, physicalCount, unit, note }
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
 * Get stock balance for specific product in warehouse
 * @param {string} storeCode - Store code
 * @param {string} productId - Product ID
 * @param {string} warehouseId - Warehouse ID
 */
export const getStockBalance = async (storeCode, productId, warehouseId) => {
  try {
    const response = await getApi(`/inventory/balance/${storeCode}/${productId}/${warehouseId}`);
    return response.data;
  } catch (error) {
    let msgError = error.response?.data?.error;
    throw msgError || 'MSG_GET_STOCK_BALANCE_FAILED';
  }
};

/**
 * Get all stock balances for a store
 * @param {string} storeCode - Store code
 * @param {Object} params - Query parameters
 * @param {string} [params.warehouseId] - Filter by warehouse ID
 */
export const getAllStockBalances = async (storeCode, params = {}) => {
  try {
    const queryParams = new URLSearchParams(params).toString();
    const url = queryParams ? `/inventory/balances/${storeCode}?${queryParams}` : `/inventory/balances/${storeCode}`;
    const response = await getApi(url);
    return response.data;
  } catch (error) {
    let msgError = error.response?.data?.error;
    throw msgError || 'MSG_GET_STOCK_BALANCES_FAILED';
  }
};

/**
 * Get transaction history with filtering and pagination
 * @param {string} storeCode - Store code
 * @param {Object} filters - { productId, warehouseId, type, startDate, endDate, page, limit }
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
 * @param {string} [warehouseId] - Filter by warehouse ID
 */
export const getLowStockReport = async (storeCode, warehouseId = null) => {
  try {
    const params = warehouseId ? { warehouseId } : {};
    const queryParams = new URLSearchParams(params).toString();
    const url = queryParams ? `/inventory/low-stock/${storeCode}?${queryParams}` : `/inventory/low-stock/${storeCode}`;
    const response = await getApi(url);
    return response.data;
  } catch (error) {
    let msgError = error.response?.data?.error;
    throw msgError || 'MSG_GET_LOW_STOCK_REPORT_FAILED';
  }
};
