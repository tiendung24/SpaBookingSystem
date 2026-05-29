import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import ShopSidebar from '../components/shop/ShopSidebar'
import { useShop } from '../context/ShopContext'

const statuses = ['Tất cả', 'Chờ xác nhận', 'Đã xác nhận', 'Đang phục vụ', 'Hoàn thành', 'Đã hủy', 'Không đến']

const mapStatus = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  checked_in: 'Đang phục vụ',
  completed: 'Hoàn thành',
  canceled: 'Đã hủy',
  cancelled: 'Đã hủy',
  no_show: 'Không đến'
}

function statusClass(label) {
  if (label === 'Hoàn thành') return 'text-emerald-600'
  if (label === 'Chờ xác nhận') return 'text-amber-700'
  if (label === 'Đã xác nhận' || label === 'Đang phục vụ') return 'text-primary'
  return 'text-red-600'
}

function formatBookingDate(value) {
  return new Date(value).toLocaleDateString('vi-VN')
}

function formatBookingTime(value) {
  return new Date(value).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
}

function formatAppointment(start, end) {
  if (!start) return '—'
  try {
    const dStart = new Date(start)
    const date = dStart.toLocaleDateString('vi-VN')
    const timeStart = dStart.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    if (end) {
      const dEnd = new Date(end)
      const timeEnd = dEnd.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
      return `${date}, ${timeStart} - ${timeEnd}`
    }
    return `${date}, ${timeStart}`
  } catch {
    return '—'
  }
}

function formatCreatedAt(value) {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString('vi-VN')
}

function formatVnd(value) {
  return `${Number(value || 0).toLocaleString('vi-VN')}đ`
}

function downloadCsv(filename, rows) {
  const escapeCell = (value) => {
    const text = String(value ?? '')
    if (text.includes(',') || text.includes('"') || text.includes('\n')) return `"${text.replace(/"/g, '""')}"`
    return text
  }
  const csv = rows.map((row) => row.map(escapeCell).join(',')).join('\n')
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export default function ShopBookingsPage() {
  const { bookings, services, staff, markAllNotificationsRead, token } = useShop()
  const [selectedStatus, setSelectedStatus] = useState('Tất cả')

  // When opening the booking page, mark notifications as read so the red badge disappears.
  useEffect(() => {
    if (!token) return
    void markAllNotificationsRead(token)
  }, [token, markAllNotificationsRead])

  const rows = useMemo(() => {
    const sorted = [...(bookings || [])].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    return sorted.map((booking) => {
      const service = services.find((s) => s.id === booking.serviceId)
      const employee = staff.find((s) => s.id === booking.staffId)
      const status = mapStatus[booking.status] ?? 'Chờ xác nhận'
      return {
        ...booking,
        statusLabel: status,
        serviceName: service?.name ?? 'Dịch vụ',
        staffName: employee?.name ?? 'Chưa phân công',
        depositAmount: Number(booking.deposit || 0),
        serviceAmount: Number(booking.total || service?.priceVnd || 0),
        remainingAmount: Math.max(Number(booking.total || service?.priceVnd || 0) - Number(booking.deposit || 0), 0),
        dateLabel: formatBookingDate(booking.time),
        timeLabelOnly: formatBookingTime(booking.time),
        timeLabel: `${new Date(booking.time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - ${new Date(booking.endTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`
      }
    })
  }, [bookings, services, staff])

  const filtered = rows.filter((row) => {
    if (selectedStatus === 'Tất cả') return true
    return row.statusLabel === selectedStatus
  })

  const handleExportBookings = () => {
    const exportRows = [
      ['Mã booking', 'Khách hàng', 'Số điện thoại', 'Dịch vụ', 'Nhân viên', 'Thời gian hẹn', 'Thời gian đặt', 'Tiền cọc', 'Tiền dịch vụ', 'Còn lại', 'Trạng thái'],
      ...filtered.map((booking) => [
        booking.bookingCode || booking.id,
        booking.customer || '',
        booking.phone || '',
        booking.serviceName || '',
        booking.staffName || '',
        formatAppointment(booking.startTime || booking.time, booking.endTime),
        formatCreatedAt(booking.createdAt),
        booking.depositAmount,
        booking.serviceAmount,
        booking.remainingAmount,
        booking.statusLabel
      ])
    ]
    const today = new Date().toISOString().slice(0, 10)
    downloadCsv(`lich-hen-shop-${today}.csv`, exportRows)
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,#f9f9ff_0%,#e7eeff_100%)] text-main">
      <ShopSidebar onNewBooking={() => console.log('Tạo lịch hẹn mới')} />
      <main className="ml-64 p-6 md:p-10 min-h-screen">
        <header className="mb-8">
          <h1 className="font-h2 text-h2 text-primary">Quản lý lịch hẹn</h1>
          <p className="text-main/70">Theo dõi và cập nhật lịch trình dịch vụ hôm nay.</p>
        </header>

        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {statuses.map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setSelectedStatus(status)}
                className={`px-4 py-2 rounded-full border text-sm ${
                  selectedStatus === status ? 'border-primary bg-primary/10 text-primary font-bold' : 'border-slate-300 text-main/70'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={handleExportBookings}
            className="px-4 py-2 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 transition-colors disabled:opacity-60"
            disabled={filtered.length === 0}
          >
            Xuất Excel (CSV)
          </button>
        </div>

        <section className="glass-card rounded-2xl overflow-hidden bg-white/70">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1180px]">
              <thead className="bg-primary/5 border-b border-primary/10">
                <tr>
                  {['Mã', 'Khách hàng', 'Dịch vụ', 'Nhân viên', 'Thời gian hẹn', 'Thời gian đặt', 'Tiền cọc', 'Tiền dịch vụ', 'Còn lại', 'Trạng thái', 'Chi tiết'].map((h) => (
                    <th key={h} className="p-4 text-left font-label-bold text-label-bold text-primary">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filtered.map((booking) => (
                  <tr key={booking.id} className="hover:bg-white/60">
                    <td className="p-4 font-bold text-primary">{`#${booking.bookingCode || booking.id}`}</td>
                    <td className="p-4">
                      <p className="font-semibold">{booking.customer}</p>
                      <p className="text-xs text-main/60">{booking.phone}</p>
                    </td>
                    <td className="p-4">{booking.serviceName}</td>
                    <td className="p-4">{booking.staffName}</td>
                    <td className="p-4 text-sm">{formatAppointment(booking.startTime || booking.time, booking.endTime) || booking.dateLabel}</td>
                    <td className="p-4 text-sm">{formatCreatedAt(booking.createdAt)}</td>
                    <td className="p-4 font-semibold text-primary">{formatVnd(booking.depositAmount)}</td>
                    <td className="p-4">{formatVnd(booking.serviceAmount)}</td>
                    <td className="p-4 font-semibold text-emerald-700">{formatVnd(booking.remainingAmount)}</td>
                    <td className={`p-4 font-bold ${statusClass(booking.statusLabel)}`}>{booking.statusLabel}</td>
                    <td className="p-4">
                      <Link className="px-3 py-1.5 rounded-lg border border-primary text-primary hover:bg-primary/10 text-sm" to={`/shop/bookings/${booking.id}`}>
                        Xem
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  )
}
