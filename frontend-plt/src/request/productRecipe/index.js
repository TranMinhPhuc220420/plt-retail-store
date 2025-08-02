import { deleteApi, getApi, postApi, putApi } from "@/request";

/**
 * Link a recipe to a product
 * @param {string} productId - Product ID
 * @param {string} recipeId - Recipe ID
 * @param {Object} data - Additional data like setAsDefault
 * @param {Object} params - Query parameters
 * @returns {Promise} API response
 */
export const linkRecipeToProduct = async (productId, recipeId, data = {}, params = {}) => {
  try {
    const response = await postApi(`/products/${productId}/recipes/${recipeId}`, data, params);
    return response.data;
  } catch (error) {
    let msgError = error.response?.data?.error;
    throw msgError || 'MSG_FAILED_TO_LINK_RECIPE';
  }
};

/**
 * Unlink a recipe from a product
 * @param {string} productId - Product ID
 * @param {string} recipeId - Recipe ID
 * @param {Object} params - Query parameters
 * @returns {Promise} API response
 */
export const unlinkRecipeFromProduct = async (productId, recipeId, params = {}) => {
  try {
    const response = await deleteApi(`/products/${productId}/recipes/${recipeId}`, { params });
    return response.data;
  } catch (error) {
    let msgError = error.response?.data?.error;
    throw msgError || 'MSG_FAILED_TO_UNLINK_RECIPE';
  }
};

/**
 * Set default recipe for a product
 * @param {string} productId - Product ID
 * @param {string} recipeId - Recipe ID
 * @param {Object} params - Query parameters
 * @returns {Promise} API response
 */
export const setDefaultRecipe = async (productId, recipeId, params = {}) => {
  try {
    const response = await putApi(`/products/${productId}/default-recipe/${recipeId}`, {}, params);
    return response.data;
  } catch (error) {
    let msgError = error.response?.data?.error;
    throw msgError || 'MSG_FAILED_TO_SET_DEFAULT_RECIPE';
  }
};

/**
 * Get product with its linked recipes
 * @param {string} productId - Product ID
 * @param {Object} params - Query parameters
 * @returns {Promise} API response
 */
export const getProductWithRecipes = async (productId, params = {}) => {
  try {
    const response = await getApi(`/products/${productId}/recipes`, params);
    return response.data;
  } catch (error) {
    let msgError = error.response?.data?.error;
    throw msgError || 'MSG_FAILED_TO_FETCH_PRODUCT_RECIPES';
  }
};

/**
 * Link a product to a recipe
 * @param {string} recipeId - Recipe ID
 * @param {string} productId - Product ID
 * @param {Object} params - Query parameters
 * @returns {Promise} API response
 */
export const linkProductToRecipe = async (recipeId, productId, params = {}) => {
  try {
    const response = await postApi(`/recipes/${recipeId}/products/${productId}`, {}, params);
    return response.data;
  } catch (error) {
    let msgError = error.response?.data?.error;
    throw msgError || 'MSG_FAILED_TO_LINK_PRODUCT';
  }
};

/**
 * Unlink a product from a recipe
 * @param {string} recipeId - Recipe ID
 * @param {string} productId - Product ID
 * @param {Object} params - Query parameters
 * @returns {Promise} API response
 */
export const unlinkProductFromRecipe = async (recipeId, productId, params = {}) => {
  try {
    const response = await deleteApi(`/recipes/${recipeId}/products/${productId}`, { params });
    return response.data;
  } catch (error) {
    let msgError = error.response?.data?.error;
    throw msgError || 'MSG_FAILED_TO_UNLINK_PRODUCT';
  }
};

/**
 * Get recipe with its linked products
 * @param {string} recipeId - Recipe ID
 * @param {Object} params - Query parameters
 * @returns {Promise} API response
 */
export const getRecipeWithProducts = async (recipeId, params = {}) => {
  try {
    const response = await getApi(`/recipes/${recipeId}/products`, params);
    return response.data;
  } catch (error) {
    let msgError = error.response?.data?.error;
    throw msgError || 'MSG_FAILED_TO_FETCH_RECIPE_PRODUCTS';
  }
};

