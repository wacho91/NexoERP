import apiClient from './apiClient'

export const inventoryService = {
  getInventoryMovements: (params) => apiClient.get('/api/v1/inventory-movements', { params }),
  createInventoryMovement: (data) => apiClient.post('/api/v1/inventory-movements', data),
}
