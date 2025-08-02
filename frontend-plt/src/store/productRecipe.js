import { create } from 'zustand';
import moment from 'moment';
import {
  linkRecipeToProduct,
  unlinkRecipeFromProduct,
  setDefaultRecipe,
  getProductWithRecipes,
  linkProductToRecipe,
  unlinkProductFromRecipe,
  getRecipeWithProducts,
  calculateProductCost,
  getCostBreakdown,
  updateProductPricing,
  calculateRecipeCost,
  updateRecipeCostCalculation,
  getRecipesWithCosts,
  checkProductionFeasibility,
  createProduction
} from '@/request/productRecipe';
import { DATE_FORMAT } from '@/constant';

const useProductRecipeStore = create((set, get) => ({
  isLoading: false,
  isLoadingCost: false,
  isLoadingProduction: false,
  error: null,
  success: null,

  // Product-recipe relationships
  productWithRecipes: null,
  recipeWithProducts: null,

  // Cost calculations
  productCostCalculation: null,
  costBreakdown: null,
  recipeCostCalculation: null,
  recipesWithCosts: [],

  // Production
  productionFeasibility: null,
  productionResult: null,

  setIsLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setSuccess: (success) => set({ success }),

  /**
   * Link recipe to product
   * @param {string} productId - Product ID
   * @param {string} recipeId - Recipe ID
   * @param {Object} options - Additional options
   */
  linkRecipe: async (productId, recipeId, options = {}) => {
    set({ isLoading: true, error: null, success: null });
    try {
      const result = await linkRecipeToProduct(productId, recipeId, options);
      set({ 
        isLoading: false, 
        success: 'Recipe linked to product successfully',
        error: null 
      });
      return result;
    } catch (error) {
      if (error.status === 401) {
        window.location.href = '/dang-nhap';
        return;
      }
      set({ 
        isLoading: false, 
        error: error.message || 'Failed to link recipe to product', 
        success: null 
      });
      throw error;
    }
  },

  /**
   * Unlink recipe from product
   * @param {string} productId - Product ID
   * @param {string} recipeId - Recipe ID
   * @param {Object} params - Query parameters
   */
  unlinkRecipe: async (productId, recipeId, params = {}) => {
    set({ isLoading: true, error: null, success: null });
    try {
      const result = await unlinkRecipeFromProduct(productId, recipeId, params);
      set({ 
        isLoading: false, 
        success: 'Recipe unlinked from product successfully',
        error: null 
      });
      return result;
    } catch (error) {
      if (error.status === 401) {
        window.location.href = '/dang-nhap';
        return;
      }
      set({ 
        isLoading: false, 
        error: error.message || 'Failed to unlink recipe from product', 
        success: null 
      });
      throw error;
    }
  },

  /**
   * Set default recipe for product
   * @param {string} productId - Product ID
   * @param {string} recipeId - Recipe ID
   * @param {Object} params - Query parameters
   */
  setDefaultRecipe: async (productId, recipeId, params = {}) => {
    set({ isLoading: true, error: null, success: null });
    try {
      const result = await setDefaultRecipe(productId, recipeId, params);
      set({ 
        isLoading: false, 
        success: 'Default recipe set successfully',
        error: null 
      });
      return result;
    } catch (error) {
      if (error.status === 401) {
        window.location.href = '/dang-nhap';
        return;
      }
      set({ 
        isLoading: false, 
        error: error.message || 'Failed to set default recipe', 
        success: null 
      });
      throw error;
    }
  },

  /**
   * Fetch product with its recipes
   * @param {string} productId - Product ID
   * @param {Object} params - Query parameters
   */
  fetchProductWithRecipes: async (productId, params = {}) => {
    set({ isLoading: true, error: null, success: null });
    try {
      const data = await getProductWithRecipes(productId, params);
      const formattedProduct = {
        ...data,
        createdAt: data.createdAt ? moment(data.createdAt).format(DATE_FORMAT) : '',
        updatedAt: data.updatedAt ? moment(data.updatedAt).format(DATE_FORMAT) : '',
        recipes: data.recipes?.map(recipe => ({
          ...recipe,
          createdAt: recipe.createdAt ? moment(recipe.createdAt).format(DATE_FORMAT) : '',
          updatedAt: recipe.updatedAt ? moment(recipe.updatedAt).format(DATE_FORMAT) : ''
        })) || []
      };
      
      set({ 
        productWithRecipes: formattedProduct,
        isLoading: false, 
        success: 'Product with recipes fetched successfully',
        error: null 
      });
      return formattedProduct;
    } catch (error) {
      if (error.status === 401) {
        window.location.href = '/dang-nhap';
        return;
      }
      set({ 
        isLoading: false, 
        error: error.message || 'Failed to fetch product with recipes', 
        success: null 
      });
      throw error;
    }
  },

  /**
   * Link product to recipe
   * @param {string} recipeId - Recipe ID
   * @param {string} productId - Product ID
   * @param {Object} params - Query parameters
   */
  linkProduct: async (recipeId, productId, params = {}) => {
    set({ isLoading: true, error: null, success: null });
    try {
      const result = await linkProductToRecipe(recipeId, productId, params);
      set({ 
        isLoading: false, 
        success: 'Product linked to recipe successfully',
        error: null 
      });
      return result;
    } catch (error) {
      if (error.status === 401) {
        window.location.href = '/dang-nhap';
        return;
      }
      set({ 
        isLoading: false, 
        error: error.message || 'Failed to link product to recipe', 
        success: null 
      });
      throw error;
    }
  },

  /**
   * Unlink product from recipe
   * @param {string} recipeId - Recipe ID
   * @param {string} productId - Product ID
   * @param {Object} params - Query parameters
   */
  unlinkProduct: async (recipeId, productId, params = {}) => {
    set({ isLoading: true, error: null, success: null });
    try {
      const result = await unlinkProductFromRecipe(recipeId, productId, params);
      set({ 
        isLoading: false, 
        success: 'Product unlinked from recipe successfully',
        error: null 
      });
      return result;
    } catch (error) {
      if (error.status === 401) {
        window.location.href = '/dang-nhap';
        return;
      }
      set({ 
        isLoading: false, 
        error: error.message || 'Failed to unlink product from recipe', 
        success: null 
      });
      throw error;
    }
  },

  /**
   * Fetch recipe with its products
   * @param {string} recipeId - Recipe ID
   * @param {Object} params - Query parameters
   */
  fetchRecipeWithProducts: async (recipeId, params = {}) => {
    set({ isLoading: true, error: null, success: null });
    try {
      const data = await getRecipeWithProducts(recipeId, params);
      const formattedRecipe = {
        ...data,
        createdAt: data.createdAt ? moment(data.createdAt).format(DATE_FORMAT) : '',
        updatedAt: data.updatedAt ? moment(data.updatedAt).format(DATE_FORMAT) : '',
        products: data.products?.map(product => ({
          ...product,
          createdAt: product.createdAt ? moment(product.createdAt).format(DATE_FORMAT) : '',
          updatedAt: product.updatedAt ? moment(product.updatedAt).format(DATE_FORMAT) : ''
        })) || []
      };
      
      set({ 
        recipeWithProducts: formattedRecipe,
        isLoading: false, 
        success: 'Recipe with products fetched successfully',
        error: null 
      });
      return formattedRecipe;
    } catch (error) {
      if (error.status === 401) {
        window.location.href = '/dang-nhap';
        return;
      }
      set({ 
        isLoading: false, 
        error: error.message || 'Failed to fetch recipe with products', 
        success: null 
      });
      throw error;
    }
  },

  /**
   * Calculate product cost
   * @param {string} productId - Product ID
   * @param {Object} params - Query parameters
   */
  calculateProductCost: async (productId, params = {}) => {
    set({ isLoadingCost: true, error: null, success: null });
    try {
      const data = await calculateProductCost(productId, params);
      set({ 
        productCostCalculation: data,
        isLoadingCost: false, 
        success: 'Product cost calculated successfully',
        error: null 
      });
      return data;
    } catch (error) {
      if (error.status === 401) {
        window.location.href = '/dang-nhap';
        return;
      }
      set({ 
        isLoadingCost: false, 
        error: error.message || 'Failed to calculate product cost', 
        success: null 
      });
      throw error;
    }
  },

  /**
   * Get cost breakdown for product
   * @param {string} productId - Product ID
   * @param {Object} params - Query parameters
   */
  getCostBreakdown: async (productId, params = {}) => {
    set({ isLoadingCost: true, error: null, success: null });
    try {
      const data = await getCostBreakdown(productId, params);
      set({ 
        costBreakdown: data,
        isLoadingCost: false, 
        success: 'Cost breakdown fetched successfully',
        error: null 
      });
      return data;
    } catch (error) {
      if (error.status === 401) {
        window.location.href = '/dang-nhap';
        return;
      }
      set({ 
        isLoadingCost: false, 
        error: error.message || 'Failed to get cost breakdown', 
        success: null 
      });
      throw error;
    }
  },

  /**
   * Update product pricing
   * @param {string} productId - Product ID
   * @param {Object} pricingOptions - Pricing update options
   * @param {Object} params - Query parameters
   */
  updateProductPricing: async (productId, pricingOptions, params = {}) => {
    set({ isLoading: true, error: null, success: null });
    try {
      const data = await updateProductPricing(productId, pricingOptions, params);
      set({ 
        isLoading: false, 
        success: 'Product pricing updated successfully',
        error: null 
      });
      return data;
    } catch (error) {
      if (error.status === 401) {
        window.location.href = '/dang-nhap';
        return;
      }
      set({ 
        isLoading: false, 
        error: error.message || 'Failed to update product pricing', 
        success: null 
      });
      throw error;
    }
  },

  /**
   * Calculate recipe cost
   * @param {string} recipeId - Recipe ID
   * @param {Object} params - Query parameters
   */
  calculateRecipeCost: async (recipeId, params = {}) => {
    set({ isLoadingCost: true, error: null, success: null });
    try {
      const data = await calculateRecipeCost(recipeId, params);
      set({ 
        recipeCostCalculation: data,
        isLoadingCost: false, 
        success: 'Recipe cost calculated successfully',
        error: null 
      });
      return data;
    } catch (error) {
      if (error.status === 401) {
        window.location.href = '/dang-nhap';
        return;
      }
      set({ 
        isLoadingCost: false, 
        error: error.message || 'Failed to calculate recipe cost', 
        success: null 
      });
      throw error;
    }
  },

  /**
   * Update recipe cost calculation
   * @param {string} recipeId - Recipe ID
   * @param {Object} params - Query parameters
   */
  updateRecipeCost: async (recipeId, params = {}) => {
    set({ isLoading: true, error: null, success: null });
    try {
      const data = await updateRecipeCostCalculation(recipeId, params);
      set({ 
        isLoading: false, 
        success: 'Recipe cost updated successfully',
        error: null 
      });
      return data;
    } catch (error) {
      if (error.status === 401) {
        window.location.href = '/dang-nhap';
        return;
      }
      set({ 
        isLoading: false, 
        error: error.message || 'Failed to update recipe cost', 
        success: null 
      });
      throw error;
    }
  },

  /**
   * Fetch recipes with costs
   * @param {Object} params - Query parameters
   */
  fetchRecipesWithCosts: async (params = {}) => {
    set({ isLoading: true, error: null, success: null });
    try {
      const data = await getRecipesWithCosts(params);
      const formattedRecipes = data.map(recipe => ({
        ...recipe,
        key: recipe._id,
        createdAt: recipe.createdAt ? moment(recipe.createdAt).format(DATE_FORMAT) : '',
        updatedAt: recipe.updatedAt ? moment(recipe.updatedAt).format(DATE_FORMAT) : '',
        ingredientCount: recipe.ingredients?.length || 0,
        productCount: recipe.products?.length || 0,
        totalCost: recipe.calculatedCost?.totalCost || 0,
        costPerUnit: recipe.calculatedCost?.costPerUnit || 0
      }));
      
      set({ 
        recipesWithCosts: formattedRecipes,
        isLoading: false, 
        success: 'Recipes with costs fetched successfully',
        error: null 
      });
      return formattedRecipes;
    } catch (error) {
      if (error.status === 401) {
        window.location.href = '/dang-nhap';
        return;
      }
      set({ 
        isLoading: false, 
        error: error.message || 'Failed to fetch recipes with costs', 
        success: null 
      });
      throw error;
    }
  },

  /**
   * Check production feasibility
   * @param {string} productId - Product ID
   * @param {Object} params - Query parameters
   */
  checkProductionFeasibility: async (productId, params = {}) => {
    set({ isLoadingProduction: true, error: null, success: null });
    try {
      const data = await checkProductionFeasibility(productId, params);
      set({ 
        productionFeasibility: data,
        isLoadingProduction: false, 
        success: 'Production feasibility checked successfully',
        error: null 
      });
      return data;
    } catch (error) {
      if (error.status === 401) {
        window.location.href = '/dang-nhap';
        return;
      }
      set({ 
        isLoadingProduction: false, 
        error: error.message || 'Failed to check production feasibility', 
        success: null 
      });
      throw error;
    }
  },

  /**
   * Create production
   * @param {string} productId - Product ID
   * @param {Object} productionData - Production data
   * @param {Object} params - Query parameters
   */
  createProduction: async (productId, productionData, params = {}) => {
    set({ isLoadingProduction: true, error: null, success: null });
    try {
      const data = await createProduction(productId, productionData, params);
      set({ 
        productionResult: data,
        isLoadingProduction: false, 
        success: 'Production created successfully',
        error: null 
      });
      return data;
    } catch (error) {
      if (error.status === 401) {
        window.location.href = '/dang-nhap';
        return;
      }
      set({ 
        isLoadingProduction: false, 
        error: error.message || 'Failed to create production', 
        success: null 
      });
      throw error;
    }
  },

  // Clear functions
  clearError: () => set({ error: null }),
  clearSuccess: () => set({ success: null }),
  clearProductWithRecipes: () => set({ productWithRecipes: null }),
  clearRecipeWithProducts: () => set({ recipeWithProducts: null }),
  clearCostCalculations: () => set({ 
    productCostCalculation: null, 
    costBreakdown: null, 
    recipeCostCalculation: null 
  }),
  clearProductionData: () => set({ 
    productionFeasibility: null, 
    productionResult: null 
  })
}));

export default useProductRecipeStore;
