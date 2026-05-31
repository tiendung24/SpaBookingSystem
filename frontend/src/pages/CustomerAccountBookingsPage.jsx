import { useEffect, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { useShop } from '../context/ShopContext'
import { apiRequest } from '../lib/api'
import CustomerHeader from '../components/customer/CustomerHeader'

function fmtVnd(v) {
  return `${Number(v || 0).toLocaleString('vi-VN')}₫`
}

const serviceFallbackImage = 'https://maisonoffice.vn/wp-content/uploads/2024/03/0-thiet-ke-spa.jpg'

function statusText(status) {
  const key = String(status || '')
  if (key === 'pending') return 'Chờ xác nhận'
  if (key === 'confirmed') return 'Đã xác nhận'
  if (key === 'checked_in') return 'Đang phục vụ'
  if (key === 'completed') return 'Hoàn thành'
  if (key === 'cancelled' || key === 'canceled') return 'Đã hủy'
  if (key === 'cancelled_waiting_refund_info') return 'Đã hủy - chờ nhập STK'
  if (key === 'cancelled_refund_pending') return 'Đã hủy - chờ hoàn tiền'
  if (key === 'cancelled_refunded') return 'Đã hủy - Đã hoàn tiền'
  if (key === 'no_show') return 'Không đến'
  return key || '?'
}

export default function CustomerAccountBookingsPage() {
  const { slug } = useParams()
  const { shop, customerBookings, user, token, loadCustomerBookings } = useShop()
  const [searchParams] = useSearchParams()
  const focusCode = String(searchParams.get('bookingCode') || '').trim().toUpperCase()
  const [activeCode, setActiveCode] = useState('')
  const [detailCode, setDetailCode] = useState('')
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [sortBy, setSortBy] = useState('createdAt')
  const [form, setForm] = useState({ bankName: '', accountNumber: '', accountName: '' })
  const [saving, setSaving] = useState(false)
  const [pageBookings, setPageBookings] = useState([])
  const [loadingBookings, setLoadingBookings] = useState(false)

  useEffect(() => {
    if (!token) {
      setPageBookings([])
      return
    }

    let alive = true
    setLoadingBookings(true)
    apiRequest('/api/customer/bookings', { token })
      .then((res) => {
        const items = Array.isArray(res?.items) ? res.items : []
        if (!alive) return
        setPageBookings(items)
        console.log('[customer-ui] bookings fetched', { items: items.length })
      })
      .catch((err) => {
        console.warn('[customer-ui] bookings fetch failed', err)
        if (!alive) return
        setPageBookings([])
      })
      .finally(() => {
        if (!alive) return
        setLoadingBookings(false)
      })

    return () => { alive = false }
  }, [token])

  const items = useMemo(() => {
    const source = Array.isArray(pageBookings) && pageBookings.length ? pageBookings : (Array.isArray(customerBookings) ? customerBookings : [])
    const raw = source.slice()
    const filtered = raw.filter((it) => {
      if (searchText && searchText.trim()) {
        const q = searchText.trim().toLowerCase()
        const code = String(it.bookingCode || '').toLowerCase()
        const svc = String(it.serviceName || '').toLowerCase()
        const shop = String(it.shopName || '').toLowerCase()
        if (!(code.includes(q) || svc.includes(q) || shop.includes(q))) return false
      }
      if (statusFilter && statusFilter !== 'all') {
        if (String(it.status || '') !== String(statusFilter)) return false
      }
      return true
    })

    const sorted = filtered.sort((a, b) => {
      if (sortBy === 'createdAt') {
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      }
      // default: sort by startTime
      return new Date(b.startTime || 0).getTime() - new Date(a.startTime || 0).getTime()
    })

    return sorted
  }, [pageBookings, customerBookings, searchText, statusFilter, sortBy])

  const openDetail = (code) => {
    setDetailCode(code)
  }

  const getServiceDescription = (item) => item.serviceDetailedDescription || item.serviceDescription || item.serviceShortDescription || 'Shop chưa cập nhật mô tả chi tiết cho dịch vụ này.'

  const getStaffDescription = (item) => item.staffBio || item.staffShortBio || 'Shop chưa cập nhật giới thiệu chi tiết cho nhân sự này.'

  const cancelBooking = async (item) => {
    const code = String(item?.bookingCode || '')
    if (!code) return

    const start = item?.startTime ? new Date(item.startTime) : null
    const hoursLeft = start ? ((start.getTime() - Date.now()) / (60 * 60 * 1000)) : 0
    const isValid = hoursLeft >= 4

        const ok = window.confirm(
          isValid
      ? `Bạn xác nhận hủy lịch ${code}?
    Bạn sẽ nhận lại cọc sau khi nhập STK.`
      : `Bạn xác nhận hủy muộn ${code}?
    Bạn sẽ mất cọc, LumiX thu 10.000₫, phần còn lại chuyển cho shop.`
        )
    if (!ok) return

    try {
      const reason = window.prompt('Lý do hủy lịch (tùy chọn):','') || ''
      await apiRequest(`/api/customer/bookings/${encodeURIComponent(code)}/cancel`, { method: 'POST', token, body: { reason } })
      await loadCustomerBookings()
      alert('Hủy lịch thành công')
    } catch (err) {
      alert(err?.message || 'Không thể hủy lịch')
    }
  }

  const submitRefund = async (bookingCode) => {
    if (!form.bankName.trim() || !form.accountNumber.trim() || !form.accountName.trim()) {
      alert('Vui lòng nhập đủ thông tin ngân hàng')
      return
    }
    setSaving(true)
    try {
      await apiRequest(`/api/customer/refunds/${encodeURIComponent(bookingCode)}/bank-info`, {
        method: 'POST',
        token,
        body: { ...form }
      })
      setActiveCode('')
      setForm({ bankName: '', accountNumber: '', accountName: '' })
      await loadCustomerBookings()
      alert('Gửi thông tin nhận hoàn cọc thành công')
    } catch (err) {
      alert(err?.message || 'Không gửi được thông tin hoàn cọc')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-main">
      <CustomerHeader
        shopName={shop.name || 'LumiX'}
        shopSlug={slug || shop.slug}
        activeTab="bookings"
        address={shop.address || ''}
      />
<div className="max-w-[1440px] mx-auto space-y-6 p-4 md:p-8 lg:p-10">

        <section className="bg-white rounded-2xl border border-slate-200 p-5 overflow-x-auto">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <input
              className="p-3 rounded-xl border min-w-[220px]"
              placeholder="Tìm kiếm mã, dịch vụ hoặc cửa hàng"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />

            <select className="p-3 rounded-xl border" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">Tất cả trạng thái</option>
              <option value="all">Tất cả</option>
              <option value="pending">Chờ xác nhận</option>
              <option value="confirmed">Đã xác nhận</option>
              <option value="checked_in">Đang phục vụ</option>
              <option value="completed">Hoàn thành</option>
              <option value="cancelled">Đã hủy</option>
            </select>

            <select className="p-3 rounded-xl border" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="createdAt">Sắp xếp: Thời gian đặt (mới nhất)</option>
              <option value="startTime">Sắp xếp: Thời gian hẹn (mới nhất)</option>
            </select>

            <button className="px-4 py-2 rounded-xl border" onClick={() => { setSearchText(''); setStatusFilter(''); setSortBy('createdAt') }}>Xóa bộ lọc</button>
          </div>
          <table className="w-full min-w-[1280px] text-sm">
            <thead>
                <tr className="bg-slate-50 text-left">
                <th className="p-3">Mã booking</th>
                <th className="p-3">Thời gian đặt</th>
                <th className="p-3">Cửa hàng</th>
                <th className="p-3">Dịch vụ</th>
                <th className="p-3">Thời gian hẹn</th>
                <th className="p-3">Tiền cọc</th>
                <th className="p-3">Tổng tiền</th>
                <th className="p-3">Còn lại</th>
                <th className="p-3">Trạng thái</th>
                <th className="p-3">Thanh toán</th>
                <th className="p-3">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loadingBookings ? (
                <tr><td colSpan={11} className="p-6 text-main/60">Đang tải lịch hẹn...</td></tr>
              ) : null}
              {items.map((item) => {
                const code = String(item.bookingCode || '')
                const highlight = focusCode && code === focusCode
                const remain = Math.max(0, Number(item.totalAmount || 0) - Number(item.depositAmount || 0))
                const canInputRefund = item.status === 'cancelled_waiting_refund_info'

                return (
                  <tr key={item._id} className={highlight ? 'bg-amber-50' : ''}>
                    <td className="p-3 font-bold text-primary">{code || item._id}</td>
                    <td className="p-3">{item.createdAt ? new Date(item.createdAt).toLocaleString('vi-VN') : '?'}</td>
                    <td className="p-3">{item.shopName || '?'}</td>
                    <td className="p-3">{item.serviceName || '?'}</td>
                    <td className="p-3">{item.startTime ? new Date(item.startTime).toLocaleString('vi-VN') : '?'}</td>
                    <td className="p-3">{fmtVnd(item.depositAmount || 0)}</td>
                    <td className="p-3">{fmtVnd(item.totalAmount || 0)}</td>
                    <td className="p-3">{fmtVnd(remain)}</td>
                    <td className="p-3">{statusText(item.status)}</td>
                    <td className="p-3">{item.paymentStatusInfo?.text || '?'}</td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <button className="px-3 py-1.5 rounded-lg border" onClick={() => openDetail(code)}>Xem chi tiết</button>
                        {['pending', 'confirmed'].includes(String(item.status || '')) ? (
                          <button className="px-3 py-1.5 rounded-lg bg-rose-600 text-white" onClick={() => cancelBooking(item)}>Hủy lịch</button>
                        ) : null}
                        {canInputRefund ? (
                          <button className="px-3 py-1.5 rounded-lg bg-primary text-white" onClick={() => setActiveCode(code)}>Nhập STK nhận hoàn</button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                )
              })}
              {items.length === 0 ? (
                <tr><td colSpan={11} className="p-6 text-main/60">Chưa có lịch hẹn nào.</td></tr>
              ) : null}
            </tbody>
          </table>
        </section>

        {detailCode ? (() => {
          const current = items.find((x) => String(x.bookingCode || '') === String(detailCode))
          if (!current) return null
          return (
            <section className="bg-white rounded-2xl border border-slate-200 p-5 space-y-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-primary">Chi tiết lịch hẹn {current.bookingCode}</h3>
                  <p className="text-sm text-main/60">Xem lại thông tin dịch vụ đã đặt</p>
                </div>
                <button className="px-3 py-1.5 rounded-lg border" onClick={() => setDetailCode('')}>Đóng</button>
              </div>

              <div className="grid md:grid-cols-[180px_1fr] gap-4 items-start">
                <img
                  src={current.serviceImageUrl || serviceFallbackImage}
                  alt={current.serviceName || 'Dịch vụ'}
                  className="w-full h-44 md:h-40 rounded-2xl object-cover border border-slate-200"
                />
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-bold text-secondary uppercase tracking-widest">Dịch vụ</p>
                    <h4 className="text-2xl font-black text-main mt-1">{current.serviceName || '?'}</h4>
                  </div>
                  <p className="text-main/70 leading-relaxed whitespace-pre-line break-words">{getServiceDescription(current)}</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-primary/5 p-4">
                      <p className="text-xs text-main/50">Giá dịch vụ</p>
                      <p className="font-black text-primary">{fmtVnd(current.servicePrice || current.totalAmount || 0)}</p>
                    </div>
                    <div className="rounded-2xl bg-primary/5 p-4">
                      <p className="text-xs text-main/50">Thời gian làm</p>
                      <p className="font-black text-primary">{current.serviceDurationMinutes ? `${current.serviceDurationMinutes} phút` : '?'}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-3">
                <div className="rounded-2xl border border-slate-200 p-4 space-y-2">
                  <p className="text-sm font-bold text-main/70">Nhân viên</p>
                  <p className="font-black text-main">{current.staffName || '?'}</p>
                  <p className="text-sm text-main/70 whitespace-pre-line break-words">{getStaffDescription(current)}</p>
                  {current.staffSpecialties?.length ? (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {current.staffSpecialties.map((item) => (
                        <span key={item} className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold">{item}</span>
                      ))}
                    </div>
                  ) : null}
                </div>
                <div className="rounded-2xl border border-slate-200 p-4 space-y-2">
                  <p className="text-sm font-bold text-main/70">Thông tin lịch hẹn</p>
                  <p><strong>Cửa hàng:</strong> {current.shopName || '?'}</p>
                  <p><strong>Thời gian đặt:</strong> {current.createdAt ? new Date(current.createdAt).toLocaleString('vi-VN') : '?'}</p>
                  <p><strong>Thời gian hẹn:</strong> {current.startTime ? new Date(current.startTime).toLocaleString('vi-VN') : '?'}</p>
                  <p><strong>Tiền cọc:</strong> {fmtVnd(current.depositAmount || 0)}</p>
                  <p><strong>Tổng tiền:</strong> {fmtVnd(current.totalAmount || 0)}</p>
                  <p><strong>Còn lại tại shop:</strong> {fmtVnd(Math.max(0, Number(current.totalAmount || 0) - Number(current.depositAmount || 0)))}</p>
                  <p><strong>Trạng thái:</strong> {statusText(current.status)}</p>
                  <p><strong>Trạng thái thanh toán:</strong> {current.paymentStatusInfo?.text || '?'}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 p-4">
                <p className="text-sm font-bold text-main/70 mb-2">Ghi chú</p>
                <p className="text-main/70 whitespace-pre-line break-words">{current.note || 'Không có ghi chú.'}</p>
              </div>
            </section>
          )
        })() : null}

        {activeCode ? (
          <section className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
            <h3 className="text-lg font-bold text-primary">Nhập thông tin nhận hoàn cọc cho {activeCode}</h3>
            <div className="grid md:grid-cols-3 gap-3">
              <input className="p-3 rounded-xl border" placeholder="Tên ngân hàng" value={form.bankName} onChange={(e) => setForm((p) => ({ ...p, bankName: e.target.value }))} />
              <input className="p-3 rounded-xl border" placeholder="Số tài khoản" value={form.accountNumber} onChange={(e) => setForm((p) => ({ ...p, accountNumber: e.target.value }))} />
              <input className="p-3 rounded-xl border" placeholder="Tên chủ tài khoản" value={form.accountName} onChange={(e) => setForm((p) => ({ ...p, accountName: e.target.value }))} />
            </div>
            <div className="flex gap-2">
              <button disabled={saving} onClick={() => submitRefund(activeCode)} className="px-4 py-2 rounded-xl bg-primary text-white disabled:opacity-60">{saving ? 'Đang gửi...' : 'Gửi thông tin'}</button>
              <button disabled={saving} onClick={() => setActiveCode('')} className="px-4 py-2 rounded-xl border">Hủy</button>
            </div>
          </section>
        ) : null}
      </div>
    </div>
  )
}




