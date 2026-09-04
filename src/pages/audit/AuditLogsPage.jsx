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

  // === LÓGICA DE PAGINACIÓN ===
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 6
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentLogs = logs.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(logs.length / itemsPerPage)
  // ============================

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
        <Spinner fullContent />
      ) : error ? (
        <div className="text-red-600 p-4 bg-red-50 rounded-lg">{error}</div>
      ) : (
        <>
          <div className="card overflow-hidden">
            <Table columns={columns} data={currentLogs} />
          </div>
          
          {/* === BOTONES DE PAGINACIÓN === */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-6">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 text-sm font-semibold border border-gray-200 dark:border-gray-700 rounded-lg disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
              >
                ← Anterior
              </button>
              <span className="text-sm font-bold bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-4 py-2 rounded-lg">
                Página {currentPage} de {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 text-sm font-semibold border border-gray-200 dark:border-gray-700 rounded-lg disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
              >
                Siguiente →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}