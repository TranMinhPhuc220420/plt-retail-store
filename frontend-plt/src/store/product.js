import { create } from 'zustand';

import moment from 'moment';

import { DATE_FORMAT } from '@/constant';

import { getMyProducts } from '@/request/product';

const useStoreProduct = create((set) => ({
  isLoading: false,
  error: null,
  success: null,
  
  products: [],

  setIsLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setSuccess: (success) => set({ success }),

  fetchProducts: async (storeCode) => {
    set({ isLoading: true, error: null, success: null });
    try {
      const data = await getMyProducts(storeCode);

      let products = data.map((item) => ({
        ...item,
        key: item.id || item._id, // Use a unique identifier like 'id' or '_id'
        createdAt: item.createdAt ? moment(item.createdAt).format(DATE_FORMAT) : '',
        updatedAt: item.updatedAt ? moment(item.updatedAt).format(DATE_FORMAT) : '',
      }));

      // Convert item have $numberDecimal
      products = products.map((item) => {
        
        for (const key in item) {
          if (Object.prototype.hasOwnProperty.call(item, key)) {
            const value = item[key];
            
            if (typeof value === 'object' && value !== null && '$numberDecimal' in value) {
              item[key] = parseFloat(value.$numberDecimal);
            }
          }
        }

        return item;
      });

      set({ products, isLoading: false, error: null, success: 'Products fetched successfully' });
    } catch (error) {
      if (error.status === 401) {
        window.location.href = '/dang-nhap';
        return;
      }
      
      set({ isLoading: false, error: error.message || 'Failed to fetch products', success: null });
    }
  },

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

}));

export default useStoreProduct;