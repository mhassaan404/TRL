// import axios from "axios";
// import { API_BASE_URL } from "../config";

// const api = axios.create({
//   baseURL: API_BASE_URL,
//   withCredentials: true, // send HttpOnly cookies
// });

// let isRefreshing = false;
// let failedQueue = [];

// const processQueue = (error, token = null) => {
//   failedQueue.forEach(p => {
//     if (error) p.reject(error);
//     else p.resolve(token);
//   });
//   failedQueue = [];
// };

// api.interceptors.response.use(
//   res => res,
//   async error => {
//     const originalRequest = error.config;

//     // ❗ Don't retry refresh call
//     if (originalRequest.url.includes("/Auth/refresh")) {
//       return Promise.reject(error);
//     }

//     if (error.response?.status === 401 && !originalRequest._retry) {
//       if (isRefreshing) {
//         return new Promise((resolve, reject) => {
//           failedQueue.push({ resolve, reject });
//         }).then(() => api(originalRequest));
//       }

//       originalRequest._retry = true;
//       isRefreshing = true;

//       try {
//         await api.post("/Auth/refresh");
//         processQueue(null);
//         return api(originalRequest);
//       } catch (err) {
//         processQueue(err, null);
//         window.location.replace("#/login"); // NOW THIS WILL RUN
//         return Promise.reject(err);
//       } finally {
//         isRefreshing = false;
//       }
//     }

//     return Promise.reject(error);
//   }
// );

// export default api;

// src/api/axios.js
import axios from 'axios'
import { API_BASE_URL } from '../config'

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Important: sends HttpOnly cookies (refresh token)
  headers: {
    'Content-Type': 'application/json',
  },
})

// Flag & queue for refresh token flow
let isRefreshing = false
let failedQueue = []

// Helper to resolve/reject all queued requests
const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error)
    else prom.resolve(token)
  })
  failedQueue = []
}

// Response interceptor - handle 401 & refresh token
api.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config

    // Prevent infinite loop on refresh endpoint itself
    if (originalRequest.url.includes('/Auth/refresh')) {
      return Promise.reject(error)
    }

    // Handle 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Queue the request until refresh completes
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then(() => api(originalRequest))
          .catch((err) => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        // Call refresh endpoint (assumes it sets new access token in cookie or response)
        await api.post('/Auth/refresh')

        // Refresh succeeded → retry original request
        processQueue(null)
        return api(originalRequest)
      } catch (refreshError) {
        // Refresh failed → logout & redirect
        processQueue(refreshError, null)

        // Clear auth data & redirect to login
        localStorage.removeItem('token') // if you store access token
        localStorage.removeItem('user')
        window.location.replace('#/login') // or use navigate if in component

        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    // All other errors pass through
    return Promise.reject(error)
  },
)

// Optional: Request interceptor - add Authorization header if token exists
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

export default api
