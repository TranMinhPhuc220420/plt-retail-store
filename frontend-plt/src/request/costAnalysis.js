import { SERVER_URL } from '@/constant';
import { getAuthToken } from '@/utils/auth';

const API_BASE = SERVER_URL || 'http://localhost:5000';

/**
 * Get cache statistics
 */
export const getCacheStats = async () => {
  const response = await fetch(`${API_BASE}/api/cost-analysis/cache-stats`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getAuthToken()}`
    },
    credentials: 'include'
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch cache statistics');
  }

  return response.json();
};

/**
 * Clear all caches
 */
export const clearAllCaches = async () => {
  const response = await fetch(`${API_BASE}/api/cost-analysis/clear-cache`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getAuthToken()}`
    },
    credentials: 'include'
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to clear caches');
  }

  return response.json();
};

/**
 * Trigger mass cost recalculation
 * @param {Object} params - Recalculation parameters
 */
export const triggerMassRecalculation = async (params = {}) => {
  const response = await fetch(`${API_BASE}/api/cost-analysis/recalculate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getAuthToken()}`
    },
    credentials: 'include',
    body: JSON.stringify(params)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to trigger mass recalculation');
  }

  return response.json();
};

/**
 * Get cost trends
 * @param {Object} params - Query parameters
 */
export const getCostTrends = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  const response = await fetch(`${API_BASE}/api/cost-analysis/trends?${queryString}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getAuthToken()}`
    },
    credentials: 'include'
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch cost trends');
  }

  return response.json();
};

/**
 * Get profitability report
 * @param {string} storeId - Store ID
 */
export const getProfitabilityReport = async (storeId) => {
  const endpoint = storeId 
    ? `${API_BASE}/api/cost-analysis/profitability/${storeId}`
    : `${API_BASE}/api/cost-analysis/profitability`;
    
  const response = await fetch(endpoint, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getAuthToken()}`
    },
    credentials: 'include'
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch profitability report');
  }

  return response.json();
};

/**
 * Get ingredient impact analysis
 * @param {string} ingredientId - Ingredient ID
 */
export const getIngredientImpact = async (ingredientId) => {
  const response = await fetch(`${API_BASE}/api/cost-analysis/ingredient-impact/${ingredientId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getAuthToken()}`
    },
    credentials: 'include'
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch ingredient impact');
  }

  return response.json();
};
