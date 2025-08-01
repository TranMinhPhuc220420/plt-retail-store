import { create } from 'zustand';
import moment from 'moment';
import { DATE_FORMAT, DATETIME_FORMAT } from '@/constant';
import { 
  ingredientStockIn, 
  ingredientStockOut, 
  ingredientStockTake, 
  getIngredientStockBalance,
  getAllIngredientStockBalances,
  getIngredientTransactionHistory,
  getIngredientLowStockReport,
  getExpiringIngredientsReport
} from '@/request/ingredientInventory';

const useIngredientInventoryStore = create((set, get) => ({
  // Loading states
  isLoading: false,
  isLoadingBalance: false,
  isLoadingTransactions: false,
  isLoadingReport: false,
  isLoadingExpiringReport: false,
  
  // Error and success states
  error: null,
  success: null,
  
  // Data states
  stockBalances: [],
  currentBalance: null,
  transactions: [],
  transactionPagination: {
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    limit: 50
  },
  lowStockReport: {
    lowStockItems: [],
    totalLowStockItems: 0,
    storeInfo: null
  },
  expiringReport: {
    expiringItems: [],
    expiredItems: [],
    totalExpiringItems: 0,
    totalExpiredItems: 0,
    storeInfo: null
  },
  
  // Action states
  isStockingIn: false,
  isStockingOut: false,
  isPerformingStockTake: false,
  
  // Setters for loading states
  setIsLoading: (isLoading) => set({ isLoading }),
  setIsLoadingBalance: (isLoadingBalance) => set({ isLoadingBalance }),
  setIsLoadingTransactions: (isLoadingTransactions) => set({ isLoadingTransactions }),
  setIsLoadingReport: (isLoadingReport) => set({ isLoadingReport }),
  setIsLoadingExpiringReport: (isLoadingExpiringReport) => set({ isLoadingExpiringReport }),
  setError: (error) => set({ error }),
  setSuccess: (success) => set({ success }),
  
  /**
   * Ingredient Stock In Operation
   */
  performIngredientStockIn: async (stockInData) => {
    set({ isStockingIn: true, error: null, success: null });
    try {
      const result = await ingredientStockIn(stockInData);
      
      // Update the stock balances if they are loaded
      const { stockBalances } = get();
      if (stockBalances.length > 0) {
        const updatedBalances = stockBalances.map(balance => {
          if (balance.ingredientId._id === stockInData.ingredientId && 
              balance.warehouseId._id === stockInData.warehouseId) {
            return {
              ...balance,
              quantity: result.balance.quantity,
              lastTransactionDate: result.balance.lastTransactionDate
            };
          }
          return balance;
        });
        set({ stockBalances: updatedBalances });
      }
      
      set({ 
        isStockingIn: false, 
        success: 'Ingredient stock in operation completed successfully',
        error: null 
      });
      
      return result;
    } catch (error) {
      set({ 
        isStockingIn: false, 
        error: error.message || 'Ingredient stock in operation failed',
        success: null 
      });
      throw error;
    }
  },
  
  /**
   * Ingredient Stock Out Operation
   */
  performIngredientStockOut: async (stockOutData) => {
    set({ isStockingOut: true, error: null, success: null });
    try {
      const result = await ingredientStockOut(stockOutData);
      
      // Update the stock balances if they are loaded
      const { stockBalances } = get();
      if (stockBalances.length > 0) {
        const updatedBalances = stockBalances.map(balance => {
          if (balance.ingredientId._id === stockOutData.ingredientId && 
              balance.warehouseId._id === stockOutData.warehouseId) {
            return {
              ...balance,
              quantity: result.balance.quantity,
              lastTransactionDate: result.balance.lastTransactionDate
            };
          }
          return balance;
        });
        set({ stockBalances: updatedBalances });
      }
      
      set({ 
        isStockingOut: false, 
        success: 'Ingredient stock out operation completed successfully',
        error: null 
      });
      
      return result;
    } catch (error) {
      set({ 
        isStockingOut: false, 
        error: error.message || 'Ingredient stock out operation failed',
        success: null 
      });
      throw error;
    }
  },
  
  /**
   * Ingredient Stock Take Operation
   */
  performIngredientStockTake: async (stockTakeData) => {
    set({ isPerformingStockTake: true, error: null, success: null });
    try {
      const result = await ingredientStockTake(stockTakeData);
      
      // Update the stock balances if they are loaded
      const { stockBalances } = get();
      if (stockBalances.length > 0) {
        const updatedBalances = stockBalances.map(balance => {
          if (balance.ingredientId._id === stockTakeData.ingredientId && 
              balance.warehouseId._id === stockTakeData.warehouseId) {
            return {
              ...balance,
              quantity: result.balance.quantity,
              lastTransactionDate: result.balance.lastTransactionDate
            };
          }
          return balance;
        });
        set({ stockBalances: updatedBalances });
      }
      
      set({ 
        isPerformingStockTake: false, 
        success: 'Ingredient stock take completed successfully',
        error: null 
      });
      
      return result;
    } catch (error) {
      set({ 
        isPerformingStockTake: false, 
        error: error.message || 'Ingredient stock take failed',
        success: null 
      });
      throw error;
    }
  },
  
  /**
   * Get ingredient stock balance for specific ingredient and warehouse
   */
  fetchIngredientStockBalance: async (storeCode, ingredientId, warehouseId) => {
    set({ isLoadingBalance: true, error: null });
    try {
      const balance = await getIngredientStockBalance(storeCode, ingredientId, warehouseId);
      set({ 
        currentBalance: balance,
        isLoadingBalance: false,
        error: null 
      });
      return balance;
    } catch (error) {
      set({ 
        isLoadingBalance: false, 
        error: error.message || 'Failed to fetch ingredient stock balance',
        currentBalance: null
      });
      throw error;
    }
  },
  
  /**
   * Get all ingredient stock balances for a store
   */
  fetchAllIngredientStockBalances: async (storeCode, params = {}) => {
    set({ isLoadingBalance: true, error: null });
    try {
      const result = await getAllIngredientStockBalances(storeCode, params);
      set({ 
        stockBalances: result.balances || [],
        isLoadingBalance: false,
        error: null 
      });
      return result;
    } catch (error) {
      set({ 
        isLoadingBalance: false, 
        error: error.message || 'Failed to fetch ingredient stock balances',
        stockBalances: []
      });
      throw error;
    }
  },
  
  /**
   * Get ingredient transaction history
   */
  fetchIngredientTransactionHistory: async (storeCode, params = {}) => {
    set({ isLoadingTransactions: true, error: null });
    try {
      const result = await getIngredientTransactionHistory(storeCode, params);
      set({ 
        transactions: result.transactions || [],
        transactionPagination: {
          currentPage: result.pagination?.currentPage || 1,
          totalPages: result.pagination?.totalPages || 1,
          totalCount: result.pagination?.totalCount || 0,
          limit: result.pagination?.limit || 50
        },
        isLoadingTransactions: false,
        error: null 
      });
      return result;
    } catch (error) {
      set({ 
        isLoadingTransactions: false, 
        error: error.message || 'Failed to fetch ingredient transaction history',
        transactions: []
      });
      throw error;
    }
  },
  
  /**
   * Get ingredient low stock report
   */
  fetchIngredientLowStockReport: async (storeCode, warehouseId = null) => {
    set({ isLoadingReport: true, error: null });
    try {
      const params = warehouseId ? { warehouseId } : {};
      const result = await getIngredientLowStockReport(storeCode, params);
      set({ 
        lowStockReport: {
          lowStockItems: result.lowStockItems || [],
          totalLowStockItems: result.totalLowStockItems || 0,
          storeInfo: result.storeInfo || null
        },
        isLoadingReport: false,
        error: null 
      });
      return result;
    } catch (error) {
      set({ 
        isLoadingReport: false, 
        error: error.message || 'Failed to fetch ingredient low stock report',
        lowStockReport: {
          lowStockItems: [],
          totalLowStockItems: 0,
          storeInfo: null
        }
      });
      throw error;
    }
  },
  
  /**
   * Get expiring ingredients report
   */
  fetchExpiringIngredientsReport: async (storeCode, params = {}) => {
    set({ isLoadingExpiringReport: true, error: null });
    try {
      const result = await getExpiringIngredientsReport(storeCode, params);
      set({ 
        expiringReport: {
          expiringItems: result.expiringItems || [],
          expiredItems: result.expiredItems || [],
          totalExpiringItems: result.totalExpiringItems || 0,
          totalExpiredItems: result.totalExpiredItems || 0,
          storeInfo: result.storeInfo || null
        },
        isLoadingExpiringReport: false,
        error: null 
      });
      return result;
    } catch (error) {
      set({ 
        isLoadingExpiringReport: false, 
        error: error.message || 'Failed to fetch expiring ingredients report',
        expiringReport: {
          expiringItems: [],
          expiredItems: [],
          totalExpiringItems: 0,
          totalExpiredItems: 0,
          storeInfo: null
        }
      });
      throw error;
    }
  },
  
  /**
   * Clear all data
   */
  clearData: () => set({
    stockBalances: [],
    currentBalance: null,
    transactions: [],
    transactionPagination: {
      currentPage: 1,
      totalPages: 1,
      totalCount: 0,
      limit: 50
    },
    lowStockReport: {
      lowStockItems: [],
      totalLowStockItems: 0,
      storeInfo: null
    },
    expiringReport: {
      expiringItems: [],
      expiredItems: [],
      totalExpiringItems: 0,
      totalExpiredItems: 0,
      storeInfo: null
    },
    error: null,
    success: null
  }),
  
  /**
   * Clear error and success messages
   */
  clearMessages: () => set({ error: null, success: null })
}));

export default useIngredientInventoryStore;
