import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { saleService } from '../../api/saleService'
import { invoiceService } from '../../api/invoiceService'
import Spinner from '../../components/ui/Spinner'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Table from '../../components/ui/Table'
import { formatCurrency, formatDate } from '../../utils/format'
import { useToast } from '../../context/ToastContext'

export default function SaleDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addToast } = useToast()
  const [sale, setSale] = useState(null)
  const [invoice, setInvoice] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const { data: saleData } = await saleService.getSale(id)
        setSale(saleData)
        try {
          const invoicesRes = await invoiceService.getInvoices({ limit: 100 })
          const foundInvoice = invoicesRes.data.find((inv) => inv.sale_id === id)
          setInvoice(foundInvoice || null)
        } catch {
          setInvoice(null)
        }
      } catch (err) {
        setError(err.response?.data?.detail || 'Error al cargar venta')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  const handleGenerateInvoice = async () => {
    setGenerating(true)
    try {
      const { data } = await saleService.generateInvoice(id)
      setInvoice(data)
      addToast('Factura generada', 'success')
    } catch (err) {
      addToast(err.response?.data?.detail || 'Error al generar factura', 'error')
    } finally {
      setGenerating(false)
    }
  }

  // === LOADER EN EL ÁREA DE CONTENIDO ===
  if (loading) return <Spinner fullContent />
  if (error) return <div className="p-8 text-center text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg">{error}</div>
  if (!sale) return null

  const itemColumns = [
    { key: 'product', label: 'Producto', render: (row) => <span className="font-medium text-gray-800 dark:text-white">{row.product?.name || row.product_id}</span> },
    { key: 'quantity', label: 'Cantidad', render: (row) => <span className="text-gray-500">{row.quantity}</span> },
    { key: 'unit_price', label: 'Precio Unit.', render: (row) => formatCurrency(row.unit_price) },
    { key: 'subtotal', label: 'Subtotal', render: (row) => <span className="font-semibold">{formatCurrency(row.subtotal)}</span> },
  ]

  return (
    <div className="max-w-5xl mx-auto py-6 space-y-6">
      <Button variant="ghost" onClick={() => navigate('/sales')} className="text-gray-500 hover:text-gray-700">← Volver a ventas</Button>

      {/* Cabecera de la Orden */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-cyan-500 p-6 text-white flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Orden #{sale.number}</h2>
            <p className="text-indigo-100 text-sm mt-1">{formatDate(sale.created_at)}</p>
          </div>
          <Badge color="green" className="bg-white/20 text-white capitalize">{sale.status}</Badge>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Cliente</p>
            <p className="font-semibold text-gray-800 dark:text-white">{sale.customer_name || 'Consumidor final'}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Método de Pago</p>
            <p className="font-semibold text-gray-800 dark:text-white capitalize">{sale.payment_method}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Total Pagado</p>
            <p className="font-extrabold text-2xl text-indigo-600 dark:text-cyan-400">{formatCurrency(sale.total)}</p>
          </div>
        </div>
      </div>

      {/* Artículos */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <h3 className="text-lg font-bold mb-4 text-gray-800 dark:text-white">Artículos Vendidos</h3>
        <Table columns={itemColumns} data={sale.sale_items} />
      </div>

      {/* Factura */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-bold text-gray-800 dark:text-white">Documento Fiscal</h3>
          {invoice ? (
            <div className="mt-2 text-sm">
              <p className="font-medium text-gray-700 dark:text-gray-300">Factura #{invoice.invoice_number}</p>
              <p className="text-gray-400">{formatDate(invoice.issued_at)}</p>
            </div>
          ) : (
            <p className="text-sm text-gray-400 mt-2">Esta venta no tiene factura asociada todavía.</p>
          )}
        </div>
        {invoice ? (
          <Button onClick={() => navigate(`/invoices/${invoice.id}`)} className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-white hover:bg-gray-200">
            Ver Factura
          </Button>
        ) : (
          <Button onClick={handleGenerateInvoice} disabled={generating} className="bg-gradient-to-r from-indigo-600 to-cyan-500 text-white">
            {generating ? 'Generando...' : 'Generar Factura'}
          </Button>
        )}
      </div>
    </div>
  )
}