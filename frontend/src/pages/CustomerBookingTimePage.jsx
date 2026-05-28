import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useShop } from '../context/ShopContext'

function formatVnd(v) {
  return `${Number(v || 0).toLocaleString('vi-VN')}₫`
}

function toMinutes(timeHHmm) {
  const [h, m] = timeHHmm.split(':').map((v) => Number(v))
  return h * 60 + m
}

function toHHmm(totalMinutes) {
  const h = String(Math.floor(totalMinutes / 60)).padStart(2, '0')
  const m = String(totalMinutes % 60).padStart(2, '0')
  return `${h}:${m}`
}

function dateOnly(date) {
  return date.toISOString().slice(0, 10)
}

function sameDate(a, b) {
  return a.slice(0, 10) === b
}

function isValidEmail(email) {
  if (!email) return false
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function normalizePhone(input) {
  return String(input || '')
    .trim()
    .replace(/[\s.-]/g, '')
}

function isValidPhone(input) {
  return /^(?:\+84|0)\d{9,10}$/.test(input)
}

export default function CustomerBookingTimePage() {
  const navigate = useNavigate()
  const { slug } = useParams()
  const { shop, services, staff, bookings, bookingDraft, setBookingDraft, loadPublicShop, holdBookingSlot, getAvailableSlots } = useShop()
  const hours = shop.hours || {}
  const openTime = hours.open || '09:00'
  const closeTime = hours.close || '20:00'
  const slotDuration = Number(hours.slotDuration || 60)
  const lunchBreakStart = hours.lunchBreakStart || '12:00'
  const lunchBreakEnd = hours.lunchBreakEnd || '13:00'
  const shopCapacity = Number(hours.capacity || 1)

  const service = services.find((s) => s.id === bookingDraft.serviceId)
  const selectedStaff = staff.find((s) => s.id === bookingDraft.staffId)

  useEffect(() => {
    if (!slug || service) return
    navigate(`/${slug}/book`, { replace: true })
  }, [slug, service, navigate])

  const today = new Date()
  const dateOptions = useMemo(
    () => {
      const base = new Date()
      return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(base)
        d.setDate(base.getDate() + i)
        return d
      })
    },
    []
  )

  const [selectedDate, setSelectedDate] = useState(bookingDraft.date || dateOnly(today))
  const [selectedTime, setSelectedTime] = useState(bookingDraft.time || '')
  const [availableSlots, setAvailableSlots] = useState(null)
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [slotsError, setSlotsError] = useState('')
  const [nowTick, setNowTick] = useState(() => Date.now())
  const slotsRequestSeqRef = useRef(0)

  // We no longer use localStorage fallbacks for hold/payment; bookingDraft and server-side attempt are authoritative

  useEffect(() => {
    if (!slug) return
    loadPublicShop(slug).catch(() => {})
  }, [slug, loadPublicShop])

  useEffect(() => {
    if (!slug || !bookingDraft.serviceId || !selectedDate) return
    const requestSeq = ++slotsRequestSeqRef.current
    const abortController = new AbortController()
    const staffId = bookingDraft.staffId === 'random' ? null : bookingDraft.staffId
    const holdToken = bookingDraft.holdToken || ''
    setSlotsLoading(true)
    setSlotsError('')
    setAvailableSlots(null)

    const run = async () => {
      try {
        const slots = await getAvailableSlots(slug, { serviceId: bookingDraft.serviceId, date: selectedDate, staffId, holdToken })
        if (!abortController.signal.aborted && requestSeq === slotsRequestSeqRef.current) {
          setAvailableSlots(Array.isArray(slots) ? slots : [])
          setSlotsLoading(false)
        }
      } catch (err) {
        // Keep UI server-authoritative: on error, disable all slots instead of local fallback.
        if (!abortController.signal.aborted && requestSeq === slotsRequestSeqRef.current) {
          console.error('[CustomerBookingTimePage] getAvailableSlots failed', err)
          setSlotsError('Không tải được khung giờ, vui lòng thử lại.')
          setAvailableSlots([])
          setSlotsLoading(false)
        }
      }
    }

    run()
    const onFocus = () => run()
    const onVisibility = () => {
      if (!document.hidden) run()
    }
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      abortController.abort()
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [slug, bookingDraft.serviceId, bookingDraft.staffId, bookingDraft.holdToken, selectedDate, getAvailableSlots])

  useEffect(() => {
    const t = setInterval(() => setNowTick(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])


  // No localStorage restore for holdToken; session-scoped attempt is used instead when available

  const [name, setName] = useState(bookingDraft.customerName || '')
  const [phone, setPhone] = useState(bookingDraft.customerPhone || '')
  const phoneTrimmed = normalizePhone(phone)
  const phoneOk = phoneTrimmed ? isValidPhone(phoneTrimmed) : false
  const [email, setEmail] = useState(bookingDraft.customerEmail || '')
  const [note, setNote] = useState(bookingDraft.note || '')
  const [holding, setHolding] = useState(false)

  const emailTrimmed = email.trim()
  const emailOk = isValidEmail(emailTrimmed)

  const ownHoldSlot = useMemo(() => {
    const holdToken = bookingDraft.holdToken || ''
    const holdExpiresAt = bookingDraft.holdExpiresAt ? new Date(bookingDraft.holdExpiresAt) : null
    if (!holdToken || !selectedDate || !bookingDraft.time) return null
    if (!holdExpiresAt || Number.isNaN(holdExpiresAt.getTime()) || holdExpiresAt.getTime() <= nowTick) return null
    return {
      date: selectedDate,
      start: bookingDraft.time,
      serviceId: bookingDraft.serviceId,
      staffId: bookingDraft.staffId,
      holdToken
    }
  }, [bookingDraft.holdToken, bookingDraft.holdExpiresAt, bookingDraft.time, bookingDraft.serviceId, bookingDraft.staffId, selectedDate, nowTick])

  const ownBookedSlot = useMemo(() => {
    // We don't rely on localStorage last booking code; if needed UI should be hydrated from server
    return null
  }, [bookingDraft.time, bookingDraft.serviceId, bookingDraft.staffId, selectedDate])

  useEffect(() => {
    if (!selectedTime) return
    if (!Array.isArray(availableSlots)) return
    const stillAvailable = availableSlots.includes(selectedTime)
    const ownHold = Boolean(
      ownHoldSlot &&
      ownHoldSlot.date === selectedDate &&
      ownHoldSlot.start === selectedTime &&
      ownHoldSlot.serviceId === bookingDraft.serviceId &&
      String(ownHoldSlot.staffId || '') === String(bookingDraft.staffId || '')
    )
    if (!stillAvailable && !ownHold) {
      setSelectedTime('')
    }
  }, [selectedTime, availableSlots, ownHoldSlot, selectedDate, bookingDraft.serviceId, bookingDraft.staffId])

  const slots = useMemo(() => {
    if (!service) return []

    const hasBackendSlots = Array.isArray(availableSlots)
    const availableSet = hasBackendSlots ? new Set(availableSlots) : null

    const start = toMinutes(openTime)
    const end = toMinutes(closeTime)
    const duration = slotDuration
    const lunchStart = toMinutes(lunchBreakStart)
    const lunchEnd = toMinutes(lunchBreakEnd)

    const list = []
    for (let t = start; t + duration <= end; t += duration) {
      const slotStart = toHHmm(t)
      const inLunch = t >= lunchStart && t < lunchEnd

      const occupied = bookings.filter((b) => {
        if (!sameDate(b.time, selectedDate)) return false
        if (['canceled', 'no_show'].includes(b.status)) return false
        const bookingTime = new Date(b.time).toTimeString().slice(0, 5)
        if (bookingTime !== slotStart) return false
        if (bookingDraft.staffId === 'random') return true
        return b.staffId === bookingDraft.staffId
      }).length

      const limit = bookingDraft.staffId === 'random' ? shopCapacity : 1
      const available = !inLunch && hasBackendSlots && availableSet.has(slotStart)
      list.push({ start: slotStart, occupied, limit, available, ownHold: false })
    }
    return list
  }, [service, availableSlots, openTime, closeTime, slotDuration, lunchBreakStart, lunchBreakEnd, shopCapacity, bookings, selectedDate, bookingDraft.staffId, ownHoldSlot, ownBookedSlot, bookingDraft.serviceId])

  const canConfirm = Boolean(service && selectedTime && name.trim() && phoneOk && emailOk && emailTrimmed)

  const confirmStep2 = async () => {
    if (!canConfirm) return
    const currentHoldToken = bookingDraft.holdToken || ''
    const currentHoldExpiresAt = bookingDraft.holdExpiresAt || ''
    const currentHoldDateValid = currentHoldExpiresAt ? new Date(currentHoldExpiresAt) : null

    const clearPreviousPaymentSession = () => {
      try { sessionStorage.removeItem(`client_attempt_${slug}`) } catch {}
    }

    const isOwnBookedSlot = Boolean(
      ownBookedSlot &&
        ownBookedSlot.date === selectedDate &&
        ownBookedSlot.start === selectedTime &&
        ownBookedSlot.serviceId === bookingDraft.serviceId &&
        String(ownBookedSlot.staffId || '') === String(bookingDraft.staffId || '')
    )
    const isOwnHeldSlot = Boolean(
      ownHoldSlot &&
        ownHoldSlot.date === selectedDate &&
        ownHoldSlot.start === selectedTime &&
        ownHoldSlot.serviceId === bookingDraft.serviceId &&
        String(ownHoldSlot.staffId || '') === String(bookingDraft.staffId || '')
    )
    if (Array.isArray(availableSlots) && !availableSlots.includes(selectedTime) && !isOwnHeldSlot && !isOwnBookedSlot) {
      alert('Khung giờ bạn chọn vừa kín. Vui lòng chọn giờ khác.')
      setSelectedTime('')
      return
    }

    if (!Array.isArray(availableSlots) || slotsLoading) {
      alert('Đang cập nhật khung giờ mới nhất, vui lòng đợi một chút.')
      return
    }

    if (isOwnBookedSlot) {
      clearPreviousPaymentSession()
      navigate(`/${slug}/book/pay`)
      return
    }

    const canReuseExistingHold = Boolean(
      currentHoldToken &&
      ownHoldSlot &&
      ownHoldSlot.date === selectedDate &&
      ownHoldSlot.start === selectedTime &&
      ownHoldSlot.serviceId === bookingDraft.serviceId &&
      String(ownHoldSlot.staffId || '') === String(bookingDraft.staffId || '') &&
      currentHoldDateValid &&
      !Number.isNaN(currentHoldDateValid.getTime()) &&
      currentHoldDateValid.getTime() > Date.now()
    )

    if (canReuseExistingHold) {
      clearPreviousPaymentSession()
      try { /* keep in bookingDraft/session attempt; no localStorage fallback */ } catch {}
      setBookingDraft((prev) => ({
        ...prev,
        date: selectedDate,
        time: selectedTime,
        customerName: name.trim(),
        customerPhone: phoneTrimmed,
        customerEmail: emailTrimmed,
        note,
        holdToken: currentHoldToken,
        holdExpiresAt: currentHoldExpiresAt
      }))
      navigate(`/${slug}/book/pay`)
      return
    }

    setHolding(true)
    try {
      const payload = {
        serviceId: bookingDraft.serviceId,
        staffId: bookingDraft.staffId === 'random' ? null : bookingDraft.staffId,
        date: selectedDate,
        time: selectedTime
      }
      // If already holding a slot, reuse the token
      if (currentHoldToken) {
        payload.holdToken = currentHoldToken
      }
      const res = await holdBookingSlot(slug, payload)
      const newToken = res?.holdToken || currentHoldToken || ''
      const newExpiresAt = res?.expiresAt || bookingDraft.holdExpiresAt || ''

      clearPreviousPaymentSession()
      
      // Save token to localStorage
      if (newToken) {
        // hold token stored in bookingDraft; client attempt id persisted via holdBookingSlot
      }
      
      setBookingDraft((prev) => ({
        ...prev,
        date: selectedDate,
        time: selectedTime,
        customerName: name.trim(),
        customerPhone: phoneTrimmed,
        customerEmail: emailTrimmed,
        note,
        holdToken: newToken,
        holdExpiresAt: newExpiresAt,
        staffId: res?.staffId || prev.staffId
      }))
      navigate(`/${slug}/book/pay`)
    } catch (err) {
      alert(err?.message || 'Không thể giữ chỗ tạm, vui lòng thử lại')
    } finally {
      setHolding(false)
    }
  }

  if (!service) return null

  return (
    <div className="bg-slate-50 min-h-screen text-main">
      <header className="bg-white/80 backdrop-blur-xl border-b border-primary/20 sticky top-0 z-50 shadow-sm">
        <div className="max-w-[1440px] mx-auto px-6 md:px-10 flex justify-between items-center h-20">
          <div className="font-h3 text-h3 tracking-tight text-primary">{shop.name}</div>
          <button className="bg-primary text-white px-6 py-2 rounded-full font-bold" type="button">
            Đặt lịch
          </button>
        </div>
      </header>

      <main className="max-w-[1440px] mx-auto px-6 md:px-10 py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          <aside className="w-full lg:w-80 p-6 bg-white/70 border border-primary/20 rounded-3xl h-fit sticky top-24">
            <div className="space-y-2">
                {[
                { t: 'Dịch vụ', done: true },
                { t: 'Nhân viên & thời gian', active: true },
                { t: 'Xác nhận' },
                { t: 'Thanh toán' }
              ].map((step, idx) => (
                <div
                  key={step.t}
                  className={`flex items-center gap-3 p-3 rounded-xl ${step.active ? 'bg-primary text-white' : 'text-main/70'}`}
                >
                  <span className="material-symbols-outlined">
                    {step.done ? 'check_circle' : idx === 1 ? 'badge' : idx === 2 ? 'schedule' : 'payments'}
                  </span>
                  <span className="font-bold">{step.t}</span>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-200">
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-main/60 uppercase tracking-wider">Dịch vụ</p>
                  <p className="font-bold">{service.name}</p>
                </div>
                <div>
                  <p className="text-xs text-main/60 uppercase tracking-wider">Nhân viên</p>
                  <p className="font-bold">{bookingDraft.staffId === 'random' ? 'Ngẫu nhiên' : selectedStaff?.name || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-main/60 uppercase tracking-wider">Giá dịch vụ</p>
                  <p className="font-bold text-primary">{formatVnd(service.priceVnd)}</p>
                </div>
              </div>
            </div>
          </aside>

          <section className="flex-1 space-y-6">
            <div className="flex flex-col gap-2">
              <h1 className="font-h2 text-h2 text-primary">Thời gian & thông tin</h1>
              <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-primary w-2/4 rounded-full transition-all duration-700 ease-out" />
              </div>
              <p className="text-main/60">Bước 2/4: Chọn khung giờ và điền thông tin của bạn.</p>
            </div>

            <div className="glass-card p-6 rounded-3xl bg-white/70">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-h3 text-h3 text-primary flex items-center gap-2">
                  <span className="material-symbols-outlined">calendar_today</span>
                  Chọn ngày thực hiện
                </h3>
              </div>
              <div className="flex overflow-x-auto gap-4 pb-4 scrollbar-hide">
                {dateOptions.map((d) => {
                  const value = dateOnly(d)
                  const selected = selectedDate === value
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setSelectedDate(value)}
                      className={`flex-shrink-0 w-20 h-24 rounded-2xl flex flex-col items-center justify-center transition-all ${
                        selected
                          ? 'border-2 border-primary bg-primary/10 shadow-md ring-2 ring-primary/20'
                          : 'border border-slate-200 bg-white shadow-sm'
                      }`}
                    >
                      <span className={`text-xs font-bold ${selected ? 'text-primary' : 'text-main/60'}`}>
                        {d.toLocaleDateString('vi-VN', { weekday: 'short' }).toUpperCase()}
                      </span>
                      <span className={`text-xl font-bold ${selected ? 'text-primary' : 'text-main'}`}>{d.getDate()}</span>
                      <span className={`text-[10px] uppercase ${selected ? 'text-primary' : 'text-main/60'}`}>{`Th ${d.getMonth() + 1}`}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="glass-card p-6 rounded-3xl bg-white/70">
                  <h3 className="font-h3 text-h3 text-primary flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined">schedule</span>
                Khung giờ còn trống
              </h3>
              {slotsLoading ? (
                <p className="text-sm text-main/60 mb-3">Đang cập nhật khung giờ...</p>
              ) : null}
              {!slotsLoading && slotsError ? (
                <p className="text-sm text-red-600 mb-3">{slotsError}</p>
              ) : null}
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {slots.map((slot) => {
                  const selected = selectedTime === slot.start && slot.available
                  if (!slot.available) {
                    return (
                      <div
                        key={slot.start}
                        className="p-3 bg-slate-100 rounded-xl text-center opacity-40 cursor-not-allowed border border-slate-300"
                      >
                        <span className="font-bold">{slot.start}</span>
                      </div>
                    )
                  }

                  return (
                    <button
                      key={slot.start}
                      type="button"
                      onClick={() => setSelectedTime(slot.start)}
                      className={`p-3 rounded-xl text-center transition-all shadow-sm ${
                        selected ? 'bg-primary text-white shadow-md' : 'bg-white border border-primary/20 hover:bg-primary/10'
                      }`}
                    >
                      <span className="font-bold">{slot.start}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="glass-card p-6 rounded-3xl bg-white/70">
              <h3 className="font-h3 text-h3 text-primary flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined">person</span>
                Thông tin khách hàng
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-bold text-main/70">HỌ VÀ TÊN</label>
                    <input
                      className="w-full p-4 mt-1 bg-slate-100 rounded-xl border border-primary/10 outline-none"
                      placeholder="Nguyễn Văn A"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-bold text-main/70">SỐ ĐIỆN THOẠI</label>
                    <input
                      className="w-full p-4 mt-1 bg-slate-100 rounded-xl border border-primary/10 outline-none"
                      placeholder="090 123 4567"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                    {!phoneTrimmed ? (
                      <p className="text-xs text-red-600 mt-2">Vui lòng nhập số điện thoại.</p>
                    ) : !phoneOk ? (
                      <p className="text-xs text-red-600 mt-2">Số điện thoại không hợp lệ (bắt đầu bằng 0 hoặc +84, 10-11 chữ số).</p>
                    ) : null}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-bold text-main/70">EMAIL (BẮT BUỘC)</label>
                  <input
                    type="email"
                    className="w-full p-4 mt-1 bg-slate-100 rounded-xl border border-primary/10 outline-none"
                    placeholder="ban@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  {!emailTrimmed ? (
                    <p className="text-xs text-red-600 mt-2">Vui lòng nhập email.</p>
                  ) : !emailOk ? (
                    <p className="text-xs text-red-600 mt-2">Email chưa đúng định dạng.</p>
                  ) : null}
                  <p className="text-xs text-main/60 mt-2">Email dùng để gửi xác nhận lịch hẹn.</p>
                </div>

                <div>
                  <label className="text-sm font-bold text-main/70">GHI CHÚ (NẾU CÓ)</label>
                  <textarea
                    className="w-full p-4 mt-1 bg-slate-100 rounded-xl border border-primary/10 outline-none resize-none"
                    rows={3}
                    placeholder="Yêu cầu đặc biệt cho kỹ thuật viên..."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-cyan-50 rounded-xl border border-cyan-200 flex gap-3 items-start">
                <span className="material-symbols-outlined text-secondary">info</span>
                <div className="text-sm text-cyan-900">
                  <p>
                    <strong>Chính sách đặt lịch:</strong> Đặt cọc{' '}
                    {shop.deposit.type === 'percent' ? `${shop.deposit.value}%` : formatVnd(shop.deposit.value)} giá trị dịch vụ.
                  </p>
                  <p>
                    <strong>Chính sách hủy:</strong> Hoàn trả 100% nếu hủy trước ít nhất {shop.deposit.cancelHours} tiếng so với giờ hẹn.
                  </p>
                </div>
              </div>
              <button
                onClick={confirmStep2}
                disabled={!canConfirm || holding}
                className={`w-full py-5 rounded-2xl font-h3 flex items-center justify-center gap-3 transition-all ${
                  canConfirm
                    ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-xl hover:scale-[1.01]'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                {holding ? 'Đang giữ chỗ tạm...' : 'Xác nhận đặt lịch'} <span className="material-symbols-outlined">arrow_forward</span>
              </button>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}

