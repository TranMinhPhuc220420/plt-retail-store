import { configureStore } from '@reduxjs/toolkit'

import appReducer from '@/store/features/app';
import employeeReducer from '@/store/features/employee';

export const store = configureStore({
  reducer: {
    app: appReducer,
    employee: employeeReducer,
  },
})