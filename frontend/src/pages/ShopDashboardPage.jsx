import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ShopSidebar from '../components/shop/ShopSidebar'
import { useShop } from '../context/ShopContext'

function formatVnd(value) {
  return `${Number(value || 0).toLocaleString('vi-VN')}đ`
}

function formatDateLabel(isoString) {
  const date = new Date(isoString)
  return date.toLocaleDateString('vi-VN')
}

function formatTimeLabel(isoString) {
  return new Date(isoString).toTimeString().slice(0, 5)
}

function customerInitials(name) {
  return String(name || '')
    .split(' ')
    .filter(Boolean)
    .slice(-2)
    .map((word) => word[0])
    .join('')
    .toUpperCase()
}

function isToday(isoString) {
  const date = new Date(isoString)
  const now = new Date()
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  )
}

function getStatusText(status) {
  if (status === 'pending') return 'Chờ xác nhận'
  if (status === 'confirmed') return 'Đã xác nhận'
  if (status === 'checked_in') return 'Đang phục vụ'
  if (status === 'checked_out' || status === 'completed') return 'Hoàn thành'
  if (status === 'canceled') return 'Đã hủy'
  if (status === 'no_show') return 'Không đến'
  return status
}

function getStatusClass(status) {
  if (status === 'pending') return 'bg-amber-100 text-amber-700'
  if (status === 'confirmed' || status === 'checked_in') return 'bg-primary/15 text-primary'
  if (status === 'checked_out' || status === 'completed') return 'bg-emerald-100 text-emerald-700'
  return 'bg-red-100 text-red-700'
}

