/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { apiRequest } from '../lib/api'
import { AUTH_EXPIRED_EVENT, clearStoredAuth, getStoredRole, getStoredToken, setStoredAuth } from '../lib/auth'

const ShopContext = createContext(null)

const emptyDraft = {
  serviceId: null,
  staffId: 'random',
  date: '',
  time: '',
  customerName: '',
  customerPhone: '',
  customerEmail: '',
  note: ''
}

function normalizeOnboardingCompleted(value) {
  if (value === true) return true
  if (value === false) return false
  if (typeof value === 'number') return value === 1
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    return normalized === 'true' || normalized === '1' || normalized === 'yes'
  }
  return false
}

function mapService(item) {
  return {
    id: item._id,
    name: item.name,
    category: item.categoryId || '',
    priceVnd: Number(item.price || 0),
    durationMinutes: Number(item.durationMinutes || 0),
    visible: item.status !== 'inactive',
    imageUrl: item.imageUrl || ''
  }
}

function mapStaff(item) {
  return {
    id: item._id,
    name: item.fullName || item.name || '',
    phone: item.phone || '',
    role: item.role || 'tech',
    status: item.status || 'active',
    rating: Number(item.rating || 0),
    bookingEnabled: item.status !== 'inactive',
    services: item.serviceIds || []
  }
}

function mapBooking(item) {
  return {
    id: item._id,
    bookingCode: item.bookingCode,
    customer: item.customerName,
    phone: item.customerPhone,
    serviceId: item.serviceId,
    staffId: item.staffId || null,
    time: item.startTime,
    endTime: item.endTime,
    deposit: Number(item.depositAmount || 0),
    total: Number(item.totalAmount || 0),
    status: item.status || 'pending',
    notes: item.note || ''
  }
}

