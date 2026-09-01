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

  // === LOADER EN EL ÁREA DE CONTENIDO ===
  if (loading) return <Spinner fullContent />
  if (error) return <div className="p-8 text-center text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg">{error}</div>
  if (!invoice) return null

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <Button variant="ghost" onClick={() => navigate('/invoices')} className="mb-6">← Volver a facturas</Button>

      {/* Contenedor del Documento */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
        
        {/* Encabezado con Gradiente Corporativo */}
        <div className="bg-gradient-to-r from-indigo-600 to-cyan-500 p-8 text-white flex justify-between items-start">
          <div>
            <div className="text-3xl font-extrabold tracking-tight">NexoERP</div>
            <p className="text-sm text-indigo-100 mt-1">Sistema de Gestión Empresarial</p>
          </div>
          <div className="text-right">
            <h2 className="text-2xl font-bold uppercase tracking-wider">Factura</h2>
            <div className="text-lg font-mono mt-1 bg-white/20 px-3 py-1 rounded-lg">#{invoice.invoice_number}</div>
            <div className="text-sm text-indigo-100 mt-2">{formatDate(invoice.issued_at)}</div>
          </div>
        </div>

        {/* Cuerpo de la Factura */}
        <div className="p-8">
          {/* Grid de Datos */}
          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Facturar a</p>
              <p className="text-lg font-semibold text-gray-800 dark:text-white">{invoice.customer_name || 'Consumidor final'}</p>
              {invoice.customer_tax_id && <p className="text-sm text-gray-500 dark:text-gray-400">RFC / Tax ID: {invoice.customer_tax_id}</p>}
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Empresa</p>
              <p className="text-lg font-semibold text-gray-800 dark:text-white">{invoice.store_name || 'Ferretería El Tornillo'}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">NIT: 900.123.456-7</p>
            </div>
          </div>

          {/* Tabla de Items */}
          <div className="mb-8 overflow-hidden border border-gray-200 dark:border-gray-700 rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 uppercase text-xs">
                <tr>
                  <th className="p-3 text-left font-semibold">Descripción</th>
                  <th className="p-3 text-center font-semibold">Cant.</th>
                  <th className="p-3 text-right font-semibold">Precio</th>
                  <th className="p-3 text-right font-semibold">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {invoice.items && invoice.items.length > 0 ? (
                  invoice.items.map((item, i) => (
                    <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="p-3 font-medium text-gray-800 dark:text-white">{item.name}</td>
                      <td className="p-3 text-center text-gray-600 dark:text-gray-300">{item.quantity}</td>
                      <td className="p-3 text-right text-gray-600 dark:text-gray-300">{formatCurrency(item.unit_price)}</td>
                      <td className="p-3 text-right font-semibold text-gray-800 dark:text-white">{formatCurrency(item.total)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="p-3 font-medium text-gray-800 dark:text-white">Venta de productos</td>
                    <td className="p-3 text-center text-gray-600 dark:text-gray-300">1</td>
                    <td className="p-3 text-right text-gray-600 dark:text-gray-300">{formatCurrency(invoice.subtotal)}</td>
                    <td className="p-3 text-right font-semibold text-gray-800 dark:text-white">{formatCurrency(invoice.subtotal)}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Totales */}
          <div className="flex justify-end">
            <div className="w-full max-w-xs space-y-3">
              <div className="flex justify-between text-gray-600 dark:text-gray-300">
                <span>Subtotal</span>
                <span className="font-medium">{formatCurrency(invoice.subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-600 dark:text-gray-300">
                <span>IVA (19%)</span>
                <span className="font-medium">{formatCurrency(invoice.tax)}</span>
              </div>
              <div className="flex justify-between text-xl font-extrabold text-gray-900 dark:text-white pt-3 border-t border-gray-200 dark:border-gray-700">
                <span>Total</span>
                <span className="text-indigo-600 dark:text-cyan-400">{formatCurrency(invoice.total)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Pie de página */}
        <div className="bg-gray-50 dark:bg-gray-900/50 p-6 text-center border-t border-gray-100 dark:border-gray-700">
          <p className="text-sm text-gray-500 mb-3">Gracias por su compra</p>
          {invoice.pdf_url && (
            <a href={invoice.pdf_url} target="_blank" rel="noreferrer" className="inline-block bg-indigo-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition-colors text-sm shadow-md">
              Descargar PDF
            </a>
          )}
        </div>
      </div>
    </div>
  )
}