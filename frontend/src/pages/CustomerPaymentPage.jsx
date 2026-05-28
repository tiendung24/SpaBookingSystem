import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useShop } from '../context/ShopContext'
import { apiRequest } from '../lib/api'

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
  const rawMeta = payment.raw && typeof payment.raw === 'object' ? payment.raw : {}

  const qrCodeUrl =
    payment.qrCodeUrl ||
    payment.qrCodeURL ||
    payment.qr_url ||
    payment.qrCode ||
    payment.qr ||
    directData?.qrCodeUrl ||
    directData?.qrCodeURL ||
    directData?.qr_url ||
    directData?.qrCode ||
    directData?.qr ||
    raw?.qrCodeUrl ||
    raw?.qrCodeURL ||
    raw?.qr_url ||
    raw?.qrCode ||
    raw?.qr ||
    rawData?.qrCodeUrl ||
    rawData?.qrCodeURL ||
    rawData?.qr_url ||
    rawData?.qrCode ||
    rawData?.qr ||
    payment.checkoutUrl ||
    payment.checkoutURL ||
    directData?.checkoutUrl ||
    directData?.checkoutURL ||
    raw?.checkoutUrl ||
    raw?.checkoutURL ||
    rawData?.checkoutUrl ||
    rawData?.checkoutURL ||
    rawMeta?.paymentLink ||
    rawMeta?.paymentLinkUrl ||
    ''

  const checkoutUrl =
    payment.checkoutUrl ||
    payment.checkoutURL ||
    directData?.checkoutUrl ||
    directData?.checkoutURL ||
    raw?.checkoutUrl ||
    raw?.checkoutURL ||
    rawData?.checkoutUrl ||
    rawData?.checkoutURL ||
    rawMeta?.paymentLink ||
    rawMeta?.paymentLinkUrl ||
    ''

  return {
    ...payment,
    qrCodeUrl,
    checkoutUrl
  }
}

