import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import AdminHeaderNav from '../components/admin/AdminHeaderNav'
import AdminLayout from '../components/admin/AdminLayout'
import { useToast } from '../components/ui/ToastProvider'
import { useShop } from '../context/ShopContext'
import { apiRequest } from '../lib/api'

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

function formatVnd(value) {
  return `${Number(value || 0).toLocaleString('vi-VN')}đ`
}

function formatCreatedAt(value) {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString('vi-VN')
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

function paymentStatusInfo(booking) {
  const backendStatus = String(booking?.paymentStatusInfo?.key || '').trim()
  if (backendStatus === 'service_paid') {
    return { key: backendStatus, label: booking.paymentStatusInfo.label || 'Đã nhận thanh toán dịch vụ', className: 'bg-emerald-100 text-emerald-700' }
  }
  if (backendStatus === 'deposit_received') {
    return { key: backendStatus, label: booking.paymentStatusInfo.label || 'Đã nhận cọc', className: 'bg-primary/10 text-primary' }
  }
  return { key: backendStatus || 'not_received', label: booking?.paymentStatusInfo?.label || 'Chưa nhận', className: 'bg-amber-100 text-amber-700' }
}

function mapShopToPartner(shop) {
  const wallet = shop?.wallet || {}
  const walletBalance = Number(shop?.stats?.walletBalance ?? wallet.balance ?? 0)
  const walletMinBalance = Number(shop?.stats?.walletMinBalance ?? wallet.minBalance ?? 100000)
  const walletHealthy = Boolean(shop?.stats?.walletHealthy ?? walletBalance >= walletMinBalance)
  const linkActive = Boolean(shop?.stats?.bookingLinkActive ?? (shop?.status === 'active' && shop?.onlineBookingEnabled !== false && walletHealthy))
  return {
    id: shop?._id || shop?.id || '',
    shopName: shop?.name || '—',
    owner: shop?.ownerName || 'Chưa cập nhật',
    phone: shop?.phone || '',
    district: shop?.address?.district || shop?.address?.city || 'Chưa cập nhật',
    plan: shop?.plan || 'Cơ bản',
    joinedAt: shop?.createdAt || new Date().toISOString(),
    status: shop?.status || 'pending',
    rating: Number(shop?.stats?.rating || 0),
    monthlyBookings: Number(shop?.stats?.monthlyBookings || 0),
    wallet: walletBalance,
    walletMinBalance,
    walletHealthy,
    linkActive,
    walletRaw: wallet,
    stats: shop?.stats || {}
  }
}

export default function AdminPartnerDetailPage() {
  const { id } = useParams()
  const { token } = useShop()
  const { pushToast } = useToast()
  const [partner, setPartner] = useState(null)
  const [status, setStatus] = useState('pending')
  const [bookings, setBookings] = useState([])
  const [search, setSearch] = useState('')
  const [paymentFilter, setPaymentFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)
  const previousLinkActiveRef = useRef(null)

  useEffect(() => {
    if (!token || !id) return
    let mounted = true
    const run = async () => {
      setLoading(true)
      try {
        const res = await apiRequest(`/api/admin/shops/${id}`, { token })
        if (!mounted) return
        const mapped = mapShopToPartner(res?.shop || null)
        setPartner(mapped)
        setStatus(mapped.status)
        setBookings(Array.isArray(res?.bookings) ? res.bookings : [])
      } catch (error) {
        pushToast({ type: 'error', title: 'Không tải được đối tác', message: error?.message || 'Lỗi không xác định' })
      } finally {
        if (mounted) setLoading(false)
      }
    }
    run()
    return () => { mounted = false }
  }, [id, token, pushToast])

  useEffect(() => {
    if (!partner) return
    if (previousLinkActiveRef.current === false && partner.linkActive && status === 'active' && partner.walletHealthy) {
      pushToast({
        type: 'success',
        title: 'Shop đã hoạt động lại',
        message: `${partner.shopName} đã đủ mức ví duy trì và link đặt lịch đang hoạt động.`
      })
    }
    previousLinkActiveRef.current = partner.linkActive
  }, [partner, status, pushToast])

  const kpis = useMemo(() => {
    const stats = partner?.stats || {}
    return {
      depositReceived: Number(stats.depositReceived || 0),
      depositWaitingForShop: Number(stats.depositWaitingForShop || 0),
      depositPaidToShop: Number(stats.depositPaidToShop || 0),
      depositRefundedToCustomer: Number(stats.depositRefundedToCustomer || 0),
      depositPendingReconcile: Number(stats.depositPendingReconcile || 0),
      totalServiceAmount: Number(stats.totalServiceAmount || 0),
      customerRemainingAmount: Number(stats.customerRemainingAmount || 0),
      platformFeeCollected: Number(stats.platformFeeCollected || 0),
      walletBalance: Number(stats.walletBalance ?? partner?.wallet ?? 0),
      completedBookings: Number(stats.completedBookings || 0),
      noDepositBookings: Number(stats.noDepositBookings || 0),
      depositBookings: Number(stats.depositBookings || 0)
    }
  }, [partner])

  const bookingRows = useMemo(() => {
    return (bookings || []).map((booking) => {
      return {
        ...booking,
        depositAmount: Number(booking.depositAmount || 0),
        totalAmount: Number(booking.totalAmount || 0),
        remainingAmount: Number(booking.remainingAmount || 0),
        createdAtLabel: formatCreatedAt(booking.createdAt),
        appointmentLabel: formatAppointment(booking.startTime || booking.time, booking.endTime)
      }
    })
  }, [bookings])

  const filteredBookingRows = useMemo(() => {
    const query = search.trim().toLowerCase()
    return bookingRows.filter((booking) => {
      const paymentStatus = paymentStatusInfo(booking).key
      const matchesPayment = paymentFilter === 'all' || paymentStatus === paymentFilter
      const matchesQuery = !query || [
        booking.paymentOrderCode,
        booking.bookingCode,
        booking.customerName,
        booking.customerPhone,
        booking.serviceName
      ]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(query))

      let matchesDate = true
      if (dateFilter !== 'all') {
        const bookingDate = new Date(booking.createdAt)
        const filterDate = new Date(dateFilter)
        matchesDate = !Number.isNaN(bookingDate.getTime()) && !Number.isNaN(filterDate.getTime()) &&
          bookingDate.getFullYear() === filterDate.getFullYear() &&
          bookingDate.getMonth() === filterDate.getMonth() &&
          bookingDate.getDate() === filterDate.getDate()
      }

      return matchesPayment && matchesQuery && matchesDate
    })
  }, [bookingRows, search, paymentFilter, dateFilter])

  const handleExportBookings = () => {
    const rows = [[
      'Mã booking',
      'OrderCode PayOS',
      'Khách hàng',
      'Số điện thoại',
      'Dịch vụ',
      'Thời gian hẹn',
      'Thời gian đặt',
      'Tiền cọc',
      'Tiền dịch vụ',
      'Tiền còn lại',
      'Trạng thái thanh toán'
    ]]

    filteredBookingRows.forEach((booking) => {
      const paymentStatus = paymentStatusInfo(booking)
      rows.push([
        booking.bookingCode || booking._id,
        booking.paymentOrderCode || '',
        booking.customerName || '',
        booking.customerPhone || '',
        booking.serviceName || '',
        booking.appointmentLabel || '',
        booking.createdAtLabel || '',
        Number(booking.depositAmount || 0),
        Number(booking.totalAmount || 0),
        Number(booking.remainingAmount || 0),
        paymentStatus.label
      ])
    })

    const dateText = new Date().toISOString().slice(0, 10)
    const slug = String(partner?.shopName || 'shop').toLowerCase().replace(/\s+/g, '-')
    downloadCsv(`lumix-bookings-${slug}-${dateText}.csv`, rows)
    pushToast({ type: 'success', title: 'Xuất file thành công', message: `Đã xuất ${filteredBookingRows.length} booking.` })
  }

  if (loading) {
    return <AdminLayout><p className="text-sm text-main/60">Đang tải đối tác...</p></AdminLayout>
  }

  if (!partner) {
    return (
      <AdminLayout>
        <h2 className="font-h2 text-h2 text-primary">Không tìm thấy đối tác</h2>
        <Link className="text-primary underline" to="/admin/partners">Quay lại danh sách đối tác</Link>
      </AdminLayout>
    )
  }

  const activate = async () => {
    setSaving(true)
    try {
      await apiRequest(`/api/admin/shops/${partner.id}/unlock`, { method: 'PUT', token })
      setStatus('active')
      pushToast({ type: 'success', title: 'Kích hoạt thành công', message: `${partner.shopName} đã được mở khóa.` })
    } catch (error) {
      pushToast({ type: 'error', title: 'Không thể kích hoạt', message: error?.message || 'Lỗi không xác định' })
    } finally {
      setSaving(false)
    }
  }

  const suspend = async () => {
    setSaving(true)
    try {
      await apiRequest(`/api/admin/shops/${partner.id}/lock`, { method: 'PUT', token })
      setStatus('inactive')
      pushToast({ type: 'warning', title: 'Đã khóa shop', message: `${partner.shopName} đã bị khóa.` })
    } catch (error) {
      pushToast({ type: 'error', title: 'Không thể tạm ngưng', message: error?.message || 'Lỗi không xác định' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <AdminLayout>
      <header className="flex items-center justify-between gap-4">
        <div>
          <h2 className="font-h2 text-h2 text-primary">Chi tiết đối tác</h2>
          <p className="text-main/70">Thông tin vận hành, ví LumiX, booking và đối soát thanh toán của shop.</p>
          <AdminHeaderNav />
        </div>
        <Link to="/admin/partners" className="px-4 py-2 rounded-xl bg-slate-100 text-main/70 font-bold hover:bg-slate-200">Quay lại</Link>
      </header>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <article className="glass-card bg-white rounded-3xl p-6 xl:col-span-2 space-y-4">
          <h4 className="font-h3 text-h3 text-primary">{partner.shopName}</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <p><span className="text-main/60">Mã đối tác:</span> <b>{partner.id}</b></p>
            <p><span className="text-main/60">Chủ shop:</span> <b>{partner.owner}</b></p>
            <p><span className="text-main/60">Số điện thoại:</span> <b>{partner.phone}</b></p>
            <p><span className="text-main/60">Khu vực:</span> <b>{partner.district}</b></p>
            <p><span className="text-main/60">Gói:</span> <b>{partner.plan}</b></p>
            <p><span className="text-main/60">Ngày tham gia:</span> <b>{new Date(partner.joinedAt).toLocaleDateString('vi-VN')}</b></p>
          </div>
        </article>

        <article className="glass-card bg-white rounded-3xl p-6 space-y-3">
          <h4 className="font-h3 text-h3 text-primary">Chỉ số nhanh</h4>
          <p className="text-sm text-main/70">Đánh giá: <b className="text-primary">{partner.rating ? `${partner.rating}/5` : '—'}</b></p>
          <p className="text-sm text-main/70">Booking/tháng: <b className="text-primary">{partner.monthlyBookings}</b></p>
          <p className="text-sm text-main/70">Ví LumiX: <b className="text-primary">{formatVnd(partner.wallet)}</b></p>
          <p className="text-sm text-main/70">Ngưỡng duy trì: <b className="text-primary">{formatVnd(partner.walletMinBalance)}</b></p>
          <p className="text-sm text-main/70">Link đặt lịch: <b className={partner.linkActive ? 'text-emerald-600' : 'text-amber-700'}>{partner.linkActive ? 'Đang hoạt động' : (partner.walletHealthy ? 'Tạm ngưng' : 'Ví dưới mức duy trì')}</b></p>
          <p className="text-sm text-main/70">Trạng thái hiện tại: <b className="text-primary">{status}</b></p>
          <div className="pt-2 flex gap-2">
            <button type="button" disabled={saving} className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-white font-bold disabled:opacity-60" onClick={activate}>Kích hoạt</button>
            <button type="button" disabled={saving} className="flex-1 px-4 py-2.5 rounded-xl bg-slate-100 text-main/70 font-bold disabled:opacity-60" onClick={suspend}>Tạm ngưng</button>
          </div>
        </article>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mt-6">
        <article className="glass-card bg-white rounded-3xl p-6"><p className="text-sm text-main/60">Tiền cọc đã nhận</p><p className="text-2xl font-bold text-primary mt-1">{formatVnd(kpis.depositReceived)}</p></article>
        <article className="glass-card bg-white rounded-3xl p-6"><p className="text-sm text-main/60">Tổng cọc đã hoàn khách</p><p className="text-2xl font-bold text-rose-600 mt-1">{formatVnd(kpis.depositRefundedToCustomer)}</p></article>
        <article className="glass-card bg-white rounded-3xl p-6"><p className="text-sm text-main/60">Cọc chờ đối soát</p><p className="text-2xl font-bold text-amber-700 mt-1">{formatVnd(kpis.depositPendingReconcile)}</p></article>
        <article className="glass-card bg-white rounded-3xl p-6"><p className="text-sm text-main/60">Tổng tiền dịch vụ</p><p className="text-2xl font-bold text-primary mt-1">{formatVnd(kpis.totalServiceAmount)}</p></article>
        <article className="glass-card bg-white rounded-3xl p-6"><p className="text-sm text-main/60">Khách đã trả tại shop</p><p className="text-2xl font-bold text-primary mt-1">{formatVnd(kpis.customerRemainingAmount)}</p></article>

        <article className="glass-card bg-white rounded-3xl p-6"><p className="text-sm text-main/60">Cọc chờ trả shop</p><p className="text-2xl font-bold text-amber-700 mt-1">{formatVnd(kpis.depositWaitingForShop)}</p></article>
        <article className="glass-card bg-white rounded-3xl p-6"><p className="text-sm text-main/60">Cọc đã trả shop</p><p className="text-2xl font-bold text-emerald-600 mt-1">{formatVnd(kpis.depositPaidToShop)}</p></article>
        <article className="glass-card bg-white rounded-3xl p-6"><p className="text-sm text-main/60">Phí nền tảng đã thu</p><p className="text-2xl font-bold text-primary mt-1">{formatVnd(kpis.platformFeeCollected)}</p></article>
        <article className="glass-card bg-white rounded-3xl p-6"><p className="text-sm text-main/60">Số dư ví</p><p className="text-2xl font-bold text-primary mt-1">{formatVnd(kpis.walletBalance)}</p></article>
        <article className="glass-card bg-white rounded-3xl p-6"><p className="text-sm text-main/60">Booking hoàn thành</p><p className="text-2xl font-bold text-emerald-600 mt-1">{kpis.completedBookings}</p></article>
        <article className="glass-card bg-white rounded-3xl p-6"><p className="text-sm text-main/60">Booking không cọc</p><p className="text-2xl font-bold text-amber-700 mt-1">{kpis.noDepositBookings}</p></article>
        <article className="glass-card bg-white rounded-3xl p-6"><p className="text-sm text-main/60">Booking có cọc</p><p className="text-2xl font-bold text-primary mt-1">{kpis.depositBookings}</p></article>
      </section>

      <section className="glass-card bg-white rounded-3xl p-6 mt-6">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-xl font-bold text-primary">Danh sách booking của shop</h3>
            <p className="text-sm text-main/60">Mã giao dịch, khách hàng, dịch vụ, lịch hẹn và đối soát tiền.</p>
          </div>
          <button type="button" className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-main font-bold hover:bg-slate-100" onClick={handleExportBookings}>Xuất Excel (CSV)</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 mb-4">
          <div>
            <label className="text-xs font-bold text-main/60 uppercase">Tìm kiếm</label>
            <input
              type="text"
              className="mt-1 w-full px-4 py-3 rounded-xl border border-slate-200"
              placeholder="Mã, khách hàng, SĐT, dịch vụ..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-bold text-main/60 uppercase">Trạng thái thanh toán</label>
            <select
              className="mt-1 w-full px-4 py-3 rounded-xl border border-slate-200"
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
            >
              <option value="all">Tất cả</option>
              <option value="not_received">Chưa nhận</option>
              <option value="deposit_received">Đã nhận cọc</option>
              <option value="service_paid">Đã nhận thanh toán dịch vụ</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-main/60 uppercase">Ngày</label>
            <input
              type="date"
              className="mt-1 w-full px-4 py-3 rounded-xl border border-slate-200"
              value={dateFilter === 'all' ? '' : dateFilter}
              onChange={(e) => setDateFilter(e.target.value || 'all')}
            />
          </div>
          <div className="flex items-end">
            <button
              type="button"
              className="w-full px-4 py-3 rounded-xl bg-slate-100 text-main font-bold hover:bg-slate-200 transition-colors"
              onClick={() => {
                setSearch('')
                setPaymentFilter('all')
                setDateFilter('all')
              }}
            >
              Xóa bộ lọc
            </button>
          </div>
        </div>

        <p className="text-sm text-main/60 mb-3">Đang hiển thị {filteredBookingRows.length}/{bookingRows.length} booking (sắp xếp theo thời gian đặt mới nhất).</p>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1280px]">
            <thead className="bg-primary/5 border-b border-primary/10">
              <tr>
                {['Mã booking', 'Khách hàng', 'Dịch vụ', 'Thời gian hẹn', 'Thời gian đặt', 'Tiền cọc', 'Tiền dịch vụ', 'Còn lại', 'Trạng thái thanh toán'].map((h) => (
                  <th key={h} className="p-4 text-left font-label-bold text-label-bold text-primary">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredBookingRows.map((booking) => (
                <tr key={booking._id} className="hover:bg-slate-50">
                  <td className="p-4 font-bold text-primary">
                    <Link className="hover:underline" to={`/admin/bookings/${booking._id}`}>{booking.bookingCode || booking._id}</Link>
                  </td>
                  <td className="p-4">
                    <p className="font-semibold">{booking.customerName || '—'}</p>
                    <p className="text-xs text-main/60">{booking.customerPhone || '—'}</p>
                  </td>
                  <td className="p-4">{booking.serviceName || '—'}</td>
                  <td className="p-4 text-sm">{booking.appointmentLabel}</td>
                  <td className="p-4 text-sm">{booking.createdAtLabel}</td>
                  <td className="p-4">{formatVnd(booking.depositAmount)}</td>
                  <td className="p-4">{formatVnd(booking.totalAmount)}</td>
                  <td className="p-4">{formatVnd(booking.remainingAmount)}</td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${paymentStatusInfo(booking).className}`}>
                      {paymentStatusInfo(booking).label}
                    </span>
                  </td>
                </tr>
              ))}
              {filteredBookingRows.length === 0 ? (
                <tr>
                  <td className="p-6 text-sm text-main/60" colSpan={9}>Chưa có booking.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </AdminLayout>
  )
}
