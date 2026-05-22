import AdminHeaderNav from '../components/admin/AdminHeaderNav'
import AdminLayout from '../components/admin/AdminLayout'
import { adminIncidents } from '../data/adminMockData'
import { Link } from 'react-router-dom'

function levelClass(level) {
  if (level === 'high') return 'bg-rose-100 text-rose-700'
  if (level === 'medium') return 'bg-amber-100 text-amber-700'
  return 'bg-slate-200 text-slate-700'
}

function levelLabel(level) {
  if (level === 'high') return 'Cao'
  if (level === 'medium') return 'Trung bình'
  return 'Thấp'
}

export default function AdminRiskPage() {
  return (
    <AdminLayout>
      <header>
        <h2 className="font-h2 text-h2 text-primary">Rủi ro & gian lận</h2>
        <p className="text-main/70">Phát hiện sớm các bất thường no-show, hủy lịch và rủi ro ví.</p>
        <AdminHeaderNav />
      </header>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {adminIncidents.map((incident) => (
          <article key={incident.id} className="glass-card bg-white rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <p className="font-bold text-primary">{incident.shopName}</p>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${levelClass(incident.level)}`}>
                Mức {levelLabel(incident.level)}
              </span>
            </div>
            <div className="space-y-2 text-sm text-main/70">
              <p>Mã sự cố: <b className="text-main">{incident.id}</b></p>
              <p>Loại: <b className="text-main">{incident.type}</b></p>
              <p>Chỉ số: <b className="text-main">{incident.metric}</b></p>
              <p>Thời điểm: <b className="text-main">{new Date(incident.createdAt).toLocaleString('vi-VN')}</b></p>
            </div>
            <div className="flex gap-2">
              <Link to={`/admin/risk/${incident.id}`} className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-white font-bold text-center">
                Điều tra
              </Link>
              <button className="flex-1 px-4 py-2.5 rounded-xl bg-slate-100 text-main/70 font-bold">Đánh dấu theo dõi</button>
            </div>
          </article>
        ))}
      </section>
    </AdminLayout>
  )
}
