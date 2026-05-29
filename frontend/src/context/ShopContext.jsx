/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
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
    const merged = { ...emptyDraft, ...(parsed || {}) }
    const expiresAt = merged.holdExpiresAt ? new Date(merged.holdExpiresAt) : null
    if (!expiresAt || Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() <= Date.now()) {
      return {
        ...merged,
        holdToken: '',
        holdExpiresAt: ''
      }
    }
    return merged
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
    shortDescription: item.shortDescription || '',
    detailedDescription: item.detailedDescription || '',
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
    shortBio: item.shortBio || '',
    bio: item.bio || '',
    specialties: item.specialties || [],
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
    startTime: item.startTime,
    endTime: item.endTime,
    createdAt: item.createdAt,
    paymentStatus: item.paymentStatus || null,
    deposit: Number(item.depositAmount || 0),
    total: Number(item.totalAmount || 0),
    status: item.status || 'pending',
    notes: item.note || ''
  }
}

function getApiBaseUrl() {
  return import.meta.env.VITE_API_BASE_URL || ''
}

function getWsUrl(token) {
  const baseUrl = getApiBaseUrl()
  const fallbackOrigin = typeof window !== 'undefined' ? window.location.origin : ''
  const source = baseUrl || fallbackOrigin
  if (!source) return ''

  try {
    const url = new URL(source)
    url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
    url.pathname = '/ws'
    url.search = `token=${encodeURIComponent(token || '')}`
    return url.toString()
  } catch {
    const normalized = source.replace(/^http(s?):\/\//i, (_, isHttps) => (isHttps ? 'wss://' : 'ws://'))
    return `${normalized.replace(/\/$/, '')}/ws?token=${encodeURIComponent(token || '')}`
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
    wallet: { balance: 0, escrow: 0, minBalance: 100000 }
  })
  const [services, setServices] = useState([])
  const [staff, setStaff] = useState([])
  const [bookings, setBookings] = useState([])
  const [walletTransactions, setWalletTransactions] = useState([])
  const [notifications, setNotifications] = useState([])
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0)
  const [bookingDraft, setBookingDraft] = useState(loadStoredBookingDraft)
  const realtimeSocketRef = useRef(null)
  const realtimeReconnectRef = useRef(null)

  const resetBookingDraft = useCallback(() => {
    setBookingDraft(emptyDraft)
    try {
      localStorage.removeItem('public_booking_draft')
    } catch {
      // ignore
    }
    // Clean up client attempt ids from sessionStorage
    try {
      Object.keys(sessionStorage).forEach((k) => {
        if (k && k.startsWith('client_attempt_')) sessionStorage.removeItem(k)
      })
    } catch {
      // ignore
    }
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
      const walletData = walletRes?.wallet || walletRes || {}
      setShop((prev) => ({
        ...prev,
        wallet: {
          balance: Number(walletData.balance || 0),
          escrow: Number(walletData.escrowBalance || 0),
          minBalance: Number(walletData.minBalance || prev.wallet?.minBalance || 100000)
        }
      }))
      setError('')
    } catch (err) {
      setError(err?.message || 'Không thể khôi phục phiên đăng nhập.')
    } finally {
      setLoading(false)
      setMeLoaded(true)
    }
  }, [token])

  const loadShopNotifications = useCallback(async (accessToken = token) => {
    if (!accessToken || role !== 'shop') return
    try {
      const res = await apiRequest('/api/shop/notifications', { token: accessToken })
      const items = Array.isArray(res?.items) ? res.items : []
      setNotifications(items)
      setUnreadNotificationCount(items.filter((item) => !item.readAt).length)
    } catch (err) {
      console.error('[ShopContext] loadShopNotifications error', err)
    }
  }, [token, role])

  const connectShopRealtime = useCallback((accessToken = token) => {
    if (!accessToken || role !== 'shop') return
    if (typeof window === 'undefined' || typeof WebSocket === 'undefined') return

    const wsUrl = getWsUrl(accessToken)
    if (!wsUrl) return

    try {
      if (realtimeSocketRef.current) {
        realtimeSocketRef.current.__disposed = true
        if (realtimeSocketRef.current.readyState === WebSocket.OPEN) {
          realtimeSocketRef.current.close()
        }
        realtimeSocketRef.current = null
      }
      if (realtimeReconnectRef.current) {
        clearTimeout(realtimeReconnectRef.current)
        realtimeReconnectRef.current = null
      }

      const socket = new WebSocket(wsUrl)
      realtimeSocketRef.current = socket
      socket.__disposed = false

      socket.onopen = () => {
        if (socket.__disposed) {
          try {
            socket.close()
          } catch {
            // ignore
          }
          return
        }
        try {
          socket.send(JSON.stringify({ type: 'shop.subscribe', token: accessToken }))
        } catch {
          // ignore
        }
      }

      socket.onmessage = (event) => {
        let data = null
        try {
          data = JSON.parse(event.data)
        } catch {
          data = null
        }

        if (!data?.type) return

        if (data.type === 'notification.created' || data.type === 'booking.updated' || data.type === 'realtime.ready') {
          void loadShopNotifications(accessToken)
        }

        if (data.type === 'booking.updated') {
          void loadMeAndShop(accessToken)
        }
      }

      socket.onclose = () => {
        if (socket.__disposed) return
        if (realtimeSocketRef.current === socket) {
          realtimeSocketRef.current = null
        }
        if (role === 'shop' && accessToken) {
          realtimeReconnectRef.current = setTimeout(() => {
            connectShopRealtime(accessToken)
          }, 3000)
        }
      }

      socket.onerror = () => {
        try {
          socket.close()
        } catch {
          // ignore
        }
      }
    } catch (err) {
      console.error('[ShopContext] connectShopRealtime error', err)
    }
  }, [token, role, loadShopNotifications, loadMeAndShop])

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
    if (!token || role !== 'shop') return

    let mounted = true
    const refresh = async () => {
      if (!mounted) return
      await loadShopNotifications(token)
    }

    void refresh()
    const timer = setInterval(() => {
      void refresh()
    }, 30000)

    const onFocus = () => { void refresh() }
    window.addEventListener('focus', onFocus)
    return () => {
      mounted = false
      clearInterval(timer)
      window.removeEventListener('focus', onFocus)
    }
  }, [token, role, loadShopNotifications])

  useEffect(() => {
    if (!token || role !== 'shop') return
    connectShopRealtime(token)

    return () => {
      if (realtimeReconnectRef.current) {
        clearTimeout(realtimeReconnectRef.current)
        realtimeReconnectRef.current = null
      }
      if (realtimeSocketRef.current) {
        try {
          realtimeSocketRef.current.__disposed = true
          if (realtimeSocketRef.current.readyState === WebSocket.OPEN) {
            realtimeSocketRef.current.close()
          }
        } catch {
          // ignore
        }
        realtimeSocketRef.current = null
      }
    }
  }, [token, role, connectShopRealtime])

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
        sessionStorage.setItem('lumix_flash_message', 'Phiên đã hết hạn. Vui lòng đăng nhập lại.')
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
      },
      deposit: {
        enabled: Boolean(shopRes.shop?.depositConfig?.enabled ?? prev.deposit.enabled),
        type: shopRes.shop?.depositConfig?.type || prev.deposit.type,
        value: Number(shopRes.shop?.depositConfig?.value ?? prev.deposit.value),
        cancelHours: Number(shopRes.shop?.depositConfig?.cancelHours ?? prev.deposit.cancelHours)
      }
    }))
    setServices((servicesRes.items || []).map(mapService))
    setStaff((staffsRes.items || []).map(mapStaff))
  }, [])

  const getAvailableSlots = async (slug, { serviceId, date, staffId, holdToken } = {}) => {
    if (!slug || !serviceId || !date) return []
    try {
      const query = new URLSearchParams({ serviceId, date })
      if (staffId) query.set('staffId', staffId)
      if (holdToken) query.set('holdToken', holdToken)
      const res = await apiRequest(`/api/public/shops/${slug}/available-slots?${query.toString()}`)
      return res.slots || []
    } catch (err) {
      // Surface API errors to callers so UI can distinguish "no slots" vs network/server errors.
      console.error('[ShopContext] getAvailableSlots error', err)
      throw err
    }
  }

  const createBookingFromDraft = useCallback(async (slug) => {
    if (!slug) return null
    // ensure we have a client attempt id to support server-side idempotency
    const attemptKey = `client_attempt_${slug}`
    let attemptId = null
    try {
      attemptId = sessionStorage.getItem(attemptKey) || null
    } catch {
      attemptId = null
    }
    try {
      if (!attemptId && typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        attemptId = crypto.randomUUID()
      }
    } catch {
      // ignore
    }
    try {
      if (attemptId) sessionStorage.setItem(attemptKey, attemptId)
    } catch {
      // ignore
    }

    const payload = {
      serviceId: bookingDraft.serviceId,
      staffId: bookingDraft.staffId === 'random' ? null : bookingDraft.staffId,
      customerName: bookingDraft.customerName,
      phone: bookingDraft.customerPhone,
      email: bookingDraft.customerEmail || undefined,
      date: bookingDraft.date,
      time: bookingDraft.time,
      holdToken: bookingDraft.holdToken || undefined,
      clientBookingAttemptId: attemptId || undefined,
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
      const errMsg = String(err?.message || '').toLowerCase()
      const statusCode = Number(err?.status || 0)

      const isExpiredHold =
        statusCode === 409 &&
        (errMsg.includes('hết hạn') || errMsg.includes('expired') || errMsg.includes('giữ chỗ') || errMsg.includes('hold'))

      const slotConflictKeywords = ['slot', 'vừa', 'đặt', 'đã được đặt', 'vừa được', 'occupied', 'booked', 'taken', 'đã bị']
      const isSlotConflict =
        statusCode === 409 && slotConflictKeywords.some((k) => errMsg.includes(k)) && !isExpiredHold

      if (isExpiredHold) {
        try {
          localStorage.removeItem(`hold_token_${slug}`)
          localStorage.removeItem(`hold_expires_${slug}`)
        } catch {
          // ignore
        }
        setBookingDraft((prev) => ({
          ...prev,
          holdToken: '',
          holdExpiresAt: ''
        }))
        // rethrow original error so callers can inspect status/message
        throw err
      }

      if (isSlotConflict) {
        // Clean up hold info and payment cache, but keep selected service/date so user can re-pick time
        try {
          localStorage.removeItem(`hold_token_${slug}`)
          localStorage.removeItem(`hold_expires_${slug}`)
          localStorage.removeItem('last_payment_data_' + slug)
        } catch {
          // ignore
        }
        setBookingDraft((prev) => ({
          ...prev,
          holdToken: '',
          holdExpiresAt: '',
          time: ''
        }))
        const userMsg = 'Khung giờ vừa bị đặt. Vui lòng chọn khung giờ khác.'
        const friendlyErr = new Error(userMsg)
        friendlyErr.status = statusCode
        throw friendlyErr
      }

      // Unknown error: rethrow for upstream handling
      throw err
    }

    if (res?.booking) {
      try { sessionStorage.removeItem(`client_attempt_${slug}`) } catch {}
      setBookings((prev) => [mapBooking(res.booking), ...prev])
      // Clean up client attempt id after successful booking
      try { sessionStorage.removeItem(`client_attempt_${slug}`) } catch {}
      // deposit expiry will be fetched from server when needed; no client fallback write
      setBookingDraft((prev) => ({
        ...prev,
        holdToken: '',
        holdExpiresAt: ''
      }))
      // clear attempt id after successful booking
      try { sessionStorage.removeItem(`client_attempt_${slug}`) } catch {}
    }
    return res
  }, [bookingDraft])

  const holdBookingSlot = useCallback(async (slug, payload) => {
    if (!slug) return null
    // ensure clientAttemptId exists and persist in sessionStorage so createBooking can use same id
    const attemptKey = `client_attempt_${slug}`
    try {
      let attemptId = payload?.clientAttemptId || sessionStorage.getItem(attemptKey) || null
      if (!attemptId && typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        attemptId = crypto.randomUUID()
      }
      if (attemptId) {
        payload = { ...(payload || {}), clientAttemptId: attemptId }
        try { sessionStorage.setItem(attemptKey, attemptId) } catch {}
      }
    } catch {
      // ignore
    }
    return await apiRequest(`/api/public/shops/${slug}/hold-slot`, { method: 'POST', body: payload })
  }, [])

  const addService = async (service) => {
    const payload = {
        name: service.name,
        categoryId: service.category || service.categoryId,
        price: Number(service.priceVnd ?? service.price ?? 0),
        durationMinutes: Number(service.durationMinutes || 0),
        imageUrl: service.imageUrl || '',
        availableStaffIds: service.staffIds || [],
        shortDescription: service.shortDescription || service.shortDesc || '',
        detailedDescription: service.detailedDescription || service.details || ''
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
      availableStaffIds: patch.staffIds || [],
      shortDescription: patch.shortDescription || patch.shortDesc || undefined,
      detailedDescription: patch.detailedDescription || patch.details || undefined
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
      avatarUrl: member.avatar || member.avatarUrl || '',
      shortBio: member.shortBio || member.short_description || '',
      bio: member.bio || member.description || '',
      specialties: Array.isArray(member.specialties) ? member.specialties : (member.specialties ? String(member.specialties).split(',').map((s) => s.trim()).filter(Boolean) : [])
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
      avatarUrl: patch.avatar || patch.avatarUrl || undefined,
      shortBio: patch.shortBio !== undefined ? patch.shortBio : undefined,
      bio: patch.bio !== undefined ? patch.bio : undefined,
      specialties: patch.specialties !== undefined ? (Array.isArray(patch.specialties) ? patch.specialties : String(patch.specialties).split(',').map((s) => s.trim()).filter(Boolean)) : undefined
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
    // Do not refresh wallet here: payment must complete via webhook.
    // Caller (UI) should poll topup status and then call `loadMeAndShop` when confirmed.
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
    notifications,
    unreadNotificationCount,
    walletTransactions,
    bookingDraft,
    setBookingDraft,
    resetBookingDraft,
    createBookingFromDraft,
    loadShopNotifications,
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






