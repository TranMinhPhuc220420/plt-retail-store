import { create } from 'zustand';
import moment from 'moment';

// Requests
import { 
  getSalesAccounts, 
  createSalesAccount, 
  updateSalesAccount, 
  toggleSalesAccountStatus,
  resetSalesPassword,
  deleteSalesAccount
} from '@/request/salesAccount';

import { DATE_FORMAT, DATETIME_FORMAT } from '@/constant';

const useSalesAccountStore = create((set, get) => ({
  // Loading states
  isLoading: false,
  isLoadingDetail: false,
  error: null,
  success: null,

  // Data
  salesAccounts: [],
  salesAccountDetail: null,
  pagination: {
    current: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0
  },
  filters: {
    search: '',
    status: null,
    department: null
  },

  // UI states
  showCreateModal: false,
  showEditModal: false,
  editingAccount: null,

  // Setters
  setIsLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setSuccess: (success) => set({ success }),
  setShowCreateModal: (show) => set({ showCreateModal: show }),
  setShowEditModal: (show) => set({ showEditModal: show }),
  setEditingAccount: (account) => set({ editingAccount: account, showEditModal: !!account }),

  // Filters
  setFilters: (newFilters) => set(state => ({ 
    filters: { ...state.filters, ...newFilters } 
  })),
  clearFilters: () => set({
    filters: { search: '', status: null, department: null }
  }),

  // Fetch sales accounts
  fetchSalesAccounts: async (storeId, params = {}) => {
    set({ isLoading: true, error: null, success: null });
    
    try {
      const currentFilters = get().filters;
      const requestParams = {
        page: get().pagination.current,
        limit: get().pagination.pageSize,
        ...currentFilters,
        ...params
      };

      // Remove null/empty values
      Object.keys(requestParams).forEach(key => {
        if (requestParams[key] === null || requestParams[key] === '') {
          delete requestParams[key];
        }
      });

      const response = await getSalesAccounts(storeId, requestParams);
      
      const salesAccounts = response.salesAccounts.map(account => ({
        ...account,
        key: account._id,
        fullName: `${account.firstName} ${account.lastName}`,
        username: account.salesCredentials?.username,
        isActive: account.salesCredentials?.isActive,
        lastLogin: account.salesCredentials?.lastSalesLogin ? 
          moment(account.salesCredentials.lastSalesLogin).format(DATETIME_FORMAT) : 
          'Chưa đăng nhập',
        createdAt: account.createdAt ? moment(account.createdAt).format(DATE_FORMAT) : '',
        updatedAt: account.updatedAt ? moment(account.updatedAt).format(DATE_FORMAT) : ''
      }));

      set({ 
        salesAccounts,
        pagination: response.pagination,
        isLoading: false, 
        error: null, 
        success: 'Sales accounts fetched successfully' 
      });
    } catch (error) {
      if (error.status === 401) {
        window.location.href = '/dang-nhap';
        return;
      }

      set({ 
        isLoading: false, 
        error: error.message || 'Failed to fetch sales accounts', 
        success: null 
      });
    }
  },

  // Create sales account
  createSalesAccount: async (storeId, accountData) => {
    set({ isLoading: true, error: null, success: null });
    
    try {
      const newAccount = await createSalesAccount(storeId, accountData);
      
      // Refresh the list
      await get().fetchSalesAccounts(storeId);
      
      set({ 
        isLoading: false, 
        error: null, 
        success: 'Sales account created successfully',
        showCreateModal: false
      });
      
      return newAccount;
    } catch (error) {
      set({ 
        isLoading: false, 
        error: error.message || 'Failed to create sales account', 
        success: null 
      });
      throw error;
    }
  },

  // Update sales account
  updateSalesAccount: async (storeId, employeeId, updateData) => {
    set({ isLoading: true, error: null, success: null });
    
    try {
      const updatedAccount = await updateSalesAccount(storeId, employeeId, updateData);
      
      // Update in current list
      const currentAccounts = get().salesAccounts;
      const updatedAccounts = currentAccounts.map(account => 
        account._id === employeeId ? { ...account, ...updatedAccount } : account
      );
      
      set({ 
        salesAccounts: updatedAccounts,
        isLoading: false, 
        error: null, 
        success: 'Sales account updated successfully',
        showEditModal: false,
        editingAccount: null
      });
      
      return updatedAccount;
    } catch (error) {
      set({ 
        isLoading: false, 
        error: error.message || 'Failed to update sales account', 
        success: null 
      });
      throw error;
    }
  },

  // Toggle account status
  toggleAccountStatus: async (storeId, employeeId) => {
    try {
      const updatedAccount = await toggleSalesAccountStatus(storeId, employeeId);
      
      // Update in current list
      const currentAccounts = get().salesAccounts;
      const updatedAccounts = currentAccounts.map(account => 
        account._id === employeeId ? { 
          ...account, 
          salesCredentials: { ...account.salesCredentials, ...updatedAccount.salesCredentials },
          isActive: updatedAccount.salesCredentials?.isActive
        } : account
      );
      
      set({ 
        salesAccounts: updatedAccounts,
        success: `Sales account ${updatedAccount.salesCredentials?.isActive ? 'activated' : 'deactivated'} successfully`
      });
      
      return updatedAccount;
    } catch (error) {
      set({ 
        error: error.message || 'Failed to toggle account status'
      });
      throw error;
    }
  },

  // Reset password
  resetPassword: async (storeId, employeeId, newPassword) => {
    try {
      await resetSalesPassword(storeId, employeeId, newPassword);
      
      set({ 
        success: 'Password reset successfully'
      });
    } catch (error) {
      set({ 
        error: error.message || 'Failed to reset password'
      });
      throw error;
    }
  },

  // Delete sales account
  deleteSalesAccount: async (storeId, employeeId) => {
    try {
      await deleteSalesAccount(storeId, employeeId);
      
      // Remove from current list
      const currentAccounts = get().salesAccounts;
      const updatedAccounts = currentAccounts.filter(account => account._id !== employeeId);
      
      set({ 
        salesAccounts: updatedAccounts,
        success: 'Sales account deleted successfully'
      });
    } catch (error) {
      set({ 
        error: error.message || 'Failed to delete sales account'
      });
      throw error;
    }
  },

  // Pagination
  setPagination: (pagination) => set(state => ({ 
    pagination: { ...state.pagination, ...pagination } 
  })),

  // Clear states
  clearError: () => set({ error: null }),
  clearSuccess: () => set({ success: null }),
  clearAll: () => set({
    salesAccounts: [],
    salesAccountDetail: null,
    pagination: { current: 1, pageSize: 10, total: 0, totalPages: 0 },
    filters: { search: '', status: null, department: null },
    error: null,
    success: null,
    isLoading: false,
    showCreateModal: false,
    showEditModal: false,
    editingAccount: null
  })
}));

export default useSalesAccountStore;