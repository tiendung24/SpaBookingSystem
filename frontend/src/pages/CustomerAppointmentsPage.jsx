import { useEffect, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { useShop } from '../context/ShopContext'

function formatVnd(v) {
  return `${Number(v || 0).toLocaleString('vi-VN')}đ`
}

function formatDateVi(isoOrDateString) {
  const d = new Date(isoOrDateString)
  return d.toLocaleDateString('vi-VN')
}

function formatTimeHHmm(isoOrDateString) {
  const d = new Date(isoOrDateString)
  return d.toTimeString().slice(0, 5)
}

function isUpcoming(booking, nowTs) {
  if (!['pending', 'confirmed'].includes(booking.status)) return false
  return new Date(booking.time).getTime() >= nowTs
}

function isCompleted(booking) {
  return ['checked_out', 'completed'].includes(booking.status)
}

function isCancelled(booking) {
  return ['canceled', 'no_show'].includes(booking.status)
}

export default function CustomerAppointmentsPage() {
  const { slug } = useParams()
  const [searchParams] = useSearchParams()
  const { shop, services, staff, bookings, updateBooking } = useShop()

  const initialPhone = searchParams.get('phone') || ''
  const [phone, setPhone] = useState(initialPhone)
  const [searchedPhone, setSearchedPhone] = useState(initialPhone)
  const [tab, setTab] = useState('upcoming') // upcoming | completed | cancelled
  const [nowTs, setNowTs] = useState(() => Date.now())

  const isCorrectSlug = !slug || slug === shop.slug

  const phoneNormalized = useMemo(() => String(searchedPhone || '').replace(/\s+/g, ''), [searchedPhone])

  const matchedBookings = useMemo(() => {
    if (!phoneNormalized) return []
    return bookings.filter((b) => String(b.phone || '').replace(/\s+/g, '') === phoneNormalized)
  }, [bookings, phoneNormalized])

  const upcoming = useMemo(() => matchedBookings.filter((booking) => isUpcoming(booking, nowTs)), [matchedBookings, nowTs])
  const completed = useMemo(() => matchedBookings.filter(isCompleted), [matchedBookings])
  const cancelled = useMemo(() => matchedBookings.filter(isCancelled), [matchedBookings])

  const list = tab === 'upcoming' ? upcoming : tab === 'completed' ? completed : cancelled

  const getService = (id) => services.find((s) => s.id === id)
  const getStaff = (id) => staff.find((s) => s.id === id)

  const doSearch = () => {
    if (!phone.trim()) {
      alert('Vui lòng nhập số điện thoại')
      return
    }
    setSearchedPhone(phone.trim())
  }

  useEffect(() => {
    if (!searchedPhone) return
    const next =
      upcoming.length > 0 ? 'upcoming' : completed.length > 0 ? 'completed' : cancelled.length > 0 ? 'cancelled' : 'upcoming'
    const t = setTimeout(() => setTab(next), 0)
    return () => clearTimeout(t)
  }, [searchedPhone, upcoming.length, completed.length, cancelled.length])

  const handleDirections = () => {
    const destination = String(shop.address || shop.name || '').trim()
    if (!destination) {
      window.alert('Cửa hàng chưa cập nhật địa chỉ để chỉ đường.')
      return
    }

    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(destination)}`
    window.open(mapsUrl, '_blank', 'noopener,noreferrer')
  }
  const handleCancel = (booking) => {
    if (!isUpcoming(booking, nowTs)) return

    const start = new Date(booking.time).getTime()
    const diffHours = (start - nowTs) / (1000 * 60 * 60)
    const isValidCancel = diffHours >= Number(shop.deposit.cancelHours || 0)

    const refundPercent = isValidCancel ? 100 : 0
    const refundAmount = Math.round((Number(booking.deposit || 0) * refundPercent) / 100)

    const ok = window.confirm(
      [
        'Xác nhận hủy lịch hẹn?',
        `- Mã: ${booking.id}`,
        `- Thời gian: ${formatDateVi(booking.time)} ${formatTimeHHmm(booking.time)}`,
        `- Hoàn cọc: ${refundPercent}% (${formatVnd(refundAmount)})`
      ].join('\n')
    )
    if (!ok) return

    updateBooking(booking.id, {
      status: 'canceled',
      cancellationType: isValidCancel ? 'valid' : 'late',
      refundPercent
    })
  }

  useEffect(() => {
    const t = setInterval(() => setNowTs(Date.now()), 60_000)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="min-h-screen bg-slate-50 text-main">
      {!isCorrectSlug && (
        <div className="bg-amber-100 border-b border-amber-300 text-amber-900 px-4 py-2 text-sm text-center">
          Bạn đang mở slug <b>{slug}</b> không khớp shop hiện tại. Demo đang hiển thị dữ liệu của <b>{shop.name}</b>.
        </div>
      )}

      <header className="bg-white/80 backdrop-blur-xl border-b border-primary/10 sticky top-0 z-50 shadow-sm">
        <nav className="flex justify-between items-center max-w-[1200px] mx-auto px-6 md:px-10 h-20">
          <div className="font-h3 text-h3 font-bold text-primary">{shop.name}</div>
          <div className="flex items-center gap-3">
            <Link className="px-5 py-2 rounded-full font-bold text-main/70 hover:bg-primary/10 transition-all" to={`/${shop.slug}`}>
              Trang chủ
            </Link>
            <Link className="px-5 py-2 rounded-full font-bold bg-primary text-white shadow-lg hover:brightness-110 transition-all" to={`/${shop.slug}/book`}>
              Đặt lịch
            </Link>
          </div>
        </nav>
      </header>

      <main className="pt-10 pb-16 px-6 md:px-10 max-w-[1200px] mx-auto">
        <section className="text-center mb-12">
          <h1 className="font-h2 text-h2 text-primary mb-3">Tra cứu lịch hẹn</h1>
          <p className="text-main/70 max-w-2xl mx-auto mb-6">
            Nhập số điện thoại đã dùng để đặt lịch để tra cứu, quản lý hoặc hủy lịch hẹn.
          </p>

          <div className="relative max-w-md mx-auto">
            <div className="relative flex items-center bg-white rounded-2xl p-1 shadow-xl border border-primary/10">
              <span className="material-symbols-outlined ml-4 text-primary">call</span>
              <input
                className="w-full border-none focus:ring-0 px-4 py-3 text-lg placeholder:text-slate-400 bg-transparent outline-none"
                placeholder="Nhập số điện thoại..."
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') doSearch()
                }}
              />
              <button
                className="bg-primary text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-secondary transition-colors"
                onClick={doSearch}
              >
                <span>Tra cứu</span>
                <span className="material-symbols-outlined text-[20px]">search</span>
              </button>
            </div>
            {searchedPhone && (
              <div className="mt-3 text-xs text-main/60">
                Kết quả cho SĐT: <b className="text-primary">{searchedPhone}</b>
              </div>
            )}
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-3">
            <div className="glass-card bg-white/70 rounded-3xl p-4 sticky top-24 border border-primary/10">
              <nav className="flex flex-col gap-2">
                <button
                  className={`w-full flex items-center justify-between p-3 rounded-2xl transition-all ${
                    tab === 'upcoming' ? 'bg-primary/10 text-primary font-bold' : 'text-main/70 hover:bg-primary/5'
                  }`}
                  onClick={() => setTab('upcoming')}
                >
                  <span className="flex items-center gap-3">
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: tab === 'upcoming' ? "'FILL' 1" : "'FILL' 0" }}>
                      event_upcoming
                    </span>
                    <span>Sắp tới</span>
                  </span>
                  <span className="bg-white/60 px-2 rounded-full text-xs">{upcoming.length}</span>
                </button>

                <button
                  className={`w-full flex items-center justify-between p-3 rounded-2xl transition-all ${
                    tab === 'completed' ? 'bg-primary/10 text-primary font-bold' : 'text-main/70 hover:bg-primary/5'
                  }`}
                  onClick={() => setTab('completed')}
                >
                  <span className="flex items-center gap-3">
                    <span className="material-symbols-outlined">check_circle</span>
                    <span>Hoàn thành</span>
                  </span>
                  <span className="bg-white/60 px-2 rounded-full text-xs">{completed.length}</span>
                </button>

                <button
                  className={`w-full flex items-center justify-between p-3 rounded-2xl transition-all ${
                    tab === 'cancelled' ? 'bg-primary/10 text-primary font-bold' : 'text-main/70 hover:bg-primary/5'
                  }`}
                  onClick={() => setTab('cancelled')}
                >
                  <span className="flex items-center gap-3">
                    <span className="material-symbols-outlined">cancel</span>
                    <span>Đã hủy</span>
                  </span>
                  <span className="bg-white/60 px-2 rounded-full text-xs">{cancelled.length}</span>
                </button>
              </nav>

              <div className="mt-6 pt-6 border-t border-primary/10">
                <p className="text-xs text-main/60 leading-relaxed">
                  Cần hỗ trợ đổi lịch gấp? Hãy gọi hotline <b className="text-primary">{shop.phone}</b>.
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-9 space-y-6">
            {!searchedPhone && (
              <div className="glass-card bg-white/70 rounded-3xl p-8 border border-primary/10 text-center text-main/70">
                Nhập số điện thoại để bắt đầu tra cứu.
              </div>
            )}

            {searchedPhone && list.length === 0 && (
              <div className="text-center py-12">
                <span className="material-symbols-outlined text-[64px] text-slate-300 mb-4">event_busy</span>
                <p className="text-main/70">Không tìm thấy lịch hẹn nào với số điện thoại này.</p>
              </div>
            )}

            {list.map((b) => {
              const svc = getService(b.serviceId)
              const stf = getStaff(b.staffId)
              const badge =
                tab === 'upcoming' ? (
                  <span className="bg-primary text-white px-3 py-1 rounded-full text-xs font-bold shadow-md">Sắp tới</span>
                ) : tab === 'completed' ? (
                  <span className="bg-emerald-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-md">Hoàn thành</span>
                ) : (
                  <span className="bg-rose-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-md">Đã hủy</span>
                )

              return (
                <div key={b.id} className="glass-card bg-white/70 rounded-3xl overflow-hidden flex flex-col md:flex-row border border-primary/10">
                  <div className="w-full md:w-1/3 relative h-48 md:h-auto overflow-hidden bg-slate-100">
                    <div className="absolute top-4 left-4">{badge}</div>
                    <div className="w-full h-full flex items-center justify-center text-primary/40">
                      <span className="material-symbols-outlined text-[64px]">spa</span>
                    </div>
                  </div>

                  <div className="flex-1 p-6 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-2 gap-4">
                        <h3 className="font-h3 text-h3 text-primary">{svc?.name || 'Dịch vụ'}</h3>
                        <span className="font-bold text-primary">{formatVnd(b.total || svc?.priceVnd || 0)}</span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-sm text-main/70 mb-4">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[20px] text-primary">calendar_today</span>
                          <span>{formatDateVi(b.time)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[20px] text-primary">schedule</span>
                          <span>
                            {formatTimeHHmm(b.time)} - {formatTimeHHmm(b.endTime || b.time)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[20px] text-primary">person</span>
                          <span>{stf?.name ? `KTV. ${stf.name}` : 'KTV. (chưa phân công)'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[20px] text-primary">payments</span>
                          <span>
                            Cọc: <strong className="text-main">{formatVnd(b.deposit || 0)}</strong>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3 pt-4 border-t border-primary/10">
                      <button className="flex-1 min-w-[140px] py-2 px-4 rounded-xl bg-slate-100 text-primary font-bold flex items-center justify-center gap-2 hover:bg-primary/10 transition-all" onClick={handleDirections}>
                        <span className="material-symbols-outlined text-[18px]">directions</span>
                        <span>Chỉ đường</span>
                      </button>
                      {tab === 'upcoming' && (
                        <button
                          className="flex-1 min-w-[140px] py-2 px-4 rounded-xl border border-rose-300 text-rose-700 font-bold flex items-center justify-center gap-2 hover:bg-rose-50 transition-all"
                          onClick={() => handleCancel(b)}
                        >
                          <span className="material-symbols-outlined text-[18px]">cancel</span>
                          <span>Hủy lịch</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </main>
    </div>
  )
}

