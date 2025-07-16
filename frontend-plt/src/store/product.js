import { create } from 'zustand';

import moment from 'moment';

import { DATE_FORMAT } from '@/constant';

const useStoreProduct = create((set) => ({
  isLoading: false,
  error: null,
  success: null,
  
  products: [],

  setIsLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setSuccess: (success) => set({ success }),

  setProducts: (products) => {
    // Ensure each product  has a unique key
    const updatedProducts = products.map((item, index) => ({
      ...item,
      key: item.id || index, // Use a unique identifier like 'id', or fallback to the index
      createdAt: item.createdAt ? moment(item.createdAt).format(DATE_FORMAT) : '',
      updatedAt: item.updatedAt ? moment(item.createdAt).format(DATE_FORMAT) : '',
    }));

    set({ products: updatedProducts });
  },

  setProductIsEditing: (id, isEditing) => {
    set((state) => ({
      products: state.products.map((product) =>
        product.id === id ? { ...product, isEditing } : product
      ),
    }));
  },

  setProductIsDeleting: (id, isDeleting) => {
    set((state) => ({
      products: state.products.map((product) =>
        product.id === id ? { ...product, isDeleting } : product
      ),
    }));
  },
  
  addProduct: (product) => {
    set((state) => ({
      products: [...state.products, { ...product, key: product.id || state.products.length }],
    }));
  },

  deleteProduct: (id) => {
    set((state) => ({
      products: state.products.filter((product) => product.id !== id),
    }));
  },

}));

export default useStoreProduct;