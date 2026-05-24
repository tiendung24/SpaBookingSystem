import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import AdminHeaderNav from '../components/admin/AdminHeaderNav'
import AdminLayout from '../components/admin/AdminLayout'
import { useToast } from '../components/ui/ToastProvider'
import { useShop } from '../context/ShopContext'
import { apiRequest } from '../lib/api'

function priorityClass(priority) {
  if (priority === 'high') return 'bg-rose-100 text-rose-700'
  if (priority === 'medium') return 'bg-amber-100 text-amber-700'
  return 'bg-slate-100 text-slate-700'
}

function statusClass(status) {
  if (status === 'resolved') return 'bg-emerald-100 text-emerald-700'
  if (status === 'in_progress') return 'bg-primary/10 text-primary'
  return 'bg-amber-100 text-amber-700'
}

function statusLabel(status) {
  if (status === 'resolved') return 'Đã xử lý'
  if (status === 'in_progress') return 'Đang xử lý'
  return 'Mới tạo'
}

function mapNotificationToTicket(item) {
  return {
    id: item?._id || item?.id || '',
    title: item?.title || 'Thông báo hệ thống',
    shopName: item?.shopId || 'Toàn hệ thống',
    channel: item?.type || 'notification',
    priority: 'medium',
    status: 'open',
    createdAt: item?.createdAt || new Date().toISOString()
  }
}

export default function AdminSupportPage() {
  const { token } = useShop()
  const { pushToast } = useToast()
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!token) return
    let mounted = true
    const run = async () => {
      setLoading(true)
      try {
        const res = await apiRequest('/api/admin/notifications', { token })
        if (!mounted) return
        setTickets((res?.items || []).map(mapNotificationToTicket))
      } catch (error) {
        pushToast({ type: 'error', title: 'Không tải được hỗ trợ', message: error?.message || 'Lỗi không xác định' })
      } finally {
        if (mounted) setLoading(false)
      }
    }
    run()
    return () => { mounted = false }
  }, [token, pushToast])

  const summary = useMemo(() => ({
    total: tickets.length,
    open: tickets.filter((t) => t.status === 'open').length,
    inProgress: tickets.filter((t) => t.status === 'in_progress').length
  }), [tickets])

  return (
    <AdminLayout>
      <header>
        <h2 className="font-h2 text-h2 text-primary">Hỗ trợ vận hành</h2>
        <p className="text-main/70">Theo dõi thông báo và yêu cầu hỗ trợ vận hành từ hệ thống.</p>
        <AdminHeaderNav />
      </header>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <article className="glass-card bg-white rounded-3xl p-6"><p className="text-sm text-main/60">Tổng yêu cầu</p><p className="text-3xl font-bold text-primary mt-1">{summary.total}</p></article>
        <article className="glass-card bg-white rounded-3xl p-6"><p className="text-sm text-main/60">Mới tạo</p><p className="text-3xl font-bold text-amber-600 mt-1">{summary.open}</p></article>
        <article className="glass-card bg-white rounded-3xl p-6"><p className="text-sm text-main/60">Đang xử lý</p><p className="text-3xl font-bold text-primary mt-1">{summary.inProgress}</p></article>
      </section>

      <section className="glass-card bg-white rounded-3xl p-6">
        {loading ? <p className="text-sm text-main/60 mb-4">Đang tải dữ liệu hỗ trợ...</p> : null}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px]">
            <thead>
              <tr className="bg-slate-50 text-left">
                <th className="px-4 py-3 text-xs uppercase text-main/60">Mã ticket</th>
                <th className="px-4 py-3 text-xs uppercase text-main/60">Tiêu đề</th>
                <th className="px-4 py-3 text-xs uppercase text-main/60">Shop</th>
                <th className="px-4 py-3 text-xs uppercase text-main/60">Kênh</th>
                <th className="px-4 py-3 text-xs uppercase text-main/60">Ưu tiên</th>
                <th className="px-4 py-3 text-xs uppercase text-main/60">Trạng thái</th>
                <th className="px-4 py-3 text-xs uppercase text-main/60">Thời gian</th>
                <th className="px-4 py-3 text-xs uppercase text-main/60 text-right">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {tickets.map((ticket) => (
                <tr key={ticket.id} className="hover:bg-slate-50">
                  <td className="px-4 py-4 font-semibold text-primary">{ticket.id}</td>
                  <td className="px-4 py-4 text-sm">{ticket.title}</td>
                  <td className="px-4 py-4 text-sm">{ticket.shopName}</td>
                  <td className="px-4 py-4 text-sm">{ticket.channel}</td>
                  <td className="px-4 py-4"><span className={`px-3 py-1 rounded-full text-xs font-bold ${priorityClass(ticket.priority)}`}>Trung bình</span></td>
                  <td className="px-4 py-4"><span className={`px-3 py-1 rounded-full text-xs font-bold ${statusClass(ticket.status)}`}>{statusLabel(ticket.status)}</span></td>
                  <td className="px-4 py-4 text-sm">{new Date(ticket.createdAt).toLocaleString('vi-VN')}</td>
                  <td className="px-4 py-4 text-right"><Link to={`/admin/support/${ticket.id}`} className="px-3 py-1.5 rounded-lg bg-primary text-white text-sm font-bold">Mở ticket</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AdminLayout>
  )
}
