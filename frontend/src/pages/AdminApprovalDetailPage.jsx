import { Link, useParams } from 'react-router-dom'
import AdminHeaderNav from '../components/admin/AdminHeaderNav'
import AdminLayout from '../components/admin/AdminLayout'
import { adminOnboardingRequests } from '../data/adminMockData'

export default function AdminApprovalDetailPage() {
  const { id } = useParams()
  const request = adminOnboardingRequests.find((item) => item.id === id)

  if (!request) {
    return (
      <AdminLayout>
        <h2 className="font-h2 text-h2 text-primary">Không tìm thấy hồ sơ onboarding</h2>
        <Link className="text-primary underline" to="/admin/approvals">
          Quay lại danh sách duyệt
        </Link>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <header className="flex items-center justify-between gap-4">
        <div>
          <h2 className="font-h2 text-h2 text-primary">Chi tiết onboarding</h2>
          <p className="text-main/70">Rà soát hồ sơ pháp lý và mức độ sẵn sàng vận hành.</p>
          <AdminHeaderNav />
        </div>
        <Link to="/admin/approvals" className="px-4 py-2 rounded-xl bg-slate-100 text-main/70 font-bold hover:bg-slate-200">
          Quay lại
        </Link>
      </header>

      <section className="glass-card bg-white rounded-3xl p-6 space-y-4">
        <h4 className="font-h3 text-h3 text-primary">{request.shopName}</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <p><span className="text-main/60">Mã request:</span> <b>{request.id}</b></p>
          <p><span className="text-main/60">Chủ shop:</span> <b>{request.owner}</b></p>
          <p><span className="text-main/60">Số điện thoại:</span> <b>{request.phone}</b></p>
          <p><span className="text-main/60">Khu vực:</span> <b>{request.district}</b></p>
          <p><span className="text-main/60">KYC:</span> <b>{request.kycStatus === 'verified' ? 'Đạt' : 'Chờ'}</b></p>
          <p><span className="text-main/60">Gửi lúc:</span> <b>{new Date(request.submittedAt).toLocaleString('vi-VN')}</b></p>
          <p><span className="text-main/60">Dịch vụ khai báo:</span> <b>{request.servicesCount}</b></p>
          <p><span className="text-main/60">Nhân sự khai báo:</span> <b>{request.staffCount}</b></p>
        </div>
        <div className="pt-2 flex gap-2">
          <button className="px-5 py-3 rounded-xl bg-primary text-white font-bold">Duyệt shop</button>
          <button className="px-5 py-3 rounded-xl bg-slate-100 text-main/70 font-bold">Yêu cầu bổ sung</button>
          <button className="px-5 py-3 rounded-xl bg-rose-100 text-rose-700 font-bold">Từ chối</button>
        </div>
      </section>
    </AdminLayout>
  )
}

