import { useState, useEffect } from 'react'
import { auditService } from '../../api/auditService'
import Table from '../../components/ui/Table'
import Badge from '../../components/ui/Badge'
import Spinner from '../../components/ui/Spinner'
import { formatDate } from '../../utils/format'

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    auditService.getAuditLogs({ limit: 100 })
      .then(({ data }) => setLogs(data))
      .catch((err) => setError(err.response?.data?.detail || 'Error al cargar logs'))
      .finally(() => setLoading(false))
  }, [])

  const columns = [
    { key: 'created_at', label: 'Fecha', render: (row) => formatDate(row.created_at) },
    { key: 'action', label: 'Acción', render: (row) => (
      <Badge color={row.action.includes('create') ? 'green' : row.action.includes('delete') ? 'red' : 'blue'}>
        {row.action}
      </Badge>
    )},
    { key: 'entity_type', label: 'Entidad', render: (row) => row.entity_type },
    { key: 'entity_id', label: 'ID', render: (row) => row.entity_id ? row.entity_id.slice(0, 8) : '—' },
    { key: 'details', label: 'Detalles', render: (row) => (
      <span className="text-xs font-mono">{JSON.stringify(row.details) || '{}'}</span>
    )},
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Auditoría</h2>
        <p className="text-sm text-gray-500">Registro de acciones del sistema</p>
      </div>
      {loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : error ? (
        <div className="text-red-600">{error}</div>
      ) : (
        <div className="card overflow-hidden">
          <Table columns={columns} data={logs} />
        </div>
      )}
    </div>
  )
}