export function ShopProvider({ children }) {
  const [token, setToken] = useState(getStoredToken())
  const [role, setRole] = useState(getStoredRole())
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [shop, setShop] = useState({
    name: '',
    slug: '',
    address: '',
    phone: '',
    onboardingCompleted: false,
    deposit: {
      enabled: false,
      type: 'fixed',
      value: 0,
      cancelHours: 4
    },
    wallet: { balance: 0, escrow: 0 }
  })
  const [services, setServices] = useState([])
  const [staff, setStaff] = useState([])
  const [bookings, setBookings] = useState([])
  const [walletTransactions, setWalletTransactions] = useState([])
  const [bookingDraft, setBookingDraft] = useState(emptyDraft)

  const resetBookingDraft = () => setBookingDraft(emptyDraft)

  const loadMeAndShop = useCallback(async (accessToken = token) => {
    if (!accessToken) return
    setLoading(true)
    try {
      const me = await apiRequest('/api/auth/me', { token: accessToken })
      setUser(me.user || null)

      const meShop = await apiRequest('/api/shop/me', { token: accessToken })
      setShop((prev) => ({
        ...prev,
        ...(meShop.shop || {}),
        onboardingCompleted: normalizeOnboardingCompleted(meShop.shop?.onboardingCompleted ?? prev.onboardingCompleted),
        deposit: {
          enabled: Boolean(meShop.shop?.depositConfig?.enabled ?? prev.deposit.enabled),
          type: meShop.shop?.depositConfig?.type || prev.deposit.type,
          value: Number(meShop.shop?.depositConfig?.value ?? prev.deposit.value),
          cancelHours: Number(meShop.shop?.depositConfig?.cancelHours ?? prev.deposit.cancelHours)
        }
      }))

      const [serviceRes, staffRes, bookingRes, walletRes, walletTxnRes] = await Promise.all([
        apiRequest('/api/shop/services', { token: accessToken }),
        apiRequest('/api/shop/staffs', { token: accessToken }),
        apiRequest('/api/shop/bookings', { token: accessToken }),
        apiRequest('/api/shop/wallet', { token: accessToken }),
        apiRequest('/api/shop/wallet/transactions', { token: accessToken })
      ])

      setServices((serviceRes.items || []).map(mapService))
      setStaff((staffRes.items || []).map(mapStaff))
      setBookings((bookingRes.items || []).map(mapBooking))
      setWalletTransactions(walletTxnRes.items || [])
      setShop((prev) => ({
        ...prev,
        wallet: {
          balance: Number(walletRes.balance || 0),
          escrow: Number(walletRes.escrowBalance || 0)
        }
      }))
      setError('')
    } catch (err) {
      setError(err.message || 'Không tải được dữ liệu')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    if (!token || role === 'admin') return
    const t = setTimeout(() => {
      loadMeAndShop(token)
    }, 0)
    return () => clearTimeout(t)
  }, [token, role, loadMeAndShop])

  useEffect(() => {
    const onExpired = () => {
      clearStoredAuth()
      setToken('')
      setRole('')
      setUser(null)
      const currentPath = window.location.pathname || ''
      const isPublicPath =
        currentPath === '/' ||
        currentPath.startsWith('/login') ||
        currentPath.startsWith('/register') ||
        currentPath.startsWith('/forgot-password') ||
        /^\/[^/]+(\/book(\/time|\/pay)?|\/appointments)?$/.test(currentPath)
      if (!isPublicPath) {
        sessionStorage.setItem('lumix_flash_message', 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.')
        window.location.href = '/login'
      }
    }
    window.addEventListener(AUTH_EXPIRED_EVENT, onExpired)
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, onExpired)
  }, [])

  const loginShop = async ({ identity, password }) => {
    const payload = identity.includes('@') ? { email: identity, password } : { phone: identity, password }
    const res = await apiRequest('/api/auth/shop/login', { method: 'POST', body: payload })
    setStoredAuth(res.token, 'shop')
    setToken(res.token)
    setRole('shop')
    await loadMeAndShop(res.token)
    return res
  }

  const loginAdmin = async ({ identity, password }) => {
    const payload = identity.includes('@') ? { email: identity, password } : { phone: identity, password }
    const res = await apiRequest('/api/auth/admin/login', { method: 'POST', body: payload })
    setStoredAuth(res.token, 'admin')
    setToken(res.token)
    setRole('admin')
    return res
  }

  const loginUnified = async ({ identity, password }) => {
    try {
      const res = await loginShop({ identity, password })
      return { ...res, role: 'shop' }
    } catch (shopErr) {
      try {
        const res = await loginAdmin({ identity, password })
        return { ...res, role: 'admin' }
      } catch (adminErr) {
        throw adminErr?.status ? adminErr : shopErr
      }
    }
  }

  const registerShop = async (payload) => {
    return apiRequest('/api/auth/shop/register', { method: 'POST', body: payload })
  }

  const logout = () => {
    clearStoredAuth()
    setToken('')
    setRole('')
    setUser(null)
  }

  const loadPublicShop = async (slug) => {
    const [shopRes, servicesRes, staffsRes] = await Promise.all([
      apiRequest(`/api/public/shops/${slug}`),
      apiRequest(`/api/public/shops/${slug}/services`),
      apiRequest(`/api/public/shops/${slug}/staffs`)
    ])
    setShop((prev) => ({
      ...prev,
      ...(shopRes.shop || {}),
      slug,
      onboardingCompleted: normalizeOnboardingCompleted(shopRes.shop?.onboardingCompleted ?? prev.onboardingCompleted)
    }))
    setServices((servicesRes.items || []).map(mapService))
    setStaff((staffsRes.items || []).map(mapStaff))
  }

  const createBookingFromDraft = async (slug) => {
    if (!slug) return null
    const payload = {
      serviceId: bookingDraft.serviceId,
      staffId: bookingDraft.staffId === 'random' ? null : bookingDraft.staffId,
      customerName: bookingDraft.customerName,
      phone: bookingDraft.customerPhone,
      email: bookingDraft.customerEmail || undefined,
      date: bookingDraft.date,
      time: bookingDraft.time,
      note: bookingDraft.note
    }
    const res = await apiRequest(`/api/public/shops/${slug}/bookings`, { method: 'POST', body: payload })
    if (res?.booking) {
      setBookings((prev) => [mapBooking(res.booking), ...prev])
    }
    return res
  }

  const addService = async (service) => {
    const payload = {
      name: service.name,
      categoryId: service.categoryId || service.category || '',
      price: Number(service.priceVnd ?? service.price ?? 0),
      durationMinutes: Number(service.durationMinutes || 0),
      status: service.visible === false ? 'inactive' : 'active'
    }
    const res = await apiRequest('/api/shop/services', { method: 'POST', token, body: payload })
    const mapped = mapService(res.service)
    setServices((prev) => [mapped, ...prev])
    return mapped
  }

  const updateService = async (id, patch) => {
    if (Object.prototype.hasOwnProperty.call(patch, 'visible')) {
      const res = await apiRequest(`/api/shop/services/${id}/status`, {
        method: 'PUT',
        token,
        body: { status: patch.visible ? 'active' : 'inactive' }
      })
      const mapped = mapService(res.service)
      setServices((prev) => prev.map((item) => (item.id === id ? mapped : item)))
      return mapped
    }

    const payload = {
      name: patch.name,
      categoryId: patch.categoryId || patch.category,
      price: Number(patch.priceVnd ?? patch.price ?? 0),
      durationMinutes: Number(patch.durationMinutes || 0)
    }
    const res = await apiRequest(`/api/shop/services/${id}`, { method: 'PUT', token, body: payload })
    const mapped = mapService(res.service)
    setServices((prev) => prev.map((item) => (item.id === id ? mapped : item)))
    return mapped
  }

  const deleteService = async (id) => {
    await apiRequest(`/api/shop/services/${id}`, { method: 'DELETE', token })
    setServices((prev) => prev.filter((item) => item.id !== id))
  }

  const addStaff = async (member) => {
    const payload = {
      fullName: member.name || member.fullName,
      phone: member.phone,
      role: member.role || 'tech',
      serviceIds: member.services || []
    }
    const res = await apiRequest('/api/shop/staffs', { method: 'POST', token, body: payload })
    const mapped = mapStaff(res.staff)
    setStaff((prev) => [mapped, ...prev])
    return mapped
  }

  const updateStaff = async (id, patch) => {
    if (Object.prototype.hasOwnProperty.call(patch, 'bookingEnabled')) {
      const res = await apiRequest(`/api/shop/staffs/${id}/status`, {
        method: 'PUT',
        token,
        body: { status: patch.bookingEnabled ? 'active' : 'inactive' }
      })
      const mapped = mapStaff(res.staff)
      setStaff((prev) => prev.map((item) => (item.id === id ? mapped : item)))
      return mapped
    }
    const payload = {
      fullName: patch.name || patch.fullName,
      phone: patch.phone,
      role: patch.role,
      serviceIds: patch.services || patch.serviceIds || []
    }
    const res = await apiRequest(`/api/shop/staffs/${id}`, { method: 'PUT', token, body: payload })
    const mapped = mapStaff(res.staff)
    setStaff((prev) => prev.map((item) => (item.id === id ? mapped : item)))
    return mapped
  }

  const deleteStaff = async (id) => {
    await apiRequest(`/api/shop/staffs/${id}`, { method: 'DELETE', token })
    setStaff((prev) => prev.filter((item) => item.id !== id))
  }

  const updateBooking = async (id, patch) => {
    let res = null
    if (patch.note !== undefined) {
      res = await apiRequest(`/api/shop/bookings/${id}/note`, { method: 'PUT', token, body: { note: patch.note } })
    } else if (patch.status === 'confirmed') {
      res = await apiRequest(`/api/shop/bookings/${id}/confirm`, { method: 'PUT', token })
    } else if (patch.status === 'canceled' || patch.status === 'cancelled') {
      res = await apiRequest(`/api/shop/bookings/${id}/cancel`, { method: 'PUT', token, body: { reason: patch.reason || '' } })
    } else if (patch.status === 'checked_in') {
      res = await apiRequest(`/api/shop/bookings/${id}/check-in`, { method: 'PUT', token })
    } else if (patch.status === 'completed' || patch.status === 'checked_out') {
      res = await apiRequest(`/api/shop/bookings/${id}/check-out`, { method: 'PUT', token })
    } else if (patch.status === 'no_show') {
      res = await apiRequest(`/api/shop/bookings/${id}/no-show`, { method: 'PUT', token })
    }

    if (res?.booking) {
      const mapped = mapBooking(res.booking)
      setBookings((prev) => prev.map((item) => (item.id === id ? mapped : item)))
      return mapped
    }

    setBookings((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)))
    return patch
  }

  const topupWallet = async (amount) => {
    const res = await apiRequest('/api/shop/wallet/topup/create', {
      method: 'POST',
      token,
      body: { amount: Number(amount || 0) }
    })
    await loadMeAndShop(token)
    return res
  }

  const value = useMemo(
    () => ({
      token,
      role,
      isAuthenticated: Boolean(token),
      user,
      loading,
      error,
      shop,
      setShop,
      services,
      setServices,
      staff,
      setStaff,
      bookings,
      setBookings,
      walletTransactions,
      bookingDraft,
      setBookingDraft,
      resetBookingDraft,
      addService,
      updateService,
      deleteService,
      addStaff,
      updateStaff,
      deleteStaff,
      updateBooking,
      topupWallet,
      loginShop,
      loginAdmin,
      loginUnified,
      registerShop,
      logout,
      loadPublicShop,
      loadMeAndShop,
      createBookingFromDraft
    }),
    [token, role, user, loading, error, shop, services, staff, bookings, walletTransactions, bookingDraft]
  )

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>
}

export function useShop() {
  const ctx = useContext(ShopContext)
  if (!ctx) throw new Error('useShop must be used within ShopProvider')
  return ctx
}
