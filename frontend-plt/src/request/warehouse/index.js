import { deleteApi, get, getApi, post, postApi, putApi } from "@/request";

// Fetch all warehouses
export const getAllWarehouses = async () => {
  try {
    const response = await get('/warehouses/all');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch all warehouses:', error);
    throw error;
  }
};

// Fetch warehouse details by ID
export const getWarehouseDetail = async (id) => {
  try {
    const response = await get(`/warehouses/detail/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch warehouse details for ID ${id}:`, error);
    throw error;
  }
};

// Delete a warehouse by ID
export const deleteWarehouse = async (id) => {
  try {
    const response = await post(`/warehouses/delete/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Failed to delete warehouse with ID ${id}:`, error);
    throw error;
  }
};

// Fetch all warehouses owned by the user
export const getMyWarehouses = async (storeCode) => {
  try {
    const response = await getApi(`/warehouses/my-warehouses-stores/${storeCode}`);
    return response.data;
  } catch (error) {
    let msgError = error.response?.data?.error;
    throw msgError || 'MSG_ERROR_FETCHING_WAREHOUSES';
  }
};

// Create a new warehouse for the user
export const createMyWarehouse = async (warehouseData) => {
  try {
    const response = await postApi('/warehouses/my-warehouses-stores', warehouseData);
    return response.data;
  } catch (error) {
    let msgError = error.response?.data?.error;
    throw msgError || 'MSG_WAREHOUSE_CREATION_FAILED';
  }
};

// Fetch details of a specific warehouse owned by the user
export const getMyWarehouseDetail = async (id) => {
  try {
    const response = await getApi(`/warehouses/my-warehouse/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch my warehouse details for ID ${id}:`, error);
    throw error;
  }
};

// Update a specific warehouse owned by the user
export const updateMyWarehouse = async (warehouseId, warehouseData) => {
  try {
    const response = await putApi(`/warehouses/my-warehouses-stores/${warehouseId}`, warehouseData);
    return response.data;
  } catch (error) {
    let msgError = error.response?.data?.error;
    throw msgError || 'TXT_WAREHOUSE_UPDATE_FAILED';
  }
};

// Delete a specific warehouse owned by the user
export const deleteMyWarehouse = async (warehouseId) => {
  try {
    const response = await deleteApi(`/warehouses/my-warehouses-stores/${warehouseId}`);
    return response.data;
  } catch (error) {
    let msgError = error.response?.data?.error;
    throw msgError || 'TXT_WAREHOUSE_UPDATE_FAILED';
  }
};