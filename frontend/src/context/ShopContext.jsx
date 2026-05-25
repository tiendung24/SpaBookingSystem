/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { apiRequest } from '../lib/api'
import { AUTH_EXPIRED_EVENT, clearStoredAuth, getStoredRole, getStoredToken, setStoredAuth, emitAuthExpired } from '../lib/auth'

const ShopContext = createContext(null)

const emptyDraft = {
  serviceId: null,
  staffId: 'random',
  date: '',
  time: '',
  customerName: '',
  customerPhone: '',
  customerEmail: '',
  note: '',
  holdToken: '',
  holdExpiresAt: ''
}

function loadStoredBookingDraft() {
  try {
    const raw = localStorage.getItem('public_booking_draft')
    if (!raw) return emptyDraft
    const parsed = JSON.parse(raw)
    return { ...emptyDraft, ...(parsed || {}) }
  } catch {
    return emptyDraft
  }
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
    imageUrl: item.imageUrl || '',
    staffIds: item.availableStaffIds || []
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
    services: item.serviceIds || [],
    avatar: item.avatarUrl || item.imageUrl || ''
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
  const [meLoaded, setMeLoaded] = useState(false)
  const [error, setError] = useState('')
  const [shop, setShop] = useState({
    name: '',
    slug: '',
    address: '',
    phone: '',
    onboardingCompleted: false,
    hours: {
      open: '09:00',
      close: '20:00',
      slotDuration: 60,
      capacity: 1,
      lunchBreakStart: '12:00',
      lunchBreakEnd: '13:00',
      daysOff: [0]
    },
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
  const [bookingDraft, setBookingDraft] = useState(loadStoredBookingDraft)

  const resetBookingDraft = useCallback(() => {
    setBookingDraft(emptyDraft)
    try {
      localStorage.removeItem('public_booking_draft')
    } catch {
      // ignore
    }
    // Clean up hold tokens from all shops (or specific slug if available)
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('hold_token_') || key.startsWith('hold_expires_')) {
        localStorage.removeItem(key)
      }
    })
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem('public_booking_draft', JSON.stringify(bookingDraft || emptyDraft))
    } catch {
      // ignore
    }
  }, [bookingDraft])

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
        hours: {
          ...(prev.hours || {}),
          ...(meShop.shop?.hours || {})
        },
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
      setError(err?.message || 'KhÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â´ng tÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂºÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â£i ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¾ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¹ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â»ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â£c dÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â»ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¯ liÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â»ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡u')
    } finally {
      setLoading(false)
      setMeLoaded(true)
    }
  }, [token])

  useEffect(() => {
    if (!token || role === 'admin') return
    // load current user/shop immediately
    const t = setTimeout(() => {
      loadMeAndShop(token)
    }, 0)

    // schedule token expiry handling
    let expiryTimer = null
    try {
      const parts = token.split('.')
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')))
        if (payload && payload.exp) {
          const msLeft = payload.exp * 1000 - Date.now()
          if (msLeft > 0) {
            expiryTimer = setTimeout(() => {
              emitAuthExpired({ reason: 'token_expired' })
            }, msLeft)
          } else {
            // already expired
            emitAuthExpired({ reason: 'token_expired' })
          }
        }
      }
    } catch {
      // ignore parse errors
    }

    return () => {
      clearTimeout(t)
      if (expiryTimer) clearTimeout(expiryTimer)
    }
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
        sessionStorage.setItem('lumix_flash_message', 'PhiÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Âªn ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¾ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¹ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¾ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ng nhÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂºÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­p ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¾ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¹ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â£ hÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂºÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¿t hÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂºÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡n, vui lÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â²ng ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¾ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¹ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¾ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ng nhÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂºÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­p lÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂºÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡i.')
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
      if (shopErr?.status !== 401 && shopErr?.status !== 403) {
        throw shopErr
      }
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
    setMeLoaded(false)
  }

  const loadPublicShop = useCallback(async (slug) => {
    const [shopRes, servicesRes, staffsRes] = await Promise.all([
      apiRequest(`/api/public/shops/${slug}`),
      apiRequest(`/api/public/shops/${slug}/services`),
      apiRequest(`/api/public/shops/${slug}/staffs`)
    ])
    setShop((prev) => ({
      ...prev,
      ...(shopRes.shop || {}),
      slug,
      onboardingCompleted: normalizeOnboardingCompleted(shopRes.shop?.onboardingCompleted ?? prev.onboardingCompleted),
      hours: {
        ...(prev.hours || {}),
        ...(shopRes.shop?.hours || {})
      }
    }))
    setServices((servicesRes.items || []).map(mapService))
    setStaff((staffsRes.items || []).map(mapStaff))
  }, [])

  const getAvailableSlots = async (slug, { serviceId, date, staffId } = {}) => {
    if (!slug || !serviceId || !date) return []
    try {
      const query = new URLSearchParams({ serviceId, date })
      if (staffId) query.set('staffId', staffId)
      const res = await apiRequest(`/api/public/shops/${slug}/available-slots?${query.toString()}`)
      return res.slots || []
    } catch {
      return []
    }
  }

  const createBookingFromDraft = useCallback(async (slug) => {
    if (!slug) return null
    const payload = {
      serviceId: bookingDraft.serviceId,
      staffId: bookingDraft.staffId === 'random' ? null : bookingDraft.staffId,
      customerName: bookingDraft.customerName,
      phone: bookingDraft.customerPhone,
      email: bookingDraft.customerEmail || undefined,
      date: bookingDraft.date,
      time: bookingDraft.time,
      holdToken: bookingDraft.holdToken || undefined,
      note: bookingDraft.note
    }
    let res = null
    try {
      // expose payload for easier debugging in deployed site
      try { window.__lastBookingPayload = payload } catch { /* ignore */ }
      console.log('[ShopContext] createBookingFromDraft payload', payload)
      res = await apiRequest(`/api/public/shops/${slug}/bookings`, { method: 'POST', body: payload })
        try { window.__lastBookingRes = res } catch { /* ignore */ }
      console.log('[ShopContext] createBookingFromDraft res', res)
    } catch (err) {
        try { window.__lastBookingError = err } catch { /* ignore */ }
        console.error('[ShopContext] createBookingFromDraft error', err)
      throw err
    }

    if (res?.booking) {
      try { localStorage.setItem('last_booking_code_' + slug, String(res.booking.bookingCode || res.booking._id || '')) } catch { /* ignore */ }
      try {
        if (res?.payment) localStorage.setItem('last_payment_data_' + slug, JSON.stringify(res.payment))
      } catch {
        // ignore
      }
      setBookings((prev) => [mapBooking(res.booking), ...prev])
      // Clean up hold token after successful booking
      localStorage.removeItem(`hold_token_${slug}`)
      localStorage.removeItem(`hold_expires_${slug}`)
      setBookingDraft((prev) => ({
        ...prev,
        holdToken: '',
        holdExpiresAt: ''
      }))
    }
    return res
  }, [bookingDraft])

  const holdBookingSlot = useCallback(async (slug, payload) => {
    if (!slug) return null
    return await apiRequest(`/api/public/shops/${slug}/hold-slot`, { method: 'POST', body: payload })
  }, [])

  const addService = async (service) => {
    const payload = {
      name: service.name,
      categoryId: service.category || service.categoryId,
      price: Number(service.priceVnd ?? service.price ?? 0),
      durationMinutes: Number(service.durationMinutes || 0),
      imageUrl: service.imageUrl || '',
      availableStaffIds: service.staffIds || []
    }
    const res = await apiRequest('/api/shop/services', { method: 'POST', token, body: payload })
    const mapped = mapService(res.service)
    setServices((prev) => [mapped, ...prev])
    return mapped
  }

  const updateService = async (id, patch) => {
    if (Object.keys(patch).length === 1 && Object.prototype.hasOwnProperty.call(patch, 'visible')) {
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
      durationMinutes: Number(patch.durationMinutes || 0),
      imageUrl: patch.imageUrl || '',
      availableStaffIds: patch.staffIds || []
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
      serviceIds: member.services || [],
      avatarUrl: member.avatar || member.avatarUrl || ''
    }
    const res = await apiRequest('/api/shop/staffs', { method: 'POST', token, body: payload })
    const mapped = mapStaff(res.staff)
    setStaff((prev) => [mapped, ...prev])
    return mapped
  }

  const updateStaff = async (id, patch) => {
    if (Object.keys(patch).length === 1 && Object.prototype.hasOwnProperty.call(patch, 'bookingEnabled')) {
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
      serviceIds: patch.services || patch.serviceIds || [],
      avatarUrl: patch.avatar || patch.avatarUrl || undefined
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

  const updateDepositConfig = async (config) => {
    const payload = {
      enabled: Boolean(config.enabled),
      type: config.type,
      value: Number(config.value || 0),
      cancelHours: Number(config.cancelHours || 4)
    }
    const res = await apiRequest('/api/shop/deposit-settings', {
      method: 'PUT',
      token,
      body: payload
    })
    setShop((prev) => ({
      ...prev,
      deposit: {
        enabled: Boolean(res.depositConfig?.enabled),
        type: res.depositConfig?.type || 'fixed',
        value: Number(res.depositConfig?.value || 0),
        cancelHours: Number(res.depositConfig?.cancelHours || 4)
      }
    }))
    return res
  }

  const uploadImage = async (imageFile) => {
    const formData = new FormData()
    formData.append('image', imageFile)
    const res = await apiRequest('/api/uploads/image', {
      method: 'POST',
      body: formData
    })
    return res.url
  }

  
  const expireUnpaidBooking = useCallback(async (bookingCode, force = false) => {
    const res = await apiRequest(`/api/public/bookings/${bookingCode}/expire-unpaid`, {
      method: 'POST',
      body: { force: Boolean(force) }
    })
    return res
  }, [])
  const checkBookingStatus = useCallback(async (bookingCode) => {
    const res = await apiRequest(`/api/public/bookings/${bookingCode}`, { method: 'GET' })
    return res
  }, [])
  const value = {
    token,
    role,
    isAuthenticated: Boolean(token),
    user,
    loading,
    meLoaded,
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
    createBookingFromDraft,
    holdBookingSlot,
    getAvailableSlots,
    addService,
    updateService,
    deleteService,
    addStaff,
    updateStaff,
    deleteStaff,
    updateBooking,
    topupWallet,
    updateDepositConfig,
    uploadImage,
    checkBookingStatus,
    expireUnpaidBooking,
    loginShop,
    loginAdmin,
    loginUnified,
    registerShop,
    logout,
    loadPublicShop,
    loadMeAndShop
  }

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>
}

export function useShop() {
  const ctx = useContext(ShopContext)
  if (!ctx) throw new Error('useShop must be used within ShopProvider')
  return ctx
}






