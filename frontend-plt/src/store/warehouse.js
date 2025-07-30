import { create } from 'zustand';

import moment from 'moment';

// Requests
import { getMyWarehouses, getMyWarehouseDetail } from '@/request/warehouse';

import { DATETIME_FORMAT, DATE_FORMAT } from '@/constant';

const useWarehouseType = create((set) => ({
  isLoading: false,
  isLoadingDetail: false,
  error: null,
  success: null,

  warehouses: [],
  warehouseDetail: null,

  setIsLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setSuccess: (success) => set({ success }),

  fetchWarehouses: async (storeCode) => {
    set({ isLoading: true, error: null, success: null });
    try {
      const data = await getMyWarehouses(storeCode);
      const warehouses = data.map((item) => ({
        ...item,
        key: item._id,
        createdAt: item.createdAt ? moment(item.createdAt).format(DATE_FORMAT) : '',
        updatedAt: item.updatedAt ? moment(item.updatedAt).format(DATE_FORMAT) : '',
      }));
      set({ warehouses, isLoading: false, error: null, success: 'Warehouses fetched successfully' });
    } catch (error) {
      if (error.status === 401) {
        window.location.href = '/dang-nhap';
        return;
      }

      set({ isLoading: false, error: error.message || 'Failed to fetch warehouses', success: null });
    }
  },

  fetchWarehouseDetail: async (warehouseId) => {
    set({ isLoadingDetail: true, error: null, success: null });

    try {
      const data = await getMyWarehouseDetail(warehouseId);
      const warehouseDetail = {
        ...data,
        key: data._id,
        createdAt: data.createdAt ? moment(data.createdAt).format(DATE_FORMAT) : '',
        updatedAt: data.updatedAt ? moment(data.updatedAt).format(DATE_FORMAT) : '',
      };
      set({ warehouseDetail, isLoading: false, error: null, success: 'Warehouse detail fetched successfully' });
    } catch (error) {
      set({ isLoadingDetail: false, error: error.message || 'Failed to fetch warehouse detail', success: null });
    }
  },

  setWarehouses: (warehouses) => {
    // Ensure each warehouse has a unique key
    const updatedWarehouses = warehouses.map((item) => ({
      ...item,
      key: item._id,
      createdAt: item.createdAt ? moment(item.createdAt).format(DATE_FORMAT) : '',
      updatedAt: item.updatedAt ? moment(item.createdAt).format(DATE_FORMAT) : '',
    }));

    set({ warehouses: updatedWarehouses });
  },

  setWarehouseIsEditing: (id, isEditing) => {
    set((state) => ({
      warehouses: state.warehouses.map((warehouse) =>
        warehouse._id === id ? { ...warehouse, isEditing } : warehouse
      ),
    }));
  },

  setWarehouseIsDeleting: (id, isDeleting) => {
    set((state) => ({
      warehouses: state.warehouses.map((warehouse) =>
        warehouse._id === id ? { ...warehouse, isDeleting } : warehouse
      ),
    }));
  },

}));

export default useWarehouseType;