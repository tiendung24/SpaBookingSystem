import { Link, useParams } from 'react-router-dom'
import AdminHeaderNav from '../components/admin/AdminHeaderNav'
import AdminLayout from '../components/admin/AdminLayout'
import { adminPartners } from '../data/adminMockData'

function formatVnd(value) {
  return `${Number(value || 0).toLocaleString('vi-VN')}đ`
}

export default function AdminPartnerDetailPage() {
  const { id } = useParams()
  const partner = adminPartners.find((item) => item.id === id)

  if (!partner) {
    return (
      <AdminLayout>
        <h2 className="font-h2 text-h2 text-primary">Không tìm thấy đối tác</h2>
        <Link className="text-primary underline" to="/admin/partners">
          Quay lại danh sách đối tác
        </Link>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <header className="flex items-center justify-between gap-4">
        <div>
          <h2 className="font-h2 text-h2 text-primary">Chi tiết đối tác</h2>
          <p className="text-main/70">Thông tin vận hành và trạng thái hợp tác của shop.</p>
          <AdminHeaderNav />
        </div>
        <Link to="/admin/partners" className="px-4 py-2 rounded-xl bg-slate-100 text-main/70 font-bold hover:bg-slate-200">
          Quay lại
        </Link>
      </header>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <article className="glass-card bg-white rounded-3xl p-6 xl:col-span-2 space-y-4">
          <h4 className="font-h3 text-h3 text-primary">{partner.shopName}</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <p><span className="text-main/60">Mã đối tác:</span> <b>{partner.id}</b></p>
            <p><span className="text-main/60">Chủ shop:</span> <b>{partner.owner}</b></p>
            <p><span className="text-main/60">Số điện thoại:</span> <b>{partner.phone}</b></p>
            <p><span className="text-main/60">Khu vực:</span> <b>{partner.district}</b></p>
            <p><span className="text-main/60">Gói:</span> <b>{partner.plan}</b></p>
            <p><span className="text-main/60">Ngày tham gia:</span> <b>{new Date(partner.joinedAt).toLocaleDateString('vi-VN')}</b></p>
          </div>
        </article>

        <article className="glass-card bg-white rounded-3xl p-6 space-y-3">
          <h4 className="font-h3 text-h3 text-primary">Chỉ số nhanh</h4>
          <p className="text-sm text-main/70">Đánh giá: <b className="text-primary">{partner.rating ? `${partner.rating}/5` : '—'}</b></p>
          <p className="text-sm text-main/70">Booking/tháng: <b className="text-primary">{partner.monthlyBookings}</b></p>
          <p className="text-sm text-main/70">Ví LumiX: <b className="text-primary">{formatVnd(partner.wallet)}</b></p>
          <div className="pt-2 flex gap-2">
            <button className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-white font-bold">Kích hoạt</button>
            <button className="flex-1 px-4 py-2.5 rounded-xl bg-slate-100 text-main/70 font-bold">Tạm ngưng</button>
          </div>
        </article>
      </section>
    </AdminLayout>
  )
}

