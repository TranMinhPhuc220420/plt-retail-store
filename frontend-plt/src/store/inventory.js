import { create } from 'zustand';
import moment from 'moment';
import { DATE_FORMAT, DATETIME_FORMAT } from '@/constant';
import { 
  stockIn, 
  stockOut, 
  stockTake, 
  getStockBalance,
  getAllStockBalances,
  getTransactionHistory,
  getLowStockReport
} from '@/request/inventory';

const useInventoryStore = create((set, get) => ({
  // Loading states
  isLoading: false,
  isLoadingBalance: false,
  isLoadingTransactions: false,
  isLoadingReport: false,
  
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
  
  // Action states
  isStockingIn: false,
  isStockingOut: false,
  isPerformingStockTake: false,
  
  // Setters for loading states
  setIsLoading: (isLoading) => set({ isLoading }),
  setIsLoadingBalance: (isLoadingBalance) => set({ isLoadingBalance }),
  setIsLoadingTransactions: (isLoadingTransactions) => set({ isLoadingTransactions }),
  setIsLoadingReport: (isLoadingReport) => set({ isLoadingReport }),
  setError: (error) => set({ error }),
  setSuccess: (success) => set({ success }),
  
  /**
   * Stock In Operation
   */
  performStockIn: async (stockInData) => {
    set({ isStockingIn: true, error: null, success: null });
    try {
      const result = await stockIn(stockInData);
      
      // Update the stock balances if they are loaded
      const { stockBalances } = get();
      if (stockBalances.length > 0) {
        const updatedBalances = stockBalances.map(balance => {
          if (balance.productId._id === stockInData.productId) {
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
        success: 'Stock in operation completed successfully',
        error: null 
      });
      
      return result;
    } catch (error) {
      set({ 
        isStockingIn: false, 
        error: error.message || 'Stock in operation failed',
        success: null 
      });
      throw error;
    }
  },
  
  /**
   * Stock Out Operation
   */
  performStockOut: async (stockOutData) => {
    set({ isStockingOut: true, error: null, success: null });
    try {
      const result = await stockOut(stockOutData);
      
      // Update the stock balances if they are loaded
      const { stockBalances } = get();
      if (stockBalances.length > 0) {
        const updatedBalances = stockBalances.map(balance => {
          if (balance.productId._id === stockOutData.productId) {
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
        success: 'Stock out operation completed successfully',
        error: null 
      });
      
      return result;
    } catch (error) {
      set({ 
        isStockingOut: false, 
        error: error.message || 'Stock out operation failed',
        success: null 
      });
      throw error;
    }
  },
  
  /**
   * Stock Take Operation
   */
  performStockTake: async (stockTakeData) => {
    set({ isPerformingStockTake: true, error: null, success: null });
    try {
      const result = await stockTake(stockTakeData);
      
      // Update the stock balances if they are loaded
      const { stockBalances } = get();
      if (stockBalances.length > 0) {
        const updatedBalances = stockBalances.map(balance => {
          if (balance.productId._id === stockTakeData.productId) {
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
      
      const successMessage = result.adjustmentMade 
        ? `Stock take completed with adjustment. Difference: ${result.difference}`
        : 'Stock take completed - no adjustment needed';
      
      set({ 
        isPerformingStockTake: false, 
        success: successMessage,
        error: null 
      });
      
      return result;
    } catch (error) {
      set({ 
        isPerformingStockTake: false, 
        error: error.message || 'Stock take operation failed',
        success: null 
      });
      throw error;
    }
  },
  
  /**
   * Fetch stock balance for specific product
   */
  fetchStockBalance: async (storeCode, productId) => {
    set({ isLoadingBalance: true, error: null });
    try {
      const balance = await getStockBalance(storeCode, productId);
      set({ 
        currentBalance: balance,
        isLoadingBalance: false,
        error: null 
      });
      return balance;
    } catch (error) {
      set({ 
        isLoadingBalance: false,
        error: error.message || 'Failed to fetch stock balance',
        currentBalance: null
      });
      throw error;
    }
  },
  
  /**
   * Fetch all stock balances for a store
   */
  fetchAllStockBalances: async (storeCode) => {
    set({ isLoadingBalance: true, error: null });
    try {
      const balances = await getAllStockBalances(storeCode);
      const formattedBalances = balances.map((balance, index) => ({
        ...balance,
        key: balance._id || index,
        lastTransactionDateFormatted: balance.lastTransactionDate 
          ? moment(balance.lastTransactionDate).format(DATETIME_FORMAT)
          : '',
        isLowStock: balance.productId?.minStock && balance.quantity <= balance.productId.minStock
      }));
      
      set({ 
        stockBalances: formattedBalances,
        isLoadingBalance: false,
        error: null,
        success: 'Stock balances loaded successfully'
      });
      
      return formattedBalances;
    } catch (error) {
      set({ 
        isLoadingBalance: false,
        error: error.message || 'Failed to fetch stock balances',
        stockBalances: []
      });
      throw error;
    }
  },
  
  /**
   * Fetch transaction history
   */
  fetchTransactionHistory: async (storeCode, filters = {}) => {
    set({ isLoadingTransactions: true, error: null });
    try {
      const result = await getTransactionHistory(storeCode, filters);
      const formattedTransactions = result.transactions.map((transaction, index) => ({
        ...transaction,
        key: transaction._id || index,
        dateFormatted: moment(transaction.date).format(DATETIME_FORMAT),
        typeDisplay: transaction.type === 'in' ? 'Stock In' : 
                    transaction.type === 'out' ? 'Stock Out' : 'Adjustment'
      }));
      
      set({ 
        transactions: formattedTransactions,
        transactionPagination: result.pagination,
        isLoadingTransactions: false,
        error: null,
        success: 'Transaction history loaded successfully'
      });
      
      return result;
    } catch (error) {
      set({ 
        isLoadingTransactions: false,
        error: error.message || 'Failed to fetch transaction history',
        transactions: []
      });
      throw error;
    }
  },
  
  /**
   * Fetch low stock report
   */
  fetchLowStockReport: async (storeCode) => {
    set({ isLoadingReport: true, error: null });
    try {
      const report = await getLowStockReport(storeCode);
      const formattedLowStockItems = report.lowStockItems.map((item, index) => ({
        ...item,
        key: item._id || index,
        lastTransactionDateFormatted: item.lastTransactionDate 
          ? moment(item.lastTransactionDate).format(DATETIME_FORMAT)
          : '',
        stockLevel: item.quantity <= 0 ? 'Out of Stock' : 'Low Stock'
      }));
      
      set({ 
        lowStockReport: {
          ...report,
          lowStockItems: formattedLowStockItems
        },
        isLoadingReport: false,
        error: null,
        success: 'Low stock report loaded successfully'
      });
      
      return report;
    } catch (error) {
      set({ 
        isLoadingReport: false,
        error: error.message || 'Failed to fetch low stock report',
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
   * Clear all data
   */
  clearData: () => {
    set({
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
      error: null,
      success: null
    });
  },
  
  /**
   * Clear messages
   */
  clearMessages: () => {
    set({ error: null, success: null });
  }
}));

export default useInventoryStore;
