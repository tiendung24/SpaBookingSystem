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
  return {
    id: txn?._id || txn?.id || '',
    time: txn?.createdAt || txn?.time || new Date().toISOString(),
    shopName: txn?.shopName || txn?.shopId || 'Chưa rõ shop',
    type: txn?.transactionType || txn?.type || 'other',
    amount: Number(txn?.amount || 0),
    status: txn?.status || 'success'
  }
}

export default function AdminFinancePage() {
  const { token } = useShop()
  const { pushToast } = useToast()
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!token) return
    let mounted = true
    const run = async () => {
      setLoading(true)
      try {
        const res = await apiRequest('/api/admin/transactions', { token })
        if (!mounted) return
        setTransactions((res?.items || []).map(mapTransaction))
      } catch (error) {
        pushToast({ type: 'error', title: 'Không tải được tài chính', message: error?.message || 'Lỗi không xác định' })
      } finally {
        if (mounted) setLoading(false)
      }
    }
    run()
    return () => { mounted = false }
  }, [token, pushToast])

  const totals = useMemo(() => {
    const totalIn = transactions.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0)
    const totalOut = transactions.filter((t) => t.amount < 0).reduce((s, t) => s + t.amount, 0)
    return { totalIn, totalOut, net: totalIn + totalOut }
  }, [transactions])

  return (
    <AdminLayout>
      <header>
        <h2 className="font-h2 text-h2 text-primary">Tài chính hệ thống</h2>
        <p className="text-main/70">Giám sát dòng tiền nạp ví, phí booking và hoàn tiền.</p>
        <AdminHeaderNav />
      </header>

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
        {loading ? <p className="text-sm text-main/60 mb-4">Đang tải giao dịch...</p> : null}
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
              {transactions.map((txn) => (
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
            </tbody>
          </table>
        </div>
      </section>
    </AdminLayout>
  )
}
