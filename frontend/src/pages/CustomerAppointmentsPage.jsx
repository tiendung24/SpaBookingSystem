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
  const [searchError, setSearchError] = useState('')
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
      setSearchError('Vui lòng nhập số điện thoại')
      return
    }
    setSearchError('')
    setSearchedPhone(phone.trim())
  }

  useEffect(() => {
    const t = setInterval(() => setNowTs(Date.now()), 30_000)
    return () => clearInterval(t)
  }, [])

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
    updateBooking(booking.id, { status: 'canceled', refundAmount, refundPercent })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-primary/10 text-main">
      <header className="px-4 md:px-10 py-6 flex items-center justify-between">
        <Link to={`/${shop.slug}`} className="font-bold text-primary text-lg">
          {shop.name || 'LumiX'}
        </Link>
        <nav className="flex items-center gap-3">
          <Link className="px-4 py-2 rounded-xl bg-white/80 hover:bg-white border border-primary/10" to={`/${shop.slug}`}>
            Trang chủ
          </Link>
          <Link className="px-4 py-2 rounded-xl bg-primary text-white hover:brightness-110" to={`/${shop.slug}/book`}>
            Đặt lịch
          </Link>
        </nav>
      </header>

      <main className="px-4 md:px-10 pb-16">
        {!isCorrectSlug ? (
          <div className="max-w-3xl mx-auto glass-card bg-white/70 rounded-3xl p-6 border border-rose-200 text-rose-700">
            Bạn đang mở slug <b>{slug}</b> không khớp shop hiện tại. Demo đang hiển thị dữ liệu của <b>{shop.name}</b>.
          </div>
        ) : null}

        <div className="max-w-4xl mx-auto">
          <div className="glass-card bg-white/70 rounded-3xl p-8 mb-8">
            <h1 className="font-h2 text-h2 text-primary mb-3">Tra cứu lịch hẹn</h1>
            <p className="text-main/70">
              Nhập số điện thoại đã dùng để đặt lịch để tra cứu, quản lý hoặc hủy lịch hẹn.
            </p>

            <div className="mt-6 flex flex-col md:flex-row gap-3">
              <input
                className="flex-1 px-5 py-4 rounded-2xl border border-primary/10 bg-white/80 focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="Nhập số điện thoại..."
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <button
                className="px-6 py-4 rounded-2xl bg-primary text-white font-bold hover:brightness-110"
                onClick={doSearch}
                type="button"
              >
                Tra cứu
              </button>
            </div>

            {searchError ? <p className="mt-3 text-sm text-rose-600 font-semibold">{searchError}</p> : null}

            {searchedPhone ? (
              <div className="mt-6">
                <p className="text-main/70">
                  Kết quả cho SĐT: <b className="text-primary">{searchedPhone}</b>
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className={`px-4 py-2 rounded-xl font-bold ${tab === 'upcoming' ? 'bg-primary text-white' : 'bg-white/70 text-main/70'}`}
                    onClick={() => setTab('upcoming')}
                  >
                    Sắp tới
                  </button>
                  <button
                    type="button"
                    className={`px-4 py-2 rounded-xl font-bold ${tab === 'completed' ? 'bg-primary text-white' : 'bg-white/70 text-main/70'}`}
                    onClick={() => setTab('completed')}
                  >
                    Hoàn thành
                  </button>
                  <button
                    type="button"
                    className={`px-4 py-2 rounded-xl font-bold ${tab === 'cancelled' ? 'bg-primary text-white' : 'bg-white/70 text-main/70'}`}
                    onClick={() => setTab('cancelled')}
                  >
                    Đã hủy
                  </button>
                </div>

                <p className="mt-4 text-sm text-main/70">
                  Cần hỗ trợ đổi lịch gấp? Hãy gọi hotline <b className="text-primary">{shop.phone}</b>.
                </p>
              </div>
            ) : (
              <div className="mt-6 text-center text-main/60">
                Nhập số điện thoại để bắt đầu tra cứu.
              </div>
            )}
          </div>

          <div className="space-y-6">
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
                <div
                  key={b.id}
                  className="glass-card bg-white/70 rounded-3xl overflow-hidden flex flex-col md:flex-row border border-primary/10"
                >
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
                      <button
                        type="button"
                        className="flex-1 min-w-[140px] py-2 px-4 rounded-xl bg-slate-100 text-primary font-bold flex items-center justify-center gap-2 hover:bg-primary/10 transition-all"
                        onClick={handleDirections}
                      >
                        <span className="material-symbols-outlined text-[18px]">directions</span>
                        <span>Chỉ đường</span>
                      </button>
                      {tab === 'upcoming' && (
                        <button
                          type="button"
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
