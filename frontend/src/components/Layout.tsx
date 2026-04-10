import { Outlet, useNavigate } from 'react-router-dom'
import Sidebar from './Sidebar'

interface LayoutProps {
  userName: string
  userRole: string
  isAdmin: boolean
  onLogout: () => void
}

export default function Layout({ userName, userRole, isAdmin, onLogout }: LayoutProps) {
  const navigate = useNavigate()

  const handleLogout = () => {
    onLogout()
    navigate('/login')
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar
        userName={userName}
        userRole={userRole}
        isAdmin={isAdmin}
        onLogout={handleLogout}
      />
      <main className="flex-1 ml-64">
        <Outlet />
      </main>
    </div>
  )
}
