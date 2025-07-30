import { deleteApi, get, getApi, post, postApi, putApi } from "@/request";

/**
 * Fetch all recipes with optional filtering by ownerId and storeCode
 * @param {Object} params - Query parameters
 * @param {string} params.ownerId - Owner ID to filter recipes
 * @param {string} params.storeCode - Store code to filter recipes
 * @returns {Promise} API response with recipes array
 */
export const getAllRecipes = async (params = {}) => {
  try {
    const response = await getApi('/recipes', params);
    return response.data;
  } catch (error) {
    let msgError = error.response?.data?.error;
    throw msgError || 'MSG_ERROR_FETCHING_RECIPES';
  }
};

/**
 * Fetch recipe details by ID with owner and store verification
 * @param {string} id - Recipe ID
 * @param {Object} params - Query parameters
 * @param {string} params.ownerId - Owner ID for verification
 * @param {string} params.storeCode - Store code for verification
 * @returns {Promise} API response with recipe details
 */
export const getRecipeById = async (id, params = {}) => {
  try {
    const response = await getApi(`/recipes/${id}`, params);
    return response.data;
  } catch (error) {
    let msgError = error.response?.data?.error;
    throw msgError || 'MSG_ERROR_FETCHING_RECIPE_DETAILS';
  }
};

/**
 * Check if a recipe can be prepared based on available ingredients
 * @param {string} id - Recipe ID
 * @param {Object} params - Query parameters
 * @param {string} params.ownerId - Owner ID for verification
 * @param {string} params.storeCode - Store code for verification
 * @returns {Promise} API response with availability information
 */
export const checkRecipeAvailability = async (id, params = {}) => {
  try {
    const response = await getApi(`/recipes/${id}/availability`, params);
    return response.data;
  } catch (error) {
    let msgError = error.response?.data?.error;
    throw msgError || 'MSG_ERROR_CHECKING_RECIPE_AVAILABILITY';
  }
};

/**
 * Create a new recipe
 * @param {Object} recipeData - Recipe data
 * @param {string} recipeData.dishName - Recipe dish name
 * @param {Array} recipeData.ingredients - Array of ingredients with ingredientId, amountUsed, unit
 * @param {string} recipeData.description - Recipe description
 * @param {string} recipeData.ownerId - Owner ID
 * @param {string} recipeData.storeCode - Store code
 * @returns {Promise} API response with created recipe
 */
export const createRecipe = async (recipeData) => {
  try {
    const response = await postApi('/recipes', recipeData);
    return response.data;
  } catch (error) {
    let msgError = error.response?.data?.error;
    throw msgError || 'MSG_RECIPE_CREATION_FAILED';
  }
};

/**
 * Update an existing recipe
 * @param {string} id - Recipe ID
 * @param {Object} recipeData - Updated recipe data
 * @param {Object} params - Query parameters
 * @param {string} params.ownerId - Owner ID for verification
 * @param {string} params.storeCode - Store code for verification
 * @returns {Promise} API response with updated recipe
 */
export const updateRecipe = async (id, recipeData, params = {}) => {
  try {
    const response = await putApi(`/recipes/${id}`, recipeData, { params });
    return response.data;
  } catch (error) {
    let msgError = error.response?.data?.error;
    throw msgError || 'MSG_RECIPE_UPDATE_FAILED';
  }
};

/**
 * Delete a recipe (soft delete)
 * @param {string} id - Recipe ID
 * @param {Object} params - Query parameters
 * @param {string} params.ownerId - Owner ID for verification
 * @param {string} params.storeCode - Store code for verification
 * @returns {Promise} API response with deletion confirmation
 */
export const deleteRecipe = async (id, params = {}) => {
  try {
    const response = await deleteApi(`/recipes/${id}`, { params });
    return response.data;
  } catch (error) {
    let msgError = error.response?.data?.error;
    throw msgError || 'MSG_RECIPE_DELETE_FAILED';
  }
};
