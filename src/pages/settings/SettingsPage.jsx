import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { storeService } from '../../api/storeService'
import { useToast } from '../../context/ToastContext'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'

export default function SettingsPage() {
  const { store, loading, refreshStore } = useAuth()
  const { addToast } = useToast()
  const [form, setForm] = useState({
    name: store?.name || '',
    legal_name: store?.legal_name || '',
    tax_id: store?.tax_id || '',
    email: store?.email || '',
    phone: store?.phone || '',
    address: store?.address || '',
    currency: store?.currency || 'USD',
  })
  const [saving, setSaving] = useState(false)

  // === LOADER PREMIUM AQUÍ ===
  if (loading) return <Spinner fullContent />

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        ...form,
        email: form.email || undefined,
      }
      await storeService.updateStore(store.id, payload)
      await refreshStore()
      addToast('Configuración guardada', 'success')
    } catch (err) {
      addToast(err.response?.data?.detail || 'Error al guardar', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Configuración</h2>
        <p className="text-sm text-gray-500">Datos de tu tienda</p>
      </div>

      <div className="card p-6 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Nombre de la tienda *" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Input label="Razón social" value={form.legal_name} onChange={(e) => setForm({ ...form, legal_name: e.target.value })} />
            <Input label="RFC / Tax ID" value={form.tax_id} onChange={(e) => setForm({ ...form, tax_id: e.target.value })} />
            <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <Input label="Teléfono" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <Input label="Moneda" required maxLength={3} value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value.toUpperCase() })} />
          </div>
          <div>
            <label className="label">Dirección</label>
            <textarea className="input" rows={2} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </div>
          <Button type="submit" disabled={saving}>{saving ? 'Guardando...' : 'Guardar cambios'}</Button>
        </form>
      </div>
    </div>
  )
}