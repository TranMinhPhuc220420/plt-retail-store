import { create } from 'zustand';

const useStoreApp = create((set) => ({
  storeActive: null,
  storeActiveIsLoading: false,
  isFetchingStoreActiveError: false,
  messageStoreActiveError: '',
  sidebarClosed: false,

  setStoreActive: (store) => set({ storeActive: store }),
  clearStoreActive: () => set({ storeActive: null }),
  setStoreActiveIsLoading: (isLoading) => set({ storeActiveIsLoading: isLoading }),
  setIsFetchingStoreActiveError: (isError) => set({ isFetchingStoreActiveError: isError }),
  setMessageStoreActiveError: (message) => set({ messageStoreActiveError: message }),

  toggleSidebar: () => {
    set((state) => {
      const newState = !state.sidebarClosed;
      // Save to storage
      localStorage.setItem('sidebarClosed', newState);
      return { sidebarClosed: newState };
    });
  },
  setSidebarClosed: (closed) => {
    set({ sidebarClosed: closed });
    // Save to storage
    localStorage.setItem('sidebarClosed', closed);
  },
}));

export default useStoreApp;