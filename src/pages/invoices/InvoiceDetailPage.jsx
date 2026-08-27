import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { invoiceService } from '../../api/invoiceService'
import Spinner from '../../components/ui/Spinner'
import Button from '../../components/ui/Button'
import { formatCurrency, formatDate } from '../../utils/format'

export default function InvoiceDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [invoice, setInvoice] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    invoiceService.getInvoice(id)
      .then(({ data }) => setInvoice(data))
      .catch((err) => setError(err.response?.data?.detail || 'Error al cargar factura'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="flex justify-center py-12"><Spinner /></div>
  if (error) return <div className="text-red-600">{error}</div>
  if (!invoice) return null

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => navigate('/invoices')}>← Volver a facturas</Button>

      <div className="card p-8 max-w-2xl mx-auto">
        <div className="flex justify-between items-start border-b pb-6">
          <div>
            <div className="text-3xl font-bold text-teal-600">NexoERP</div>
            <p className="text-sm text-gray-500 mt-1">Factura</p>
          </div>
          <div className="text-right">
            <div className="text-lg font-semibold">#{invoice.invoice_number}</div>
            <div className="text-sm text-gray-500">{formatDate(invoice.issued_at)}</div>
          </div>
        </div>

        <div className="py-6 border-b">
          <h3 className="text-xs font-medium text-gray-500 mb-2">FACTURAR A</h3>
          <div className="font-medium">{invoice.customer_name || 'Consumidor final'}</div>
          {invoice.customer_tax_id && <div className="text-sm text-gray-600">RFC: {invoice.customer_tax_id}</div>}
        </div>

        <div className="py-6 space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">Subtotal</span>
            <span>{formatCurrency(invoice.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Impuesto</span>
            <span>{formatCurrency(invoice.tax)}</span>
          </div>
          <div className="flex justify-between text-lg font-bold">
            <span>Total</span>
            <span className="text-teal-600">{formatCurrency(invoice.total)}</span>
          </div>
        </div>

        {invoice.pdf_url && (
          <div className="text-center pt-4">
            <a href={invoice.pdf_url} target="_blank" rel="noreferrer" className="text-teal-600 hover:text-teal-700 font-medium">
              Descargar PDF
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
