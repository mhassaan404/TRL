// src/services/auth.service.js
import api from '../api/axios' // your axios instance with interceptors

export const LAST_CLIENT_CODE = 'lastClientCode'

class AuthService {
  /**
   * Login with client (company) code + username/password
   * - Tokens are HttpOnly cookies (withCredentials: true); the server picks the client's database from them
   * - Stores only non-sensitive details: { username, role, clientCode, clientName }
   */
  async login(clientCode, username, password) {
    try {
      const response = await api.post('/Auth/login', {
        clientCode: clientCode.trim(),
        username: username.trim(),
        password: password.trim(),
      })

      const user = response.data.user || response.data
      localStorage.setItem('user', JSON.stringify(user))
      // Remembered to pre-fill the login form next time (not secret)
      if (user?.clientCode) localStorage.setItem(LAST_CLIENT_CODE, user.clientCode)

      return user
    } catch (error) {
      let message = 'Invalid username or password. Please try again.'

      if (error.response?.data?.message) {
        message = error.response.data.message
      } else if (error.response?.status === 401) {
        message = 'Invalid credentials'
      } else if (error.message.includes('Network')) {
        message = 'No response from server. Please check your network.'
      }

      throw new Error(message)
    }
  }

  /**
   * Logout - clear client-side data and call backend logout if needed
   */
  async logout() {
    try {
      await api.post('/Auth/logout') // optional backend logout endpoint
    } catch {
      // silent fail - clear anyway
    } finally {
      localStorage.removeItem('user')
      // Refresh token cookie is HttpOnly → browser clears on logout
      window.location.replace('#/login')
    }
  }

  /**
   * Get current user from localStorage (non-sensitive data only)
   */
  getCurrentUser() {
    const user = localStorage.getItem('user')
    return user ? JSON.parse(user) : null
  }

  /**
   * Check if user is authenticated (basic client check)
   * Note: real check should be done via protected API call
   */
  isAuthenticated() {
    return !!this.getCurrentUser()
  }
}

export default new AuthService()
