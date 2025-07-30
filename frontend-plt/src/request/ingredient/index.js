import { deleteApi, get, getApi, post, postApi, putApi } from "@/request";

/**
 * Fetch all ingredients with optional filtering by ownerId and storeCode
 * @param {Object} params - Query parameters
 * @param {string} params.ownerId - Owner ID to filter ingredients
 * @param {string} params.storeCode - Store code to filter ingredients
 * @returns {Promise} API response with ingredients array
 */
export const getAllIngredients = async (params = {}) => {
  try {
    const response = await getApi('/ingredients', params);
    return response.data;
  } catch (error) {
    let msgError = error.response?.data?.error;
    throw msgError || 'MSG_ERROR_FETCHING_INGREDIENTS';
  }
};

/**
 * Fetch ingredient details by ID with owner and store verification
 * @param {string} id - Ingredient ID
 * @param {Object} params - Query parameters
 * @param {string} params.ownerId - Owner ID for verification
 * @param {string} params.storeCode - Store code for verification
 * @returns {Promise} API response with ingredient details
 */
export const getIngredientById = async (id, params = {}) => {
  try {
    const response = await getApi(`/ingredients/${id}`, params);
    return response.data;
  } catch (error) {
    let msgError = error.response?.data?.error;
    throw msgError || 'MSG_ERROR_FETCHING_INGREDIENT_DETAILS';
  }
};

/**
 * Fetch ingredients by warehouse ID
 * @param {string} warehouseId - Warehouse ID
 * @param {Object} params - Query parameters
 * @param {string} params.ownerId - Owner ID for verification
 * @param {string} params.storeCode - Store code for verification
 * @returns {Promise} API response with ingredients array
 */
export const getIngredientsByWarehouse = async (warehouseId, params = {}) => {
  try {
    const response = await getApi(`/ingredients/warehouse/${warehouseId}`, params);
    return response.data;
  } catch (error) {
    let msgError = error.response?.data?.error;
    throw msgError || 'MSG_ERROR_FETCHING_WAREHOUSE_INGREDIENTS';
  }
};

/**
 * Create a new ingredient
 * @param {Object} ingredientData - Ingredient data
 * @param {string} ingredientData.name - Ingredient name
 * @param {string} ingredientData.unit - Unit of measurement
 * @param {number} ingredientData.stockQuantity - Stock quantity
 * @param {string} ingredientData.warehouseId - Warehouse ID
 * @param {string} ingredientData.ownerId - Owner ID
 * @param {string} ingredientData.storeCode - Store code
 * @returns {Promise} API response with created ingredient
 */
export const createIngredient = async (ingredientData) => {
  try {
    const response = await postApi('/ingredients', ingredientData);
    return response.data;
  } catch (error) {
    let msgError = error.response?.data?.error;
    throw msgError || 'MSG_INGREDIENT_CREATION_FAILED';
  }
};

/**
 * Update an existing ingredient
 * @param {string} id - Ingredient ID
 * @param {Object} ingredientData - Updated ingredient data
 * @param {Object} params - Query parameters
 * @param {string} params.ownerId - Owner ID for verification
 * @param {string} params.storeCode - Store code for verification
 * @returns {Promise} API response with updated ingredient
 */
export const updateIngredient = async (id, ingredientData, params = {}) => {
  try {
    const response = await putApi(`/ingredients/${id}`, ingredientData, { params });
    return response.data;
  } catch (error) {
    let msgError = error.response?.data?.error;
    throw msgError || 'MSG_INGREDIENT_UPDATE_FAILED';
  }
};

/**
 * Delete an ingredient (soft delete)
 * @param {string} id - Ingredient ID
 * @param {Object} params - Query parameters
 * @param {string} params.ownerId - Owner ID for verification
 * @param {string} params.storeCode - Store code for verification
 * @returns {Promise} API response with deletion confirmation
 */
export const deleteIngredient = async (id, params = {}) => {
  try {
    const response = await deleteApi(`/ingredients/${id}`, { params });
    return response.data;
  } catch (error) {
    let msgError = error.response?.data?.error;
    throw msgError || 'MSG_INGREDIENT_DELETE_FAILED';
  }
};