export default function ShopDashboardPage() {
  const navigate = useNavigate()
  const { shop, bookings, services, staff } = useShop()
  const [copied, setCopied] = useState(false)
  const [dateFilter, setDateFilter] = useState('today')
  const [customDate, setCustomDate] = useState(new Date().toISOString().slice(0, 10))

  const bookingLink = `${window.location.origin}/${shop.slug}`

  const todayBookings = useMemo(() => bookings.filter((item) => isToday(item.time)), [bookings])
  const pendingBookings = useMemo(() => bookings.filter((item) => item.status === 'pending'), [bookings])
  const todayRevenue = useMemo(
    () =>
      todayBookings
        .filter((item) => ['confirmed', 'checked_in', 'checked_out', 'completed'].includes(item.status))
        .reduce((sum, item) => sum + Number(item.total || 0), 0),
    [todayBookings]
  )

  const recentBookings = useMemo(() => {
    const now = new Date()
    const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
    const endToday = startToday + 24 * 60 * 60 * 1000
    const start7Days = startToday - 6 * 24 * 60 * 60 * 1000
    const customStart = new Date(`${customDate}T00:00:00`).getTime()
    const customEnd = customStart + 24 * 60 * 60 * 1000

    const filtered = bookings.filter((item) => {
      const t = new Date(item.time).getTime()
      if (dateFilter === 'today') return t >= startToday && t < endToday
      if (dateFilter === '7days') return t >= start7Days && t < endToday
      if (dateFilter === 'custom') return t >= customStart && t < customEnd
      return true
    })

    return filtered.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
  }, [bookings, dateFilter, customDate])

  const weeklyChart = useMemo(() => {
    const now = new Date()
    const labels = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']

    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(now)
      date.setDate(now.getDate() - (6 - index))
      const count = bookings.filter((item) => {
        const bookingDate = new Date(item.time)
        return (
          bookingDate.getFullYear() === date.getFullYear() &&
          bookingDate.getMonth() === date.getMonth() &&
          bookingDate.getDate() === date.getDate()
        )
      }).length

      return {
        day: labels[date.getDay()],
        value: count,
        active: index === 6
      }
    })
  }, [bookings])

  const maxChart = useMemo(() => Math.max(...weeklyChart.map((item) => item.value), 1), [weeklyChart])

  const stats = [
    {
      title: 'Lịch hôm nay',
      value: String(todayBookings.length).padStart(2, '0'),
      icon: 'event_note',
      valueColor: 'text-primary',
      note: `${todayBookings.filter((item) => ['pending', 'confirmed'].includes(item.status)).length} lịch đang hoạt động`,
      noteColor: 'text-emerald-600'
    },
    {
      title: 'Chờ xác nhận',
      value: String(pendingBookings.length).padStart(2, '0'),
      icon: 'pending_actions',
      valueColor: 'text-amber-700',
      note: pendingBookings.length > 0 ? 'Cần xử lý ngay' : 'Không có lịch chờ',
      noteColor: pendingBookings.length > 0 ? 'text-red-600' : 'text-emerald-600'
    },
    {
      title: 'Doanh thu hôm nay',
      value: formatVnd(todayRevenue),
      icon: 'payments',
      valueColor: 'text-primary',
      note: `${services.length} dịch vụ đang mở bán`,
      noteColor: 'text-emerald-600'
    },
    {
      title: 'Số dư ví LumiX',
      value: formatVnd(shop.wallet.balance),
      icon: 'wallet',
      valueColor: 'text-primary',
      note: shop.wallet.balance >= shop.wallet.minBalance ? 'An toàn' : 'Cần nạp thêm',
      noteColor: shop.wallet.balance >= shop.wallet.minBalance ? 'text-cyan-700' : 'text-red-600'
    }
  ]

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(bookingLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Copy failed:', error)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-main">
      <ShopSidebar onNewBooking={() => console.log('Tạo lịch hẹn mới')} />

      <main className="ml-64 p-6 md:p-10 space-y-8">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="font-h2 text-h2 text-primary">Chào mừng quay lại, {shop.name}</h2>
            <p className="font-body-lg text-body-lg text-main/80">
              Theo dõi tình hình kinh doanh, lịch hẹn và hiệu suất vận hành trong ngày.
            </p>
          </div>
          <button type="button" className="bg-primary text-white px-6 py-3 rounded-xl flex items-center gap-2 shadow-lg hover:scale-105 active:scale-95 transition-all font-bold">
            <span className="material-symbols-outlined">add_circle</span>
            Tạo lịch hẹn mới
          </button>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <article key={stat.title} className="glass-card inner-glow rounded-3xl p-6 bg-white relative overflow-hidden">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-3">
                <span className="material-symbols-outlined">{stat.icon}</span>
              </div>
              <p className="font-label-bold text-label-bold text-main/70 mb-2">{stat.title}</p>
              <h3 className={`font-h2 text-h2 ${stat.valueColor}`}>{stat.value}</h3>
              <p className={`text-sm mt-2 ${stat.noteColor}`}>{stat.note}</p>
            </article>
          ))}
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <article className="glass-card bg-white rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-h3 text-h3 text-primary">Link đặt lịch</h4>
              <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold">
                {copied ? 'Đã sao chép' : 'Online'}
              </span>
            </div>
            <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
              <p className="text-sm text-main/60 mb-1">Liên kết shop</p>
              <p className="font-bold text-primary break-all">{bookingLink}</p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={handleCopyLink}
                className="bg-primary text-white py-3 rounded-xl flex items-center justify-center gap-2 font-bold hover:opacity-90 transition-all"
              >
                <span className="material-symbols-outlined">content_copy</span>
                Copy
              </button>
              <button type="button" className="bg-primary/10 text-primary py-3 rounded-xl flex items-center justify-center gap-2 font-bold hover:bg-primary/20 transition-all">
                <span className="material-symbols-outlined">qr_code_2</span>
                QR
              </button>
              <button type="button" className="bg-primary text-white py-3 rounded-xl flex items-center justify-center gap-2 font-bold hover:opacity-90 transition-all">
                <span className="material-symbols-outlined">share</span>
                Chia sẻ
              </button>
            </div>
            <p className="text-sm text-main/70 italic text-center">Đưa khách hàng đến link của bạn để họ tự đặt lịch nhanh hơn.</p>
          </article>

          <article className="glass-card bg-white rounded-3xl p-6 xl:col-span-2 space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-h3 text-h3 text-primary">Tăng trưởng 7 ngày</h4>
              <span className="px-2 py-1 rounded-full bg-red-100 text-red-600 text-xs font-bold">
                Hủy lịch: {bookings.length ? Math.round((bookings.filter((item) => item.status === 'canceled').length / bookings.length) * 100) : 0}%
              </span>
            </div>
            <div className="h-56 flex items-end justify-between gap-2 border-b border-slate-200 pb-2">
              {weeklyChart.map((item) => (
                <div key={item.day} className="flex-1 flex flex-col items-center justify-end gap-2">
                  <div
                    className={`w-full max-w-8 rounded-t-lg transition-all duration-700 ${
                      item.active ? 'bg-primary' : 'bg-primary/35 hover:bg-primary'
                    }`}
                    style={{ height: `${Math.max(20, (item.value / maxChart) * 180)}px` }}
                  />
                  <span className={`text-xs font-label-bold ${item.active ? 'text-primary' : 'text-main/60'}`}>{item.day}</span>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <article className="glass-card bg-white rounded-3xl p-6 space-y-4">
            <h4 className="font-h3 text-h3 text-primary">Tổng quan nhanh</h4>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-main/70">Nhân viên đang hoạt động</span>
                <span className="font-bold text-primary">
                  {staff.filter((item) => item.bookingEnabled).length}/{staff.length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-main/70">Dịch vụ đang hiển thị</span>
                <span className="font-bold text-primary">
                  {services.filter((item) => item.visible).length}/{services.length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-main/70">Tiền ký quỹ đang giữ</span>
                <span className="font-bold text-primary">{formatVnd(shop.wallet.escrow)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-main/70">Ngưỡng ví tối thiểu</span>
                <span className="font-bold text-primary">{formatVnd(shop.wallet.minBalance)}</span>
              </div>
            </div>
          </article>

          <article className="glass-card bg-white rounded-3xl p-6 xl:col-span-2 space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <h4 className="font-h3 text-h3 text-primary">Lịch hẹn gần đây</h4>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setDateFilter('today')}
                  className={`px-3 py-2 rounded-xl text-sm font-bold transition-all ${
                    dateFilter === 'today' ? 'bg-primary text-white' : 'bg-slate-100 text-main/70 hover:bg-primary/10'
                  }`}
                >
                  Hôm nay
                </button>
                <button
                  type="button"
                  onClick={() => setDateFilter('7days')}
                  className={`px-3 py-2 rounded-xl text-sm font-bold transition-all ${
                    dateFilter === '7days' ? 'bg-primary text-white' : 'bg-slate-100 text-main/70 hover:bg-primary/10'
                  }`}
                >
                  7 ngày
                </button>
                <button
                  type="button"
                  onClick={() => setDateFilter('all')}
                  className={`px-3 py-2 rounded-xl text-sm font-bold transition-all ${
                    dateFilter === 'all' ? 'bg-primary text-white' : 'bg-slate-100 text-main/70 hover:bg-primary/10'
                  }`}
                >
                  Tất cả
                </button>
                <input
                  type="date"
                  value={customDate}
                  onChange={(e) => {
                    setCustomDate(e.target.value)
                    setDateFilter('custom')
                  }}
                  className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[860px]">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="px-6 py-4 font-label-bold text-label-bold text-main/70 uppercase">Khách hàng</th>
                    <th className="px-6 py-4 font-label-bold text-label-bold text-main/70 uppercase">Dịch vụ</th>
                    <th className="px-6 py-4 font-label-bold text-label-bold text-main/70 uppercase">Thời gian</th>
                    <th className="px-6 py-4 font-label-bold text-label-bold text-main/70 uppercase">Giá tiền</th>
                    <th className="px-6 py-4 font-label-bold text-label-bold text-main/70 uppercase text-right">Trạng thái</th>
                    <th className="px-4 py-4 font-label-bold text-label-bold text-main/70 uppercase text-right">Chi tiết</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {recentBookings.map((booking) => {
                    const service = services.find((item) => item.id === booking.serviceId)
                    return (
                      <tr
                        key={booking.id}
                        className="hover:bg-slate-50 transition-colors cursor-pointer"
                        onClick={() => navigate(`/shop/bookings/${booking.id}`)}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center text-primary font-bold text-sm">
                              {customerInitials(booking.customer)}
                            </div>
                            <div>
                              <p className="font-label-bold text-label-bold text-primary">{booking.customer}</p>
                              <p className="text-sm text-main/70">{booking.phone}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-main">{service?.name || 'Dịch vụ'}</td>
                        <td className="px-6 py-4 text-sm text-main/80">
                          {formatTimeLabel(booking.time)}, {formatDateLabel(booking.time)}
                        </td>
                        <td className="px-6 py-4 font-label-bold text-label-bold text-primary">{formatVnd(booking.total)}</td>
                        <td className="px-6 py-4 text-right">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusClass(booking.status)}`}>
                            {getStatusText(booking.status)}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right text-primary">
                          <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            {recentBookings.length === 0 && (
              <div className="text-center py-8 text-main/60">Không có lịch hẹn phù hợp với bộ lọc ngày đã chọn.</div>
            )}
          </article>
        </section>
      </main>
    </div>
  )
}
