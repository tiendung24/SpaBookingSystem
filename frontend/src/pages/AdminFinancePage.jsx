import { useEffect, useMemo, useState } from 'react'
import AdminHeaderNav from '../components/admin/AdminHeaderNav'
import AdminLayout from '../components/admin/AdminLayout'
import { useToast } from '../components/ui/ToastProvider'
import { useShop } from '../context/ShopContext'
import { apiRequest } from '../lib/api'

function formatVnd(value) {
  return `${Number(value || 0).toLocaleString('vi-VN')}đ`
}

function typeLabel(type) {
  if (type === 'wallet') return 'Ví shop'
  if (type === 'platform_fee') return 'Phí nền tảng'
  if (type === 'payos_payment') return 'Thanh toán PayOS'
  if (type === 'deposit') return 'Tiền cọc'
  return 'Giao dịch khác'
}

function mapTransaction(txn) {
  const rawStatus = String(txn?.status || 'success').toLowerCase()
  const isReceived = ['success', 'paid', 'completed', 'holding', 'released', 'captured', 'settled'].includes(rawStatus)
  return {
    id: txn?._id || txn?.id || '',
    time: txn?.createdAt || txn?.time || new Date().toISOString(),
    shopName: txn?.shopName || txn?.shopId || 'Chưa rõ shop',
    type: txn?.transactionType || txn?.type || 'other',
    amount: Number(txn?.amount || 0),
    status: isReceived ? 'success' : rawStatus
  }
}

function getMonthRange() {
  const now = new Date()
  const from = new Date(now.getFullYear(), now.getMonth(), 1)
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10)
  }
}

