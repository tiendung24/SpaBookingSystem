import { Link, useParams } from 'react-router-dom'
import AdminHeaderNav from '../components/admin/AdminHeaderNav'
import AdminLayout from '../components/admin/AdminLayout'
import { adminTickets } from '../data/adminMockData'

export default function AdminTicketDetailPage() {
  const { id } = useParams()
  const ticket = adminTickets.find((item) => item.id === id)

  if (!ticket) {
    return (
      <AdminLayout>
        <h2 className="font-h2 text-h2 text-primary">Không tìm thấy ticket</h2>
        <Link className="text-primary underline" to="/admin/support">
          Quay lại danh sách hỗ trợ
        </Link>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <header className="flex items-center justify-between gap-4">
        <div>
          <h2 className="font-h2 text-h2 text-primary">Chi tiết ticket hỗ trợ</h2>
          <p className="text-main/70">Theo dõi tiến độ xử lý và lịch sử trao đổi với đối tác.</p>
          <AdminHeaderNav />
        </div>
        <Link to="/admin/support" className="px-4 py-2 rounded-xl bg-slate-100 text-main/70 font-bold hover:bg-slate-200">
          Quay lại
        </Link>
      </header>

      <section className="glass-card bg-white rounded-3xl p-6 space-y-4">
        <h4 className="font-h3 text-h3 text-primary">{ticket.title}</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <p><span className="text-main/60">Mã ticket:</span> <b>{ticket.id}</b></p>
          <p><span className="text-main/60">Shop:</span> <b>{ticket.shopName}</b></p>
          <p><span className="text-main/60">Kênh:</span> <b>{ticket.channel}</b></p>
          <p><span className="text-main/60">Ưu tiên:</span> <b>{ticket.priority}</b></p>
          <p><span className="text-main/60">Trạng thái:</span> <b>{ticket.status}</b></p>
          <p><span className="text-main/60">Tạo lúc:</span> <b>{new Date(ticket.createdAt).toLocaleString('vi-VN')}</b></p>
        </div>
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-sm text-main/70">
          Timeline xử lý và hội thoại nội bộ sẽ được nối ở bước tích hợp backend/helpdesk.
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2.5 rounded-xl bg-primary text-white font-bold">Nhận xử lý</button>
          <button className="px-4 py-2.5 rounded-xl bg-slate-100 text-main/70 font-bold">Chuyển tuyến</button>
          <button className="px-4 py-2.5 rounded-xl bg-emerald-100 text-emerald-700 font-bold">Đánh dấu hoàn tất</button>
        </div>
      </section>
    </AdminLayout>
  )
}

