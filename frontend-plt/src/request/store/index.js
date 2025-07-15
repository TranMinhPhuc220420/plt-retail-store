import { get, post } from "@/request";
import { storeCodeIsValid } from "@/utils";

// Fetch all stores
export const getAllStores = async () => {
  try {
    const response = await get('/stores/all');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch all stores:', error);
    throw error;
  }
};

// Fetch store details by ID
export const getStoreDetail = async (id) => {
  try {
    const response = await get(`/stores/detail/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch store details for ID ${id}:`, error);
    throw error;
  }
};

// Delete a store by ID
export const deleteStore = async (id) => {
  try {
    const response = await post(`/stores/delete/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Failed to delete store with ID ${id}:`, error);
    throw error;
  }
};

// Fetch all stores owned by the user
export const getMyStores = async () => {
  try {
    const response = await get('/stores/my-stores');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch my stores:', error);
    throw error;
  }
};

// Create a new store for the user
export const createMyStore = async (storeData) => {
  try {
    const response = await post('/stores/my-store', storeData, {
      'Content-Type': 'multipart/form-data',
    });
    return response.data;
  } catch (error) {
    let message = error.response?.data?.message;
    throw message || 'TXT_STORE_CREATION_FAILED';
  }
};

// Fetch details of a specific store owned by the user
export const getMyStoreDetail = async (id) => {
  try {
    const response = await get(`/stores/my-store/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch my store details for ID ${id}:`, error);
    throw error;
  }
};

export const getMyStoreByStoreCode = async (storeCode) => {
  try {
    const response = await get(`/stores/my-store-by-code`, { storeCode });
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch my store details for ID ${id}:`, error);
    throw error;
  }
};

// Update a specific store owned by the user
export const updateMyStore = async (id, storeData) => {
  try {
    const response = await post(`/stores/update-my-store/${id}`, storeData, {
      'Content-Type': 'multipart/form-data',
    });
    return response.data;
  } catch (error) {
    let message = error.response?.data?.message;
    throw message || 'TXT_STORE_UPDATE_FAILED';
  }
};

// Delete a specific store owned by the user
export const deleteMyStore = async (id) => {
  try {
    const response = await post(`/stores/delete-my-store/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Failed to delete my store with ID ${id}:`, error);
    throw error;
  }
};

export const validateStoreCode = async (storeCode) => {
  try {
    
    await storeCodeIsValid(storeCode);

    const response = await post('/stores/validate-store-code', { storeCode });
    return response.data;
  } catch (error) {
    let message = error.response?.data?.message;
    throw message || 'MSG_STORE_CODE_INVALID';
  }
}