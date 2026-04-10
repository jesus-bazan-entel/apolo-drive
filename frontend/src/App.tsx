import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useAuth } from '@/hooks/useAuth'
import Layout from '@/components/Layout'
import Login from '@/pages/Login'
import Dashboard from '@/pages/Dashboard'
import Admin from '@/pages/Admin'

export default function App() {
  const { user, loading, saveAuth, logout, isAdmin } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: { fontSize: '14px' },
        }}
      />
      <Routes>
        <Route
          path="/login"
          element={
            user ? <Navigate to="/" replace /> : <Login onLogin={saveAuth} />
          }
        />
        {user ? (
          <Route
            element={
              <Layout
                userName={user.full_name || user.email}
                userRole={user.role}
                isAdmin={isAdmin}
                onLogout={logout}
              />
            }
          >
            <Route path="/" element={<Dashboard />} />
            {isAdmin && <Route path="/admin" element={<Admin />} />}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        ) : (
          <Route path="*" element={<Navigate to="/login" replace />} />
        )}
      </Routes>
    </>
  )
}
