import { useMemo, useState } from 'react'
import AdminLayout from '../components/admin/AdminLayout'
import AdminHeaderNav from '../components/admin/AdminHeaderNav'
import { adminPartners } from '../data/adminMockData'
import { Link } from 'react-router-dom'

function formatVnd(value) {
  return `${Number(value || 0).toLocaleString('vi-VN')}đ`
}

function statusLabel(status) {
  if (status === 'active') return 'Đang hoạt động'
  if (status === 'pending') return 'Chờ duyệt'
  return 'Tạm ngưng'
}

function statusClass(status) {
  if (status === 'active') return 'bg-emerald-100 text-emerald-700'
  if (status === 'pending') return 'bg-amber-100 text-amber-700'
  return 'bg-slate-200 text-slate-700'
}

export default function AdminPartnersPage() {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return adminPartners.filter((partner) => {
      const matchStatus = status === 'all' || partner.status === status
      const matchText =
        !q ||
        partner.shopName.toLowerCase().includes(q) ||
        partner.owner.toLowerCase().includes(q) ||
        partner.phone.includes(q)
      return matchStatus && matchText
    })
  }, [query, status])

  const stats = useMemo(() => {
    const total = adminPartners.length
    const active = adminPartners.filter((item) => item.status === 'active').length
    const pending = adminPartners.filter((item) => item.status === 'pending').length
    const totalBookings = adminPartners.reduce((sum, item) => sum + item.monthlyBookings, 0)
    return { total, active, pending, totalBookings }
  }, [])

  return (
    <AdminLayout>
      <header className="flex flex-col md:flex-row justify-between gap-4">
        <div>
          <h2 className="font-h2 text-h2 text-primary">Quản lý đối tác</h2>
          <p className="text-main/70">Duyệt shop mới, theo dõi chất lượng và kiểm soát trạng thái hợp tác.</p>
          <AdminHeaderNav />
        </div>
        <button className="bg-primary text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:scale-105 transition-transform">
          + Thêm đối tác
        </button>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <article className="glass-card bg-white rounded-3xl p-6">
          <p className="text-main/60 text-sm">Tổng đối tác</p>
          <p className="text-3xl font-bold text-primary mt-1">{stats.total}</p>
        </article>
        <article className="glass-card bg-white rounded-3xl p-6">
          <p className="text-main/60 text-sm">Đang hoạt động</p>
          <p className="text-3xl font-bold text-emerald-600 mt-1">{stats.active}</p>
        </article>
        <article className="glass-card bg-white rounded-3xl p-6">
          <p className="text-main/60 text-sm">Chờ duyệt</p>
          <p className="text-3xl font-bold text-amber-600 mt-1">{stats.pending}</p>
        </article>
        <article className="glass-card bg-white rounded-3xl p-6">
          <p className="text-main/60 text-sm">Booking tháng này</p>
          <p className="text-3xl font-bold text-primary mt-1">{stats.totalBookings}</p>
        </article>
      </section>

      <section className="glass-card bg-white rounded-3xl p-6 space-y-4">
        <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-md">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-main/40">search</span>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm theo tên shop, chủ shop, số điện thoại..."
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {[
              { id: 'all', label: 'Tất cả' },
              { id: 'active', label: 'Đang hoạt động' },
              { id: 'pending', label: 'Chờ duyệt' },
              { id: 'inactive', label: 'Tạm ngưng' }
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setStatus(item.id)}
                className={`px-4 py-2 rounded-xl text-sm font-bold ${
                  status === item.id ? 'bg-primary text-white' : 'bg-slate-100 text-main/70'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1080px]">
            <thead>
              <tr className="text-left bg-slate-50">
                <th className="px-4 py-3 text-xs uppercase text-main/60">Shop</th>
                <th className="px-4 py-3 text-xs uppercase text-main/60">Chủ shop</th>
                <th className="px-4 py-3 text-xs uppercase text-main/60">Khu vực</th>
                <th className="px-4 py-3 text-xs uppercase text-main/60">Gói</th>
                <th className="px-4 py-3 text-xs uppercase text-main/60">Đánh giá</th>
                <th className="px-4 py-3 text-xs uppercase text-main/60">Booking/tháng</th>
                <th className="px-4 py-3 text-xs uppercase text-main/60">Ví LumiX</th>
                <th className="px-4 py-3 text-xs uppercase text-main/60">Trạng thái</th>
                <th className="px-4 py-3 text-xs uppercase text-main/60 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filtered.map((partner) => (
                <tr key={partner.id} className="hover:bg-slate-50">
                  <td className="px-4 py-4">
                    <p className="font-bold text-primary">{partner.shopName}</p>
                    <p className="text-xs text-main/60">ID: {partner.id}</p>
                  </td>
                  <td className="px-4 py-4">
                    <p className="font-semibold">{partner.owner}</p>
                    <p className="text-xs text-main/60">{partner.phone}</p>
                  </td>
                  <td className="px-4 py-4 text-sm text-main/80">{partner.district}</td>
                  <td className="px-4 py-4 text-sm">{partner.plan}</td>
                  <td className="px-4 py-4 text-sm">{partner.rating ? `${partner.rating}/5` : '—'}</td>
                  <td className="px-4 py-4 text-sm">{partner.monthlyBookings}</td>
                  <td className="px-4 py-4 text-sm font-semibold text-primary">{formatVnd(partner.wallet)}</td>
                  <td className="px-4 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusClass(partner.status)}`}>
                      {statusLabel(partner.status)}
                    </span>
                  </td>
                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-2">
                      <Link
                        to={`/admin/partners/${partner.id}`}
                        className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-sm font-bold hover:bg-primary/20"
                      >
                        Chi tiết
                      </Link>
                      <button className="px-3 py-1.5 rounded-lg bg-slate-100 text-main/70 text-sm font-bold hover:bg-slate-200">Duyệt</button>
                      </div>
                    </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && <div className="text-center py-10 text-main/60">Không tìm thấy đối tác phù hợp bộ lọc hiện tại.</div>}
      </section>
    </AdminLayout>
  )
}
