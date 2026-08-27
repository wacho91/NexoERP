import { useState } from 'react'
import { inventoryService } from '../../../api/inventoryService'
import { useToast } from '../../../context/ToastContext'
import Input from '../../../components/ui/Input'
import Button from '../../../components/ui/Button'

export default function StockAdjustModal({ product, onSuccess, onCancel }) {
  const { addToast } = useToast()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    type: 'adjustment',
    quantity: 0,
    reason: '',
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.quantity === 0) {
      addToast('La cantidad no puede ser cero', 'error')
      return
    }
    setLoading(true)
    try {
      await inventoryService.createInventoryMovement({
        product_id: product.id,
        type: form.type,
        quantity: parseInt(form.quantity),
        reason: form.reason || undefined,
      })
      addToast('Stock ajustado', 'success')
      onSuccess()
    } catch (error) {
      addToast(error.response?.data?.detail || 'Error al ajustar stock', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <div className="text-sm font-medium text-gray-700">Producto: {product?.name}</div>
        <div className="text-xs text-gray-500">Stock actual: {product?.stock_quantity}</div>
      </div>
      <div>
        <label className="label">Tipo de movimiento</label>
        <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
          <option value="adjustment">Ajuste</option>
          <option value="purchase">Compra</option>
          <option value="return">Devolución</option>
        </select>
      </div>
      <Input
        label="Cantidad"
        type="number"
        required
        value={form.quantity}
        onChange={(e) => setForm({ ...form, quantity: e.target.value })}
      />
      <Input label="Motivo" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={loading}>{loading ? 'Ajustando...' : 'Ajustar stock'}</Button>
      </div>
    </form>
  )
}
