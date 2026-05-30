import { useEffect, useMemo, useState } from 'react'
import AdminHeaderNav from '../components/admin/AdminHeaderNav'
import AdminLayout from '../components/admin/AdminLayout'
import { useToast } from '../components/ui/ToastProvider'
import { useShop } from '../context/ShopContext'
import { apiRequest } from '../lib/api'

function formatVnd(value) {
  return `${Number(value || 0).toLocaleString('vi-VN')}đ`
}

function formatDateTime(value) {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString('vi-VN')
}

function statusLabel(status) {
  const key = String(status || '').toLowerCase()
  if (key === 'success' || key === 'paid') return { text: 'Đã hoàn tiền', cls: 'bg-emerald-100 text-emerald-700' }
  if (key === 'processing') return { text: 'Đang xử lý', cls: 'bg-primary/10 text-primary' }
  if (key === 'pending_payout') return { text: 'Chờ hoàn tiền', cls: 'bg-amber-100 text-amber-700' }
  if (key === 'pending_customer_info') return { text: 'Chờ khách nhập STK', cls: 'bg-slate-200 text-slate-700' }
  if (key === 'failed') return { text: 'Thất bại', cls: 'bg-rose-100 text-rose-700' }
  return { text: status || 'Không rõ', cls: 'bg-slate-100 text-slate-700' }
}

export default function AdminRefundsPage() {
  const { token } = useShop()
  const { pushToast } = useToast()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [payingId, setPayingId] = useState('')
  const [transactionRefs, setTransactionRefs] = useState({})

  const load = async () => {
    if (!token) return
    setLoading(true)
    try {
      const query = new URLSearchParams()
      if (statusFilter !== 'all') query.set('status', statusFilter)
      const res = await apiRequest(`/api/admin/refunds${query.toString() ? `?${query.toString()}` : ''}`, { token })
      setItems(Array.isArray(res?.items) ? res.items : [])
    } catch (error) {
      pushToast({ type: 'error', title: 'Không tải được refund', message: error?.message || 'Lỗi không xác định' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [token, statusFilter])

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase()
    return items.filter((item) => {
      if (!q) return true
      return [item.bookingCode, item.customerName, item.customerPhone, item.customerEmail, item.shopName, item.bankInfo?.bankName, item.bankInfo?.accountNumber]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    })
  }, [items, search])

  const markPaid = async (item) => {
    if (!token) return
    const transactionRef = String(transactionRefs[item._id] || '').trim()
    if (!transactionRef) {
      pushToast({ type: 'warning', title: 'Thiếu mã giao dịch', message: 'Vui lòng nhập mã giao dịch trước khi xác nhận hoàn tiền.' })
      return
    }
    setPayingId(String(item._id))
    try {
      await apiRequest(`/api/admin/refunds/${item._id}/success`, {
        method: 'PUT',
        token,
        body: { transactionRef }
      })
      pushToast({ type: 'success', title: 'Đã hoàn tiền', message: `Đã cập nhật refund ${item.bookingCode || item._id}.` })
      await load()
    } catch (error) {
      pushToast({ type: 'error', title: 'Cập nhật thất bại', message: error?.message || 'Không thể cập nhật trạng thái refund.' })
    } finally {
      setPayingId('')
    }
  }

  return (
    <AdminLayout>
      <AdminHeaderNav title="Quản lý hoàn tiền" subtitle="Danh sách refund pending/paid, thông tin ngân hàng và thao tác hoàn tiền." />

      <section className="glass-card bg-white rounded-3xl p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-2">
            <label className="text-xs font-bold text-main/60 uppercase">Tìm kiếm</label>
            <input
              className="mt-1 w-full px-4 py-3 rounded-xl border border-slate-200"
              placeholder="Booking, khách, email, ngân hàng..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-bold text-main/60 uppercase">Trạng thái</label>
            <select className="mt-1 w-full px-4 py-3 rounded-xl border border-slate-200" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">Tất cả</option>
              <option value="pending_customer_info">Chờ khách nhập STK</option>
              <option value="pending_payout">Chờ hoàn tiền</option>
              <option value="processing">Đang xử lý</option>
              <option value="success">Đã hoàn tiền</option>
              <option value="failed">Thất bại</option>
            </select>
          </div>
          <div className="flex items-end">
            <button type="button" className="w-full px-4 py-3 rounded-xl bg-slate-100 font-bold hover:bg-slate-200" onClick={() => { setSearch(''); setStatusFilter('all') }}>
              Xóa bộ lọc
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1200px] text-sm">
            <thead>
              <tr className="bg-slate-50 text-left">
                <th className="p-3">Booking</th>
                <th className="p-3">Shop</th>
                <th className="p-3">Khách</th>
                <th className="p-3">Số tiền</th>
                <th className="p-3">Ngân hàng nhận</th>
                <th className="p-3">Trạng thái</th>
                <th className="p-3">Mã GD hoàn tiền</th>
                <th className="p-3">Tác vụ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {rows.map((item) => {
                const status = statusLabel(item.status)
                const bankName = item.bankInfo?.bankName || '—'
                const accountNumber = item.bankInfo?.accountNumber || '—'
                const accountName = item.bankInfo?.accountName || '—'
                const canMarkPaid = !['success', 'paid'].includes(String(item.status || '').toLowerCase()) && accountNumber !== '—'
                return (
                  <tr key={item._id} className="hover:bg-slate-50 align-top">
                    <td className="p-3">
                      <p className="font-bold text-primary">{item.bookingCode || '—'}</p>
                      <p className="text-xs text-main/60">{formatDateTime(item.createdAt)}</p>
                    </td>
                    <td className="p-3">{item.shopName || '—'}</td>
                    <td className="p-3">
                      <p className="font-semibold">{item.customerName || '—'}</p>
                      <p className="text-xs text-main/60">{item.customerPhone || '—'}</p>
                      <p className="text-xs text-main/60">{item.customerEmail || '—'}</p>
                    </td>
                    <td className="p-3 font-bold">{formatVnd(item.amount)}</td>
                    <td className="p-3">
                      <p><b>{bankName}</b></p>
                      <p className="text-xs text-main/70">STK: {accountNumber}</p>
                      <p className="text-xs text-main/70">Chủ TK: {accountName}</p>
                    </td>
                    <td className="p-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${status.cls}`}>{status.text}</span>
                    </td>
                    <td className="p-3">
                      <input
                        className="w-full px-3 py-2 rounded-lg border border-slate-300"
                        placeholder="Nhập mã giao dịch"
                        value={transactionRefs[item._id] || item.payoutTransactionRef || ''}
                        onChange={(e) => setTransactionRefs((prev) => ({ ...prev, [item._id]: e.target.value }))}
                        disabled={!canMarkPaid}
                      />
                    </td>
                    <td className="p-3">
                      <button
                        type="button"
                        disabled={!canMarkPaid || payingId === String(item._id)}
                        className="px-4 py-2 rounded-xl bg-primary text-white font-bold disabled:opacity-60"
                        onClick={() => markPaid(item)}
                      >
                        {payingId === String(item._id) ? 'Đang cập nhật...' : 'Đã hoàn tiền'}
                      </button>
                    </td>
                  </tr>
                )
              })}
              {rows.length === 0 ? (
                <tr>
                  <td className="p-6 text-main/60" colSpan={8}>{loading ? 'Đang tải...' : 'Không có refund phù hợp.'}</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </AdminLayout>
  )
}
