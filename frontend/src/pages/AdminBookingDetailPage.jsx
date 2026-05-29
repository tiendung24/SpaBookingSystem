import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import AdminHeaderNav from '../components/admin/AdminHeaderNav'
import AdminLayout from '../components/admin/AdminLayout'
import { useToast } from '../components/ui/ToastProvider'
import { useShop } from '../context/ShopContext'
import { apiRequest } from '../lib/api'

function fmtVnd(value) {
  return `${Number(value || 0).toLocaleString('vi-VN')}đ`
}

function fmtDateTime(value, end) {
  if (!value) return '—'
  try {
    const start = new Date(value)
    const date = start.toLocaleDateString('vi-VN')
    const timeStart = start.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    if (end) {
      const timeEnd = new Date(end).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
      return `${date}, ${timeStart} - ${timeEnd}`
    }
    return `${date}, ${timeStart}`
  } catch {
    return '—'
  }
}

function fmtCreatedAt(value) {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString('vi-VN')
}

function paymentStatusInfo(booking) {
  if (booking?.paymentStatus?.key) {
    const key = String(booking.paymentStatus.key)
    if (key === 'service_paid') return { key, label: booking.paymentStatus.label || 'Đã nhận thanh toán dịch vụ', className: 'bg-emerald-100 text-emerald-700' }
    if (key === 'deposit_received') return { key, label: booking.paymentStatus.label || 'Đã nhận cọc', className: 'bg-primary/10 text-primary' }
    return { key, label: booking.paymentStatus.label || 'Chưa nhận', className: 'bg-amber-100 text-amber-700' }
  }
  return { key: 'not_received', label: 'Chưa nhận', className: 'bg-amber-100 text-amber-700' }
}

export default function AdminBookingDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { token } = useShop()
  const { pushToast } = useToast()
  const [loading, setLoading] = useState(true)
  const [booking, setBooking] = useState(null)

  const loadBooking = async (mountedRef = { current: true }) => {
    if (!token || !id) return
    setLoading(true)
    try {
      const res = await apiRequest(`/api/admin/bookings/${id}`, { token })
      if (mountedRef.current) setBooking(res.booking || null)
    } catch (error) {
      if (mountedRef.current) {
        pushToast({ type: 'error', title: 'Không tải được booking', message: error?.message || 'Lỗi không xác định' })
      }
    } finally {
      if (mountedRef.current) setLoading(false)
    }
  }

  useEffect(() => {
    const mountedRef = { current: true }
    void loadBooking(mountedRef)

    const onFocus = () => { void loadBooking(mountedRef) }
    const onVisibility = () => {
      if (document.visibilityState === 'visible') void loadBooking(mountedRef)
    }
    const intervalId = window.setInterval(() => { void loadBooking(mountedRef) }, 15000)

    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      mountedRef.current = false
      window.clearInterval(intervalId)
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [id, token, pushToast])

  const paymentStatus = useMemo(() => paymentStatusInfo(booking), [booking])

  return (
    <AdminLayout>
      <header>
        <h2 className="font-h2 text-h2 text-primary">Chi tiết booking</h2>
        <p className="text-main/70">Xem trạng thái booking và trạng thái thanh toán ở cùng một nơi.</p>
        <AdminHeaderNav />
      </header>

      <section className="glass-card bg-white rounded-3xl p-6">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <Link className="text-primary hover:underline" to={booking?.shopId ? `/admin/partners/${booking.shopId}` : '/admin/partners'}>← Quay lại đối tác</Link>
            <h1 className="font-h2 text-h2 text-primary mt-2">{booking ? `Booking #${booking.bookingCode || booking._id}` : 'Chi tiết booking'}</h1>
          </div>
          <button type="button" className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50" onClick={() => navigate(-1)}>
            Đóng
          </button>
        </div>

        {loading ? <p className="text-main/60">Đang tải...</p> : null}

        {!loading && booking ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50">
              <p className="text-xs uppercase text-main/60 font-bold">Khách hàng</p>
              <p className="font-bold text-lg text-main mt-1">{booking.customerName || '—'}</p>
              <p className="text-main/70">{booking.customerPhone || '—'}</p>
            </div>
            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50">
              <p className="text-xs uppercase text-main/60 font-bold">Thời gian hẹn</p>
              <p className="font-bold text-lg text-main mt-1">{fmtDateTime(booking.startTime, booking.endTime)}</p>
              <p className="text-main/70">Thời gian đặt: {fmtCreatedAt(booking.createdAt)}</p>
            </div>
            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50">
              <p className="text-xs uppercase text-main/60 font-bold">Trạng thái thanh toán</p>
              <p className={`inline-flex mt-1 px-3 py-1 rounded-full text-xs font-bold ${paymentStatus.className}`}>{paymentStatus.label}</p>
              <p className="text-main/70">Booking: {booking.status || '—'}</p>
            </div>
            <div className="p-4 rounded-2xl border border-slate-200 bg-white">
              <p className="text-xs uppercase text-main/60 font-bold">Shop</p>
              <p className="font-bold text-lg text-main mt-1">{booking.shopId || '—'}</p>
            </div>
            <div className="p-4 rounded-2xl border border-slate-200 bg-white">
              <p className="text-xs uppercase text-main/60 font-bold">Dịch vụ</p>
              <p className="font-bold text-lg text-main mt-1">{booking.serviceId || '—'}</p>
            </div>
            <div className="p-4 rounded-2xl border border-slate-200 bg-white">
              <p className="text-xs uppercase text-main/60 font-bold">Số tiền</p>
              <p className="font-bold text-lg text-main mt-1">Tổng bill: {fmtVnd(booking.totalAmount)}</p>
              <p className="text-primary font-bold">Cọc: {fmtVnd(booking.depositAmount)}</p>
            </div>
          </div>
        ) : null}
      </section>
    </AdminLayout>
  )
}
