import apiClient from './apiClient'

export const storeService = {
  getMyStore: () => apiClient.get('/stores/me'),
  getStore: (storeId) => apiClient.get(`/stores/${storeId}`),
  updateStore: (storeId, data) => apiClient.patch(`/stores/${storeId}`, data),
}