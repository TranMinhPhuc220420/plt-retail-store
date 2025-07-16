import { create } from 'zustand';

import moment from 'moment';

// Requests
import { getMyProductTypes } from '@/request/product-type';

import { DATETIME_FORMAT, DATE_FORMAT } from '@/constant';

const useStoreProductType = create((set) => ({
  isLoading: false,
  error: null,
  success: null,
  
  productTypes: [],

  setIsLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setSuccess: (success) => set({ success }),

  fetchProductTypes: async (storeCode) => {
    set({ isLoading: true, error: null, success: null });
    try {
      const data = await getMyProductTypes(storeCode);
      const productTypes = data.map((item) => ({
        ...item,
        createdAt: item.createdAt ? moment(item.createdAt).format(DATETIME_FORMAT) : '',
        updatedAt: item.updatedAt ? moment(item.updatedAt).format(DATETIME_FORMAT) : '',
      }));
      set({ productTypes, isLoading: false, error: null, success: 'Product types fetched successfully' });
    } catch (error) {
      set({ isLoading: false, error: error.message || 'Failed to fetch product types', success: null });
    }
  },

  setProductTypes: (productTypes) => {
    // Ensure each product type has a unique key
    const updatedProductTypes = productTypes.map((item, index) => ({
      ...item,
      key: item.id || index, // Use a unique identifier like 'id', or fallback to the index
      createdAt: item.createdAt ? moment(item.createdAt).format(DATE_FORMAT) : '',
      updatedAt: item.updatedAt ? moment(item.createdAt).format(DATE_FORMAT) : '',
    }));

    set({ productTypes: updatedProductTypes });
  },

  setProductTypeIsEditing: (id, isEditing) => {
    set((state) => ({
      productTypes: state.productTypes.map((productType) =>
        productType.id === id ? { ...productType, isEditing } : productType
      ),
    }));
  },

  setProductTypeIsDeleting: (id, isDeleting) => {
    set((state) => ({
      productTypes: state.productTypes.map((productType) =>
        productType.id === id ? { ...productType, isDeleting } : productType
      ),
    }));
  },
  
  addProductType: (productType) => {
    set((state) => ({
      productTypes: [...state.productTypes, { ...productType, key: productType.id || state.productTypes.length }],
    }));
  },

  deleteProductType: (id) => {
    set((state) => ({
      productTypes: state.productTypes.filter((productType) => productType.id !== id),
    }));
  },

}));

export default useStoreProductType;