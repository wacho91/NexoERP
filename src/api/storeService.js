import apiClient from './apiClient'

export const storeService = {
  getMyStore: () => apiClient.get('/api/v1/stores/me'),
  getStore: (storeId) => apiClient.get(`/api/v1/stores/${storeId}`),
  updateStore: (storeId, data) => apiClient.patch(`/api/v1/stores/${storeId}`, data),
}
