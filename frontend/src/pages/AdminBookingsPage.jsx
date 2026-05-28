import { useEffect, useMemo, useRef, useState } from 'react'
import AdminHeaderNav from '../components/admin/AdminHeaderNav'
import AdminLayout from '../components/admin/AdminLayout'
import { useToast } from '../components/ui/ToastProvider'
import { useShop } from '../context/ShopContext'
import { apiRequest } from '../lib/api'

function formatVnd(value) {
  return `${Number(value || 0).toLocaleString('vi-VN')}đ`
}

function formatDateTime(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString('vi-VN')
}

function statusLabel(status) {
  if (status === 'pending') return 'Chờ xác nhận'
  if (status === 'confirmed') return 'Đã xác nhận'
  if (status === 'checked_in') return 'Đang phục vụ'
  if (status === 'checked_out' || status === 'completed') return 'Hoàn thành'
  if (status === 'canceled') return 'Đã hủy'
  if (status === 'no_show') return 'Không đến'
  return status || '—'
}

function statusClass(status) {
  if (status === 'pending') return 'bg-amber-100 text-amber-700'
  if (status === 'confirmed') return 'bg-primary/10 text-primary'
  if (status === 'checked_in') return 'bg-cyan-100 text-cyan-700'
  if (status === 'checked_out' || status === 'completed') return 'bg-emerald-100 text-emerald-700'
  return 'bg-rose-100 text-rose-700'
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

export default function AdminBookingsPage() {
  const { token } = useShop()
  const { pushToast } = useToast()
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  const socketRef = useRef(null)
  const reconnectRef = useRef(null)

  const getWsUrl = (accessToken) => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || ''
    const source = baseUrl || window.location.origin
    try {
      const url = new URL(source)
      url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
      url.pathname = '/ws'
      url.search = `token=${encodeURIComponent(accessToken || '')}`
      return url.toString()
    } catch {
      const normalized = source.replace(/^http(s?):\/\//i, (_, isHttps) => (isHttps ? 'wss://' : 'ws://'))
      return `${normalized.replace(/\/$/, '')}/ws?token=${encodeURIComponent(accessToken || '')}`
    }
  }

  const fetchBookings = async () => {
    if (!token) return
    setLoading(true)
    try {
      const res = await apiRequest('/api/admin/bookings', { token })
      const list = Array.isArray(res?.items) ? res.items : []
      setItems(list)
    } catch (error) {
      pushToast({ type: 'error', title: 'Không tải được lịch hẹn', message: error?.message || 'Lỗi không xác định' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchBookings()
  }, [token])

  useEffect(() => {
    if (!token) return
    if (typeof window === 'undefined' || typeof WebSocket === 'undefined') return

    const connect = () => {
      const wsUrl = getWsUrl(token)
      if (!wsUrl) return

      try {
        if (socketRef.current) {
          socketRef.current.__disposed = true
          if (socketRef.current.readyState === WebSocket.OPEN) {
            socketRef.current.close()
          }
          socketRef.current = null
        }
        if (reconnectRef.current) {
          clearTimeout(reconnectRef.current)
          reconnectRef.current = null
        }

          const socket = new WebSocket(wsUrl)
          socketRef.current = socket
          socket.__disposed = false

        socket.onmessage = (event) => {
          let data = null
          try {
            data = JSON.parse(event.data)
          } catch {
            data = null
          }

          if (data?.type === 'booking.updated') {
            void fetchBookings()
          }
        }

        socket.onclose = () => {
          if (socket.__disposed) return
          if (socketRef.current === socket) {
            socketRef.current = null
          }
          reconnectRef.current = setTimeout(() => {
            connect()
          }, 3000)
        }

        socket.onerror = () => {
          try {
            socket.close()
          } catch {
            // ignore
          }
        }
      } catch (error) {
        console.error('[AdminBookingsPage] websocket error', error)
      }
    }

    connect()

    return () => {
      if (reconnectRef.current) {
        clearTimeout(reconnectRef.current)
        reconnectRef.current = null
      }
      if (socketRef.current) {
        try {
          socketRef.current.__disposed = true
          if (socketRef.current.readyState === WebSocket.OPEN) {
            socketRef.current.close()
          }
        } catch {
          // ignore
        }
        socketRef.current = null
      }
    }
  }, [token])

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase()
    return items.filter((item) => {
      const status = String(item.status || '').toLowerCase()
      const matchesStatus = statusFilter === 'all' || status === statusFilter
      const matchesQuery = !query || [item.bookingCode, item.customerName, item.customerPhone, item.shopId]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(query))

      let matchesDate = true
      if (dateFilter !== 'all') {
        const bookingDate = new Date(item.time)
        const filterDate = new Date(dateFilter)
        matchesDate = !Number.isNaN(bookingDate.getTime()) && !Number.isNaN(filterDate.getTime()) &&
          bookingDate.getFullYear() === filterDate.getFullYear() &&
          bookingDate.getMonth() === filterDate.getMonth() &&
          bookingDate.getDate() === filterDate.getDate()
      }

      return matchesStatus && matchesQuery && matchesDate
    })
  }, [items, search, statusFilter, dateFilter])

  const pendingCount = useMemo(() => items.filter((item) => String(item.status || '').toLowerCase() === 'pending').length, [items])

  return (
    <AdminLayout>
      <header>
        <h2 className="font-h2 text-h2 text-primary">Quản lý booking</h2>
        <p className="text-main/70">Thanh toán thành công sẽ tự động cập nhật trạng thái booking. Trang này chỉ để theo dõi realtime.</p>
        <AdminHeaderNav />
      </header>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <article className="glass-card bg-white rounded-3xl p-6">
          <p className="text-sm text-main/60">Tổng booking</p>
          <p className="text-3xl font-bold text-primary mt-1">{items.length}</p>
        </article>
        <article className="glass-card bg-white rounded-3xl p-6">
          <p className="text-sm text-main/60">Chờ xử lý</p>
          <p className="text-3xl font-bold text-amber-700 mt-1">{pendingCount}</p>
        </article>
        <article className="glass-card bg-white rounded-3xl p-6">
          <p className="text-sm text-main/60">Đã xác nhận</p>
          <p className="text-3xl font-bold text-emerald-600 mt-1">{items.filter((item) => item.status === 'confirmed').length}</p>
        </article>
      </section>

      <section className="glass-card bg-white rounded-3xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-5">
          <div>
            <label className="text-xs font-bold text-main/60 uppercase">Tìm kiếm</label>
            <input
              className="mt-1 w-full px-4 py-3 rounded-xl border border-slate-200"
              placeholder="Mã, tên khách, số điện thoại, shop"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-bold text-main/60 uppercase">Trạng thái</label>
            <select
              className="mt-1 w-full px-4 py-3 rounded-xl border border-slate-200"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Tất cả</option>
              <option value="pending">Chờ xác nhận</option>
              <option value="confirmed">Đã xác nhận</option>
              <option value="checked_in">Đang phục vụ</option>
              <option value="completed">Hoàn thành</option>
              <option value="canceled">Đã hủy</option>
              <option value="no_show">Không đến</option>
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
                setStatusFilter('all')
                setDateFilter('all')
              }}
            >
              Xóa bộ lọc
            </button>
          </div>
        </div>

        {loading ? <p className="text-sm text-main/60 mb-4">Đang tải booking...</p> : null}
        <p className="text-sm text-main/60 mb-4">
          Đang hiển thị {filteredItems.length}/{items.length} booking
        </p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1280px]">
            <thead>
              <tr className="bg-slate-50 text-left">
                <th className="px-4 py-3 text-xs uppercase text-main/60">Mã</th>
                <th className="px-4 py-3 text-xs uppercase text-main/60">Khách hàng</th>
                <th className="px-4 py-3 text-xs uppercase text-main/60">Shop</th>
                <th className="px-4 py-3 text-xs uppercase text-main/60">Thời gian hẹn</th>
                <th className="px-4 py-3 text-xs uppercase text-main/60">Thời gian đặt</th>
                <th className="px-4 py-3 text-xs uppercase text-main/60">Cọc</th>
                <th className="px-4 py-3 text-xs uppercase text-main/60">Tổng tiền</th>
                <th className="px-4 py-3 text-xs uppercase text-main/60">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredItems.map((booking) => {
                const currentStatus = String(booking.status || '').toLowerCase()
                return (
                  <tr key={booking._id} className="hover:bg-slate-50 align-top">
                    <td className="px-4 py-4 font-semibold text-primary">{booking.bookingCode || booking._id}</td>
                    <td className="px-4 py-4 text-sm">
                      <div className="font-semibold text-main">{booking.customerName || '—'}</div>
                      <div className="text-main/60">{booking.customerPhone || '—'}</div>
                    </td>
                    <td className="px-4 py-4 text-sm text-main/70">{booking.shopId || '—'}</td>
                    <td className="px-4 py-4 text-sm text-main/70">{formatAppointment(booking.startTime || booking.time, booking.endTime)}</td>
                    <td className="px-4 py-4 text-sm text-main/70">{formatCreatedAt(booking.createdAt)}</td>
                    <td className="px-4 py-4 text-sm font-semibold text-primary">{formatVnd(booking.depositAmount || 0)}</td>
                    <td className="px-4 py-4 text-sm font-semibold text-main">{formatVnd(booking.totalAmount || 0)}</td>
                    <td className="px-4 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusClass(currentStatus)}`}>
                        {statusLabel(currentStatus)}
                      </span>
                    </td>
                  </tr>
                )
              })}
              {!loading && filteredItems.length === 0 ? (
                <tr>
                  <td className="px-4 py-8 text-center text-main/60" colSpan={7}>
                    Không có booking nào phù hợp với bộ lọc hiện tại.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </AdminLayout>
  )
}
