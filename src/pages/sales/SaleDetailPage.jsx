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

  if (loading) return <div className="flex justify-center py-12"><Spinner /></div>
  if (error) return <div className="text-red-600">{error}</div>
  if (!sale) return null

  const itemColumns = [
    { key: 'product', label: 'Producto', render: (row) => row.product?.name || row.product_id },
    { key: 'quantity', label: 'Cantidad' },
    { key: 'unit_price', label: 'Precio unitario', render: (row) => formatCurrency(row.unit_price) },
    { key: 'subtotal', label: 'Subtotal', render: (row) => formatCurrency(row.subtotal) },
  ]

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => navigate('/sales')}>← Volver a ventas</Button>

      <div className="card p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">Venta #{sale.number}</h2>
            <p className="text-sm text-gray-500">{formatDate(sale.created_at)}</p>
          </div>
          <Badge color="green">{sale.status}</Badge>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
          <div>
            <div className="text-xs text-gray-500">Cliente</div>
            <div className="font-medium">{sale.customer_name || 'Consumidor final'}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Método de pago</div>
            <div className="font-medium capitalize">{sale.payment_method}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Subtotal</div>
            <div className="font-medium">{formatCurrency(sale.subtotal)}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Total</div>
            <div className="font-bold text-teal-600 text-lg">{formatCurrency(sale.total)}</div>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <h3 className="text-lg font-semibold mb-4">Artículos</h3>
        <Table columns={itemColumns} data={sale.sale_items} />
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Factura</h3>
            {invoice ? (
              <div className="mt-2">
                <p>Factura #{invoice.invoice_number}</p>
                <p className="text-sm text-gray-500">{formatDate(invoice.issued_at)}</p>
              </div>
            ) : (
              <p className="text-sm text-gray-500">Esta venta no tiene factura asociada</p>
            )}
          </div>
          {!invoice && (
            <Button onClick={handleGenerateInvoice} disabled={generating}>
              {generating ? 'Generando...' : 'Generar factura'}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
