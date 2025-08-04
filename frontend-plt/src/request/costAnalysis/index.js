import { getApi, postApi } from '../index';

/**
 * Cost Analysis API Functions
 * Handles all cost analysis and management API calls
 */

/**
 * Get cache statistics and system status
 * @returns {Promise} API response
 */
export const getCacheStats = async () => {
  try {
    const response = await getApi('/cost-analysis/cache-stats');
    return response.data;
  } catch (error) {
    throw error.response?.data?.error || 'Failed to fetch cache statistics';
  }
};

/**
 * Clear all cost calculation caches
 * @returns {Promise} API response
 */
export const clearAllCaches = async () => {
  try {
    const response = await postApi('/cost-analysis/clear-cache');
    return response.data;
  } catch (error) {
    throw error.response?.data?.error || 'Failed to clear caches';
  }
};

/**
 * Trigger mass recalculation of all costs
 * @param {Object} data - Recalculation parameters
 * @returns {Promise} API response
 */
export const triggerMassRecalculation = async (data = {}) => {
  try {
    const response = await postApi('/cost-analysis/recalculate-all', data);
    return response.data;
  } catch (error) {
    throw error.response?.data?.error || 'Failed to trigger mass recalculation';
  }
};

/**
 * Get cost trend analysis for recipe/product
 * @param {string} type - 'recipe' or 'product'
 * @param {string} id - Entity ID
 * @param {Object} params - Query parameters
 * @returns {Promise} API response
 */
export const getCostTrends = async (type, id, params = {}) => {
  try {
    const response = await getApi(`/cost-analysis/cost-trends/${type}/${id}`, params);
    return response.data;
  } catch (error) {
    throw error.response?.data?.error || 'Failed to get cost trends';
  }
};

/**
 * Get comprehensive profitability report for store
 * @param {string} storeId - Store ID
 * @returns {Promise} API response
 */
export const getProfitabilityReport = async (storeId) => {
  try {
    const response = await getApi(`/cost-analysis/profitability-report/${storeId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.error || 'Failed to get profitability report';
  }
};

/**
 * Analyze ingredient impact across all recipes
 * @param {string} ingredientId - Ingredient ID
 * @returns {Promise} API response
 */
export const getIngredientImpact = async (ingredientId) => {
  try {
    const response = await getApi(`/cost-analysis/ingredient-impact/${ingredientId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.error || 'Failed to get ingredient impact analysis';
  }
};
