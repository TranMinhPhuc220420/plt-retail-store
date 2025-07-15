import { create } from 'zustand';

const useStoreApp = create((set) => ({
  storeActive: null,
  storeActiveIsLoading: false,
  isFetchingStoreActiveError: false,
  messageStoreActiveError: '',

  setStoreActive: (store) => set({ storeActive: store }),
  clearStoreActive: () => set({ storeActive: null }),
  setStoreActiveIsLoading: (isLoading) => set({ storeActiveIsLoading: isLoading }),
  setIsFetchingStoreActiveError: (isError) => set({ isFetchingStoreActiveError: isError }),
  setMessageStoreActiveError: (message) => set({ messageStoreActiveError: message }),
}));

export default useStoreApp;