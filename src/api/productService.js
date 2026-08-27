import apiClient from './apiClient'

export const productService = {
  getProducts: (params) => apiClient.get('/api/v1/products', { params }),
  getProduct: (productId) => apiClient.get(`/api/v1/products/${productId}`),
  createProduct: (data) => apiClient.post('/api/v1/products', data),
  updateProduct: (productId, data) => apiClient.patch(`/api/v1/products/${productId}`, data),
  deleteProduct: (productId) => apiClient.delete(`/api/v1/products/${productId}`),
}
