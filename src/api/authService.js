import apiClient from './apiClient'

export const authService = {
  register: (data) => apiClient.post('/stores', data),
  login: (credentials) => apiClient.post('/auth/login', credentials),
  getMe: () => apiClient.get('/auth/me'), // <-- Arreglado para coincidir con Swagger
  logout: (refreshToken) => apiClient.post('/auth/logout', { refresh_token: refreshToken }),
}