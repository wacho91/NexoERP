import apiClient from './apiClient'

export const authService = {
  register: (data) => apiClient.post('/stores', data), // <-- ¡AQUÍ ESTÁ EL ERROR! Que no tenga /api/v1 al principio
  login: (credentials) => apiClient.post('/auth/login', credentials),
  getMe: () => apiClient.get('/users/me'),
  logout: (refreshToken) => apiClient.post('/auth/logout', { refresh_token: refreshToken }),
}