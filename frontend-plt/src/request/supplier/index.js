import { getApi, postApi, putApi, deleteApi } from '../index';

/**
 * Fetch all suppliers for a specific store
 * @param {string} storeCode - Store code to filter suppliers
 * @returns {Promise} Response with suppliers data
 */
export const getMySuppliers = async (storeCode) => {
  try {
    const response = await getApi(`/suppliers/my-suppliers-stores/${storeCode}`);
    return response.data;
  } catch (error) {
    let msgError = error.response?.data?.error;
    throw msgError || 'MSG_ERROR_FETCHING_SUPPLIERS';
  }
};

/**
 * Fetch supplier details by ID
 * @param {string} supplierId - Supplier ID
 * @returns {Promise} Response with supplier data
 */
export const getSupplierById = async (supplierId) => {
  try {
    const response = await getApi(`/suppliers/my-suppliers/${supplierId}`);
    return response.data;
  } catch (error) {
    let msgError = error.response?.data?.error;
    throw msgError || 'MSG_ERROR_FETCHING_SUPPLIER';
  }
};

/**
 * Create a new supplier
 * @param {Object} supplierData - Supplier data
 * @returns {Promise} Response with created supplier
 */
export const createMySupplier = async (supplierData) => {
  try {
    const response = await postApi('/suppliers/my-suppliers-stores', supplierData);
    return response.data;
  } catch (error) {
    let msgError = error.response?.data?.error;
    throw msgError || 'MSG_SUPPLIER_CREATION_FAILED';
  }
};

/**
 * Create multiple suppliers in bulk
 * @param {string} storeCode - Store code
 * @param {Array} suppliers - Array of supplier data
 * @returns {Promise} Response with created suppliers
 */
export const createMySuppliersInBulk = async (storeCode, suppliers) => {
  try {
    const response = await postApi('/suppliers/my-suppliers-stores-bulk', {
      storeCode,
      suppliers
    });
    return response.data;
  } catch (error) {
    let msgError = error.response?.data?.error;
    throw msgError || 'MSG_SUPPLIERS_CREATION_FAILED';
  }
};

/**
 * Update supplier information
 * @param {string} supplierId - Supplier ID
 * @param {Object} supplierData - Updated supplier data
 * @returns {Promise} Response with updated supplier
 */
export const updateMySupplier = async (supplierId, supplierData) => {
  try {
    const response = await putApi(`/suppliers/my-suppliers-stores/${supplierId}`, supplierData);
    return response.data;
  } catch (error) {
    let msgError = error.response?.data?.error;
    throw msgError || 'MSG_SUPPLIER_UPDATE_FAILED';
  }
};

/**
 * Delete a supplier (soft delete)
 * @param {string} supplierId - Supplier ID
 * @returns {Promise} Response confirmation
 */
export const deleteMySupplier = async (supplierId) => {
  try {
    const response = await deleteApi(`/suppliers/my-suppliers-stores/${supplierId}`);
    return response.data;
  } catch (error) {
    let msgError = error.response?.data?.error;
    throw msgError || 'MSG_SUPPLIER_DELETE_FAILED';
  }
};

/**
 * Delete multiple suppliers in bulk (soft delete)
 * @param {Array} supplierIds - Array of supplier IDs
 * @returns {Promise} Response confirmation
 */
export const deleteMySuppliersInBulk = async (supplierIds) => {
  try {
    const response = await deleteApi('/suppliers/my-suppliers-stores-bulk', {
      supplierIds
    });
    return response.data;
  } catch (error) {
    let msgError = error.response?.data?.error;
    throw msgError || 'MSG_SUPPLIERS_DELETE_FAILED';
  }
};

/**
 * Get supplier performance metrics
 * @param {string} supplierId - Supplier ID
 * @returns {Promise} Response with performance data
 */
export const getSupplierPerformance = async (supplierId) => {
  try {
    const response = await getApi(`/suppliers/my-suppliers/${supplierId}/performance`);
    return response.data;
  } catch (error) {
    let msgError = error.response?.data?.error;
    throw msgError || 'MSG_ERROR_FETCHING_PERFORMANCE';
  }
};

/**
 * Update supplier performance metrics (internal use)
 * @param {string} supplierId - Supplier ID
 * @param {Object} performanceData - Performance data
 * @returns {Promise} Response with updated performance
 */
export const updateSupplierPerformance = async (supplierId, performanceData) => {
  try {
    const response = await putApi(`/suppliers/my-suppliers/${supplierId}/performance`, {
      performance: performanceData
    });
    return response.data;
  } catch (error) {
    let msgError = error.response?.data?.error;
    throw msgError || 'MSG_PERFORMANCE_UPDATE_FAILED';
  }
};
