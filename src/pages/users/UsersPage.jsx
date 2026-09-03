import { useState, useEffect } from 'react'
import { userService } from '../../api/userService'
import { useToast } from '../../context/ToastContext'
import { useAuth } from '../../context/AuthContext'
import Table from '../../components/ui/Table'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import Input from '../../components/ui/Input'
import Spinner from '../../components/ui/Spinner'
import { formatDate } from '../../utils/format'

export default function UsersPage() {
  const { user: currentUser } = useAuth()
  const { addToast } = useToast()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [form, setForm] = useState({ email: '', full_name: '', password: '', role: 'cashier' })
  const [saving, setSaving] = useState(false)

  const loadUsers = async () => {
    setLoading(true)
    try {
      const { data } = await userService.getUsers({ limit: 100 })
      setUsers(data)
      setError(null)
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al cargar usuarios')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadUsers() }, [])

  const openCreate = () => {
    setEditingUser(null)
    setForm({ email: '', full_name: '', password: '', role: 'cashier' })
    setShowModal(true)
  }

  const openEdit = (user) => {
    setEditingUser(user)
    setForm({ email: user.email, full_name: user.full_name, password: '', role: user.role })
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (editingUser) {
        const payload = {
          email: form.email,
          full_name: form.full_name,
          role: form.role,
        }
        if (form.password) payload.password = form.password
        await userService.updateUser(editingUser.id, payload)
        addToast('Usuario actualizado', 'success')
      } else {
        const payload = {
          email: form.email,
          full_name: form.full_name,
          password: form.password,
          role: form.role,
        }
        await userService.createUser(payload)
        addToast('Usuario creado', 'success')
      }
      setShowModal(false)
      loadUsers()
    } catch (err) {
      addToast(err.response?.data?.detail || 'Error al guardar usuario', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (user) => {
    if (user.id === currentUser?.id) {
      addToast('No puedes eliminar tu propia cuenta', 'error')
      return
    }
    if (window.confirm(`¿Desactivar al usuario "${user.full_name}"?`)) {
      try {
        await userService.deleteUser(user.id)
        addToast('Usuario desactivado', 'success')
        loadUsers()
      } catch (err) {
        addToast(err.response?.data?.detail || 'Error al desactivar usuario', 'error')
      }
    }
  }

  const columns = [
    { key: 'full_name', label: 'Nombre', render: (row) => (
      <div>
        <div className="font-medium text-gray-900">{row.full_name}</div>
        <div className="text-xs text-gray-500">{row.email}</div>
      </div>
    )},
    { key: 'role', label: 'Rol', render: (row) => (
      <Badge color={row.role === 'admin' ? 'teal' : row.role === 'cashier' ? 'blue' : row.role === 'accountant' ? 'yellow' : 'gray'}>
        {row.role === 'admin' ? 'Administrador' : row.role === 'cashier' ? 'Cajero' : row.role === 'accountant' ? 'Contador' : 'Visitante'}
      </Badge>
    )},
    { key: 'active', label: 'Estado', render: (row) => row.active ? <Badge color="green">Activo</Badge> : <Badge color="red">Inactivo</Badge> },
    { key: 'last_login_at', label: 'Último acceso', render: (row) => row.last_login_at ? formatDate(row.last_login_at) : 'Nunca' },
    { key: 'actions', label: 'Acciones', render: (row) => (
      <div className="flex gap-2">
        <Button size="sm" variant="ghost" onClick={() => openEdit(row)}>Editar</Button>
        {row.active && (
          <Button size="sm" variant="danger" onClick={() => handleDelete(row)}>Desactivar</Button>
        )}
      </div>
    )},
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Usuarios</h2>
          <p className="text-sm text-gray-500">Gestiona el acceso al sistema</p>
        </div>
        <Button onClick={openCreate}>Nuevo usuario</Button>
      </div>

      {/* === LOADER PREMIUM AQUÍ === */}
      {loading ? (
        <Spinner fullContent />
      ) : error ? (
        <div className="text-red-600 p-4 bg-red-50 rounded-lg">{error}</div>
      ) : (
        <div className="card overflow-hidden">
          <Table columns={columns} data={users} />
        </div>
      )}

      <Modal open={showModal} title={editingUser ? 'Editar usuario' : 'Nuevo usuario'} onClose={() => setShowModal(false)}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Nombre completo *" required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
          <Input label="Email *" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input
            label={editingUser ? 'Contraseña (dejar vacío para no cambiar)' : 'Contraseña *'}
            type="password"
            required={!editingUser}
            minLength={6}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          <div>
            <label className="label">Rol</label>
            <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="cashier">Cajero</option>
              <option value="admin">Administrador</option>
              <option value="accountant">Contador</option>
              <option value="viewer">Visitante</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}