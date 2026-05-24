import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import AdminHeaderNav from '../components/admin/AdminHeaderNav'
import AdminLayout from '../components/admin/AdminLayout'
import { useToast } from '../components/ui/ToastProvider'
import { useShop } from '../context/ShopContext'
import { apiRequest } from '../lib/api'

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

export default function AdminTicketDetailPage() {
  const { id } = useParams()
  const { token } = useShop()
  const { pushToast } = useToast()
  const [ticket, setTicket] = useState(null)
  const [status, setStatus] = useState('open')
  const [assignee, setAssignee] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!token || !id) return
    let mounted = true
    const run = async () => {
      setLoading(true)
      try {
        const res = await apiRequest(`/api/admin/notifications/${id}`, { token })
        if (!mounted) return
        const mapped = mapNotificationToTicket(res?.notification || null)
        setTicket(mapped)
        setStatus(mapped.status)
      } catch (error) {
        pushToast({ type: 'error', title: 'Không tải được ticket', message: error?.message || 'Lỗi không xác định' })
      } finally {
        if (mounted) setLoading(false)
      }
    }
    run()
    return () => { mounted = false }
  }, [id, token, pushToast])

  if (loading) {
    return <AdminLayout><p className="text-sm text-main/60">Đang tải ticket...</p></AdminLayout>
  }

  if (!ticket) {
    return (
      <AdminLayout>
        <h2 className="font-h2 text-h2 text-primary">Không tìm thấy ticket hỗ trợ</h2>
        <Link className="text-primary underline" to="/admin/support">Quay lại danh sách hỗ trợ</Link>
      </AdminLayout>
    )
  }

  const takeOwnership = () => {
    setAssignee('Admin hiện tại')
    setStatus('in_progress')
    pushToast({ type: 'info', title: 'Đã nhận xử lý', message: `Ticket ${ticket.id} đã được nhận xử lý.` })
  }

  const rerouteTicket = () => {
    setStatus('rerouted')
    pushToast({ type: 'warning', title: 'Đã chuyển tuyến', message: `Ticket ${ticket.id} đã được chuyển tuyến nội bộ.` })
  }

  const resolveTicket = () => {
    setStatus('resolved')
    pushToast({ type: 'success', title: 'Đã hoàn tất', message: `Ticket ${ticket.id} đã được đánh dấu hoàn tất.` })
  }

  return (
    <AdminLayout>
      <header className="flex items-center justify-between gap-4">
        <div>
          <h2 className="font-h2 text-h2 text-primary">Chi tiết ticket hỗ trợ</h2>
          <p className="text-main/70">Theo dõi tiến độ xử lý và cập nhật trạng thái ticket.</p>
          <AdminHeaderNav />
        </div>
        <Link to="/admin/support" className="px-4 py-2 rounded-xl bg-slate-100 text-main/70 font-bold hover:bg-slate-200">Quay lại</Link>
      </header>

      <section className="glass-card bg-white rounded-3xl p-6 space-y-4">
        <h4 className="font-h3 text-h3 text-primary">{ticket.title}</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <p><span className="text-main/60">Mã ticket:</span> <b>{ticket.id}</b></p>
          <p><span className="text-main/60">Shop:</span> <b>{ticket.shopName}</b></p>
          <p><span className="text-main/60">Kênh:</span> <b>{ticket.channel}</b></p>
          <p><span className="text-main/60">Ưu tiên:</span> <b>{ticket.priority}</b></p>
          <p><span className="text-main/60">Trạng thái:</span> <b>{status}</b></p>
          <p><span className="text-main/60">Tạo lúc:</span> <b>{new Date(ticket.createdAt).toLocaleString('vi-VN')}</b></p>
          <p><span className="text-main/60">Người xử lý:</span> <b>{assignee || 'Chưa gán'}</b></p>
        </div>
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-sm text-main/70">Ticket đang dùng nguồn dữ liệu notification từ backend admin.</div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="px-4 py-2.5 rounded-xl bg-primary text-white font-bold" onClick={takeOwnership}>Nhận xử lý</button>
          <button type="button" className="px-4 py-2.5 rounded-xl bg-slate-100 text-main/70 font-bold" onClick={rerouteTicket}>Chuyển tuyến</button>
          <button type="button" className="px-4 py-2.5 rounded-xl bg-emerald-100 text-emerald-700 font-bold" onClick={resolveTicket}>Đánh dấu hoàn tất</button>
        </div>
      </section>
    </AdminLayout>
  )
}
