import { create } from 'zustand';
import moment from 'moment';

// Requests
import { 
  getAllRecipes, 
  getRecipeById, 
  checkRecipeAvailability 
} from '@/request/recipe';

import { DATE_FORMAT } from '@/constant';

const useRecipeStore = create((set) => ({
  isLoading: false,
  isLoadingDetail: false,
  isLoadingAvailability: false,
  error: null,
  success: null,

  recipes: [],
  recipeDetail: null,
  recipeAvailability: null,

  setIsLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setSuccess: (success) => set({ success }),

  /**
   * Fetch all recipes with optional filtering by ownerId and storeCode
   * @param {Object} params - Query parameters
   * @param {string} params.ownerId - Owner ID to filter recipes
   * @param {string} params.storeCode - Store code to filter recipes
   */
  fetchRecipes: async (params = {}) => {
    set({ isLoading: true, error: null, success: null });
    try {
      const data = await getAllRecipes(params);
      const recipes = data.map((item) => ({
        ...item,
        key: item._id,
        createdAt: item.createdAt ? moment(item.createdAt).format(DATE_FORMAT) : '',
        updatedAt: item.updatedAt ? moment(item.updatedAt).format(DATE_FORMAT) : '',
        ownerName: item.ownerId?.name || 'N/A',
        storeName: item.storeId?.name || 'N/A',
        storeCode: item.storeId?.storeCode || 'N/A',
        ingredientCount: item.ingredients?.length || 0,
      }));
      set({ recipes, isLoading: false, error: null, success: 'Recipes fetched successfully' });
    } catch (error) {
      if (error.status === 401) {
        window.location.href = '/dang-nhap';
        return;
      }
      set({ isLoading: false, error: error.message || 'Failed to fetch recipes', success: null });
    }
  },

  /**
   * Fetch recipe details by ID
   * @param {string} id - Recipe ID
   * @param {Object} params - Query parameters
   */
  fetchRecipeDetail: async (id, params = {}) => {
    set({ isLoadingDetail: true, error: null, success: null });
    try {
      const data = await getRecipeById(id, params);
      const recipeDetail = {
        ...data,
        createdAt: data.createdAt ? moment(data.createdAt).format(DATE_FORMAT) : '',
        updatedAt: data.updatedAt ? moment(data.updatedAt).format(DATE_FORMAT) : '',
        ownerName: data.ownerId?.name || 'N/A',
        storeName: data.storeId?.name || 'N/A',
        storeCode: data.storeId?.storeCode || 'N/A',
        ingredientCount: data.ingredients?.length || 0,
      };
      set({ recipeDetail, isLoadingDetail: false, error: null, success: 'Recipe detail fetched successfully' });
    } catch (error) {
      if (error.status === 401) {
        window.location.href = '/dang-nhap';
        return;
      }
      set({ isLoadingDetail: false, error: error.message || 'Failed to fetch recipe detail', success: null });
    }
  },

  /**
   * Check if a recipe can be prepared based on available ingredients
   * @param {string} id - Recipe ID
   * @param {Object} params - Query parameters
   */
  checkRecipeAvailability: async (id, params = {}) => {
    set({ isLoadingAvailability: true, error: null, success: null });
    try {
      const data = await checkRecipeAvailability(id, params);
      set({ 
        recipeAvailability: data, 
        isLoadingAvailability: false, 
        error: null, 
        success: 'Recipe availability checked successfully' 
      });
    } catch (error) {
      if (error.status === 401) {
        window.location.href = '/dang-nhap';
        return;
      }
      set({ isLoadingAvailability: false, error: error.message || 'Failed to check recipe availability', success: null });
    }
  },

  // Clear states
  clearError: () => set({ error: null }),
  clearSuccess: () => set({ success: null }),
  clearRecipeDetail: () => set({ recipeDetail: null }),
  clearRecipeAvailability: () => set({ recipeAvailability: null }),
}));

export default useRecipeStore;
