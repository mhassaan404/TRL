import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  user: null,
  token: null,
  loading: false,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart: (state) => {
      state.loading = true
    },
    loginSuccess: (state, action) => {
      state.loading = false
      state.user = action.payload.user
      state.token = action.payload.token
    },
    logout: (state) => {
      state.user = null
      state.token = null
    },
  },
})

export const { loginStart, loginSuccess, logout } = authSlice.actions
export default authSlice.reducer
