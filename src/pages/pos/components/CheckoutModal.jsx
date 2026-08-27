import { useState } from 'react'
import Modal from '../../../components/ui/Modal'
import Input from '../../../components/ui/Input'
import Button from '../../../components/ui/Button'
import { saleService } from '../../../api/saleService'
import { useToast } from '../../../context/ToastContext'

export default function CheckoutModal({ open, cart, totals, onClose, onSuccess }) {
  const { addToast } = useToast()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    customer_name: '',
    customer_tax_id: '',
    payment_method: 'cash',
    tax_rate: 0,
    generate_invoice: true,
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = {
        customer_name: form.customer_name || undefined,
        customer_tax_id: form.customer_tax_id || undefined,
        payment_method: form.payment_method,
        tax_rate: parseFloat(form.tax_rate) || 0,
        generate_invoice: form.generate_invoice,
        items: cart.map((i) => ({ product_id: i.product_id, quantity: i.quantity })),
      }
      await saleService.createSale(payload)
      onSuccess()
    } catch (error) {
      addToast(error.response?.data?.detail || 'Error al procesar venta', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} title="Confirmar venta" onClose={onClose} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="text-sm">
          <div className="flex justify-between py-1">
            <span>Artículos</span>
            <span className="font-medium">{cart.length}</span>
          </div>
          <div className="flex justify-between py-1">
            <span>Subtotal</span>
            <span className="font-medium">{new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(totals.subtotal)}</span>
          </div>
          <div className="flex justify-between py-1 font-bold">
            <span>Total</span>
            <span className="text-teal-600">{new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(totals.total)}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Cliente" value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} />
          <Input label="RFC del cliente" value={form.customer_tax_id} onChange={(e) => setForm({ ...form, customer_tax_id: e.target.value })} />
          <div>
            <label className="label">Método de pago</label>
            <select className="input" value={form.payment_method} onChange={(e) => setForm({ ...form, payment_method: e.target.value })}>
              <option value="cash">Efectivo</option>
              <option value="card">Tarjeta</option>
              <option value="transfer">Transferencia</option>
              <option value="mixed">Mixto</option>
            </select>
          </div>
          <Input label="Impuesto (%)" type="number" min="0" max="100" value={form.tax_rate} onChange={(e) => setForm({ ...form, tax_rate: e.target.value })} />
        </div>

        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={form.generate_invoice}
            onChange={(e) => setForm({ ...form, generate_invoice: e.target.checked })}
            className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
          />
          Generar factura
        </label>

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Procesando...' : 'Confirmar venta'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
