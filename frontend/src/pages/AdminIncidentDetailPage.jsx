import { Link, useParams } from 'react-router-dom'
import AdminHeaderNav from '../components/admin/AdminHeaderNav'
import AdminLayout from '../components/admin/AdminLayout'
import { adminIncidents } from '../data/adminMockData'

export default function AdminIncidentDetailPage() {
  const { id } = useParams()
  const incident = adminIncidents.find((item) => item.id === id)

  if (!incident) {
    return (
      <AdminLayout>
        <h2 className="font-h2 text-h2 text-primary">Không tìm thấy sự cố</h2>
        <Link className="text-primary underline" to="/admin/risk">
          Quay lại màn rủi ro
        </Link>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <header className="flex items-center justify-between gap-4">
        <div>
          <h2 className="font-h2 text-h2 text-primary">Chi tiết sự cố rủi ro</h2>
          <p className="text-main/70">Phân tích nguyên nhân và quyết định xử lý cho shop.</p>
          <AdminHeaderNav />
        </div>
        <Link to="/admin/risk" className="px-4 py-2 rounded-xl bg-slate-100 text-main/70 font-bold hover:bg-slate-200">
          Quay lại
        </Link>
      </header>

      <section className="glass-card bg-white rounded-3xl p-6 space-y-4">
        <h4 className="font-h3 text-h3 text-primary">{incident.shopName}</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <p><span className="text-main/60">Mã sự cố:</span> <b>{incident.id}</b></p>
          <p><span className="text-main/60">Mức độ:</span> <b>{incident.level}</b></p>
          <p><span className="text-main/60">Loại:</span> <b>{incident.type}</b></p>
          <p><span className="text-main/60">Chỉ số:</span> <b>{incident.metric}</b></p>
          <p><span className="text-main/60">Phát hiện lúc:</span> <b>{new Date(incident.createdAt).toLocaleString('vi-VN')}</b></p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-sm text-main/70">
          Gợi ý xử lý: xác minh dữ liệu booking 14 ngày gần nhất, đối soát ví và nhật ký thao tác nhân sự.
        </div>

        <div className="flex gap-2">
          <button className="px-4 py-2.5 rounded-xl bg-primary text-white font-bold">Khóa tạm giao dịch rủi ro</button>
          <button className="px-4 py-2.5 rounded-xl bg-slate-100 text-main/70 font-bold">Đánh dấu an toàn</button>
        </div>
      </section>
    </AdminLayout>
  )
}

