import { useState, useEffect } from 'react'
import {
  UserPlus,
  Trash2,
  Shield,
  User as UserIcon,
  Eye,
  EyeOff,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { getUsers, createUser, updateUser, deleteUser } from '@/lib/api'
import type { User } from '@/types'

export default function Admin() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'user',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [creating, setCreating] = useState(false)

  const loadUsers = async () => {
    try {
      const data = await getUsers()
      setUsers(data)
    } catch (err: any) {
      toast.error('Error al cargar usuarios')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.email || !formData.password || !formData.full_name) {
      toast.error('Completa todos los campos')
      return
    }
    if (formData.password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres')
      return
    }

    setCreating(true)
    try {
      await createUser(formData)
      toast.success('Usuario creado exitosamente')
      setFormData({ email: '', password: '', full_name: '', role: 'user' })
      setShowCreateForm(false)
      loadUsers()
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Error al crear usuario'
      toast.error(msg)
    } finally {
      setCreating(false)
    }
  }

  const handleToggleActive = async (user: User) => {
    try {
      await updateUser(user.id, { is_active: !user.is_active })
      toast.success(
        user.is_active ? 'Usuario desactivado' : 'Usuario activado'
      )
      loadUsers()
    } catch {
      toast.error('Error al actualizar usuario')
    }
  }

  const handleToggleRole = async (user: User) => {
    const newRole = user.role === 'admin' ? 'user' : 'admin'
    try {
      await updateUser(user.id, { role: newRole })
      toast.success(`Rol cambiado a ${newRole}`)
      loadUsers()
    } catch {
      toast.error('Error al cambiar rol')
    }
  }

  const handleDelete = async (user: User) => {
    if (!confirm(`¿Eliminar al usuario "${user.full_name || user.email}"? Esta acción no se puede deshacer.`))
      return
    try {
      await deleteUser(user.id)
      toast.success('Usuario eliminado')
      loadUsers()
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Error al eliminar usuario'
      toast.error(msg)
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Usuarios</h1>
          <p className="text-sm text-gray-500 mt-1">
            Administra los usuarios que pueden acceder a Apolo Drive
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition"
        >
          <UserPlus className="w-4 h-4" />
          Nuevo usuario
        </button>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Crear nuevo usuario</h2>
          <form onSubmit={handleCreate} className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre completo
              </label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="Juan Pérez"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="juan@email.com"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="user">Usuario</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
            <div className="col-span-2 flex justify-end gap-2 mt-2">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={creating}
                className="px-6 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
              >
                {creating ? 'Creando...' : 'Crear usuario'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Users Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 text-left">
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuario
                </th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider w-28">
                  Rol
                </th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                  Estado
                </th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider w-36">
                  Creado
                </th>
                <th className="px-4 py-3 w-28" />
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                        {user.role === 'admin' ? (
                          <Shield className="w-4 h-4 text-blue-600" />
                        ) : (
                          <UserIcon className="w-4 h-4 text-gray-500" />
                        )}
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {user.full_name || '—'}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{user.email}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleToggleRole(user)}
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition ${
                        user.role === 'admin'
                          ? 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {user.role === 'admin' ? 'Admin' : 'Usuario'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleToggleActive(user)}
                      className="flex items-center"
                      title={user.is_active ? 'Desactivar' : 'Activar'}
                    >
                      {user.is_active ? (
                        <ToggleRight className="w-7 h-7 text-green-500" />
                      ) : (
                        <ToggleLeft className="w-7 h-7 text-gray-300" />
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {new Date(user.created_at).toLocaleDateString('es-ES')}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleDelete(user)}
                      className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-600 transition"
                      title="Eliminar usuario"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-gray-400 text-sm">
                    No hay usuarios registrados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-gray-400 mt-4">{users.length} usuario(s) total</p>
    </div>
  )
}
