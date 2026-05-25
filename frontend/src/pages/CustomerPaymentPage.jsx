import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useShop } from '../context/ShopContext'

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

function normalizePhone(input) {
  return String(input || '')
    .trim()
    .replace(/[\s.-]/g, '')
}

function isValidPhone(input) {
  return /^(?:\+84|0)\d{9,10}$/.test(input)
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
  const { slug } = useParams()
  const { shop, services, staff, bookingDraft, createBookingFromDraft, resetBookingDraft, loadPublicShop, checkBookingStatus } = useShop()

  const service = services.find((item) => item.id === bookingDraft.serviceId)
  const selectedStaff = bookingDraft.staffId === 'random' ? null : staff.find((item) => item.id === bookingDraft.staffId)

  const [timeLeft, setTimeLeft] = useState(15 * 60)
  const [success, setSuccess] = useState(false)
  const [createdBookingId, setCreatedBookingId] = useState(null)
  const [confetti, setConfetti] = useState(false)

  const [payosData, setPayosData] = useState(null)
  const [creating, setCreating] = useState(true)

  useEffect(() => {
    if (!slug) return
    loadPublicShop(slug).catch(() => {})
  }, [slug, loadPublicShop])

  const depositAmount = useMemo(() => {
    if (!service) return 0
    const deposit = shop.deposit || { enabled: false, type: 'fixed', value: 0 }
    if (!deposit.enabled) return 0
    if (deposit.type === 'percent') {
      return Math.round((service.priceVnd * Number(deposit.value || 0)) / 100)
    }
    return Number(deposit.value || 0)
  }, [service, shop.deposit])

  useEffect(() => {
    const phoneNormalized = normalizePhone(bookingDraft.customerPhone)
    const phoneOk = isValidPhone(phoneNormalized)

    if (!service || !phoneOk || createdBookingId) return

    let mounted = true

    const run = async () => {
      if (mounted) setCreating(true)
      try {
        const res = await createBookingFromDraft(slug)
        if (!mounted) return

        if (res?.booking) {
          setCreatedBookingId(res.booking.bookingCode || res.booking._id)
        }

        if (res?.payment) {
          setPayosData(res.payment)
        } else if (depositAmount <= 0) {
          // Không yêu cầu đặt cọc -> coi như hoàn tất bước thanh toán
          setSuccess(true)
          setConfetti(true)
          setTimeout(() => setConfetti(false), 2500)
          resetBookingDraft()
        }
      } catch (err) {
        console.error(err)
        if (mounted) {
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
  }, [service, bookingDraft.customerPhone, slug, createdBookingId, createBookingFromDraft, depositAmount, resetBookingDraft])

  useEffect(() => {
    if (success) return
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev <= 0 ? 0 : prev - 1))
    }, 1000)
    return () => clearInterval(timer)
  }, [success])

  useEffect(() => {
    if (!createdBookingId || success) return

    let mounted = true
    const timer = setInterval(async () => {
      try {
        const res = await checkBookingStatus(createdBookingId)
        const booking = res?.booking || res?.data?.booking || null
        const paid = booking?.status === 'confirmed'

        if (paid && mounted) {
          setSuccess(true)
          setConfetti(true)
          setTimeout(() => setConfetti(false), 2500)
          resetBookingDraft()
        }
      } catch {
        // ignore polling errors
      }
    }, 3000)

    return () => {
      mounted = false
      clearInterval(timer)
    }
  }, [createdBookingId, success, checkBookingStatus, resetBookingDraft])

  const handleTransferred = async () => {
    if (!createdBookingId) return

    try {
      const res = await checkBookingStatus(createdBookingId)
      const booking = res?.booking || res?.data?.booking || null
      const paid = booking?.status === 'confirmed'
      if (paid) {
        setSuccess(true)
        setConfetti(true)
        setTimeout(() => setConfetti(false), 2500)
        resetBookingDraft()
        return
      }
      window.alert('Hệ thống chưa ghi nhận thanh toán. Vui lòng đợi 1-2 phút và thử lại.')
    } catch (err) {
      window.alert(err?.message || 'Không kiểm tra được trạng thái thanh toán.')
    }
  }

  if (!service) {
    return (
      <div className="min-h-screen flex items-center justify-center text-main">
        <div className="glass-card bg-white/70 rounded-3xl p-8 border border-primary/10 text-center">
          <p className="font-bold mb-2">Thiếu thông tin dịch vụ</p>
          <Link to={`/${slug || ''}/book`} className="text-primary underline">
            Quay lại đặt lịch
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
        <nav className="flex items-center gap-3">
          <Link className="px-4 py-2 rounded-xl bg-white/80 hover:bg-white border border-primary/10" to={`/${shop.slug || slug || ''}`}>
            Trang chủ
          </Link>
          <Link className="px-4 py-2 rounded-xl bg-primary text-white hover:brightness-110" to={`/${shop.slug || slug || ''}/book`}>
            Đặt lịch
          </Link>
        </nav>
      </header>

      <main className="max-w-[1440px] mx-auto px-6 md:px-10 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className={`w-full lg:w-7/12 order-2 lg:order-1 ${success ? '' : 'hidden'}`}>
            <div className="glass-card bg-white/70 rounded-3xl p-6 text-center border border-primary/10 shadow-xl">
              <div className="w-24 h-24 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-[48px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  check_circle
                </span>
              </div>
              <h1 className="font-h2 text-h2 text-primary mb-2">Đặt lịch thành công!</h1>
              <p className="text-main/70 mb-6">Cảm ơn bạn đã tin tưởng dịch vụ của chúng tôi.</p>
              <div className="mt-4">
                <Link
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-primary text-white font-bold hover:brightness-110 transition-all"
                  to={`/${shop.slug || slug}/appointments?phone=${encodeURIComponent(bookingDraft.customerPhone || '')}`}
                >
                  <span className="material-symbols-outlined text-[20px]">event_note</span>
                  <span>Xem lịch hẹn của tôi</span>
                </Link>
              </div>
              {createdBookingId ? (
                <div className="mt-6 text-sm text-main/70">
                  Mã đặt lịch: <b className="text-primary">#{createdBookingId}</b>
                </div>
              ) : null}
            </div>
          </div>

          <div className={`w-full lg:w-7/12 order-2 lg:order-1 ${success ? 'hidden' : ''}`}>
            <div className="glass-card bg-white/70 rounded-3xl p-6 border border-primary/10 shadow-xl">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h1 className="font-h2 text-h2 text-primary">Thanh toán đặt cọc</h1>
                  <p className="text-main/70 text-sm">Giữ chỗ trong {formatCountdown(timeLeft)}.</p>
                </div>
                <div className="text-right">
                  <div className="text-xs text-main/60">Mã đặt lịch</div>
                  <div className="font-bold text-primary">{createdBookingId ? `#${createdBookingId}` : '#LMX-????'}</div>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-3xl p-5 border border-slate-200">
                  <h3 className="font-bold mb-3">Quét QR để thanh toán</h3>
                  <div className="flex items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 min-h-[320px]">
                    {creating ? (
                      <div className="text-main/60">Đang tạo đơn thanh toán...</div>
                    ) : payosData?.qrCodeUrl ? (
                      <img
                        className="w-[300px] h-[300px] rounded-2xl"
                        alt="PayOS QR"
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(payosData.qrCodeUrl)}`}
                      />
                    ) : (
                      <div className="text-main/60 text-center">
                        {depositAmount > 0 ? 'Không lấy được QR. Vui lòng mở link PayOS.' : 'Không cần đặt cọc.'}
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
                      Mở trang PayOS
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
                  <h3 className="font-bold mb-4">Thông tin đơn</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between"><span className="text-main/60">Dịch vụ</span><span className="font-bold text-main">{service.name}</span></div>
                    <div className="flex justify-between"><span className="text-main/60">Nhân viên</span><span className="font-bold text-main">{bookingDraft.staffId === 'random' ? 'Ngẫu nhiên' : selectedStaff?.name ?? '—'}</span></div>
                    <div className="flex justify-between"><span className="text-main/60">Thời lượng</span><span className="font-bold text-main">{service.durationMinutes} phút</span></div>
                    <div className="flex justify-between"><span className="text-main/60">Giá</span><span className="font-bold text-main">{formatVnd(service.priceVnd)}</span></div>
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
          </div>

          <aside className="w-full lg:w-5/12 order-1 lg:order-2">
            <div className="glass-card bg-white/80 rounded-3xl p-6 border border-primary/10 shadow-xl">
              <h3 className="font-h3 text-h3 text-main">Xác nhận đặt lịch</h3>
              <p className="text-main/70 mt-1">Vui lòng kiểm tra thông tin trước khi thanh toán.</p>

              <div className="mt-6 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-main/60">Mã đặt lịch</span>
                  <span className="font-bold text-primary">{createdBookingId ? `#${createdBookingId}` : '#LMX-????'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-main/60">Dịch vụ</span>
                  <span className="font-bold text-main">{service.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-main/60">Nhân viên</span>
                  <span className="font-bold text-main">{bookingDraft.staffId === 'random' ? 'Ngẫu nhiên' : selectedStaff?.name ?? '—'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-main/60">Thời gian</span>
                  <span className="font-bold text-main">{bookingDraft.date} {bookingDraft.time}</span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-primary/10">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-main/60">Tổng thanh toán:</span>
                  <span className="text-lg">{formatVnd(service.priceVnd)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-primary">Cọc trước (khấu trừ):</span>
                  <span className="text-2xl font-bold text-primary">{formatVnd(depositAmount)}</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>

      <style>{`
        @keyframes lumixConfettiFall {
          0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
    </div>
  )
}
