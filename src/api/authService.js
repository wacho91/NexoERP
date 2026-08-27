import apiClient from './apiClient'

export const authService = {
  login: (credentials) => apiClient.post('/api/v1/auth/login', credentials),
  register: (storeData) => apiClient.post('/api/v1/stores', storeData),
  refresh: (refreshToken) => apiClient.post('/api/v1/auth/refresh', { refresh_token: refreshToken }),
  logout: (refreshToken) => apiClient.post('/api/v1/auth/logout', { refresh_token: refreshToken }),
  getMe: () => apiClient.get('/api/v1/auth/me'),
}
