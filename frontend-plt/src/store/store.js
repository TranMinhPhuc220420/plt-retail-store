import { DATETIME_FORMAT } from '@/constant';
import { getMyStores } from '@/request/store';
import moment from 'moment';
import { create } from 'zustand';

const useStoreStore = create((set) => ({
  isLoading: false,
  error: null,
  success: null,
  
  stores: [],

  setIsLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setSuccess: (success) => set({ success }),

  fetchStores: async () => {
    set({ isLoading: true, error: null, success: null });
    try {
      const data = await getMyStores();
      const stores = data.map((item) => ({
        ...item,
        key: item._id,
        createdAt: item.createdAt ? moment(item.createdAt).format(DATETIME_FORMAT) : '',
        updatedAt: item.updatedAt ? moment(item.updatedAt).format(DATETIME_FORMAT) : '',
      }));

      set({ stores, isLoading: false, error: null, success: 'MY_STORES_FETCHED' });

    } catch (error) {
      if (error.status === 401) {
        window.location.href = '/dang-nhap';
        return;
      }
      
      set({ isLoading: false, error: error.message || 'MSG_FAILED_TO_FETCH_MY_STORES', success: null });
    }
  },
  
  setStores: (stores) => set({ stores }),
}));

export default useStoreStore;