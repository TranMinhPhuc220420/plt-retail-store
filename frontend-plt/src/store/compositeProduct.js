import { create } from 'zustand';
import { getMyCompositeProducts, getRegularProductsForComposite } from '@/request/compositeProduct';

const useCompositeProductStore = create((set, get) => ({
  // State
  compositeProducts: [],
  regularProducts: [],
  isLoading: false,
  error: null,
  
  // Loading states for individual products
  preparingProducts: new Set(),
  servingProducts: new Set(),
  deletingProducts: new Set(),
  editingProducts: new Set(),

  // Actions
  setCompositeProducts: (products) => set({ compositeProducts: products }),
  setRegularProducts: (products) => set({ regularProducts: products }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),

  // Individual product loading states
  setPreparingProduct: (productId, isPreparing) => set(state => {
    const newSet = new Set(state.preparingProducts);
    if (isPreparing) {
      newSet.add(productId);
    } else {
      newSet.delete(productId);
    }
    return { preparingProducts: newSet };
  }),

  setServingProduct: (productId, isServing) => set(state => {
    const newSet = new Set(state.servingProducts);
    if (isServing) {
      newSet.add(productId);
    } else {
      newSet.delete(productId);
    }
    return { servingProducts: newSet };
  }),

  setDeletingProduct: (productId, isDeleting) => set(state => {
    const newSet = new Set(state.deletingProducts);
    if (isDeleting) {
      newSet.add(productId);
    } else {
      newSet.delete(productId);
    }
    return { deletingProducts: newSet };
  }),

  setEditingProduct: (productId, isEditing) => set(state => {
    const newSet = new Set(state.editingProducts);
    if (isEditing) {
      newSet.add(productId);
    } else {
      newSet.delete(productId);
    }
    return { editingProducts: newSet };
  }),

  // Fetch functions
  fetchCompositeProducts: async (storeCode) => {
    try {
      set({ isLoading: true, error: null });
      const products = await getMyCompositeProducts(storeCode);
      set({ 
        compositeProducts: products,
        isLoading: false 
      });
    } catch (error) {
      set({ 
        error: error.message || 'Failed to fetch composite products',
        isLoading: false 
      });
    }
  },

  fetchRegularProducts: async (storeCode) => {
    try {
      const products = await getRegularProductsForComposite(storeCode);
      set({ regularProducts: products });
    } catch (error) {
      console.error('Error fetching regular products:', error);
      set({ error: error.message || 'Failed to fetch regular products' });
    }
  },

  // Update product in list after actions
  updateCompositeProduct: (productId, updates) => set(state => ({
    compositeProducts: state.compositeProducts.map(product =>
      product._id === productId ? { ...product, ...updates } : product
    )
  })),

  // Remove product from list
  removeCompositeProduct: (productId) => set(state => ({
    compositeProducts: state.compositeProducts.filter(product => product._id !== productId)
  })),

  // Add new product to list
  addCompositeProduct: (product) => set(state => ({
    compositeProducts: [product, ...state.compositeProducts]
  })),

  // Get composite product by ID
  getCompositeProductById: (productId) => {
    const { compositeProducts } = get();
    return compositeProducts.find(product => product._id === productId);
  },

  // Get loading states
  isProductPreparing: (productId) => {
    const { preparingProducts } = get();
    return preparingProducts.has(productId);
  },

  isProductServing: (productId) => {
    const { servingProducts } = get();
    return servingProducts.has(productId);
  },

  isProductDeleting: (productId) => {
    const { deletingProducts } = get();
    return deletingProducts.has(productId);
  },

  isProductEditing: (productId) => {
    const { editingProducts } = get();
    return editingProducts.has(productId);
  },

  // Clear all states
  reset: () => set({
    compositeProducts: [],
    regularProducts: [],
    isLoading: false,
    error: null,
    preparingProducts: new Set(),
    servingProducts: new Set(),
    deletingProducts: new Set(),
    editingProducts: new Set()
  })
}));

export default useCompositeProductStore;
