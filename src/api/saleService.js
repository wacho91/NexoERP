import apiClient from './apiClient'

export const saleService = {
  getSales: (params) => apiClient.get('/api/v1/sales', { params }),
  getSale: (saleId) => apiClient.get(`/api/v1/sales/${saleId}`),
  createSale: (data) => apiClient.post('/api/v1/sales', data),
  generateInvoice: (saleId) => apiClient.post(`/api/v1/sales/${saleId}/invoice`),
}
