import AdminHeaderNav from '../components/admin/AdminHeaderNav'
import AdminLayout from '../components/admin/AdminLayout'
import { adminOnboardingRequests } from '../data/adminMockData'
import { Link } from 'react-router-dom'

function kycBadge(status) {
  return status === 'verified' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
}

export default function AdminApprovalsPage() {
  return (
    <AdminLayout>
      <header className="flex flex-col md:flex-row justify-between gap-4">
        <div>
          <h2 className="font-h2 text-h2 text-primary">Duyệt onboarding shop</h2>
          <p className="text-main/70">Kiểm tra hồ sơ, KYC và mức độ sẵn sàng trước khi kích hoạt đối tác.</p>
          <AdminHeaderNav />
        </div>
      </header>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {adminOnboardingRequests.map((item) => (
          <article key={item.id} className="glass-card bg-white rounded-3xl p-6 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h4 className="font-h3 text-h3 text-primary">{item.shopName}</h4>
                <p className="text-sm text-main/60">{item.owner} • {item.phone}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${kycBadge(item.kycStatus)}`}>
                {item.kycStatus === 'verified' ? 'KYC đạt' : 'KYC chờ'}
              </span>
            </div>
            <div className="space-y-2 text-sm text-main/70">
              <p>Khu vực: <b className="text-main">{item.district}</b></p>
              <p>Gửi hồ sơ lúc: <b className="text-main">{new Date(item.submittedAt).toLocaleString('vi-VN')}</b></p>
              <p>Dịch vụ đã khai báo: <b className="text-main">{item.servicesCount}</b></p>
              <p>Nhân sự đã khai báo: <b className="text-main">{item.staffCount}</b></p>
            </div>
            <div className="flex gap-2 pt-2">
              <Link to={`/admin/approvals/${item.id}`} className="flex-1 px-4 py-3 rounded-xl bg-primary text-white font-bold text-center">
                Xem hồ sơ
              </Link>
              <button className="flex-1 px-4 py-3 rounded-xl bg-slate-100 text-main/70 font-bold">Yêu cầu bổ sung</button>
            </div>
          </article>
        ))}
      </section>
    </AdminLayout>
  )
}