function isSuccessfulPaymentStatus(status) {
  return ['success', 'paid', 'completed'].includes(String(status || '').toLowerCase())
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
  const paymentSnapshot = readPaymentSnapshot(slug)
  const {
    shop,
    services,
    staff,
    bookingDraft,
    createBookingFromDraft,
    resetBookingDraft,
    loadPublicShop,
    checkBookingStatus,
    expireUnpaidBooking
  } = useShop()
  // allow restoring booking draft from localStorage when page reloaded
  const { setBookingDraft } = useShop()

  const service = services.find((item) => item.id === bookingDraft.serviceId)
  const selectedStaff = bookingDraft.staffId === 'random' ? null : staff.find((item) => item.id === bookingDraft.staffId)

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
  const [createdBookingId, setCreatedBookingId] = useState(paymentSnapshot?.createdBookingId || null)
  const [confetti, setConfetti] = useState(false)

  const [payosData, setPayosData] = useState(paymentSnapshot?.payosData ? normalizePaymentPayload(paymentSnapshot.payosData) : null)
  const [creating, setCreating] = useState(false)
  const [restoreChecked, setRestoreChecked] = useState(false)
  const [showRestoreHold, setShowRestoreHold] = useState(false)
  const [attemptAmounts, setAttemptAmounts] = useState(paymentSnapshot?.attemptAmounts || { depositAmount: 0, totalAmount: 0 })
  const autoBookingCalledRef = useRef(false)
  const skipExitCleanupRef = useRef(false)
  const paymentPageUrlRef = useRef(`${window.location.pathname}${window.location.search}${window.location.hash}`)
  const shouldBlockExit = Boolean(createdBookingId && !success && !expired)

  useEffect(() => {
    if (!slug) return
    writePaymentSnapshot(slug, {
      createdBookingId,
      bookingExpiresAt,
      payosData,
      attemptAmounts,
      timeLeft,
      updatedAt: Date.now()
    })
  }, [slug, createdBookingId, bookingExpiresAt, payosData, attemptAmounts, timeLeft])

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

      const ok = window.confirm('Bạn có chắc muốn hủy phiên thanh toán và trả lại khung giờ? Nếu thoát, phiên giữ chỗ sẽ bị hủy.')
      if (ok) {
        skipExitCleanupRef.current = true
        void expireUnpaidBooking(createdBookingId, true).catch(() => {})
        try { sessionStorage.removeItem(`client_attempt_${slug}`) } catch {}
        clearPaymentSnapshot(slug)
        resetBookingDraft()
        navigate(`/${slug}/book`, { replace: true })
      }
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

  const isPaymentLoading = Boolean(
    !success &&
    !expired &&
    (
      creating ||
      (shop.deposit?.enabled && !payosData && (depositAmount > 0 || !service))
    )
  )

  const syncBookingState = useCallback(async (bookingCode) => {
    if (!bookingCode) return null
    const res = await checkBookingStatus(bookingCode)
    if (res?.booking) {
      setCreatedBookingId(res.booking.bookingCode || res.booking._id)
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

  // Restore booking info on hard reload (bookingDraft may be empty)
  useEffect(() => {
    if (!slug) return
    let mounted = true
    const restore = async () => {
      try {
        // hydrate from server using client attempt id if available
        try {
          const attemptKey = `client_attempt_${slug}`
          const attemptId = sessionStorage.getItem(attemptKey)
          if (attemptId) {
            const attemptRes = await apiRequest(`/api/public/shops/${slug}/booking-attempts/${attemptId}`)
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
              setBookingDraft((prev) => clearHoldFromDraft(prev))
              setAttemptAmounts({
                depositAmount: Number(attemptRes.booking.depositAmount || 0),
                totalAmount: Number(attemptRes.booking.totalAmount || 0)
              })
              setCreatedBookingId(attemptRes.booking.bookingCode || attemptRes.booking._id)
              if (attemptRes.booking.depositExpiresAt) {
                setBookingExpiresAt(attemptRes.booking.depositExpiresAt)
              }
            }
            if (attemptRes?.payment) {
              setPayosData(normalizePaymentPayload(attemptRes.payment))
            }
            // if there is a temp hold payload, consider prompting restore UI (kept minimal here)
          }
        } catch (err) {
          // ignore
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
              setCreatedBookingId(attemptRes.booking.bookingCode || attemptRes.booking._id)
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
  useEffect(() => {
    if (expired) return

    const readyToEvaluate = restoreChecked || Boolean(service)
    if (!readyToEvaluate) return

    const evalAndMaybeAutoCreate = async () => {
      const phoneNormalized = normalizePhone(bookingDraft.customerPhone)
      const phoneOk = isValidPhone(phoneNormalized)

      // If the hold is missing or expired, don't try to create booking again.
      // This prevents repeated API calls when user reloads the page many times.
      const attemptKey = `client_attempt_${slug}`
      let attemptRes = null
      try {
        const attemptId = sessionStorage.getItem(attemptKey)
        if (attemptId) {
          attemptRes = await apiRequest(`/api/public/shops/${slug}/booking-attempts/${attemptId}`)
        }
      } catch {
        attemptRes = null
      }

      const attemptHold = attemptRes?.hold || null
      const holdExpiresAt = bookingDraft?.holdExpiresAt
        ? new Date(bookingDraft.holdExpiresAt)
        : bookingExpiresAt
        ? new Date(bookingExpiresAt)
        : attemptHold?.expiresAt
        ? new Date(attemptHold.expiresAt)
        : null
      const hasHold = Boolean(bookingDraft?.holdToken) || Boolean(attemptHold)
      const holdExpired = !holdExpiresAt || Number.isNaN(holdExpiresAt.getTime()) ? true : holdExpiresAt.getTime() <= Date.now()

      const effectiveBookingCode = createdBookingId || attemptRes?.booking?.bookingCode || null

      if (!service || !phoneOk || effectiveBookingCode) return

      if (!hasHold || holdExpired) {
        if (effectiveBookingCode) return
        window.alert('Giữ chỗ tạm đã hết hạn. Vui lòng chọn lại khung giờ.')
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
          if (!mounted) return

          if (res?.booking) {
            const hydratedDraft = buildDraftFromAttempt(res.booking)
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
            setCreatedBookingId(res.booking.bookingCode || res.booking._id)
            if (res.booking.depositExpiresAt) {
              setBookingExpiresAt(res.booking.depositExpiresAt)
            }
          }

          if (res?.payment) {
            const normalized = normalizePaymentPayload(res.payment)
            setPayosData(normalized)
            try { window.__payosData = res.payment } catch {}
            if (!normalized?.checkoutUrl && !normalized?.qrCodeUrl && !normalized?.qrCode) {
              void syncBookingState(res.booking?.bookingCode || res.booking?._id)
            }
          } else if (res?.booking) {
            // Booking exists but no immediate payment payload; sync authoritative state from server.
            void syncBookingState(res.booking.bookingCode || res.booking._id)

            // If the shop does not require a deposit, consider this step complete for the customer
            // UX-wise even if the payment system hasn't separately recorded a payment object yet.
            // The backend may already mark the booking as confirmed; if not, the UI treats it as
            // completed because no deposit is required.
            try {
              if (!shop?.deposit?.enabled) {
                setCreatedBookingId(res.booking.bookingCode || res.booking._id)
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
              window.alert('Giữ chỗ tạm đã hết hạn. Vui lòng chọn lại khung giờ.')
              navigate(`/${slug}/book`, { replace: true })
              return
            }

            if (isSlotConflict) {
              try { sessionStorage.removeItem(`client_attempt_${slug}`) } catch {}
              clearPaymentSnapshot(slug)
              resetBookingDraft()
              window.alert('Khung giờ vừa bị đặt. Vui lòng chọn lại khung giờ khác.')
              navigate(`/${slug}/book`, { replace: true })
              return
            }

            window.alert(`Không thể giữ chỗ: ${err?.message || 'Lỗi không xác định'}`)
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
    bookingDraft.customerPhone,
    bookingDraft.holdToken,
    bookingDraft.holdExpiresAt,
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
      window.alert('Giữ chỗ tạm đã hết hạn. Vui lòng chọn lại khung giờ.')
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
    window.alert('Phiên thanh toán đặt cọc đã hết hạn. Vui lòng chọn lại khung giờ.')
    navigate(`/${slug}/book`, { replace: true })
  }, [expired, slug, navigate])

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
      window.alert('Không tìm thấy mã đặt lịch để kiểm tra thanh toán.')
      return
    }

    let lastError = null
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        const res = await checkBookingStatus(bookingCode)
        const booking = res?.booking || res?.data?.booking || null
        const payment = res?.payment || res?.data?.payment || null
        const paid = booking?.status === 'confirmed' || isSuccessfulPaymentStatus(payment?.status)

        if (paid) {
          setCreatedBookingId(booking?.bookingCode || bookingCode)
          setSuccess(true)
          setConfetti(true)
          setTimeout(() => setConfetti(false), 2500)
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
        resetBookingDraft()
        return
      }
    } catch {
      // ignore
    }

    if (lastError) {
      window.alert('Hệ thống chưa kiểm tra được trạng thái thanh toán lúc này. Vui lòng đợi 10-15 giây rồi bấm lại.')
      return
    }

    window.alert('Hệ thống chưa ghi nhận thanh toán. Vui lòng đợi thêm vài giây rồi thử lại.')
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-white to-primary/10 text-main p-6">
        <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center max-w-md w-full">
          <h1 className="text-2xl font-bold text-primary">Thanh toán thành công</h1>
          <p className="text-main/70 mt-2">Cảm ơn bạn! Hệ thống đã ghi nhận đặt lịch.</p>
          <Link to={`/${slug || ''}/book`} className="inline-block mt-5 px-6 py-3 rounded-2xl bg-primary text-white font-bold">
            Quay lại đặt lịch
          </Link>
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

      <header className="px-4 md:px-10 py-6 flex items-center justify-between">
        <Link to={`/${shop.slug || slug || ''}`} className="font-bold text-primary text-lg">
          {shop.name || 'LumiX'}
        </Link>
      </header>

      <main className="px-4 md:px-10 pb-12">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
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
          <section className="lg:col-span-7">
            <div className="bg-white/80 rounded-3xl p-6 border border-primary/10 shadow-xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="font-h2 text-h2 text-primary">Thanh toán đặt cọc</h1>
                  <p className="text-main/70 mt-1">Vui lòng thanh toán trước khi hết thời gian giữ chỗ.</p>
                </div>
                <div className="text-right">
                  <div className="text-xs text-main/60">Còn lại</div>
                  <div className="text-2xl font-bold text-primary">{formatCountdown(timeLeft)}</div>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-3xl p-5 border border-slate-200">
                  <h3 className="font-bold mb-3">Quét QR để thanh toán</h3>
                  <div className="flex items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 min-h-[320px]">
                      {isPaymentLoading ? (
                        <div className="text-main/60">Đang lấy mã thanh toán cọc...</div>
                    ) : (payosData?.qrCodeUrl || payosData?.qrCode || payosData?.checkoutUrl) ? (
                      <img
                        className="w-[300px] h-[300px] rounded-2xl"
                        alt="PayOS QR"
                        src={buildQrImageSrc(payosData.qrCodeUrl || payosData.qrCode || payosData.checkoutUrl)}
                      />
                    ) : (
                        <div className="text-main/60 text-center">
                          {depositAmount > 0 ? 'Không lấy được mã QR. Vui lòng mở liên kết PayOS.' : 'Không cần đặt cọc.'}
                        </div>
                    )}
                  </div>

                  {payosData?.checkoutUrl ? (
                    <a
                      className="mt-4 inline-flex w-full items-center justify-center px-5 py-3 rounded-2xl bg-primary text-white font-bold hover:brightness-110"
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

                <div className="bg-white rounded-3xl p-5 border border-slate-200">
                  <h3 className="font-bold mb-4">Thông tin đặt lịch</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between"><span className="text-main/60">Dịch vụ</span><span className="font-bold text-main">{service?.name || '—'}</span></div>
                    <div className="flex justify-between"><span className="text-main/60">Nhân viên</span><span className="font-bold text-main">{bookingDraft.staffId === 'random' ? 'Ngẫu nhiên' : selectedStaff?.name ?? '—'}</span></div>
                    <div className="flex justify-between"><span className="text-main/60">Thời lượng</span><span className="font-bold text-main">{service?.durationMinutes || 0} phút</span></div>
                    <div className="flex justify-between"><span className="text-main/60">Giá</span><span className="font-bold text-main">{formatVnd(service?.priceVnd || attemptAmounts.totalAmount || 0)}</span></div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-primary/10">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-primary">Cọc trước (khấu trừ):</span>
                      <span className="text-2xl font-bold text-primary">{formatVnd(depositAmount)}</span>
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

          <aside className="lg:col-span-5">
            <div className="bg-white/80 rounded-3xl p-6 border border-primary/10 shadow-xl">
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
    </div>
  )
}
