import { useNavigate, useLocation } from 'react-router-dom'
import {
  HardDrive,
  FolderOpen,
  Users,
  LogOut,
  Shield,
} from 'lucide-react'

interface SidebarProps {
  userName: string
  userRole: string
  isAdmin: boolean
  onLogout: () => void
}

export default function Sidebar({ userName, userRole, isAdmin, onLogout }: SidebarProps) {
  const navigate = useNavigate()
  const location = useLocation()

  const navItems = [
    { path: '/', label: 'Archivos', icon: FolderOpen },
    ...(isAdmin ? [{ path: '/admin', label: 'Usuarios', icon: Users }] : []),
  ]

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-screen fixed left-0 top-0">
      {/* Header */}
      <div className="p-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
            <HardDrive className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-gray-900 text-lg leading-tight">Apolo Drive</h1>
            <p className="text-xs text-gray-400">File Server</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = location.pathname === item.path
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                active
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </button>
          )
        })}
      </nav>

      {/* User info */}
      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center">
            <span className="text-sm font-semibold text-gray-600">
              {userName?.charAt(0)?.toUpperCase() || '?'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{userName}</p>
            <div className="flex items-center gap-1">
              {isAdmin && <Shield className="w-3 h-3 text-blue-600" />}
              <p className="text-xs text-gray-400 capitalize">{userRole}</p>
            </div>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 transition"
        >
          <LogOut className="w-4 h-4" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
