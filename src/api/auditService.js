import apiClient from './apiClient'

export const auditService = {
  getAuditLogs: (params) => apiClient.get('/api/v1/audit-logs', { params }),
}
