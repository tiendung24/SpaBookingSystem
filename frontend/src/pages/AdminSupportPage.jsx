import AdminHeaderNav from '../components/admin/AdminHeaderNav'
import AdminLayout from '../components/admin/AdminLayout'
import { adminTickets } from '../data/adminMockData'
import { Link } from 'react-router-dom'

function priorityClass(priority) {
  if (priority === 'high') return 'bg-rose-100 text-rose-700'
  if (priority === 'medium') return 'bg-amber-100 text-amber-700'
  return 'bg-slate-200 text-slate-700'
}

function statusClass(status) {
  if (status === 'open') return 'bg-rose-100 text-rose-700'
  if (status === 'in_progress') return 'bg-primary/15 text-primary'
  return 'bg-emerald-100 text-emerald-700'
}

function statusLabel(status) {
  if (status === 'open') return 'Mới'
  if (status === 'in_progress') return 'Đang xử lý'
  return 'Đã xử lý'
}

export default function AdminSupportPage() {
  return (
    <AdminLayout>
      <header>
        <h2 className="font-h2 text-h2 text-primary">Hỗ trợ đối tác</h2>
        <p className="text-main/70">Quản lý ticket hỗ trợ, SLA và chất lượng phản hồi.</p>
        <AdminHeaderNav />
      </header>

      <section className="glass-card bg-white rounded-3xl p-6">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px]">
            <thead>
              <tr className="bg-slate-50 text-left">
                <th className="px-4 py-3 text-xs uppercase text-main/60">Mã ticket</th>
                <th className="px-4 py-3 text-xs uppercase text-main/60">Shop</th>
                <th className="px-4 py-3 text-xs uppercase text-main/60">Tiêu đề</th>
                <th className="px-4 py-3 text-xs uppercase text-main/60">Kênh</th>
                <th className="px-4 py-3 text-xs uppercase text-main/60">Ưu tiên</th>
                <th className="px-4 py-3 text-xs uppercase text-main/60">Trạng thái</th>
                <th className="px-4 py-3 text-xs uppercase text-main/60">Tạo lúc</th>
                <th className="px-4 py-3 text-xs uppercase text-main/60 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {adminTickets.map((ticket) => (
                <tr key={ticket.id} className="hover:bg-slate-50">
                  <td className="px-4 py-4 font-semibold text-primary">{ticket.id}</td>
                  <td className="px-4 py-4 text-sm">{ticket.shopName}</td>
                  <td className="px-4 py-4 text-sm">{ticket.title}</td>
                  <td className="px-4 py-4 text-sm">{ticket.channel}</td>
                  <td className="px-4 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${priorityClass(ticket.priority)}`}>
                      {ticket.priority === 'high' ? 'Cao' : ticket.priority === 'medium' ? 'Trung bình' : 'Thấp'}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusClass(ticket.status)}`}>
                      {statusLabel(ticket.status)}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm">{new Date(ticket.createdAt).toLocaleString('vi-VN')}</td>
                  <td className="px-4 py-4 text-right">
                    <Link to={`/admin/support/${ticket.id}`} className="px-3 py-1.5 rounded-lg bg-primary text-white text-sm font-bold">
                      Mở ticket
                    </Link>
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
