import { create } from 'zustand';
import moment from 'moment';
import { DATE_FORMAT } from '@/constant';

// API imports
import {
  getMySuppliers,
  getSupplierById,
  createMySupplier,
  createMySuppliersInBulk,
  updateMySupplier,
  deleteMySupplier,
  deleteMySuppliersInBulk,
  getSupplierPerformance,
  updateSupplierPerformance
} from '@/request/supplier';

const useSupplierStore = create((set, get) => ({
  isLoading: false,
  isLoadingDetail: false,
  error: null,
  success: null,

  suppliers: [],
  supplierDetail: null,

  setIsLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setSuccess: (success) => set({ success }),

  /**
   * Fetch all suppliers for a store
   * @param {string} storeCode - Store code to filter suppliers
   */
  fetchSuppliers: async (storeCode) => {
    set({ isLoading: true, error: null, success: null });
    try {
      const data = await getMySuppliers(storeCode);
      
      const suppliers = data.map((item) => ({
        ...item,
        key: item._id,
        createdAt: item.createdAt ? moment(item.createdAt).format(DATE_FORMAT) : '',
        updatedAt: item.updatedAt ? moment(item.updatedAt).format(DATE_FORMAT) : '',
      }));
      
      set({ suppliers, isLoading: false, error: null, success: 'Suppliers fetched successfully' });
    } catch (error) {
      if (error.status === 401) {
        window.location.href = '/dang-nhap';
        return;
      }
      set({ isLoading: false, error: error.message || error || 'Failed to fetch suppliers', success: null });
    }
  },

  /**
   * Fetch supplier details by ID
   * @param {string} supplierId - Supplier ID
   */
  fetchSupplierDetail: async (supplierId) => {
    set({ isLoadingDetail: true, error: null, success: null });
    try {
      const data = await getSupplierById(supplierId);

      const supplierDetail = {
        ...data,
        createdAt: data.createdAt ? moment(data.createdAt).format(DATE_FORMAT) : '',
        updatedAt: data.updatedAt ? moment(data.updatedAt).format(DATE_FORMAT) : '',
      };
      
      set({ supplierDetail, isLoadingDetail: false, error: null, success: 'Supplier detail fetched successfully' });
    } catch (error) {
      if (error.status === 401) {
        window.location.href = '/dang-nhap';
        return;
      }
      set({ isLoadingDetail: false, error: error.message || error || 'Failed to fetch supplier detail', success: null });
    }
  },

  /**
   * Create a new supplier
   * @param {Object} supplierData - Supplier data
   */
  createSupplier: async (supplierData) => {
    set({ isLoading: true, error: null, success: null });
    try {
      const newSupplier = await createMySupplier(supplierData);
      
      const supplierWithFormatting = {
        ...newSupplier,
        key: newSupplier._id,
        createdAt: newSupplier.createdAt ? moment(newSupplier.createdAt).format(DATE_FORMAT) : '',
        updatedAt: newSupplier.updatedAt ? moment(newSupplier.updatedAt).format(DATE_FORMAT) : '',
      };

      set((state) => ({
        suppliers: [supplierWithFormatting, ...state.suppliers],
        isLoading: false,
        error: null,
        success: 'Supplier created successfully'
      }));

      return newSupplier;
    } catch (error) {
      if (error.status === 401) {
        window.location.href = '/dang-nhap';
        return;
      }
      set({ isLoading: false, error: error.message || error || 'Failed to create supplier', success: null });
      throw error;
    }
  },

  /**
   * Create multiple suppliers in bulk
   * @param {string} storeCode - Store code
   * @param {Array} suppliers - Array of supplier data
   */
  createSuppliersInBulk: async (storeCode, suppliers) => {
    set({ isLoading: true, error: null, success: null });
    try {
      const newSuppliers = await createMySuppliersInBulk(storeCode, suppliers);
      
      const suppliersWithFormatting = newSuppliers.map((item) => ({
        ...item,
        key: item._id,
        createdAt: item.createdAt ? moment(item.createdAt).format(DATE_FORMAT) : '',
        updatedAt: item.updatedAt ? moment(item.updatedAt).format(DATE_FORMAT) : '',
      }));

      set((state) => ({
        suppliers: [...suppliersWithFormatting, ...state.suppliers],
        isLoading: false,
        error: null,
        success: `${newSuppliers.length} suppliers created successfully`
      }));

      return newSuppliers;
    } catch (error) {
      if (error.status === 401) {
        window.location.href = '/dang-nhap';
        return;
      }
      set({ isLoading: false, error: error.message || error || 'Failed to create suppliers', success: null });
      throw error;
    }
  },

  /**
   * Update supplier information
   * @param {string} supplierId - Supplier ID
   * @param {Object} supplierData - Updated supplier data
   */
  updateSupplier: async (supplierId, supplierData) => {
    set({ isLoading: true, error: null, success: null });
    try {
      const updatedSupplier = await updateMySupplier(supplierId, supplierData);
      
      const supplierWithFormatting = {
        ...updatedSupplier,
        key: updatedSupplier._id,
        createdAt: updatedSupplier.createdAt ? moment(updatedSupplier.createdAt).format(DATE_FORMAT) : '',
        updatedAt: updatedSupplier.updatedAt ? moment(updatedSupplier.updatedAt).format(DATE_FORMAT) : '',
      };

      set((state) => ({
        suppliers: state.suppliers.map((supplier) =>
          supplier._id === supplierId ? supplierWithFormatting : supplier
        ),
        supplierDetail: state.supplierDetail?._id === supplierId ? supplierWithFormatting : state.supplierDetail,
        isLoading: false,
        error: null,
        success: 'Supplier updated successfully'
      }));

      return updatedSupplier;
    } catch (error) {
      if (error.status === 401) {
        window.location.href = '/dang-nhap';
        return;
      }
      set({ isLoading: false, error: error.message || error || 'Failed to update supplier', success: null });
      throw error;
    }
  },

  /**
   * Delete a supplier
   * @param {string} supplierId - Supplier ID
   */
  deleteSupplier: async (supplierId) => {
    set({ isLoading: true, error: null, success: null });
    try {
      await deleteMySupplier(supplierId);

      set((state) => ({
        suppliers: state.suppliers.filter((supplier) => supplier._id !== supplierId),
        isLoading: false,
        error: null,
        success: 'Supplier deleted successfully'
      }));
    } catch (error) {
      if (error.status === 401) {
        window.location.href = '/dang-nhap';
        return;
      }
      set({ isLoading: false, error: error.message || error || 'Failed to delete supplier', success: null });
      throw error;
    }
  },

  /**
   * Delete multiple suppliers in bulk
   * @param {Array} supplierIds - Array of supplier IDs
   */
  deleteSuppliersInBulk: async (supplierIds) => {
    set({ isLoading: true, error: null, success: null });
    try {
      const result = await deleteMySuppliersInBulk(supplierIds);

      set((state) => ({
        suppliers: state.suppliers.filter((supplier) => !supplierIds.includes(supplier._id)),
        isLoading: false,
        error: null,
        success: `${result.deletedCount} suppliers deleted successfully`
      }));

      return result;
    } catch (error) {
      if (error.status === 401) {
        window.location.href = '/dang-nhap';
        return;
      }
      set({ isLoading: false, error: error.message || error || 'Failed to delete suppliers', success: null });
      throw error;
    }
  },

  /**
   * Get supplier performance metrics
   * @param {string} supplierId - Supplier ID
   */
  fetchSupplierPerformance: async (supplierId) => {
    try {
      const performanceData = await getSupplierPerformance(supplierId);
      return performanceData;
    } catch (error) {
      if (error.status === 401) {
        window.location.href = '/dang-nhap';
        return;
      }
      throw error;
    }
  },

  /**
   * Update supplier performance metrics
   * @param {string} supplierId - Supplier ID
   * @param {Object} performanceData - Performance data
   */
  updateSupplierPerformance: async (supplierId, performanceData) => {
    try {
      const updatedPerformance = await updateSupplierPerformance(supplierId, performanceData);
      return updatedPerformance;
    } catch (error) {
      if (error.status === 401) {
        window.location.href = '/dang-nhap';
        return;
      }
      throw error;
    }
  },

  /**
   * Set suppliers data directly (for external updates)
   * @param {Array} suppliers - Suppliers array
   */
  setSuppliers: (suppliers) => {
    const updatedSuppliers = suppliers.map((item) => ({
      ...item,
      key: item._id,
      createdAt: item.createdAt ? moment(item.createdAt).format(DATE_FORMAT) : '',
      updatedAt: item.updatedAt ? moment(item.updatedAt).format(DATE_FORMAT) : '',
    }));

    set({ suppliers: updatedSuppliers });
  },

  /**
   * Set supplier editing state
   * @param {string} id - Supplier ID
   * @param {boolean} isEditing - Editing state
   */
  setSupplierIsEditing: (id, isEditing) => {
    set((state) => ({
      suppliers: state.suppliers.map((supplier) =>
        supplier._id === id ? { ...supplier, isEditing } : supplier
      )
    }));
  },

  // Clear states
  clearError: () => set({ error: null }),
  clearSuccess: () => set({ success: null }),
  clearSupplierDetail: () => set({ supplierDetail: null }),
}));

export default useSupplierStore;
