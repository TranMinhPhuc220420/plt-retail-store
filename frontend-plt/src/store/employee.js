import { create } from 'zustand';

const useEmployeeStore = create((set) => ({
  employees: [],
  setEmployees: (employees) => set({ employees }),
  
  addEmployee: (employee) => {
    set((state) => ({
      employees: [...state.employees, employee],
    }));
  },

  deleteEmployee: (id) => {
    set((state) => ({
      employees: state.employees.filter((employee) => employee.id !== id),
    }));
  },

}));

export default useEmployeeStore;
export { useEmployeeStore };