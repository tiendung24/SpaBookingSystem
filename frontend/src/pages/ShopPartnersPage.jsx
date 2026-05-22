import { useMemo, useState } from 'react'
import ShopSidebar from '../components/shop/ShopSidebar'

const partnerSeed = [
  {
    id: 'pt-001',
    shopName: 'Mộc Spa Quận 1',
    owner: 'Nguyễn Thanh Mai',
    phone: '0909 888 111',
    district: 'Quận 1, TP.HCM',
    plan: 'Nâng cao',
    joinedAt: '2026-05-01',
    status: 'active',
    rating: 4.9,
    monthlyBookings: 162,
    wallet: 1250000
  },
  {
    id: 'pt-002',
    shopName: 'Luna Nail Studio',
    owner: 'Trần Hải Yến',
    phone: '0912 222 454',
    district: 'Quận 3, TP.HCM',
    plan: 'Cơ bản',
    joinedAt: '2026-04-18',
    status: 'active',
    rating: 4.7,
    monthlyBookings: 96,
    wallet: 620000
  },
  {
    id: 'pt-003',
    shopName: 'An Nhiên Beauty House',
    owner: 'Lê Minh Tâm',
    phone: '0986 731 920',
    district: 'Thủ Đức, TP.HCM',
    plan: 'Nâng cao',
    joinedAt: '2026-05-15',
    status: 'pending',
    rating: 0,
    monthlyBookings: 0,
    wallet: 0
  },
  {
    id: 'pt-004',
    shopName: 'Sora Wellness',
    owner: 'Phạm Ngọc Anh',
    phone: '0977 321 009',
    district: 'Quận 7, TP.HCM',
    plan: 'Cơ bản',
    joinedAt: '2026-03-05',
    status: 'inactive',
    rating: 4.3,
    monthlyBookings: 41,
    wallet: 180000
  }
]

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

export default function ShopPartnersPage() {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return partnerSeed.filter((partner) => {
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
    const total = partnerSeed.length
    const active = partnerSeed.filter((item) => item.status === 'active').length
    const pending = partnerSeed.filter((item) => item.status === 'pending').length
    const totalBookings = partnerSeed.reduce((sum, item) => sum + item.monthlyBookings, 0)
    return { total, active, pending, totalBookings }
  }, [])

  return (
    <div className="min-h-screen bg-slate-50 text-main">
      <ShopSidebar onNewBooking={() => console.log('Tạo lịch hẹn mới')} />

      <main className="ml-64 p-6 md:p-10 space-y-8">
        <header className="flex flex-col md:flex-row justify-between gap-4">
          <div>
            <h2 className="font-h2 text-h2 text-primary">Quản lý đối tác shop</h2>
            <p className="text-main/70">Theo dõi trạng thái hợp tác, hiệu suất và chất lượng vận hành của các shop đối tác.</p>
          </div>
          <button className="bg-primary text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:scale-105 transition-transform">
            + Thêm đối tác mới
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

            <div className="flex items-center gap-2">
              <button
                onClick={() => setStatus('all')}
                className={`px-4 py-2 rounded-xl text-sm font-bold ${status === 'all' ? 'bg-primary text-white' : 'bg-slate-100 text-main/70'}`}
              >
                Tất cả
              </button>
              <button
                onClick={() => setStatus('active')}
                className={`px-4 py-2 rounded-xl text-sm font-bold ${status === 'active' ? 'bg-primary text-white' : 'bg-slate-100 text-main/70'}`}
              >
                Đang hoạt động
              </button>
              <button
                onClick={() => setStatus('pending')}
                className={`px-4 py-2 rounded-xl text-sm font-bold ${status === 'pending' ? 'bg-primary text-white' : 'bg-slate-100 text-main/70'}`}
              >
                Chờ duyệt
              </button>
              <button
                onClick={() => setStatus('inactive')}
                className={`px-4 py-2 rounded-xl text-sm font-bold ${status === 'inactive' ? 'bg-primary text-white' : 'bg-slate-100 text-main/70'}`}
              >
                Tạm ngưng
              </button>
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
                        <button className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-sm font-bold hover:bg-primary/20">
                          Chi tiết
                        </button>
                        <button className="px-3 py-1.5 rounded-lg bg-slate-100 text-main/70 text-sm font-bold hover:bg-slate-200">
                          Cấu hình
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-10 text-main/60">
              Không tìm thấy đối tác phù hợp bộ lọc hiện tại.
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

