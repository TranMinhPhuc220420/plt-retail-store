import { create } from 'zustand';
import {
  getCacheStats,
  clearAllCaches,
  triggerMassRecalculation,
  getCostTrends,
  getProfitabilityReport,
  getIngredientImpact
} from '@/request/costAnalysis';

const useCostAnalysisStore = create((set, get) => ({
  // Loading states
  isLoading: false,
  isCacheClearing: false,
  isRecalculating: false,
  error: null,
  success: null,

  // Data
  cacheStats: null,
  profitabilityReport: null,
  costTrends: {},
  ingredientImpacts: {},

  // Real-time data
  lastUpdate: null,
  queueStatus: {
    isProcessing: false,
    queueLength: 0,
    connectedClients: 0
  },

  /**
   * Fetch cache statistics
   */
  fetchCacheStats: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await getCacheStats();
      set({ 
        cacheStats: data,
        queueStatus: data.updateQueue || {},
        isLoading: false,
        success: 'Cache statistics loaded successfully'
      });
      return data;
    } catch (error) {
      if (error.status === 401) {
        window.location.href = '/dang-nhap';
        return;
      }
      set({ 
        isLoading: false, 
        error: error.message || 'Failed to load cache statistics'
      });
      throw error;
    }
  },

  /**
   * Clear all caches
   */
  clearCaches: async () => {
    set({ isCacheClearing: true, error: null });
    try {
      const data = await clearAllCaches();
      set({ 
        isCacheClearing: false,
        success: 'All caches cleared successfully'
      });
      
      // Refresh cache stats after clearing
      setTimeout(() => {
        get().fetchCacheStats();
      }, 1000);
      
      return data;
    } catch (error) {
      if (error.status === 401) {
        window.location.href = '/dang-nhap';
        return;
      }
      set({ 
        isCacheClearing: false, 
        error: error.message || 'Failed to clear caches'
      });
      throw error;
    }
  },

  /**
   * Trigger mass cost recalculation
   * @param {Object} params - Recalculation parameters
   */
  massRecalculate: async (params = {}) => {
    set({ isRecalculating: true, error: null });
    try {
      const data = await triggerMassRecalculation(params);
      set({ 
        isRecalculating: false,
        success: `Mass recalculation initiated: ${data.totalTasks} tasks queued`
      });
      
      // Refresh stats periodically during recalculation
      const checkInterval = setInterval(() => {
        get().fetchCacheStats().then(() => {
          const { queueStatus } = get();
          if (!queueStatus.isProcessing && queueStatus.queueLength === 0) {
            clearInterval(checkInterval);
          }
        });
      }, 3000);
      
      return data;
    } catch (error) {
      if (error.status === 401) {
        window.location.href = '/dang-nhap';
        return;
      }
      set({ 
        isRecalculating: false, 
        error: error.message || 'Failed to trigger mass recalculation'
      });
      throw error;
    }
  },

  /**
   * Fetch profitability report
   * @param {string} storeId - Store ID
   */
  fetchProfitabilityReport: async (storeId) => {
    set({ isLoading: true, error: null });
    try {
      const data = await getProfitabilityReport(storeId);
      set({ 
        profitabilityReport: data,
        isLoading: false,
        success: 'Profitability report loaded successfully'
      });
      return data;
    } catch (error) {
      if (error.status === 401) {
        window.location.href = '/dang-nhap';
        return;
      }
      set({ 
        isLoading: false, 
        error: error.message || 'Failed to load profitability report'
      });
      throw error;
    }
  },

  /**
   * Fetch cost trends for entity
   * @param {string} type - 'recipe' or 'product'
   * @param {string} id - Entity ID
   * @param {Object} params - Query parameters
   */
  fetchCostTrends: async (type, id, params = {}) => {
    set({ isLoading: true, error: null });
    try {
      const data = await getCostTrends(type, id, params);
      const trendKey = `${type}_${id}`;
      set(state => ({ 
        costTrends: {
          ...state.costTrends,
          [trendKey]: data
        },
        isLoading: false,
        success: 'Cost trends loaded successfully'
      }));
      return data;
    } catch (error) {
      if (error.status === 401) {
        window.location.href = '/dang-nhap';
        return;
      }
      set({ 
        isLoading: false, 
        error: error.message || 'Failed to load cost trends'
      });
      throw error;
    }
  },

  /**
   * Fetch ingredient impact analysis
   * @param {string} ingredientId - Ingredient ID
   */
  fetchIngredientImpact: async (ingredientId) => {
    set({ isLoading: true, error: null });
    try {
      const data = await getIngredientImpact(ingredientId);
      set(state => ({ 
        ingredientImpacts: {
          ...state.ingredientImpacts,
          [ingredientId]: data
        },
        isLoading: false,
        success: 'Ingredient impact analysis loaded successfully'
      }));
      return data;
    } catch (error) {
      if (error.status === 401) {
        window.location.href = '/dang-nhap';
        return;
      }
      set({ 
        isLoading: false, 
        error: error.message || 'Failed to load ingredient impact analysis'
      });
      throw error;
    }
  },

  /**
   * Update real-time data from WebSocket
   * @param {Object} updateData - Real-time update data
   */
  updateRealTimeData: (updateData) => {
    set(state => ({
      lastUpdate: updateData,
      // Update queue status if provided
      queueStatus: updateData.queueStatus || state.queueStatus
    }));
  },

  /**
   * Clear all error and success messages
   */
  clearMessages: () => {
    set({ error: null, success: null });
  },

  /**
   * Clear specific data
   */
  clearData: () => {
    set({
      cacheStats: null,
      profitabilityReport: null,
      costTrends: {},
      ingredientImpacts: {},
      lastUpdate: null
    });
  }
}));

export default useCostAnalysisStore;
