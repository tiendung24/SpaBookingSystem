import { Navigate, useLocation } from 'react-router-dom'
import { useShop } from '../../context/ShopContext'

export function RequireRole({ allow, children }) {
  const { isAuthenticated, role, shop, meLoaded } = useShop()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }


  if (role === 'shop') {
    // If shop data hasn't been loaded yet, wait to avoid premature redirect
    if (!meLoaded) return null

    const isOnboardingDone = shop?.onboardingCompleted === true
    const isOnboardingRoute = location.pathname === '/shop/onboarding'
    if (!isOnboardingDone && !isOnboardingRoute) {
      return <Navigate to="/shop/onboarding" replace state={{ from: location.pathname }} />
    }
    if (isOnboardingDone && isOnboardingRoute) {
      return <Navigate to="/shop/dashboard" replace />
    }
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

