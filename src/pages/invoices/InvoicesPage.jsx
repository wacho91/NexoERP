import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { invoiceService } from '../../api/invoiceService'
import Table from '../../components/ui/Table'
import Spinner from '../../components/ui/Spinner'
import { formatCurrency, formatDate } from '../../utils/format'

export default function InvoicesPage() {
  const navigate = useNavigate()
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    invoiceService.getInvoices({ limit: 100 })
      .then(({ data }) => setInvoices(data))
      .catch((err) => setError(err.response?.data?.detail || 'Error al cargar facturas'))
      .finally(() => setLoading(false))
  }, [])

  const columns = [
    { key: 'invoice_number', label: 'No. Factura', render: (row) => <span className="font-medium">#{row.invoice_number}</span> },
    { key: 'sale_id', label: 'Venta', render: (row) => `#${row.sale_id?.slice(0, 8) || ''}` },
    { key: 'customer_name', label: 'Cliente', render: (row) => row.customer_name || 'Consumidor final' },
    { key: 'subtotal', label: 'Subtotal', render: (row) => formatCurrency(row.subtotal) },
    { key: 'tax', label: 'Impuesto', render: (row) => formatCurrency(row.tax) },
    { key: 'total', label: 'Total', render: (row) => <span className="font-semibold">{formatCurrency(row.total)}</span> },
    { key: 'issued_at', label: 'Fecha', render: (row) => formatDate(row.issued_at) },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Facturas</h2>
        <p className="text-sm text-gray-500">Documentos fiscales generados</p>
      </div>
      {loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : error ? (
        <div className="text-red-600">{error}</div>
      ) : (
        <div className="card overflow-hidden">
          <Table columns={columns} data={invoices} onRowClick={(row) => navigate(`/invoices/${row.id}`)} />
        </div>
      )}
    </div>
  )
}