export default function AdminFinancePage() {
  const { token } = useShop()
  const { pushToast } = useToast()
  const [dateRange, setDateRange] = useState(() => getMonthRange())
  const [finance, setFinance] = useState({})
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(false)

  const fetchData = async (mountedRef = { current: true }) => {
    if (!token) return
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (dateRange.from) params.set('from', dateRange.from)
      if (dateRange.to) params.set('to', dateRange.to)

      const [overviewRes, txRes] = await Promise.all([
        apiRequest(params.toString() ? `/api/admin/dashboard/overview?${params.toString()}` : '/api/admin/dashboard/overview', { token }),
        apiRequest('/api/admin/transactions', { token })
      ])

      if (!mountedRef.current) return
      setFinance(overviewRes?.metrics?.finance || {})
      setTransactions((txRes?.items || []).map(mapTransaction))
    } catch (error) {
      if (!mountedRef.current) return
      pushToast({ type: 'error', title: 'Không tải được tài chính', message: error?.message || 'Lỗi không xác định' })
    } finally {
      if (mountedRef.current) setLoading(false)
    }
  }

  useEffect(() => {
    if (!token) return
    const mountedRef = { current: true }
    void fetchData(mountedRef)

    const onFocus = () => { void fetchData(mountedRef) }
    const onVisibility = () => {
      if (document.visibilityState === 'visible') void fetchData(mountedRef)
    }
    const intervalId = window.setInterval(() => { void fetchData(mountedRef) }, 15000)

    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      mountedRef.current = false
      window.clearInterval(intervalId)
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [token, pushToast, dateRange.from, dateRange.to])

  const totals = useMemo(() => {
    const totalIn = transactions.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0)
    const totalOut = transactions.filter((t) => t.amount < 0).reduce((s, t) => s + t.amount, 0)
    return { totalIn, totalOut, net: totalIn + totalOut }
  }, [transactions])

  const filteredTransactions = useMemo(() => {
    const from = dateRange.from ? new Date(`${dateRange.from}T00:00:00`) : null
    const to = dateRange.to ? new Date(`${dateRange.to}T23:59:59.999`) : null
    return transactions.filter((txn) => {
      const time = new Date(txn.time)
      if (Number.isNaN(time.getTime())) return false
      if (from && time < from) return false
      if (to && time > to) return false
      return true
    })
  }, [transactions, dateRange.from, dateRange.to])

  const settlementCards = [
    { label: 'Tổng cọc đã nhận', value: formatVnd(finance.depositReceivedTotal), tone: 'text-primary' },
    { label: 'Cọc chờ trả shop', value: formatVnd(finance.depositPendingShopPayoutTotal), tone: 'text-amber-700' },
    { label: 'Cọc đã trả shop', value: formatVnd(finance.depositPaidBackTotal), tone: 'text-emerald-600' },
    { label: 'Cọc chờ đối soát', value: formatVnd(finance.depositAwaitingReconciliationTotal), tone: 'text-sky-700' },
    { label: 'Tổng tiền dịch vụ', value: formatVnd(finance.serviceTotalAmount), tone: 'text-primary' },
    { label: 'Khách còn phải trả', value: formatVnd(finance.remainingCustomerBalanceTotal), tone: 'text-fuchsia-700' },
    { label: 'Phí nền tảng đã thu', value: formatVnd(finance.platformFeeTotal), tone: 'text-rose-600' },
    { label: 'Tổng số dư ví ảo shop', value: formatVnd(finance.totalVirtualWalletBalance), tone: 'text-emerald-600' },
    { label: 'Booking hoàn thành', value: String(finance.totalCompletedBookings || 0), tone: 'text-primary' },
    { label: 'Booking không cọc', value: String(finance.totalNoDepositBookings || 0), tone: 'text-amber-700' },
    { label: 'Booking có cọc', value: String(finance.totalDepositBookings || 0), tone: 'text-emerald-600' }
  ]

  return (
    <AdminLayout>
      <header>
        <h2 className="font-h2 text-h2 text-primary">Tài chính hệ thống</h2>
        <p className="text-main/70">Giám sát dòng tiền nạp ví, escrow cọc, phí nền tảng và đối soát shop.</p>
        <AdminHeaderNav />
      </header>

      <section className="glass-card bg-white rounded-3xl p-6">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-5">
          <div>
            <h3 className="text-xl font-bold text-primary">Đối soát LumiX</h3>
            <p className="text-sm text-main/60">Khoảng ngày {dateRange.from || '—'} đến {dateRange.to || '—'}</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="date"
              className="px-4 py-3 rounded-xl border border-slate-200 bg-white"
              value={dateRange.from}
              onChange={(e) => setDateRange((current) => ({ ...current, from: e.target.value }))}
            />
            <input
              type="date"
              className="px-4 py-3 rounded-xl border border-slate-200 bg-white"
              value={dateRange.to}
              onChange={(e) => setDateRange((current) => ({ ...current, to: e.target.value }))}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {settlementCards.map((item) => (
            <article key={item.label} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-sm text-main/60">{item.label}</p>
              <p className={`text-2xl font-bold mt-1 ${item.tone}`}>{item.value}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <article className="glass-card bg-white rounded-3xl p-6">
          <p className="text-sm text-main/60">Tổng nạp vào</p>
          <p className="text-3xl font-bold text-emerald-600 mt-1">{formatVnd(totals.totalIn)}</p>
        </article>
        <article className="glass-card bg-white rounded-3xl p-6">
          <p className="text-sm text-main/60">Tổng chi ra</p>
          <p className="text-3xl font-bold text-rose-600 mt-1">{formatVnd(Math.abs(totals.totalOut))}</p>
        </article>
        <article className="glass-card bg-white rounded-3xl p-6">
          <p className="text-sm text-main/60">Dòng tiền ròng</p>
          <p className="text-3xl font-bold text-primary mt-1">{formatVnd(totals.net)}</p>
        </article>
      </section>

      <section className="glass-card bg-white rounded-3xl p-6">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-xl font-bold text-primary">Chi tiết giao dịch đối soát</h3>
            <p className="text-sm text-main/60">Dòng tiền thực tế và các bản ghi PayOS / ví / phí</p>
          </div>
          {loading ? <p className="text-sm text-main/60">Đang tải giao dịch...</p> : null}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px]">
            <thead>
              <tr className="bg-slate-50 text-left">
                <th className="px-4 py-3 text-xs uppercase text-main/60">Mã GD</th>
                <th className="px-4 py-3 text-xs uppercase text-main/60">Thời gian</th>
                <th className="px-4 py-3 text-xs uppercase text-main/60">Shop</th>
                <th className="px-4 py-3 text-xs uppercase text-main/60">Loại</th>
                <th className="px-4 py-3 text-xs uppercase text-main/60">Số tiền</th>
                <th className="px-4 py-3 text-xs uppercase text-main/60">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredTransactions.map((txn) => (
                <tr key={txn.id} className="hover:bg-slate-50">
                  <td className="px-4 py-4 font-semibold text-primary">{txn.id}</td>
                  <td className="px-4 py-4 text-sm">{new Date(txn.time).toLocaleString('vi-VN')}</td>
                  <td className="px-4 py-4 text-sm">{txn.shopName}</td>
                  <td className="px-4 py-4 text-sm">{typeLabel(txn.type)}</td>
                  <td className={`px-4 py-4 text-sm font-bold ${txn.amount >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {txn.amount >= 0 ? '+' : '-'}{formatVnd(Math.abs(txn.amount))}
                  </td>
                  <td className="px-4 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${txn.status === 'success' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {txn.status === 'success' ? 'Thành công' : 'Đang xử lý'}
                    </span>
                  </td>
                </tr>
              ))}
              {!filteredTransactions.length ? (
                <tr>
                  <td className="px-4 py-6 text-sm text-main/60" colSpan={6}>Chưa có giao dịch trong khoảng ngày này.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </AdminLayout>
  )
}
