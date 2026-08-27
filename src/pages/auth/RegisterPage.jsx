import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'

export default function RegisterPage() {
  const { register } = useAuth()
  const { addToast } = useToast()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '',
    legal_name: '',
    tax_id: '',
    email: '',
    currency: 'USD',
    phone: '',
    address: '',
    admin_full_name: '',
    admin_email: '',
    admin_password: '',
    admin_password2: '',
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.admin_password !== form.admin_password2) {
      addToast('Las contraseñas no coinciden', 'error')
      return
    }
    setLoading(true)
    try {
      const payload = {
        name: form.name,
        legal_name: form.legal_name || undefined,
        tax_id: form.tax_id || undefined,
        email: form.email || undefined,
        currency: form.currency,
        phone: form.phone || undefined,
        address: form.address || undefined,
        admin_full_name: form.admin_full_name,
        admin_email: form.admin_email,
        admin_password: form.admin_password,
      }
      await register(payload)
      addToast('Tienda creada correctamente', 'success')
      navigate('/')
    } catch (error) {
      addToast(error.response?.data?.detail || 'Error al crear la tienda', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-teal-600 rounded-xl flex items-center justify-center mx-auto mb-3 text-white font-bold text-2xl">
            N
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Crear cuenta NexoERP</h1>
          <p className="text-sm text-gray-500">Configura tu tienda en menos de 5 minutos</p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Información de la tienda</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Nombre de la tienda *" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                <Input label="Razón social" value={form.legal_name} onChange={(e) => setForm({ ...form, legal_name: e.target.value })} />
                <Input label="RFC / Tax ID" value={form.tax_id} onChange={(e) => setForm({ ...form, tax_id: e.target.value })} />
                <Input label="Email de contacto" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                <Input label="Teléfono" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                <Input label="Moneda *" required maxLength={3} value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value.toUpperCase() })} />
              </div>
              <div className="mt-4">
                <label className="label">Dirección</label>
                <textarea className="input" rows={2} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Cuenta de administrador</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Nombre completo *" required value={form.admin_full_name} onChange={(e) => setForm({ ...form, admin_full_name: e.target.value })} />
                <Input label="Email *" type="email" required value={form.admin_email} onChange={(e) => setForm({ ...form, admin_email: e.target.value })} />
                <Input label="Contraseña *" type="password" required minLength={6} value={form.admin_password} onChange={(e) => setForm({ ...form, admin_password: e.target.value })} />
                <Input label="Confirmar contraseña *" type="password" required minLength={6} value={form.admin_password2} onChange={(e) => setForm({ ...form, admin_password2: e.target.value })} />
              </div>
            </div>

            <Button type="submit" disabled={loading} size="lg" className="w-full">
              {loading ? 'Creando...' : 'Crear tienda y cuenta'}
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-600 mt-4">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="text-teal-600 hover:text-teal-700 font-medium">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  )
}
