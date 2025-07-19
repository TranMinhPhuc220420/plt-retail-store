import { get, getApi, post, postApi, put, putApi } from "@/request";
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
    const response = await getApi('/stores/my-stores');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch my stores:', error);
    throw error;
  }
};

export const uploadAvatarStore = async (file) => {
  try {
    const formData = new FormData();
    formData.append('avatar', file);

    const response = await post('/upload/stores', formData, {
      'Content-Type': 'multipart/form-data',
    });

    let imageUrl;
    if (response.data && response.data.url) {
      imageUrl = response.data.url;
    } else {
      throw 'TXT_AVATAR_UPLOAD_FAILED';
    }

    return imageUrl;
  } catch (error) {
    console.error('Failed to upload store avatar:', error);
    throw error;
  }
};

// Create a new store for the user
export const createMyStore = async (storeData) => {
  try {
    const response = await postApi('/stores/my-store', storeData);
    return response.data;
  } catch (error) {
    let message = error.response?.data?.error;
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

export const getMyStoreById = async (id) => {
  try {
    const response = await getApi(`/stores/my-store/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch my store details for ID ${id}:`, error);
    throw error;
  }
};

export const getMyStoreByStoreCode = async (storeCode) => {
  try {
    const response = await getApi(`/stores/my-store-by-store-code/${storeCode}`);
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch my store details for ID ${id}:`, error);
    throw error;
  }
};

// Update a specific store owned by the user
export const updateMyStore = async (storeId, storeData) => {
  try {
    const response = await putApi(`/stores/my-store/${storeId}`, storeData);
    return response.data;
  } catch (error) {
    let message = error.response?.data?.error;
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
    let message = error.response?.data?.error;
    throw message || 'MSG_STORE_CODE_INVALID';
  }
}