import { create } from 'zustand';

const useStoreStore = create((set) => ({
  stores: [],
  setStores: (stores) => set({ stores }),
  
  addStore: (Store) => {
    set((state) => ({
      stores: [...state.stores, store],
    }));
  },

  deleteStore: (id) => {
    set((state) => ({
      stores: state.stores.filter((store) => store.id !== id),
    }));
  },

}));

export default useStoreStore;