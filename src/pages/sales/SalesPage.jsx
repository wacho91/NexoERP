import { useNavigate } from 'react-router-dom'
import { useSales } from '../../hooks/useSales'
import Table from '../../components/ui/Table'
import Badge from '../../components/ui/Badge'
import Spinner from '../../components/ui/Spinner'
import { formatCurrency, formatDate } from '../../utils/format'

export default function SalesPage() {
  const navigate = useNavigate()
  const { sales, loading, error } = useSales({ limit: 100 })

  const columns = [
    { key: 'number', label: 'No. Orden', render: (row) => <span className="font-bold text-gray-800 dark:text-white">#{row.number}</span> },
    { key: 'created_at', label: 'Fecha', render: (row) => <span className="text-gray-500">{formatDate(row.created_at)}</span> },
    { key: 'customer_name', label: 'Cliente', render: (row) => <span className="font-medium">{row.customer_name || 'Consumidor final'}</span> },
    { key: 'subtotal', label: 'Subtotal', render: (row) => formatCurrency(row.subtotal) },
    { key: 'tax', label: 'Impuesto', render: (row) => <span className="text-gray-500">{formatCurrency(row.tax)}</span> },
    { key: 'total', label: 'Total', render: (row) => <span className="font-bold text-indigo-600 dark:text-cyan-400">{formatCurrency(row.total)}</span> },
    { key: 'payment_method', label: 'Pago', render: (row) => (
      <Badge color={row.payment_method === 'cash' ? 'green' : row.payment_method === 'card' ? 'blue' : 'yellow'}>
        {row.payment_method === 'cash' ? 'Efectivo' : row.payment_method === 'card' ? 'Tarjeta' : row.payment_method === 'transfer' ? 'Transferencia' : 'Mixto'}
      </Badge>
    )},
  ]

  // === LOADER EN EL ÁREA DE CONTENIDO ===
  if (loading) return <Spinner fullContent />
  if (error) return <div className="p-8 text-center text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg">{error}</div>

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Ventas</h2>
          <p className="text-sm text-gray-500">Historial de transacciones</p>
        </div>
      </div>

      {sales.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
          <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
          <h3 className="text-lg font-semibold text-gray-700 dark:text-white">No hay ventas registradas</h3>
          <p className="text-gray-400 text-sm mt-1">Cuando hagas una venta en el POS, aparecerá aquí.</p>
          <button onClick={() => navigate('/pos')} className="mt-6 bg-gradient-to-r from-indigo-600 to-cyan-500 text-white px-6 py-2.5 rounded-lg font-semibold shadow-md hover:shadow-lg transition">
            Ir al Punto de Venta
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <Table columns={columns} data={sales} onRowClick={(row) => navigate(`/sales/${row.id}`)} />
        </div>
      )}
    </div>
  )
}