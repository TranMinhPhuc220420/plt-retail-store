import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import authAPI from '@/request/authAPI';

const useSalesAuthStore = create(
  persist(
    (set, get) => ({
      // Auth state
      isAuthenticated: false,
      isLoading: false,
      error: null,
      
      // User data
      employee: null,
      permissions: null,
      currentShift: null,
      
      // Store info
      storeCode: null,
      storeInfo: null,

      // Actions
      login: async (credentials) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await authAPI.salesLogin(credentials);
          
          if (response?.success) {
            const { employee, permissions, store } = response.data;
            
            set({
              isAuthenticated: true,
              employee,
              permissions,
              storeCode: credentials.storeCode,
              storeInfo: store,
              isLoading: false,
              error: null
            });
            
            return { success: true, data: response.data };
          } else {
            set({
              isAuthenticated: false,
              employee: null,
              permissions: null,
              isLoading: false,
              error: response?.message || 'Đăng nhập thất bại'
            });
            
            return { success: false, message: response?.message };
          }
        } catch (error) {
          console.error('Sales login error:', error);
          set({
            isAuthenticated: false,
            employee: null,
            permissions: null,
            isLoading: false,
            error: 'Lỗi kết nối. Vui lòng thử lại.'
          });
          
          return { success: false, message: error.message };
        }
      },

      logout: async () => {
        set({ isLoading: true });
        
        try {
          // Call logout API to clear server-side session/cookies
          await authAPI.logout();
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          // Clear all auth data regardless of API call result
          set({
            isAuthenticated: false,
            employee: null,
            permissions: null,
            currentShift: null,
            storeCode: null,
            storeInfo: null,
            isLoading: false,
            error: null
          });
        }
      },

      // Verify token and get user info
      verifyAuth: async (storeCode) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await authAPI.getSalesMe();
          
          if (response?.success && response?.data) {
            const { employee, permissions, store } = response.data;
            
            set({
              isAuthenticated: true,
              employee,
              permissions,
              storeCode,
              storeInfo: store,
              isLoading: false,
              error: null
            });
            
            return { success: true, data: response.data };
          } else {
            // Token invalid, clear auth state
            set({
              isAuthenticated: false,
              employee: null,
              permissions: null,
              storeCode: null,
              storeInfo: null,
              isLoading: false,
              error: null
            });
            
            return { success: false };
          }
        } catch (error) {
          console.error('Auth verification error:', error);
          set({
            isAuthenticated: false,
            employee: null,
            permissions: null,
            storeCode: null,
            storeInfo: null,
            isLoading: false,
            error: null
          });
          
          return { success: false };
        }
      },

      // Start shift
      startShift: (shiftData) => {
        set({
          currentShift: {
            startTime: new Date().toISOString(),
            initialCash: shiftData.initialCash || 0,
            ...shiftData
          }
        });
      },

      // End shift
      endShift: () => {
        set({
          currentShift: null
        });
      },

      // Update permissions (when admin changes them)
      updatePermissions: (newPermissions) => {
        set({
          permissions: newPermissions
        });
      },

      // Clear error
      clearError: () => {
        set({ error: null });
      },

      // Helper getters
      hasPermission: (permission) => {
        const { permissions } = get();
        return permissions?.[permission] === true;
      },

      getMaxDiscount: () => {
        const { permissions } = get();
        return permissions?.maxDiscountPercent || 0;
      },

      isShiftActive: () => {
        const { currentShift } = get();
        return !!currentShift;
      },

      getEmployeeInfo: () => {
        const { employee } = get();
        return employee;
      },

      getStoreInfo: () => {
        const { storeInfo, storeCode } = get();
        return { storeInfo, storeCode };
      }
    }),
    {
      name: 'sales-auth-storage',
      partialize: (state) => ({
        // Only persist essential data, not sensitive info
        isAuthenticated: state.isAuthenticated,
        storeCode: state.storeCode,
        employee: state.employee ? {
          id: state.employee.id,
          firstName: state.employee.firstName,
          lastName: state.employee.lastName,
          employeeCode: state.employee.employeeCode,
          department: state.employee.department,
          avatar: state.employee.avatar
        } : null,
        permissions: state.permissions,
        currentShift: state.currentShift
      })
    }
  )
);

export default useSalesAuthStore;