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
    { key: 'number', label: 'No.', render: (row) => <span className="font-medium">#{row.number}</span> },
    { key: 'created_at', label: 'Fecha', render: (row) => formatDate(row.created_at) },
    { key: 'customer_name', label: 'Cliente', render: (row) => row.customer_name || 'Consumidor final' },
    { key: 'subtotal', label: 'Subtotal', render: (row) => formatCurrency(row.subtotal) },
    { key: 'tax', label: 'Impuesto', render: (row) => formatCurrency(row.tax) },
    { key: 'total', label: 'Total', render: (row) => <span className="font-semibold">{formatCurrency(row.total)}</span> },
    { key: 'payment_method', label: 'Pago', render: (row) => (
      <Badge color={row.payment_method === 'cash' ? 'green' : row.payment_method === 'card' ? 'blue' : 'yellow'}>
        {row.payment_method === 'cash' ? 'Efectivo' : row.payment_method === 'card' ? 'Tarjeta' : row.payment_method === 'transfer' ? 'Transferencia' : 'Mixto'}
      </Badge>
    )},
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Ventas</h2>
        <p className="text-sm text-gray-500">Historial de transacciones</p>
      </div>
      {loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : error ? (
        <div className="text-red-600">{error}</div>
      ) : (
        <div className="card overflow-hidden">
          <Table columns={columns} data={sales} onRowClick={(row) => navigate(`/sales/${row.id}`)} />
        </div>
      )}
    </div>
  )
}
