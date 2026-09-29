import axios from 'axios'
import { API_BASE_URL } from '../config'

// Auth lives in HttpOnly cookies (access + refresh token), so every request sends credentials.
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Flag & queue for the refresh-token flow: while one refresh runs, other 401s wait for it
let isRefreshing = false
let failedQueue = []

const processQueue = (error) => {
  failedQueue.forEach((prom) => (error ? prom.reject(error) : prom.resolve()))
  failedQueue = []
}

// On 401: refresh the session once and retry; if the refresh fails, send the user to the login page
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // Never refresh for the refresh call itself, and a failed login is not an expired session
    if (originalRequest.url.includes('/Auth/refresh') || originalRequest.url.includes('/Auth/login')) {
      return Promise.reject(error)
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then(() => api(originalRequest))
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        await api.post('/Auth/refresh')
        processQueue(null)
        return api(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError)
        localStorage.removeItem('user')
        window.location.replace('#/login')
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  },
)

// The message to show for a failed call: the API's own message (ApiResponse errorMessage/message),
// a clear network message, or the given fallback. Never raw exception text.
export const getErrorMessage = (err, fallback = 'Something went wrong. Please try again.') => {
  const data = err?.response?.data
  if (data && typeof data === 'object' && (data.errorMessage || data.message)) return data.errorMessage || data.message
  if (err?.response?.status === 403) return "You don't have permission to do this."
  if (err?.response) return fallback
  if (err?.message === 'Network Error') return 'Cannot reach the server. Check your connection and try again.'
  return err?.message || fallback
}

// For calls that change data. Returns the response body, or throws an Error whose message is the API's
// message. Services don't toast these errors: the screen that started the action shows err.message once.
export const request = async (call, fallback) => {
  try {
    const res = await call()
    if (res.data?.isSuccess === false) throw new Error(res.data.errorMessage || res.data.message || fallback)
    return res.data
  } catch (err) {
    if (err?.isAxiosError) throw new Error(getErrorMessage(err, fallback))
    throw err
  }
}

export default api
