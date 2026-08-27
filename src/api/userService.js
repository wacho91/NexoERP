import apiClient from './apiClient'

export const userService = {
  getUsers: (params) => apiClient.get('/api/v1/users', { params }),
  createUser: (data) => apiClient.post('/api/v1/users', data),
  updateUser: (userId, data) => apiClient.patch(`/api/v1/users/${userId}`, data),
  deleteUser: (userId) => apiClient.delete(`/api/v1/users/${userId}`),
}
