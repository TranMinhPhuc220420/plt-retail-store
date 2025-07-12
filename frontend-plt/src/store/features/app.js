import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  collapsedSider: false,
}

export const counterSlice = createSlice({
  name: 'app_manager',
  initialState,
  reducers: {
    toggleSider: (state) => {
      state.collapsedSider = !state.collapsedSider
    },
  },
})

export const {
  toggleSider,
} = counterSlice.actions;

export default counterSlice.reducer