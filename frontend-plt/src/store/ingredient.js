import { create } from 'zustand';
import moment from 'moment';

// Requests
import { 
  getAllIngredients, 
  getIngredientById, 
  getIngredientsByWarehouse 
} from '@/request/ingredient';

import { DATE_FORMAT } from '@/constant';

const useIngredientStore = create((set) => ({
  isLoading: false,
  isLoadingDetail: false,
  error: null,
  success: null,

  ingredients: [],
  ingredientDetail: null,
  warehouseIngredients: [],

  setIsLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setSuccess: (success) => set({ success }),

  /**
   * Fetch all ingredients with optional filtering by ownerId and storeCode
   * @param {Object} params - Query parameters
   * @param {string} params.ownerId - Owner ID to filter ingredients
   * @param {string} params.storeCode - Store code to filter ingredients
   */
  fetchIngredients: async (params = {}) => {
    set({ isLoading: true, error: null, success: null });
    try {
      const data = await getAllIngredients(params);
      const ingredients = data.map((item) => ({
        ...item,
        key: item._id,
        createdAt: item.createdAt ? moment(item.createdAt).format(DATE_FORMAT) : '',
        updatedAt: item.updatedAt ? moment(item.updatedAt).format(DATE_FORMAT) : '',
        warehouseName: item.warehouseId?.name || 'N/A',
        ownerName: item.ownerId?.name || 'N/A',
        storeName: item.storeId?.name || 'N/A',
        storeCode: item.storeId?.storeCode || 'N/A',
      }));
      set({ ingredients, isLoading: false, error: null, success: 'Ingredients fetched successfully' });
    } catch (error) {
      if (error.status === 401) {
        window.location.href = '/dang-nhap';
        return;
      }
      set({ isLoading: false, error: error.message || 'Failed to fetch ingredients', success: null });
    }
  },

  /**
   * Fetch ingredient details by ID
   * @param {string} id - Ingredient ID
   * @param {Object} params - Query parameters
   */
  fetchIngredientDetail: async (id, params = {}) => {
    set({ isLoadingDetail: true, error: null, success: null });
    try {
      const data = await getIngredientById(id, params);
      const ingredientDetail = {
        ...data,
        createdAt: data.createdAt ? moment(data.createdAt).format(DATE_FORMAT) : '',
        updatedAt: data.updatedAt ? moment(data.updatedAt).format(DATE_FORMAT) : '',
        warehouseName: data.warehouseId?.name || 'N/A',
        ownerName: data.ownerId?.name || 'N/A',
        storeName: data.storeId?.name || 'N/A',
        storeCode: data.storeId?.storeCode || 'N/A',
      };
      set({ ingredientDetail, isLoadingDetail: false, error: null, success: 'Ingredient detail fetched successfully' });
    } catch (error) {
      if (error.status === 401) {
        window.location.href = '/dang-nhap';
        return;
      }
      set({ isLoadingDetail: false, error: error.message || 'Failed to fetch ingredient detail', success: null });
    }
  },

  /**
   * Fetch ingredients by warehouse ID
   * @param {string} warehouseId - Warehouse ID
   * @param {Object} params - Query parameters
   */
  fetchIngredientsByWarehouse: async (warehouseId, params = {}) => {
    set({ isLoading: true, error: null, success: null });
    try {
      const data = await getIngredientsByWarehouse(warehouseId, params);
      const warehouseIngredients = data.map((item) => ({
        ...item,
        key: item._id,
        createdAt: item.createdAt ? moment(item.createdAt).format(DATE_FORMAT) : '',
        updatedAt: item.updatedAt ? moment(item.updatedAt).format(DATE_FORMAT) : '',
        warehouseName: item.warehouseId?.name || 'N/A',
        ownerName: item.ownerId?.name || 'N/A',
        storeName: item.storeId?.name || 'N/A',
        storeCode: item.storeId?.storeCode || 'N/A',
      }));
      set({ warehouseIngredients, isLoading: false, error: null, success: 'Warehouse ingredients fetched successfully' });
    } catch (error) {
      if (error.status === 401) {
        window.location.href = '/dang-nhap';
        return;
      }
      set({ isLoading: false, error: error.message || 'Failed to fetch warehouse ingredients', success: null });
    }
  },

  // Clear states
  clearError: () => set({ error: null }),
  clearSuccess: () => set({ success: null }),
  clearIngredientDetail: () => set({ ingredientDetail: null }),
}));

export default useIngredientStore;
