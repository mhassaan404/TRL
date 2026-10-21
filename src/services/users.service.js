import api, { request } from '../api/axios'

// Users page (Super Admin only): staff users, their permissions and password resets
export const usersService = {
  getAll: () => request(() => api.get('/Users/GetAll'), 'Failed to load users'),

  create: ({ username, fullName, email, phone, password, confirmPassword, permissions }) =>
    request(
      () =>
        api.post('/Users/Create', {
          username,
          fullName,
          email,
          phone,
          password,
          confirmPassword,
          permissions,
        }),
      'The user could not be created',
    ),

  update: ({ userId, fullName, email, phone, isActive, permissions }) =>
    request(
      () => api.post('/Users/Update', { userId, fullName, email, phone, isActive, permissions }),
      'The user could not be saved',
    ),

  resetPassword: ({ userId, newPassword, confirmPassword }) =>
    request(
      () => api.post('/Users/ResetPassword', { userId, newPassword, confirmPassword }),
      'The password could not be changed',
    ),
}
