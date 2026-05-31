import { useEffect, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { useShop } from '../context/ShopContext'
import { apiRequest } from '../lib/api'
import CustomerHeader from '../components/customer/CustomerHeader'

function fmtVnd(v) {
  return `${Number(v || 0).toLocaleString('vi-VN')}₫`
}

const serviceFallbackImage = 'https://maisonoffice.vn/wp-content/uploads/2024/03/0-thiet-ke-spa.jpg'

function statusBadgeClass(status) {
  const key = String(status || '')
  if (key === 'pending') return 'bg-amber-100 text-amber-700'
  if (key === 'confirmed') return 'bg-primary/10 text-primary'
  if (key === 'checked_in') return 'bg-sky-100 text-sky-700'
  if (key === 'completed') return 'bg-emerald-100 text-emerald-700'
  if (key === 'no_show') return 'bg-rose-100 text-rose-700'
  if (key === 'cancelled' || key === 'canceled' || key.startsWith('cancelled_')) return 'bg-slate-100 text-slate-700'
  return 'bg-slate-100 text-slate-700'
}

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
  const scopedShopSlug = String(searchParams.get('shopSlug') || slug || shop?.slug || '').trim().toLowerCase()
  const [activeCode, setActiveCode] = useState('')
  const [detailCode, setDetailCode] = useState('')
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [sortBy, setSortBy] = useState('createdAt')
  const [form, setForm] = useState({ bankName: '', accountNumber: '', accountName: '' })
  const [saving, setSaving] = useState(false)
  const [pageBookings, setPageBookings] = useState([])
  const [loadingBookings, setLoadingBookings] = useState(false)
  const [toast, setToast] = useState(null)
  const [cancelDialog, setCancelDialog] = useState({ open: false, item: null, reason: '', submitting: false })

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


  useEffect(() => {
    if (!toast) return undefined
    const t = setTimeout(() => setToast(null), 2600)
    return () => clearTimeout(t)
  }, [toast])

  const pushToast = (type, message) => {
    setToast({ type, message })
  }

  const openCancelDialog = (item) => {
    setCancelDialog({ open: true, item, reason: '', submitting: false })
  }

  const closeCancelDialog = () => {
    setCancelDialog({ open: false, item: null, reason: '', submitting: false })
  }

  const submitCancelDialog = async () => {
    const item = cancelDialog.item
    const code = String(item?.bookingCode || '')
    if (!code) return closeCancelDialog()
    setCancelDialog((prev) => ({ ...prev, submitting: true }))
    try {
      await apiRequest(`/api/customer/bookings/${encodeURIComponent(code)}/cancel`, {
        method: 'POST',
        token,
        body: { reason: cancelDialog.reason || '' }
      })
      const refreshed = await apiRequest('/api/customer/bookings', { token })
      setPageBookings(Array.isArray(refreshed?.items) ? refreshed.items : [])
      closeCancelDialog()
      pushToast('success', `Đã hủy lịch ${code} thành công.`)
    } catch (err) {
      setCancelDialog((prev) => ({ ...prev, submitting: false }))
      pushToast('error', err?.message || 'Không thể hủy lịch.')
    }
  }

  const items = useMemo(() => {
    const source = Array.isArray(pageBookings) && pageBookings.length ? pageBookings : (Array.isArray(customerBookings) ? customerBookings : [])
    const currentShopSlug = scopedShopSlug
    const raw = source.filter((it) => {
      if (!currentShopSlug) return true
      const itemShopSlug = String(it.shopSlug || '').trim().toLowerCase()
      return !itemShopSlug || itemShopSlug === currentShopSlug
    })
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
  }, [pageBookings, customerBookings, scopedShopSlug, searchText, statusFilter, sortBy])

  const openDetail = (code) => {
    setDetailCode(code)
  }

  const getServiceDescription = (item) => item.serviceDetailedDescription || item.serviceDescription || item.serviceShortDescription || 'Shop chưa cập nhật mô tả chi tiết cho dịch vụ này.'

  const getStaffDescription = (item) => item.staffBio || item.staffShortBio || 'Shop chưa cập nhật giới thiệu chi tiết cho nhân sự này.'

  const cancelBooking = async (item) => {
    if (!item?.bookingCode) return
    openCancelDialog(item)
  }

  const submitRefund = async (bookingCode) => {
    if (!form.bankName.trim() || !form.accountNumber.trim() || !form.accountName.trim()) {
      pushToast('error', 'Vui lòng nhập đủ thông tin ngân hàng.')
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
      pushToast('success', 'Đã gửi thông tin nhận hoàn cọc thành công.')
    } catch (err) {
      pushToast('error', err?.message || 'Không gửi được thông tin hoàn cọc.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-main">
      <CustomerHeader
        shopName={shop.name || 'LumiX'}
        shopSlug={scopedShopSlug || shop.slug}
        activeTab="bookings"
        address={shop.address || ''}
      />
<div className="w-full max-w-[1840px] mx-auto space-y-6 px-3 md:px-6 lg:px-8 py-4 md:py-6 lg:py-8">

        <section className="glass-card rounded-2xl overflow-hidden bg-white/70">
          <div className="p-5 md:p-6 border-b border-primary/10 bg-primary/5">
            <div className="flex flex-col lg:flex-row lg:items-end gap-4 lg:gap-6">
              <div className="flex-1">
                <h2 className="font-h2 text-h2 text-primary">Lịch hẹn của tôi</h2>
                <p className="text-sm text-main/60 mt-1">Theo dõi lịch hẹn, trạng thái và thông tin thanh toán.</p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative">
                  <input
                    className="w-full sm:w-[320px] pl-10 pr-3 py-3 rounded-2xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
                    placeholder="Tìm mã, dịch vụ hoặc cửa hàng"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                  />
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-main/40">search</span>
                </div>

                <select className="py-3 px-4 rounded-2xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary/30" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="">Tất cả trạng thái</option>
                  <option value="all">Tất cả</option>
                  <option value="pending">Chờ xác nhận</option>
                  <option value="confirmed">Đã xác nhận</option>
                  <option value="checked_in">Đang phục vụ</option>
                  <option value="completed">Hoàn thành</option>
                  <option value="cancelled">Đã hủy</option>
                </select>

                <select className="py-3 px-4 rounded-2xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary/30" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                  <option value="createdAt">Sắp xếp: Thời gian đặt (mới nhất)</option>
                  <option value="startTime">Sắp xếp: Thời gian hẹn (mới nhất)</option>
                </select>

                <button
                  className="py-3 px-4 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors font-semibold"
                  onClick={() => { setSearchText(''); setStatusFilter(''); setSortBy('createdAt') }}
                >
                  Xóa bộ lọc
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1520px]">
              <thead className="bg-primary/5 border-b border-primary/10">
                <tr className="text-left">
                  <th className="p-4 text-left font-label-bold text-label-bold text-primary">Mã booking</th>
                  <th className="p-4 text-left font-label-bold text-label-bold text-primary">Thời gian đặt</th>
                  <th className="p-4 text-left font-label-bold text-label-bold text-primary">Cửa hàng</th>
                  <th className="p-4 text-left font-label-bold text-label-bold text-primary">Dịch vụ</th>
                  <th className="p-4 text-left font-label-bold text-label-bold text-primary">Thời gian hẹn</th>
                  <th className="p-4 text-left font-label-bold text-label-bold text-primary">Tiền cọc</th>
                  <th className="p-4 text-left font-label-bold text-label-bold text-primary">Tổng tiền</th>
                  <th className="p-4 text-left font-label-bold text-label-bold text-primary">Còn lại</th>
                  <th className="p-4 text-left font-label-bold text-label-bold text-primary">Trạng thái</th>
                  <th className="p-4 text-left font-label-bold text-label-bold text-primary">Thanh toán</th>
                  <th className="p-4 text-left font-label-bold text-label-bold text-primary">Hành động</th>
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
                    <tr
                      key={item._id}
                      className={highlight
                        ? 'bg-amber-50'
                        : 'hover:bg-white/60 transition-colors'}
                    >
                      <td className="p-4 font-bold text-primary">{code ? `#${code}` : item._id}</td>
                      <td className="p-4">{item.createdAt ? new Date(item.createdAt).toLocaleString('vi-VN') : '—'}</td>
                      <td className="p-4"><p className="font-semibold text-main">{item.shopName || '—'}</p></td>
                      <td className="p-4 text-main/80">{item.serviceName || '—'}</td>
                      <td className="p-4 text-sm text-main/70">{item.startTime ? new Date(item.startTime).toLocaleString('vi-VN') : '—'}</td>
                      <td className="p-4 font-semibold text-primary">{fmtVnd(item.depositAmount || 0)}</td>
                      <td className="p-4 font-semibold text-main">{fmtVnd(item.totalAmount || 0)}</td>
                      <td className="p-4 font-semibold text-emerald-700">{fmtVnd(remain)}</td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusBadgeClass(item.status)}`}>{statusText(item.status)}</span>
                      </td>
                      <td className="p-4">
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary">{item.paymentStatusInfo?.label || '—'}</span>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-2">
                          <button className="px-3 py-1.5 rounded-lg border border-primary text-primary hover:bg-primary/10 text-sm font-semibold" onClick={() => openDetail(code)}>Xem</button>
                          {['pending', 'confirmed'].includes(String(item.status || '')) ? (
                            <button className="px-3 py-1.5 rounded-lg bg-rose-600 text-white hover:brightness-110 text-sm font-semibold" onClick={() => cancelBooking(item)}>Hủy</button>
                          ) : null}
                          {canInputRefund ? (
                            <button className="px-3 py-1.5 rounded-lg bg-primary text-white hover:brightness-110 text-sm font-semibold" onClick={() => setActiveCode(code)}>Nhập STK</button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  )
                })}

                {!loadingBookings && items.length === 0 ? (
                  <tr><td colSpan={11} className="p-8 text-main/60">Chưa có lịch hẹn nào.</td></tr>
                ) : null}
              </tbody>
            </table>
          </div>
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
                  <p><strong>Trạng thái thanh toán:</strong> {current.paymentStatusInfo?.label || '?'}</p>
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

        {toast ? (
          <div className="fixed top-24 right-4 z-[90] max-w-sm">
            <div className={`rounded-2xl shadow-xl border px-4 py-3 text-sm font-semibold ${toast.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
              {toast.message}
            </div>
          </div>
        ) : null}

        {cancelDialog.open && cancelDialog.item ? (() => {
          const item = cancelDialog.item
          const start = item?.startTime ? new Date(item.startTime) : null
          const hoursLeft = start ? ((start.getTime() - Date.now()) / (60 * 60 * 1000)) : 0
          const isValid = hoursLeft >= 4
          return (
            <div className="fixed inset-0 z-[95] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={closeCancelDialog}>
              <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl border border-slate-200 p-6" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-black text-main">Xác nhận hủy lịch {item.bookingCode}</h3>
                    <p className="text-sm text-main/60 mt-1">
                      {isValid
                        ? 'Bạn sẽ nhận lại cọc sau khi nhập thông tin hoàn tiền.'
                        : 'Bạn đang hủy muộn. Tiền cọc sẽ được xử lý theo chính sách của LumiX.'}
                    </p>
                  </div>
                  <button type="button" onClick={closeCancelDialog} className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200">✕</button>
                </div>

                <div className="mt-5 space-y-3">
                  <label className="block text-sm font-semibold text-main">Lý do hủy lịch</label>
                  <textarea
                    value={cancelDialog.reason}
                    onChange={(e) => setCancelDialog((prev) => ({ ...prev, reason: e.target.value }))}
                    placeholder="Nhập lý do hủy lịch (không bắt buộc)"
                    className="w-full min-h-[120px] rounded-2xl border border-slate-200 p-4 focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>

                <div className="mt-6 flex flex-col sm:flex-row gap-3 sm:justify-end">
                  <button type="button" onClick={closeCancelDialog} className="px-4 py-3 rounded-2xl border border-slate-200 bg-white font-semibold hover:bg-slate-50">Đóng</button>
                  <button type="button" disabled={cancelDialog.submitting} onClick={submitCancelDialog} className="px-4 py-3 rounded-2xl bg-rose-600 text-white font-semibold hover:brightness-110 disabled:opacity-60">
                    {cancelDialog.submitting ? 'Đang xử lý...' : 'Xác nhận hủy lịch'}
                  </button>
                </div>
              </div>
            </div>
          )
        })() : null}
      </div>
    </div>
  )
}