/**
 * Calculate product cost based on recipe
 * @param {string} productId - Product ID
 * @param {Object} params - Query parameters including recipeId
 * @returns {Promise} API response
 */
export const calculateProductCost = async (productId, params = {}) => {
  try {
    const response = await getApi(`/products/${productId}/cost-calculation`, params);
    return response.data;
  } catch (error) {
    let msgError = error.response?.data?.error;
    throw msgError || 'MSG_FAILED_TO_CALCULATE_COST';
  }
};

/**
 * Get detailed cost breakdown for a product
 * @param {string} productId - Product ID
 * @param {Object} params - Query parameters
 * @returns {Promise} API response
 */
export const getCostBreakdown = async (productId, params = {}) => {
  try {
    const response = await getApi(`/products/${productId}/cost-breakdown`, params);
    return response.data;
  } catch (error) {
    let msgError = error.response?.data?.error;
    throw msgError || 'MSG_FAILED_TO_GET_COST_BREAKDOWN';
  }
};

/**
 * Update product pricing based on calculated costs
 * @param {string} productId - Product ID
 * @param {Object} data - Pricing update options
 * @param {Object} params - Query parameters
 * @returns {Promise} API response
 */
export const updateProductPricing = async (productId, data, params = {}) => {
  try {
    const response = await putApi(`/products/${productId}/update-pricing`, data, params);
    return response.data;
  } catch (error) {
    let msgError = error.response?.data?.error;
    throw msgError || 'MSG_FAILED_TO_UPDATE_PRICING';
  }
};

/**
 * Calculate recipe cost
 * @param {string} recipeId - Recipe ID
 * @param {Object} params - Query parameters
 * @returns {Promise} API response
 */
export const calculateRecipeCost = async (recipeId, params = {}) => {
  try {
    const response = await getApi(`/recipes/${recipeId}/cost-calculation`, params);
    return response.data;
  } catch (error) {
    let msgError = error.response?.data?.error;
    throw msgError || 'MSG_FAILED_TO_CALCULATE_RECIPE_COST';
  }
};

/**
 * Update recipe cost calculation
 * @param {string} recipeId - Recipe ID
 * @param {Object} params - Query parameters
 * @returns {Promise} API response
 */
export const updateRecipeCostCalculation = async (recipeId, params = {}) => {
  try {
    const response = await putApi(`/recipes/${recipeId}/update-cost`, {}, params);
    return response.data;
  } catch (error) {
    let msgError = error.response?.data?.error;
    throw msgError || 'MSG_FAILED_TO_UPDATE_RECIPE_COST';
  }
};

/**
 * Get all recipes with cost information
 * @param {Object} params - Query parameters
 * @returns {Promise} API response
 */
export const getRecipesWithCosts = async (params = {}) => {
  try {
    const response = await getApi('/recipes/with-costs', params);
    return response.data;
  } catch (error) {
    let msgError = error.response?.data?.error;
    throw msgError || 'MSG_FAILED_TO_FETCH_RECIPES_WITH_COSTS';
  }
};

/**
 * Check production feasibility for a product
 * @param {string} productId - Product ID
 * @param {Object} params - Query parameters including quantity and recipeId
 * @returns {Promise} API response
 */
export const checkProductionFeasibility = async (productId, params = {}) => {
  try {
    const response = await getApi(`/products/${productId}/production-feasibility`, params);
    return response.data;
  } catch (error) {
    let msgError = error.response?.data?.error;
    throw msgError || 'MSG_FAILED_TO_CHECK_FEASIBILITY';
  }
};

/**
 * Create production for a product
 * @param {string} productId - Product ID
 * @param {Object} data - Production data
 * @param {Object} params - Query parameters
 * @returns {Promise} API response
 */
export const createProduction = async (productId, data, params = {}) => {
  try {
    const response = await postApi(`/products/${productId}/production`, data, params);
    return response.data;
  } catch (error) {
    let msgError = error.response?.data?.error;
    throw msgError || 'MSG_FAILED_TO_CREATE_PRODUCTION';
  }
};
