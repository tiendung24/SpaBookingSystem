import { Navigate, useLocation } from 'react-router-dom'
import { useShop } from '../../context/ShopContext'

export function RequireRole({ allow, children }) {
  const { isAuthenticated, role } = useShop()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (!allow.includes(role)) {
    if (role === 'admin') return <Navigate to="/admin/dashboard" replace />
    return <Navigate to="/shop/dashboard" replace />
  }

  return children
}

export function GuestOnly({ children }) {
  const { isAuthenticated, role } = useShop()
  if (!isAuthenticated) return children
  if (role === 'admin') return <Navigate to="/admin/dashboard" replace />
  return <Navigate to="/shop/dashboard" replace />
}

