import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  employees: [],
}

export const counterSlice = createSlice({
  name: 'app_manager',
  initialState,
  reducers: {
    setEmployees: (state, action) => {
      state.employees = action.payload
    }
  },
})

export const {
  setEmployees
} = counterSlice.actions;

export default counterSlice.reducer