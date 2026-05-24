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
    const colors = ['#14677a', '#2a6673', '#cb8d56', '#afe9f9', '#ffdcc1']
    return Array.from({ length: 50 }, (_, i) => ({
      id: i,
      left: pseudo(i + 1) * 100,
      color: colors[Math.floor(pseudo(i + 11) * colors.length)],
      duration: pseudo(i + 21) * 3 + 2,
      delay: pseudo(i + 31) * 0.2,
      round: pseudo(i + 41) > 0.5
    }))
  }, [active])

  if (!active) return null

  return (
    <>
      <style>{`
        @keyframes confetti-fall {
          0% { transform: translateY(-10vh) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
      {items.map((item) => (
        <div
          key={item.id}
          style={{
            position: 'fixed',
            width: 10,
            height: 10,
            left: `${item.left}vw`,
            top: -20,
            backgroundColor: item.color,
            borderRadius: item.round ? '50%' : 2,
            pointerEvents: 'none',
            zIndex: 100,
            animation: `confetti-fall ${item.duration}s linear ${item.delay}s forwards`
          }}
        />
      ))}
    </>
  )
}

export default function CustomerPaymentPage() {
  const { slug } = useParams()
  const {
    shop,
    services,
    staff,
    bookingDraft,
    createBookingFromDraft,
    resetBookingDraft,
    loadPublicShop,
    checkBookingStatus
  } = useShop()

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
  }, [service, bookingDraft.customerPhone, slug, createdBookingId, createBookingFromDraft])

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
        const paid = Boolean(booking?.isPaid || booking?.paid || booking?.paymentStatus === 'paid')

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
      const paid = Boolean(booking?.isPaid || booking?.paid || booking?.paymentStatus === 'paid')
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
              <h1 className="font-h2 text-h2 text-primary mb-3">Thanh toán cọc</h1>
              <p className="text-main/70 mb-6">Vui lòng chuyển khoản trước khi hết thời gian giữ slot.</p>

              {creating ? (
                <div className="flex flex-col items-center justify-center py-12 text-primary">
                  <span className="material-symbols-outlined text-4xl animate-spin mb-4">autorenew</span>
                  <p className="font-bold">Đang khởi tạo phiên thanh toán...</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-white rounded-2xl border border-slate-200 p-4 text-center">
                    {payosData?.qrCodeUrl ? (
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(payosData.qrCodeUrl)}`}
                        alt="QR thanh toán PayOS"
                        className="w-full rounded-xl"
                      />
                    ) : (
                      <div className="w-full h-48 bg-slate-100 flex items-center justify-center rounded-xl text-slate-500">
                        {depositAmount > 0 ? 'Không lấy được QR. Vui lòng mở link PayOS.' : 'Không cần đặt cọc'}
                      </div>
                    )}
                    {payosData?.checkoutUrl ? (
                      <a
                        href={payosData.checkoutUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-block mt-4 text-sm font-bold text-blue-600 hover:underline"
                      >
                        Mở trang PayOS
                      </a>
                    ) : null}
                  </div>

                  <div className="space-y-4">
                    <div className="text-sm rounded-xl bg-slate-100 px-4 py-3">
                      Còn lại: <b className="text-primary">{formatCountdown(timeLeft)}</b>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-main/60">Số tiền:</span>
                        <span className="font-bold text-primary">{formatVnd(depositAmount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-main/60">Nội dung:</span>
                        <span className="font-bold text-main">{buildPayContent(createdBookingId || '')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-main/60">Ngân hàng:</span>
                        <span className="font-bold text-main">VietinBank (PayOS)</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleTransferred}
                      disabled={timeLeft <= 0}
                      className={`w-full py-4 rounded-xl font-bold transition-all ${
                        timeLeft > 0
                          ? 'bg-primary text-white hover:brightness-110 active:scale-[0.98]'
                          : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      Tôi đã chuyển khoản
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <aside className="w-full lg:w-5/12 order-1 lg:order-2 sticky top-24 h-fit">
            <div className="glass-card bg-white/70 rounded-3xl p-6 border border-primary/10">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-2xl overflow-hidden border border-primary/10 bg-white flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                    spa
                  </span>
                </div>
                <div>
                  <h2 className="font-h3 text-h3 text-main">{shop.name}</h2>
                  <p className="text-xs text-main/60">{shop.address}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between py-2 border-b border-slate-200">
                  <span className="text-main/60">Mã đặt lịch:</span>
                  <span className="font-bold text-primary">{createdBookingId ? `#${createdBookingId}` : '#LMX-????'}</span>
                </div>

                <div className="space-y-2">
                  <span className="text-xs text-main/60 uppercase tracking-wider">Dịch vụ</span>
                  <div className="flex justify-between items-center">
                    <span className="font-bold">{service.name}</span>
                    <span className="font-bold">{formatVnd(service.priceVnd)}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-xs text-main/60 uppercase tracking-wider">Thời gian</span>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[20px]">calendar_today</span>
                    <span className="font-bold">
                      {bookingDraft.time
                        ? `${bookingDraft.time} - ${new Date(bookingDraft.date || new Date()).toLocaleDateString('vi-VN')}`
                        : '—'}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-xs text-main/60 uppercase tracking-wider">Nhân viên</span>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[20px]">person</span>
                    <span className="font-bold">{bookingDraft.staffId === 'random' ? 'Ngẫu nhiên' : selectedStaff?.name ?? '—'}</span>
                  </div>
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
    </div>
  )
}

