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
  return `LUMIX_${bookingCode}`
}

const qrPlaceholder =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCZ6SPtBXru0iQm3v5zKYWLzOETMiIItS8mvd8U3kXOLMbXUbN23J_pUv2U0WyV9S_dXm6zljE2ZXJPo1yrEcOEWUmpXESCH_c2pD3Yw3SE5anhxI9ixa5gC5Pk9giG1MG6onA8yzOxIuz7cj4oS_NmgAWBCHF5p_3yLwLrTyhj8Yj3VcGBwPZBRPA5J_On4l8iW9e14z-k19Cl3JWGH7cB5FX2XS7igC-BNIbbAYL1kkYPA6NkSya2-KCqo5UCz287A579koBKDoLq'

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
  const { shop, services, staff, bookingDraft, createBookingFromDraft, resetBookingDraft, loadPublicShop } = useShop()

  const service = services.find((item) => item.id === bookingDraft.serviceId)
  const selectedStaff = bookingDraft.staffId === 'random' ? null : staff.find((item) => item.id === bookingDraft.staffId)

  const [timeLeft, setTimeLeft] = useState(15 * 60)
  const [success, setSuccess] = useState(false)
  const [createdBookingId, setCreatedBookingId] = useState(null)
  const [confetti, setConfetti] = useState(false)

  const bookingCode = useMemo(() => createdBookingId || '9982', [createdBookingId])

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
    if (success) return
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev <= 0 ? 0 : prev - 1))
    }, 1000)
    return () => clearInterval(timer)
  }, [success])

  const handleTransferred = async () => {
    const created = await createBookingFromDraft(slug)
    const booking = created?.booking
    if (!booking) {
      alert('Thiếu thông tin đặt lịch. Vui lòng quay lại và nhập đủ thông tin.')
      return
    }

    setCreatedBookingId(booking.bookingCode || booking._id)
    setSuccess(true)
    setConfetti(true)
    setTimeout(() => setConfetti(false), 5200)
    resetBookingDraft()
  }

  if (!service) {
    return (
      <div className="min-h-screen bg-slate-50 p-10 text-main">
        <p>Bạn chưa chọn dịch vụ.</p>
        <Link className="text-primary underline" to={`/${shop.slug || slug}/book`}>
          Quay lại bước 1
        </Link>
      </div>
    )
  }

  const email = (bookingDraft.customerEmail || '').trim()

  return (
    <div className="bg-slate-50 min-h-screen text-main">
      <ConfettiLayer active={confetti} />

      <nav className="bg-white/80 backdrop-blur-xl border-b border-primary/20 sticky top-0 z-50 shadow-sm">
        <div className="max-w-[1440px] mx-auto px-6 md:px-10 flex justify-between items-center h-20">
          <span className="font-h3 text-h3 tracking-tight text-primary">{shop.name}</span>
        </div>
      </nav>

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
              {createdBookingId && (
                <div className="mt-6 text-sm text-main/70">
                  Mã đặt lịch: <b className="text-primary">#{createdBookingId}</b>
                </div>
              )}
            </div>
          </div>

          <div className={`w-full lg:w-7/12 order-2 lg:order-1 ${success ? 'hidden' : ''}`}>
            <div className="glass-card bg-white/70 rounded-3xl p-6 border border-primary/10 shadow-xl">
              <h1 className="font-h2 text-h2 text-primary mb-3">Thanh toán cọc</h1>
              <p className="text-main/70 mb-6">Vui lòng chuyển khoản trước khi hết thời gian giữ slot.</p>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl border border-slate-200 p-4">
                  <img src={qrPlaceholder} alt="QR thanh toán" className="w-full rounded-xl" />
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
                      <span className="font-bold text-main">{buildPayContent(bookingCode)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-main/60">Ngân hàng:</span>
                      <span className="font-bold text-main">VietinBank (PayOS)</span>
                    </div>
                  </div>

                  <button
                    onClick={handleTransferred}
                    disabled={timeLeft <= 0}
                    className={`w-full py-4 rounded-xl font-bold transition-all ${
                      timeLeft > 0 ? 'bg-primary text-white hover:brightness-110 active:scale-[0.98]' : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    Tôi đã chuyển khoản
                  </button>
                </div>
              </div>
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
                <div className="space-y-2">
                  <span className="text-xs text-main/60 uppercase tracking-wider">Email nhận thông báo</span>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[20px]">mail</span>
                    <span className="font-bold text-sm">
                      {email || 'Chưa nhập email (vẫn đặt lịch bình thường)'}
                    </span>
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
