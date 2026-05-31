import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useShop } from '../context/ShopContext'
import CustomerHeader from '../components/customer/CustomerHeader'
import { apiRequest } from '../lib/api'
import { useToast } from '../components/ui/ToastProvider'

function formatVnd(value) {
  return `${Number(value || 0).toLocaleString('vi-VN')}đ`
}

function pad2(n) {
  return String(n).padStart(2, '0')
}

function formatCountdown(seconds) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${pad2(s)}`
}

function buildPayContent(bookingCode) {
  return `LUMIX_${bookingCode || ''}`
}

function buildQrImageSrc(value) {
  const raw = String(value || '').trim()
  if (!raw) return ''
  // PayOS may return a ready-to-render image URL or data URI.
  if (/^(data:image\/|https?:\/\/)/i.test(raw)) return raw
  // Otherwise treat it as QR payload and render via qrserver.
  return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(raw)}`
}

function normalizePaymentPayload(payment) {
  if (!payment || typeof payment !== 'object') return null

  const raw = payment.raw && typeof payment.raw === 'object' ? payment.raw : null
  const rawData = raw?.data && typeof raw.data === 'object' ? raw.data : null
  const directData = payment.data && typeof payment.data === 'object' ? payment.data : null
  const rawMeta = raw?.meta && typeof raw.meta === 'object' ? raw.meta : raw

  // helper: probe a few likely nested locations and prefer the first non-empty value
  const candidates = [payment, directData, rawData, raw, rawMeta].filter(Boolean)

  const readPath = (obj, path) => {
    if (!obj) return undefined
    const parts = String(path || '').split('.')
    let cur = obj
    for (const p of parts) {
      if (!cur) return undefined
      const m = p.match(/^([a-zA-Z0-9_]+)(?:\[(\d+)\])?$/)
      if (!m) {
        cur = cur[p]
      } else {
        const key = m[1]
        const idx = m[2] != null ? Number(m[2]) : null
        cur = cur[key]
        if (idx != null) {
          if (!Array.isArray(cur)) return undefined
          cur = cur[idx]
        }
      }
    }
    return cur
  }

  const pick = (paths) => {
    for (const obj of candidates) {
      for (const p of paths) {
        const v = readPath(obj, p)
        if (v != null && v !== '') return v
      }
    }
    return ''
  }

  const qrCodeUrl = pick([
    'qrCodeUrl', 'qrCodeURL', 'qr_url', 'qrCode', 'qr',
    'data.qrCodeUrl', 'data.qrCode', 'data.qr', 'raw.data.qr', 'raw.qr',
    'checkoutUrl', 'checkoutURL', 'paymentLink', 'paymentLinkUrl', 'meta.paymentLink', 'meta.paymentLinkUrl'
  ])

  const checkoutUrl = pick([
    'checkoutUrl', 'checkoutURL', 'paymentLink', 'paymentLinkUrl',
    'data.checkoutUrl', 'raw.data.checkoutUrl', 'meta.paymentLink', 'gateway.paymentUrl', 'data.paymentUrl'
  ])

  const chooseUrl = (v) => {
    if (!v) return ''
    const s = String(v)
    if (/^https?:\/\//i.test(s) || /^data:image\//i.test(s)) return s
    return s
  }

  return {
    ...payment,
    qrCodeUrl: chooseUrl(qrCodeUrl),
    checkoutUrl: chooseUrl(checkoutUrl)
  }
}

function isSuccessfulPaymentStatus(status) {
  return ['success', 'paid', 'completed'].includes(String(status || '').toLowerCase())
}

function pickBookingCode(booking) {
  const bookingCode = String(booking?.bookingCode || '').trim()
  return bookingCode || ''
}

function normalizePhone(input) {
  return String(input || '')
    .trim()
    .replace(/[\s.-]/g, '')
}

function isValidPhone(input) {
  return /^(?:\+84|0)\d{9,10}$/.test(input)
}

function buildDraftFromAttempt(bookingOrHold) {
  if (!bookingOrHold) return null
  const startSource = bookingOrHold.startTime || bookingOrHold.date || ''
  const startDate = startSource ? new Date(startSource) : null
  const date = startDate && !Number.isNaN(startDate.getTime()) ? startDate.toISOString().slice(0, 10) : (bookingOrHold.date || '')
  const time = startDate && !Number.isNaN(startDate.getTime()) ? startDate.toTimeString().slice(0, 5) : (bookingOrHold.time || '')

  return {
    serviceId: bookingOrHold.serviceId || null,
    staffId: bookingOrHold.staffId || 'random',
    date,
    time,
    customerName: bookingOrHold.customerName || '',
    customerPhone: bookingOrHold.customerPhone || '',
    customerEmail: bookingOrHold.customerEmail || '',
    note: bookingOrHold.note || '',
    holdToken: bookingOrHold.holdToken || '',
    holdExpiresAt: bookingOrHold.expiresAt || bookingOrHold.depositExpiresAt || '',
    depositAmount: Number(bookingOrHold.depositAmount || 0),
    totalAmount: Number(bookingOrHold.totalAmount || 0)
  }
}

function clearHoldFromDraft(prev) {
  return {
    ...prev,
    holdToken: '',
    holdExpiresAt: ''
  }
}

function readPaymentSnapshot(slug) {
  if (!slug) return null
  try {
    const raw = sessionStorage.getItem(`lumix_payment_snapshot_${slug}`)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return null
    return parsed
  } catch {
    return null
  }
}

function writePaymentSnapshot(slug, snapshot) {
  if (!slug) return
  try {
    sessionStorage.setItem(`lumix_payment_snapshot_${slug}`, JSON.stringify(snapshot || {}))
  } catch {
    // ignore
  }
}

function clearPaymentSnapshot(slug) {
  if (!slug) return
  try {
    sessionStorage.removeItem(`lumix_payment_snapshot_${slug}`)
  } catch {
    // ignore
  }
}

function snapshotDraftFromBookingDraft(draft) {
  return {
    serviceId: draft?.serviceId || null,
    staffId: draft?.staffId || 'random',
    date: draft?.date || '',
    time: draft?.time || '',
    customerName: draft?.customerName || '',
    customerPhone: draft?.customerPhone || '',
    customerEmail: draft?.customerEmail || '',
    note: draft?.note || '',
    holdToken: draft?.holdToken || '',
    holdExpiresAt: draft?.holdExpiresAt || ''
  }
}

function ConfettiLayer({ active }) {
  const pseudo = (seed) => {
    const x = Math.sin(seed * 12.9898) * 43758.5453
    return x - Math.floor(x)
  }

  const items = useMemo(() => {
    if (!active) return []
    const colors = ['#3b82f6', '#22c55e', '#f97316', '#a855f7', '#ec4899']
    return Array.from({ length: 32 }).map((_, idx) => {
      const left = Math.round(pseudo(idx + 1) * 100)
      const size = 8 + Math.round(pseudo(idx + 10) * 10)
      const delay = pseudo(idx + 20) * 0.4
      const duration = 1.2 + pseudo(idx + 30) * 0.8
      const rotate = Math.round(pseudo(idx + 40) * 360)
      const color = colors[idx % colors.length]
      return { id: idx, left, size, delay, duration, rotate, color }
    })
  }, [active])

  if (!active) return null

  return (
    <>
      {items.map((item) => (
        <span
          key={item.id}
          className="fixed top-0 z-[60] rounded-md"
          style={{
            left: `${item.left}%`,
            width: item.size,
            height: item.size,
            backgroundColor: item.color,
            transform: `rotate(${item.rotate}deg)`,
            animation: `lumixConfettiFall ${item.duration}s linear ${item.delay}s forwards`
          }}
        />
      ))}
    </>
  )
}

export default function CustomerPaymentPage() {
  const navigate = useNavigate()
  const { slug } = useParams()
  const { pushToast } = useToast()
  const paymentSnapshot = readPaymentSnapshot(slug)
  const {
    shop,
    services,
    staff,
    bookingDraft,
    customerLoyalty,
    loadCustomerLoyalty,
    createBookingFromDraft,
    resetBookingDraft,
    loadPublicShop,
    checkBookingStatus,
    expireUnpaidBooking,
    loadCustomerBookings
  } = useShop()
  // allow restoring booking draft from localStorage when page reloaded
  const { setBookingDraft } = useShop()

  const effectiveBookingDraft = useMemo(() => {
    const fallback = paymentSnapshot?.draft || paymentSnapshot?.bookingDraft || paymentSnapshot || {}
    return {
      ...bookingDraft,
      serviceId: bookingDraft?.serviceId || fallback.serviceId || null,
      staffId: bookingDraft?.staffId || fallback.staffId || 'random',
      date: bookingDraft?.date || fallback.date || '',
      time: bookingDraft?.time || fallback.time || '',
      customerName: bookingDraft?.customerName || fallback.customerName || '',
      customerPhone: bookingDraft?.customerPhone || fallback.customerPhone || '',
      customerEmail: bookingDraft?.customerEmail || fallback.customerEmail || '',
      note: bookingDraft?.note || fallback.note || '',
      holdToken: bookingDraft?.holdToken || fallback.holdToken || '',
      holdExpiresAt: bookingDraft?.holdExpiresAt || fallback.holdExpiresAt || ''
    }
  }, [bookingDraft, paymentSnapshot])

  const service = services.find((item) => item.id === effectiveBookingDraft.serviceId)
  const selectedStaff = effectiveBookingDraft.staffId === 'random' ? null : staff.find((item) => item.id === effectiveBookingDraft.staffId)

  // Do not rely on localStorage fallbacks for hold/payment; bookingDraft and server attempt are authoritative
  const getInitialHoldSeconds = () => {
    const expiresAt = bookingDraft?.holdExpiresAt || ''
    if (!expiresAt) return 3 * 60
    const diff = Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000)
    return Number.isFinite(diff) ? Math.max(0, diff) : 3 * 60
  }

  const [timeLeft, setTimeLeft] = useState(() => {
    const snapshotExpiresAt = paymentSnapshot?.bookingExpiresAt || paymentSnapshot?.depositExpiresAt || ''
    const expiresAt = bookingDraft?.holdExpiresAt || snapshotExpiresAt || ''
    if (!expiresAt) return 3 * 60
    const diff = Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000)
    return Number.isFinite(diff) ? Math.max(0, diff) : 3 * 60
  })
  const [bookingExpiresAt, setBookingExpiresAt] = useState(bookingDraft?.holdExpiresAt || paymentSnapshot?.bookingExpiresAt || paymentSnapshot?.depositExpiresAt || '')
  const [success, setSuccess] = useState(false)
  const [expired, setExpired] = useState(false)
  const [createdBookingId, setCreatedBookingId] = useState(() => {
    const initial = String(paymentSnapshot?.createdBookingId || '').trim()
    return /^BK/i.test(initial) ? initial : null
  })
  const [confetti, setConfetti] = useState(false)

  const [payosData, setPayosData] = useState(paymentSnapshot?.payosData ? normalizePaymentPayload(paymentSnapshot.payosData) : null)
  const [creating, setCreating] = useState(false)
  const [qrFetchHint, setQrFetchHint] = useState('')
  const [restoreChecked, setRestoreChecked] = useState(false)
  const [showRestoreHold, setShowRestoreHold] = useState(false)
  const [attemptAmounts, setAttemptAmounts] = useState(paymentSnapshot?.attemptAmounts || { depositAmount: 0, totalAmount: 0 })
  const [showExitConfirm, setShowExitConfirm] = useState(false)
  const [redeemPoints, setRedeemPoints] = useState(() => Math.max(0, Math.floor(Number(bookingDraft?.redeemPoints || 0))))
  const autoBookingCalledRef = useRef(false)
  const AUTO_CREATE_PAYMENT = false
  const createdRedeemPointsRef = useRef(0)
  const [paymentDirty, setPaymentDirty] = useState(false)
  const skipExitCleanupRef = useRef(false)
  const autoRetryRef = useRef({ attempts: 0, lastAt: 0 })
  const paymentPageUrlRef = useRef(`${window.location.pathname}${window.location.search}${window.location.hash}`)
  const shouldBlockExit = Boolean(createdBookingId && !success && !expired)

  useEffect(() => {
    setBookingDraft((prev) => ({ ...prev, redeemPoints }))

    if (createdBookingId && !success && !expired && Number(redeemPoints || 0) != Number(createdRedeemPointsRef.current || 0)) {
      setPaymentDirty(true)
      setPayosData(null)
    }
  }, [redeemPoints, setBookingDraft, createdBookingId, success, expired])

  useEffect(() => {
    if (!slug) return
    writePaymentSnapshot(slug, {
      createdBookingId,
      bookingExpiresAt,
      payosData,
      attemptAmounts,
      draft: snapshotDraftFromBookingDraft(bookingDraft),
      timeLeft,
      updatedAt: Date.now()
    })
  }, [slug, createdBookingId, bookingExpiresAt, payosData, attemptAmounts, timeLeft, bookingDraft])

  useEffect(() => {
    if (!slug) return
    loadPublicShop(slug).catch(() => {})
  }, [slug, loadPublicShop])

  useEffect(() => {
    if (!slug) return

    const onBeforeUnload = () => {
      skipExitCleanupRef.current = true
      try {
        sessionStorage.setItem(`lumix_payment_reloading_${slug}`, '1')
      } catch {
        // ignore
      }
    }

    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [slug])

  useEffect(() => {
    if (!slug) return

    const onPopState = () => {
      if (!shouldBlockExit || skipExitCleanupRef.current) return

      try {
        window.history.pushState(window.history.state, '', paymentPageUrlRef.current)
      } catch {
        // ignore
      }

      setShowExitConfirm(true)
    }

    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [slug, shouldBlockExit, createdBookingId, expireUnpaidBooking, resetBookingDraft, navigate])

  useEffect(() => {
    if (!slug) return
    return () => {
      let isReloading = false
      try {
        isReloading = sessionStorage.getItem(`lumix_payment_reloading_${slug}`) === '1'
      } catch {
        isReloading = false
      }

      if (!isReloading && !skipExitCleanupRef.current) {
        if (createdBookingId && !success && !expired) {
          void expireUnpaidBooking(createdBookingId, true).catch(() => {})
        }
        try { sessionStorage.removeItem(`client_attempt_${slug}`) } catch {}
        clearPaymentSnapshot(slug)
        resetBookingDraft()
      }

      try {
        sessionStorage.removeItem(`lumix_payment_reloading_${slug}`)
      } catch {
        // ignore
      }
    }
  }, [slug, resetBookingDraft, createdBookingId, success, expired, expireUnpaidBooking])


  const depositAmount = useMemo(() => {
    const fallbackDeposit = Number(attemptAmounts.depositAmount || 0)
    if (!service) return fallbackDeposit
    const deposit = shop.deposit || { enabled: false, type: 'fixed', value: 0 }
    if (!deposit.enabled) return fallbackDeposit
    let computed = 0
    if (deposit.type === 'percent') {
      computed = Math.round((service.priceVnd * Number(deposit.value || 0)) / 100)
    } else {
      computed = Number(deposit.value || 0)
    }
    return computed > 0 ? computed : fallbackDeposit
  }, [service, shop.deposit, attemptAmounts.depositAmount])

  const loyaltyBalancePoints = Math.max(0, Math.floor(Number(customerLoyalty?.pointsBalance || 0)))
  const safeRedeemPoints = Math.max(0, Math.floor(Number(redeemPoints || 0)))
  const maxDiscountVnd = Math.floor((Math.max(0, Number(depositAmount || 0)) * 80) / 100)
  const maxRedeemablePoints = Math.max(0, Math.floor(maxDiscountVnd / 100))
  const redeemPointsToUse = Math.max(0, Math.min(safeRedeemPoints, loyaltyBalancePoints, maxRedeemablePoints))
  const redeemDiscountVnd = redeemPointsToUse * 100
  const originalDepositAmount = Math.max(0, Number((payosData?.loyalty?.originalDepositAmount ?? depositAmount) || 0))
  const finalDepositAmount = Math.max(0, Number((payosData?.loyalty?.finalDepositAmount ?? (originalDepositAmount - redeemDiscountVnd)) || 0))
  const redeemPreview = {
    balancePoints: loyaltyBalancePoints,
    requestedPoints: safeRedeemPoints,
    pointsToUse: redeemPointsToUse,
    discountVnd: redeemDiscountVnd,
    maxRedeemablePoints,
    originalDepositAmount,
    finalDepositAmount
  }


  const isPaymentLoading = Boolean(
    !success &&
    !expired &&
    (
      creating ||
      (shop.deposit?.enabled && creating)
    )
  )

  const syncBookingState = useCallback(async (bookingCode) => {
    if (!bookingCode) return null
    const res = await checkBookingStatus(bookingCode)
    if (res?.booking) {
      setCreatedBookingId(pickBookingCode(res.booking))
      if (res.booking.depositExpiresAt) {
        setBookingExpiresAt(res.booking.depositExpiresAt)
      }
    }
    if (res?.payment) {
      const normalized = normalizePaymentPayload(res.payment)
      setPayosData(normalized)
    }
    return res
  }, [checkBookingStatus, slug])

  // Try to fetch payment info a few times when backend needs a moment to persist
  const fetchPaymentWithRetries = useCallback(async (bookingCode, attempts = 12, delayMs = 500) => {
    if (!bookingCode) return null
    for (let i = 0; i < attempts; i += 1) {
      try {
        const r = await checkBookingStatus(bookingCode)
        const payment = r?.payment || r?.data?.payment || null
        if (payment) {
          const normalized = normalizePaymentPayload(payment)
          setPayosData(normalized)
          return normalized
        }
      } catch {
        // ignore transient errors
      }
      // wait before next try
      // eslint-disable-next-line no-await-in-loop
      await new Promise((res) => setTimeout(res, delayMs))
    }
    return null
  }, [checkBookingStatus])

  const retryFetchPaymentNow = useCallback(async () => {
    let bookingCode = String(createdBookingId || '').trim()
    if (!bookingCode) {
      try {
        const attemptId = sessionStorage.getItem(`client_attempt_${slug}`)
        if (attemptId) {
          const attemptRes = await apiRequest(`/api/public/shops/${slug}/booking-attempts/${attemptId}`)
          const resolved = String(attemptRes?.booking?.bookingCode || '').trim()
          if (resolved) {
            bookingCode = resolved
            setCreatedBookingId(resolved)
          }
        }
      } catch {
        // ignore
      }
    }

    if (!bookingCode) {
      setQrFetchHint('Không tìm thấy mã booking để lấy lại QR.')
      return
    }

    setQrFetchHint('Đang thử lấy lại mã thanh toán...')
    try {
      try {
        await apiRequest(`/api/public/bookings/${encodeURIComponent(bookingCode)}/refresh-payment`, { method: 'POST' })
      } catch {
        // ignore
      }
      const normalized = await fetchPaymentWithRetries(bookingCode, 12, 500)
      if (normalized) {
        setQrFetchHint('Đã lấy lại mã thanh toán.')
        return
      }
      const res = await syncBookingState(bookingCode)
      const payment = res?.payment || res?.data?.payment || null
      if (payment) {
        setPayosData(normalizePaymentPayload(payment))
        setQrFetchHint('Đã lấy lại mã thanh toán.')
        return
      }
      setQrFetchHint('Chưa lấy được mã thanh toán. Vui lòng thử lại sau vài giây.')
    } catch {
      setQrFetchHint('Không thể lấy lại mã thanh toán. Vui lòng thử lại.')
    }
  }, [createdBookingId, fetchPaymentWithRetries, syncBookingState, slug])

  // Fail-safe: if booking exists but QR/payment is still missing after a short delay, show a retry hint.
  useEffect(() => {
    if (success || expired) return
    if (!isPaymentLoading) return
    if (payosData) return
    if (!depositAmount || depositAmount <= 0) return

    const timer = setTimeout(() => {
      setQrFetchHint((prev) => prev || 'Đang lấy mã thanh toán cọc...')
    }, 3500)
    return () => clearTimeout(timer)
  }, [success, expired, isPaymentLoading, payosData, depositAmount])

  useEffect(() => {
    if (payosData) setQrFetchHint('')
  }, [payosData])

  // Background auto-retry: every 4s, up to 3 times, while waiting for QR/payment.
  useEffect(() => {
    if (success || expired) return
    if (!isPaymentLoading) return
    if (payosData) return
    if (!depositAmount || depositAmount <= 0) return

    autoRetryRef.current.attempts = 0
    autoRetryRef.current.lastAt = Date.now()

    let mounted = true
    const timer = setInterval(async () => {
      if (!mounted) return
      if (payosData) return
      if (!isPaymentLoading) return
      if (autoRetryRef.current.attempts >= 3) return

      const now = Date.now()
      if (now - Number(autoRetryRef.current.lastAt || 0) < 3900) return
      autoRetryRef.current.lastAt = now
      autoRetryRef.current.attempts += 1

      try {
        await retryFetchPaymentNow()
      } catch {
        // ignore
      }
    }, 4000)

    return () => {
      mounted = false
      clearInterval(timer)
    }
  }, [success, expired, isPaymentLoading, payosData, depositAmount, retryFetchPaymentNow])

  // Seed payosData from globals if present (helps avoid first-render race in prod)
  useEffect(() => {
    if (payosData) return
    try {
      const win = window || {}
      const candidate = win.__payosData || (win.__lastBookingRes && win.__lastBookingRes.payment) || null
      if (candidate) {
        setPayosData(normalizePaymentPayload(candidate))
      }
    } catch {
      // ignore
    }
  }, [payosData])

  // Restore booking info on hard reload (bookingDraft may be empty)
  useEffect(() => {
    if (!slug) return
    let mounted = true
    const restore = async () => {
      try {
        const snapshotDraft = paymentSnapshot?.draft || paymentSnapshot || {}
        if (snapshotDraft?.serviceId || snapshotDraft?.staffId || snapshotDraft?.date || snapshotDraft?.time) {
          setBookingDraft((prev) => ({
            ...prev,
            serviceId: prev.serviceId || snapshotDraft.serviceId || null,
            staffId: prev.staffId || snapshotDraft.staffId || 'random',
            date: prev.date || snapshotDraft.date || '',
            time: prev.time || snapshotDraft.time || '',
            customerName: prev.customerName || snapshotDraft.customerName || '',
            customerPhone: prev.customerPhone || snapshotDraft.customerPhone || '',
            customerEmail: prev.customerEmail || snapshotDraft.customerEmail || '',
            note: prev.note || snapshotDraft.note || '',
            holdToken: prev.holdToken || snapshotDraft.holdToken || '',
            holdExpiresAt: prev.holdExpiresAt || snapshotDraft.holdExpiresAt || ''
          }))
        }
      } catch {
        // ignore
      } finally {
        if (mounted) {
          setRestoreChecked(true)
          setCreating(false)
        }
      }
    }

    restore()
    return () => {
      mounted = false
    }
  }, [slug, checkBookingStatus, bookingDraft?.serviceId])

  const handleRestoreHold = () => {
    (async () => {
      try {
        const attemptKey = `client_attempt_${slug}`
        const attemptId = sessionStorage.getItem(attemptKey)
        if (attemptId) {
          try {
            const attemptRes = await apiRequest(`/api/public/shops/${slug}/booking-attempts/${attemptId}`)
            if (attemptRes?.hold) {
              const h = attemptRes.hold
              const dt = new Date(h.startTime)
              const date = dt.toISOString().slice(0, 10)
              const time = dt.toTimeString().slice(0, 5)
              try {
                setBookingDraft((prev) => ({
                  ...prev,
                  serviceId: h.serviceId || prev.serviceId,
                  staffId: h.staffId || prev.staffId || 'random',
                  date,
                  time,
                  holdToken: h.holdToken || '',
                  holdExpiresAt: h.expiresAt || ''
                }))
              } catch {
                // ignore
              }
            }
            if (attemptRes?.booking) {
              const hydratedDraft = buildDraftFromAttempt(attemptRes.booking)
              if (hydratedDraft) {
                setBookingDraft((prev) => ({
                  ...prev,
                  ...hydratedDraft,
                  holdToken: prev.holdToken || hydratedDraft.holdToken,
                  holdExpiresAt: prev.holdExpiresAt || hydratedDraft.holdExpiresAt
                }))
              }
              setAttemptAmounts({
                depositAmount: Number(attemptRes.booking.depositAmount || 0),
                totalAmount: Number(attemptRes.booking.totalAmount || 0)
              })
              setCreatedBookingId(pickBookingCode(attemptRes.booking))
            }
            if (attemptRes?.payment) setPayosData(normalizePaymentPayload(attemptRes.payment))
          } catch {
            // ignore
          }
        }
      } finally {
        setShowRestoreHold(false)
      }
    })()
  }

  const handleCancelHold = () => {
    if (createdBookingId && !success && !expired) {
      void expireUnpaidBooking(createdBookingId, true).catch(() => {})
    }
    try { sessionStorage.removeItem(`client_attempt_${slug}`) } catch {}
    setShowRestoreHold(false)
    resetBookingDraft()
    navigate(`/${slug}/book/time`)
  }

  // Auto-create booking when arriving at payment page.
  // Disabled: customer must confirm loyalty points before generating QR/payment.
  useEffect(() => {
    if (!AUTO_CREATE_PAYMENT) return
    if (expired) return

    const readyToEvaluate = restoreChecked || Boolean(service)
    if (!readyToEvaluate) return

    const evalAndMaybeAutoCreate = async () => {
      const phoneNormalized = normalizePhone(effectiveBookingDraft.customerPhone)
      const phoneOk = isValidPhone(phoneNormalized)
      const hasRestoredDraft = Boolean(
        effectiveBookingDraft?.serviceId ||
        effectiveBookingDraft?.holdToken ||
        paymentSnapshot?.draft?.serviceId ||
        paymentSnapshot?.serviceId
      )

      // If the hold is missing or expired, don't try to create booking again.
      // This prevents repeated API calls when user reloads the page many times.
      const attemptRes = null

      const attemptHold = attemptRes?.hold || null
      const holdExpiresAt = effectiveBookingDraft?.holdExpiresAt
        ? new Date(effectiveBookingDraft.holdExpiresAt)
        : bookingExpiresAt
        ? new Date(bookingExpiresAt)
        : null
      const hasHold = Boolean(effectiveBookingDraft?.holdToken)
      const holdExpired = !holdExpiresAt || Number.isNaN(holdExpiresAt.getTime()) ? true : holdExpiresAt.getTime() <= Date.now()

      const effectiveBookingCode = createdBookingId || null

      if (!service || !phoneOk || effectiveBookingCode) return

      if (!hasHold || holdExpired) {
        if (effectiveBookingCode) return
        pushToast({ type: 'warning', title: 'Phiên giữ chỗ hết hạn', message: 'Giữ chỗ tạm đã hết hạn. Vui lòng chọn lại khung giờ.' })
        navigate(`/${slug}/book`, { replace: true })
        return
      }

      if (autoBookingCalledRef.current) return

      let mounted = true
      autoBookingCalledRef.current = true

      const run = async () => {
        if (mounted) setCreating(true)
        try {
          const res = await createBookingFromDraft(slug)
          try { window.__lastBookingRes = res } catch {}
          if (!mounted) return

          if (res?.booking) {
            const hydratedDraft = buildDraftFromAttempt(res.booking)
            const mergedDraft = {
              ...bookingDraft,
              ...(hydratedDraft || {})
            }
            writePaymentSnapshot(slug, {
              createdBookingId: pickBookingCode(res.booking),
              bookingExpiresAt: res.booking.depositExpiresAt || bookingExpiresAt,
              payosData: res?.payment ? normalizePaymentPayload(res.payment) : payosData,
              attemptAmounts: {
                depositAmount: Number(res.booking.depositAmount || 0),
                totalAmount: Number(res.booking.totalAmount || 0)
              },
              draft: snapshotDraftFromBookingDraft(mergedDraft),
              serviceId: mergedDraft.serviceId || null,
              staffId: mergedDraft.staffId || 'random',
              timeLeft,
              updatedAt: Date.now()
            })
            if (hydratedDraft) {
              setBookingDraft((prev) => ({
                ...prev,
                ...hydratedDraft,
                holdToken: prev.holdToken || hydratedDraft.holdToken,
                holdExpiresAt: prev.holdExpiresAt || hydratedDraft.holdExpiresAt
              }))
            }
            setBookingDraft((prev) => clearHoldFromDraft(prev))
            setAttemptAmounts({
              depositAmount: Number(res.booking.depositAmount || 0),
              totalAmount: Number(res.booking.totalAmount || 0)
            })
            setCreatedBookingId(pickBookingCode(res.booking))
            if (res.booking.depositExpiresAt) {
              setBookingExpiresAt(res.booking.depositExpiresAt)
            }
          }

          if (res?.payment) {
            const normalized = normalizePaymentPayload(res.payment)
            setPayosData(normalized)
            writePaymentSnapshot(slug, {
              createdBookingId: pickBookingCode(res.booking) || createdBookingId,
              bookingExpiresAt: res.booking?.depositExpiresAt || bookingExpiresAt,
              payosData: normalized,
              attemptAmounts,
              draft: snapshotDraftFromBookingDraft(effectiveBookingDraft),
              serviceId: effectiveBookingDraft.serviceId || null,
              staffId: effectiveBookingDraft.staffId || 'random',
              timeLeft,
              updatedAt: Date.now()
            })
            try { window.__payosData = res.payment } catch {}
            // If normalized payload lacks a usable checkout/QR, poll the server
            const needPolling = !normalized?.checkoutUrl && !normalized?.qrCodeUrl && !normalized?.qrCode
            if (needPolling) {
              // increase attempts for this situation (webhook persistence lag)
              void fetchPaymentWithRetries(pickBookingCode(res.booking), 24, 500)
              void syncBookingState(pickBookingCode(res.booking))
            }
          } else if (res?.booking) {
            // Booking was created but payment object may not be persisted yet in prod.
            // Try to hydrate payment info for a few seconds to avoid forcing user reload.
            if (res?.booking?.bookingCode) {
              void fetchPaymentWithRetries(res.booking.bookingCode, 24, 500)
            }
            // Booking exists but no immediate payment payload; sync authoritative state from server.
            void syncBookingState(res.booking.bookingCode)

            // If the shop does not require a deposit, consider this step complete for the customer
            // UX-wise even if the payment system hasn't separately recorded a payment object yet.
            // The backend may already mark the booking as confirmed; if not, the UI treats it as
            // completed because no deposit is required.
            try {
              if (!shop?.deposit?.enabled) {
                setCreatedBookingId(pickBookingCode(res.booking))
                setSuccess(true)
                setConfetti(true)
                setTimeout(() => setConfetti(false), 2500)
                resetBookingDraft()
              }
            } catch {
              // ignore
            }
          } else {
            // No payment and no booking payload returned yet. Do NOT assume success based on client-side
            // deposit heuristics. Rely on server-side booking.status/payment webhook to mark booking as confirmed.
          }
        } catch (err) {
          console.error(err)
          if (mounted) {
            // Only treat real hold-expiry conflicts as expired hold, not every 409 conflict.
            const msg = String(err?.message || '').toLowerCase()
            const isExpiredHold =
              Number(err?.status || 0) === 409 &&
              (msg.includes('hết hạn') || msg.includes('expired') || msg.includes('giữ chỗ'))
            const isSlotConflict =
              Number(err?.status || 0) === 409 &&
              (msg.includes('khung giờ') || msg.includes('slot') || msg.includes('vừa bị đặt') || msg.includes('đã được đặt') || msg.includes('taken') || msg.includes('booked'))

            if (isExpiredHold) {
              try { sessionStorage.removeItem(`client_attempt_${slug}`) } catch {}
              clearPaymentSnapshot(slug)
              pushToast({ type: 'warning', title: 'Phiên giữ chỗ hết hạn', message: 'Giữ chỗ tạm đã hết hạn. Vui lòng chọn lại khung giờ.' })
              navigate(`/${slug}/book`, { replace: true })
              return
            }

            if (isSlotConflict) {
              try { sessionStorage.removeItem(`client_attempt_${slug}`) } catch {}
              clearPaymentSnapshot(slug)
              resetBookingDraft()
              pushToast({ type: 'warning', title: 'Khung giờ đã kín', message: 'Khung giờ vừa bị đặt. Vui lòng chọn lại khung giờ khác.' })
              navigate(`/${slug}/book`, { replace: true })
              return
            }

            pushToast({ type: 'error', title: 'Không thể giữ chỗ', message: err?.message || 'Lỗi không xác định.' })
          }
        } finally {
          if (mounted) setCreating(false)
        }
      }

      run()
      return () => {
        mounted = false
      }
    }

    void evalAndMaybeAutoCreate()
  }, [
    expired,
    service,
    effectiveBookingDraft.customerPhone,
    effectiveBookingDraft.holdToken,
    effectiveBookingDraft.holdExpiresAt,
    slug,
    createdBookingId,
    restoreChecked,
    depositAmount,
    createBookingFromDraft,
    resetBookingDraft,
    
    navigate,
    bookingExpiresAt
  ])

  // Countdown display
  useEffect(() => {
    if (success || expired) return

    const timer = setInterval(() => {
      const expiresAt = bookingDraft?.holdExpiresAt || bookingExpiresAt || ''
      if (expiresAt) {
        const diff = Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000)
        setTimeLeft(Number.isFinite(diff) ? Math.max(0, diff) : 0)
        return
      }
      setTimeLeft((prev) => (prev <= 0 ? 0 : prev - 1))
    }, 1000)

    return () => clearInterval(timer)
  }, [success, expired, bookingDraft?.holdExpiresAt, bookingExpiresAt])

  // Time up -> expire unpaid booking immediately and clean local state.
  useEffect(() => {
    if (success || expired) return
    if (timeLeft > 0) return

    let mounted = true
    const run = async () => {
      if (mounted) {
        setExpired(true)
        setPayosData(null)
      }
      try {
        if (createdBookingId) {
          await expireUnpaidBooking(createdBookingId, true)
        }
      } catch {
        // ignore expire errors
      }

      if (!mounted) return
      try { sessionStorage.removeItem(`client_attempt_${slug}`) } catch {}
      clearPaymentSnapshot(slug)
      pushToast({ type: 'warning', title: 'Phiên giữ chỗ hết hạn', message: 'Giữ chỗ tạm đã hết hạn. Vui lòng chọn lại khung giờ.' })
      navigate(`/${slug}/book`, { replace: true })
    }

    run()
    return () => {
      mounted = false
    }
  }, [timeLeft, createdBookingId, success, expired, slug, navigate, expireUnpaidBooking])

  // Poll booking status while awaiting payment
  useEffect(() => {
    if (!createdBookingId || success) return

    let mounted = true
    const timer = setInterval(async () => {
      try {
        const res = await checkBookingStatus(createdBookingId)
        const booking = res?.booking || res?.data?.booking || null
        const status = String(booking?.status || '').toLowerCase()
        if ((status === 'cancelled' || status === 'canceled') && mounted) {
          setExpired(true)
          return
        }
        const paid = booking?.status === 'confirmed'

        if (paid && mounted) {
          setSuccess(true)
          setConfetti(true)
          setTimeout(() => setConfetti(false), 2500)
          resetBookingDraft()
        }
        // If a payment object appears later (e.g., checkoutUrl-only), capture it so QR/link shows.
        try {
          const payment = res?.payment || res?.data?.payment || null
            if (payment && mounted && !payosData) {
            const normalized = normalizePaymentPayload(payment)
            setPayosData(normalized)
          }
        } catch {
          // ignore payment parsing errors
        }
      } catch {
        // ignore polling errors
      }
    }, 3000)

    return () => {
      mounted = false
      clearInterval(timer)
    }
  }, [createdBookingId, success, checkBookingStatus, resetBookingDraft, payosData, slug])

  // If booking exists but QR data is missing, fetch once from booking status API.
  useEffect(() => {
    if (!createdBookingId || payosData) return
    let mounted = true
    const run = async () => {
      try {
        const res = await checkBookingStatus(createdBookingId)
        if (!mounted) return
        if (res?.payment) {
          const normalized = normalizePaymentPayload(res.payment)
          setPayosData(normalized)
        }
      } catch {
        // ignore
      }
    }
    run()
    return () => {
      mounted = false
    }
  }, [createdBookingId, payosData, checkBookingStatus, slug])

  useEffect(() => {
    if (!expired) return
    try { sessionStorage.removeItem(`client_attempt_${slug}`) } catch {}
    clearPaymentSnapshot(slug)
    pushToast({ type: 'warning', title: 'Phiên thanh toán hết hạn', message: 'Phiên thanh toán đặt cọc đã hết hạn. Vui lòng chọn lại khung giờ.' })
    navigate(`/${slug}/book`, { replace: true })
  }, [expired, slug, navigate])


  const createPaymentNow = async () => {
    if (!slug || expired) return

    const phoneNormalized = normalizePhone(effectiveBookingDraft.customerPhone)
    const phoneOk = isValidPhone(phoneNormalized)
    const hasHold = Boolean(effectiveBookingDraft?.holdToken)
    const holdExpiresAt = effectiveBookingDraft?.holdExpiresAt ? new Date(effectiveBookingDraft.holdExpiresAt) : null
    const holdExpired = !holdExpiresAt || Number.isNaN(holdExpiresAt.getTime()) ? true : holdExpiresAt.getTime() <= Date.now()

    if (!service || !phoneOk) {
      pushToast({ type: 'warning', title: 'Thiếu thông tin', message: 'Vui lòng quay lại và nhập đủ thông tin trước khi tạo mã cọc.' })
      navigate(`/${slug}/book`, { replace: true })
      return
    }

    if (!hasHold || holdExpired) {
      pushToast({ type: 'warning', title: 'Phiên giữ chỗ hết hạn', message: 'Giữ chỗ tạm đã hết hạn. Vui lòng chọn lại khung giờ.' })
      navigate(`/${slug}/book`, { replace: true })
      return
    }

    setCreating(true)
    try {
      let res = null
      if (createdBookingId && paymentDirty) {
        res = await apiRequest(`/api/public/bookings/${createdBookingId}/recreate-payment`, {
          method: 'POST',
          body: { redeemPoints: Math.max(0, Math.floor(Number(redeemPoints || 0))) }
        })
      } else {
        res = await createBookingFromDraft(slug)
      }
      if (res?.booking) {
        createdRedeemPointsRef.current = Math.max(0, Math.floor(Number(redeemPoints || 0)))
        setPaymentDirty(false)
        setAttemptAmounts({
          depositAmount: Number(res.booking.depositAmount || 0),
          totalAmount: Number(res.booking.totalAmount || 0)
        })
        setCreatedBookingId(pickBookingCode(res.booking))
        if (res.booking.depositExpiresAt) setBookingExpiresAt(res.booking.depositExpiresAt)
      }

      if (res?.payment) {
        setPayosData(normalizePaymentPayload(res.payment))
      } else if (res?.booking?.bookingCode) {
        void fetchPaymentWithRetries(res.booking.bookingCode, 24, 500)
      }
    } catch (err) {
      pushToast({ type: 'error', title: 'Không thể tạo mã cọc', message: err?.message || 'Vui lòng thử lại.' })
    } finally {
      setCreating(false)
    }
  }

  const handleTransferred = async () => {
    let bookingCode = createdBookingId || null
    if (!bookingCode) {
      try {
        const attemptId = sessionStorage.getItem(`client_attempt_${slug}`)
        if (attemptId) {
          const attemptRes = await apiRequest(`/api/public/shops/${slug}/booking-attempts/${attemptId}`)
          if (attemptRes?.booking) bookingCode = attemptRes.booking.bookingCode || attemptRes.booking._id
        }
      } catch {
        // ignore
      }
    }

    if (!bookingCode) {
      pushToast({ type: 'error', title: 'Thiếu mã đặt lịch', message: 'Không tìm thấy mã đặt lịch để kiểm tra thanh toán.' })
      return
    }

    let lastError = null
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        // First, ask server to refresh payment by querying PayOS (best-effort)
        try { await apiRequest(`/api/public/bookings/${bookingCode}/refresh-payment`, { method: 'POST' }) } catch {}
        const res = await checkBookingStatus(bookingCode)
        const booking = res?.booking || res?.data?.booking || null
        const payment = res?.payment || res?.data?.payment || null
        const paid = booking?.status === 'confirmed' || isSuccessfulPaymentStatus(payment?.status)

        if (paid) {
          setCreatedBookingId(pickBookingCode(booking) || bookingCode)
          setSuccess(true)
          setConfetti(true)
          setTimeout(() => setConfetti(false), 2500)
          await loadCustomerBookings().catch(() => {})
          await loadCustomerLoyalty().catch(() => {})
          resetBookingDraft()
          return
        }

        lastError = null
      } catch (err) {
        lastError = err
      }
    }

    // If the shop does not require deposit, allow marking as completed even if server hasn't
    // yet recorded an external payment object. This keeps UX consistent for no-deposit flows.
    try {
      if (!shop?.deposit?.enabled) {
        setSuccess(true)
        setConfetti(true)
        setTimeout(() => setConfetti(false), 2500)
        await loadCustomerBookings().catch(() => {})
        resetBookingDraft()
        return
      }
    } catch {
      // ignore
    }

    if (lastError) {
      pushToast({ type: 'warning', title: 'Chưa kiểm tra được thanh toán', message: 'Vui lòng đợi 10-15 giây rồi bấm lại.' })
      return
    }

    pushToast({ type: 'info', title: 'Chưa ghi nhận thanh toán', message: 'Vui lòng đợi thêm vài giây rồi thử lại.' })
  }


  const confirmExitPayment = () => {
    skipExitCleanupRef.current = true
    void expireUnpaidBooking(createdBookingId, true).catch(() => {})
    try { sessionStorage.removeItem(`client_attempt_${slug}`) } catch {}
    clearPaymentSnapshot(slug)
    resetBookingDraft()
    setShowExitConfirm(false)
    navigate(`/${slug}/book`, { replace: true })
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-white to-primary/10 text-main p-6">
        <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center max-w-md w-full">
          <h1 className="text-2xl font-bold text-primary">Thanh toán thành công</h1>
          <p className="text-main/70 mt-2">Cảm ơn bạn! Hệ thống đã ghi nhận đặt lịch.</p>
          <div className="mt-5 flex flex-col sm:flex-row gap-3 justify-center">
            <Link to={slug ? `/customer/bookings?shopSlug=${encodeURIComponent(slug)}` : "/customer/bookings"} className="inline-block px-6 py-3 rounded-2xl bg-primary text-white font-bold">
              Xem lịch hẹn của tôi
            </Link>
            <Link to={`/${slug || ''}/book`} className="inline-block px-6 py-3 rounded-2xl border border-primary text-primary font-bold">
              Đặt thêm lịch
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (expired) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-white to-primary/10 text-main p-6">
        <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center max-w-md w-full shadow-xl">
          <h1 className="text-2xl font-bold text-primary">Phiên thanh toán đã hết hạn</h1>
          <p className="text-main/70 mt-2">Bạn vui lòng chọn lại khung giờ để tạo mã thanh toán mới.</p>
          <Link to={`/${slug || ''}/book/time`} className="inline-block mt-5 px-6 py-3 rounded-2xl bg-primary text-white font-bold">
            Chọn lại khung giờ
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-primary/10 text-main">
      <ConfettiLayer active={confetti} />

      <CustomerHeader />

      <main className="px-4 md:px-10 pb-16">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10">
          {showRestoreHold ? (
            <div className="lg:col-span-12 mb-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 flex items-center justify-between">
                <div className="text-sm text-main/80">Hệ thống phát hiện phiên giữ chỗ vẫn còn hiệu lực. Bạn có muốn khôi phục phiên giữ chỗ và tiếp tục thanh toán không?</div>
                <div className="flex items-center gap-3">
                  <button onClick={handleRestoreHold} className="px-4 py-2 rounded-2xl bg-primary text-white font-bold">Khôi phục và tiếp tục</button>
                  <button onClick={handleCancelHold} className="px-4 py-2 rounded-2xl bg-white border border-primary text-primary font-bold">Hủy và chọn lại</button>
                </div>
              </div>
            </div>
          ) : null}
          <section className="lg:col-span-8">
            <div className="bg-white/80 rounded-3xl p-7 md:p-8 border border-primary/10 shadow-xl backdrop-blur-sm transition-shadow hover:shadow-2xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="font-h2 text-h2 text-primary">Thanh toán đặt cọc</h1>
                  <p className="text-main/70 mt-1">Vui lòng thanh toán trước khi hết thời gian giữ chỗ.</p>
                </div>
                <div className="text-right">
                  <div className="text-xs text-main/60">Còn lại</div>
                  <div className="text-3xl font-black text-primary tracking-tight tabular-nums">{formatCountdown(timeLeft)}</div>
                </div>
              </div>

              <div className="mt-7 grid grid-cols-1 md:grid-cols-2 gap-7">
                <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm transition-all hover:shadow-lg">
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <h3 className="font-extrabold text-main">Quét QR để thanh toán</h3>
                    <span className="text-xs text-main/60">PayOS</span>
                  </div>
                  <div className="flex flex-col rounded-2xl border border-dashed border-slate-300 bg-gradient-to-br from-slate-50 to-white p-5 min-h-[420px]">
                    {depositAmount > 0 ? (
                      <button
                        type="button"
                        className="w-full mb-5 px-6 py-3.5 rounded-2xl bg-primary text-white font-extrabold hover:brightness-110 active:brightness-95 disabled:opacity-60 transition"
                        onClick={createPaymentNow}
                        disabled={Boolean(creating) || Boolean(success) || Boolean(expired)}
                      >
                        {payosData ? (paymentDirty ? 'Tạo lại mã cọc theo điểm mới' : 'Tạo lại mã cọc') : 'Áp dụng điểm & tạo mã cọc'}
                      </button>
                    ) : null}
                    <div className="flex items-center justify-center min-h-[320px]">
                      {isPaymentLoading ? (
                        <div className="text-center text-main/70 space-y-3">
                          <div className="font-semibold">{qrFetchHint || 'Đang lấy mã thanh toán cọc...'}</div>
                          <div className="mx-auto w-40 h-2 rounded-full bg-slate-200 overflow-hidden">
                            <div className="h-full w-1/2 bg-primary/40 animate-pulse" />
                          </div>
                        </div>
                    ) : (!paymentDirty && (payosData?.qrCodeUrl || payosData?.qrCode || payosData?.checkoutUrl)) ? (
                      <img
                        className="w-[340px] h-[340px] rounded-2xl shadow-md ring-1 ring-black/5 transition-transform duration-300 hover:scale-[1.01]"
                        alt="PayOS QR"
                        src={buildQrImageSrc(payosData.qrCodeUrl || payosData.qrCode || payosData.checkoutUrl)}
                      />
                    ) : (
                        <div className="text-main/60 text-center">
                          <p>{paymentDirty ? 'Bạn đã thay đổi điểm. Vui lòng tạo lại mã cọc để cập nhật số tiền.' : (depositAmount > 0 ? 'Chưa có mã QR. Vui lòng bấm tạo mã cọc.' : 'Không cần đặt cọc.')}</p>
                        </div>
                    )}
                    </div>
                  </div>

                  {payosData?.checkoutUrl ? (
                    <a
                      className="mt-5 inline-flex w-full items-center justify-center px-6 py-3.5 rounded-2xl bg-primary text-white font-extrabold hover:brightness-110 active:brightness-95 transition"
                      href={payosData.checkoutUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Mở cổng thanh toán PayOS
                    </a>
                  ) : null}

                  <button
                    type="button"
                    className="mt-3 w-full px-5 py-3 rounded-2xl bg-white border border-primary text-primary font-bold hover:bg-primary hover:text-white"
                    onClick={handleTransferred}
                  >
                    Tôi đã chuyển khoản
                  </button>
                </div>

                <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm transition-all hover:shadow-lg">
                  <h3 className="font-bold mb-4">Thông tin đặt lịch</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between"><span className="text-main/60">Dịch vụ</span><span className="font-bold text-main">{service?.name || '—'}</span></div>
                    <div className="flex justify-between"><span className="text-main/60">Nhân viên</span><span className="font-bold text-main">{bookingDraft.staffId === 'random' ? 'Ngẫu nhiên' : selectedStaff?.name ?? '—'}</span></div>
                    <div className="flex justify-between"><span className="text-main/60">Thời lượng</span><span className="font-bold text-main">{service?.durationMinutes || 0} phút</span></div>
                    <div className="flex justify-between"><span className="text-main/60">Giá</span><span className="font-bold text-main">{formatVnd(service?.priceVnd || attemptAmounts.totalAmount || 0)}</span></div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-primary/10">
                    <div className="mb-5 p-4 rounded-2xl border border-primary/15 bg-primary/5">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-bold text-main">Dùng điểm để giảm tiền cọc</p>
                          <p className="text-xs text-main/60 mt-0.5">Tối đa dùng 80% tiền cọc · 1 điểm = 100đ</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-main/60">Điểm hiện có</p>
                          <p className="font-extrabold text-primary">{redeemPreview.balancePoints.toLocaleString('vi-VN')} điểm</p>
                        </div>
                      </div>

                      <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-3">
                        <div className="flex-1">
                          <label className="block text-xs text-main/60 mb-1">Số điểm muốn dùng</label>
                          <input
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
                            type="number"
                            min={0}
                            value={redeemPoints}
                            onChange={(e) => setRedeemPoints(Math.max(0, Math.floor(Number(e.target.value || 0))))}
                            placeholder="Nhập số điểm"
                          />
                          <p className="text-xs text-main/50 mt-1">Tối đa: {redeemPreview.maxRedeemablePoints.toLocaleString('vi-VN')} điểm</p>
                        </div>
                        <button
                          type="button"
                          className="px-4 py-3 rounded-xl bg-white border border-primary text-primary font-bold hover:bg-primary/5"
                          onClick={() => setRedeemPoints(Math.max(0, Math.min(redeemPreview.balancePoints, redeemPreview.maxRedeemablePoints)))}
                        >
                          Dùng tối đa
                        </button>
                      </div>

                      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="p-3 rounded-xl bg-white border border-slate-200">
                          <p className="text-xs text-main/60">Cọc gốc</p>
                          <p className="font-bold text-main">{formatVnd(redeemPreview.originalDepositAmount)}</p>
                        </div>
                        <div className="p-3 rounded-xl bg-white border border-slate-200">
                          <p className="text-xs text-main/60">Giảm từ điểm</p>
                          <p className="font-bold text-emerald-600">- {formatVnd(redeemPreview.discountVnd)}</p>
                        </div>
                        <div className="p-3 rounded-xl bg-white border border-slate-200">
                          <p className="text-xs text-main/60">Cọc cần thanh toán</p>
                          <p className="font-extrabold text-primary">{formatVnd(redeemPreview.finalDepositAmount)}</p>
                        </div>
                      </div>

                      {redeemPreview.pointsToUse > 0 ? (
                        <div className="mt-3 text-xs text-main/60">Dự kiến dùng <b className="text-main">{redeemPreview.pointsToUse.toLocaleString('vi-VN')}</b> điểm (giảm <b className="text-main">{formatVnd(redeemPreview.discountVnd)}</b>). Điểm sẽ được giữ khi bạn bắt đầu thanh toán.</div>
                      ) : null}
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-extrabold text-primary">Tiền cọc cần thanh toán:</span>
                      <span className="text-3xl font-black text-primary tracking-tight">{formatVnd(redeemPreview.finalDepositAmount)}</span>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-main/60">Nội dung chuyển khoản</span>
                      <span className="font-mono font-bold text-main">{buildPayContent(createdBookingId || '')}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <aside className="lg:col-span-4">
            <div className="bg-white/80 rounded-3xl p-7 md:p-8 border border-primary/10 shadow-xl backdrop-blur-sm lg:sticky lg:top-24 transition-shadow hover:shadow-2xl">
              <h3 className="font-h3 text-h3 text-main">Xác nhận đặt lịch</h3>
              <p className="text-main/70 mt-1">Vui lòng kiểm tra thông tin trước khi thanh toán.</p>

              <div className="mt-6 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-main/60">Mã đặt lịch</span>
                  <span className="font-bold text-primary">{createdBookingId ? `#${createdBookingId}` : '#LMX-????'}</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>

      {showExitConfirm ? (
        <div className="fixed inset-0 z-[95] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowExitConfirm(false)}>
          <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl border border-slate-200 p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-black text-main">Hủy phiên thanh toán?</h3>
            <p className="text-sm text-main/60 mt-2">Nếu thoát, phiên giữ chỗ sẽ bị hủy và khung giờ được trả lại.</p>
            <div className="mt-6 flex flex-col sm:flex-row gap-3 sm:justify-end">
              <button type="button" onClick={() => setShowExitConfirm(false)} className="px-4 py-3 rounded-2xl border border-slate-200 bg-white font-semibold hover:bg-slate-50">Ở lại thanh toán</button>
              <button type="button" onClick={confirmExitPayment} className="px-4 py-3 rounded-2xl bg-rose-600 text-white font-semibold hover:brightness-110">Xác nhận thoát</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
