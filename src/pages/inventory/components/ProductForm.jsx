import { useState } from 'react'
import { productService } from '../../../api/productService'
import { useToast } from '../../../context/ToastContext'
import Input from '../../../components/ui/Input'
import Button from '../../../components/ui/Button'

export default function ProductForm({ initialData, onSuccess, onCancel }) {
  const { addToast } = useToast()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    sku: initialData?.sku || '',
    barcode: initialData?.barcode || '',
    name: initialData?.name || '',
    description: initialData?.description || '',
    category: initialData?.category || '',
    price: initialData?.price || '',
    cost: initialData?.cost ?? '',
    stock_quantity: initialData?.stock_quantity ?? 0,
    min_stock: initialData?.min_stock ?? 0,
    image_url: initialData?.image_url || '',
    active: initialData?.active ?? true,
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    const payload = {
      ...form,
      price: parseFloat(form.price) || 0,
      cost: form.cost === '' ? undefined : parseFloat(form.cost),
      stock_quantity: parseInt(form.stock_quantity) || 0,
      min_stock: parseInt(form.min_stock) || 0,
      active: Boolean(form.active),
    }

    try {
      if (initialData) {
        await productService.updateProduct(initialData.id, payload)
        addToast('Producto actualizado', 'success')
      } else {
        await productService.createProduct(payload)
        addToast('Producto creado', 'success')
      }
      onSuccess()
    } catch (error) {
      addToast(error.response?.data?.detail || 'Error al guardar producto', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="Nombre *" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <Input label="SKU" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
        <Input label="Código de barras" value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} />
        <Input label="Categoría" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
        <Input label="Precio de venta *" type="number" step="0.01" min="0" required value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
        <Input label="Costo" type="number" step="0.01" min="0" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} />
        <Input label="Stock inicial" type="number" min="0" value={form.stock_quantity} onChange={(e) => setForm({ ...form, stock_quantity: e.target.value })} />
        <Input label="Stock mínimo" type="number" min="0" value={form.min_stock} onChange={(e) => setForm({ ...form, min_stock: e.target.value })} />
        <Input label="URL de imagen" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} />
        <div>
          <label className="label">Estado</label>
          <select className="input" value={form.active} onChange={(e) => setForm({ ...form, active: e.target.value === 'true' })}>
            <option value="true">Activo</option>
            <option value="false">Inactivo</option>
          </select>
        </div>
      </div>
      <div>
        <label className="label">Descripción</label>
        <textarea className="input" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      </div>
      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={loading}>{loading ? 'Guardando...' : 'Guardar'}</Button>
      </div>
    </form>
  )
}
