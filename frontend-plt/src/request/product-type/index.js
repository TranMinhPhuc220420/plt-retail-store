import { deleteApi, get, getApi, post, postApi, putApi } from "@/request";

import { PRODUCT_TYPE_TEMP_FILE } from "@/constant";

// Fetch all product types
export const getAllProductTypes = async () => {
  try {
    const response = await get('/product-types/all');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch all product types:', error);
    throw error;
  }
};

// Fetch product type details by ID
export const getProductTypeDetail = async (id) => {
  try {
    const response = await get(`/product-types/detail/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch product type details for ID ${id}:`, error);
    throw error;
  }
};

// Delete a product type by ID
export const deleteProductType = async (id) => {
  try {
    const response = await post(`/product-types/delete/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Failed to delete product type with ID ${id}:`, error);
    throw error;
  }
};

// Fetch all product types owned by the user
export const getMyProductTypes = async (storeCode) => {
  try {
    const response = await getApi(`/product-categories/my-categories-stores/${storeCode}`);
    return response.data;
  } catch (error) {
    let message = error.response?.data?.error;
    throw message || 'MSG_ERROR_FETCHING_PRODUCT_TYPES';
  }
};

// Create a new product type for the user
export const createMyProductType = async (productTypeData) => {
  try {
    const response = await postApi('/product-categories/my-categories-stores', productTypeData);
    return response.data;
  } catch (error) {
    let message = error.response?.data?.error;
    throw message || 'MSG_PRODUCT_TYPE_CREATION_FAILED';
  }
};

// Create multiple product types from an Excel file
export const createMyProductTypeTypeBulk = async (storeCode, productTypesData) => {
  try {
    const response = await postApi('/product-categories/my-categories-stores-bulk', { storeCode, categories: productTypesData });
    return response.data;
  } catch (error) {
    let message = error.response?.data?.error;
    throw message || 'MSG_PRODUCT_TYPE_CREATION_FAILED';
  }
};

// Fetch details of a specific product type owned by the user
export const getMyProductTypeDetail = async (id) => {
  try {
    const response = await get(`/product-types/my-product-type/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch my product type details for ID ${id}:`, error);
    throw error;
  }
};

// Update a specific product type owned by the user
export const updateMyProductType = async (productTypeId, productTypeData) => {
  try {
    const response = await putApi(`/product-categories/my-categories-stores/${productTypeId}`, productTypeData);
    return response.data;
  } catch (error) {
    let message = error.response?.data?.error;
    throw message || 'TXT_PRODUCT_TYPE_UPDATE_FAILED';
  }
};

// Delete a specific product type owned by the user
export const deleteMyProductType = async (productTypeId) => {
  try {
    const response = await deleteApi(`/product-categories/my-categories-stores/${productTypeId}`);
    return response.data;
  } catch (error) {
    let message = error.response?.data?.error;
    throw message || 'TXT_PRODUCT_TYPE_UPDATE_FAILED';
  }
};

export const deleteMyProductTypeBulk = async (ids) => {
  try {
    const response = await deleteApi(`/product-categories/my-categories-stores-bulk`, { ids });
    return response.data;
  } catch (error) {
    let message = error.response?.data?.error;
    throw message || 'TXT_PRODUCT_TYPE_UPDATE_FAILED';
  }
};

export const downloadFileTemplateProductType = async () => {
  window.open(PRODUCT_TYPE_TEMP_FILE, '_blank');
}