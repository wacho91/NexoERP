import apiClient from './apiClient'

export const invoiceService = {
  getInvoices: (params) => apiClient.get('/api/v1/invoices', { params }),
  getInvoice: (invoiceId) => apiClient.get(`/api/v1/invoices/${invoiceId}`),
}
