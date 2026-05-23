import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import AdminLayout from '../components/admin/AdminLayout'
import AdminHeaderNav from '../components/admin/AdminHeaderNav'
import { adminPartners } from '../data/adminMockData'

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

const emptyForm = {
  shopName: '',
  owner: '',
  phone: '',
  district: '',
  plan: 'Cơ bản',
  status: 'pending'
}

export default function AdminPartnersPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [partners, setPartners] = useState(adminPartners)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const shouldOpenCreateForm = searchParams.get('create') === '1'
  const [form, setForm] = useState(emptyForm)
  const [formError, setFormError] = useState('')


  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return partners.filter((partner) => {
      const matchStatus = status === 'all' || partner.status === status
      const matchText =
        !q ||
        partner.shopName.toLowerCase().includes(q) ||
        partner.owner.toLowerCase().includes(q) ||
        partner.phone.includes(q)
      return matchStatus && matchText
    })
  }, [partners, query, status])

  const stats = useMemo(() => {
    const total = partners.length
    const active = partners.filter((item) => item.status === 'active').length
    const pending = partners.filter((item) => item.status === 'pending').length
    const totalBookings = partners.reduce((sum, item) => sum + item.monthlyBookings, 0)
    return { total, active, pending, totalBookings }
  }, [partners])

  const openCreateForm = () => {
    setSearchParams({ create: '1' })
  }

  const closeCreateForm = () => {
    setForm(emptyForm)
    setFormError('')
    setSearchParams({})
  }

  const handleCreatePartner = (event) => {
    event.preventDefault()

    if (!form.shopName.trim() || !form.owner.trim() || !form.phone.trim() || !form.district.trim()) {
      setFormError('Vui lòng nhập đầy đủ thông tin đối tác.')
      return
    }

    const nextPartner = {
      id: `pt-${String(partners.length + 1).padStart(3, '0')}`,
      shopName: form.shopName.trim(),
      owner: form.owner.trim(),
      phone: form.phone.trim(),
      district: form.district.trim(),
      plan: form.plan,
      joinedAt: new Date().toISOString().slice(0, 10),
      status: form.status,
      rating: 0,
      monthlyBookings: 0,
      wallet: 0
    }

    setPartners((prev) => [nextPartner, ...prev])
    setQuery(nextPartner.shopName)
    setStatus('all')
    closeCreateForm()
  }

  return (
    <AdminLayout>
      <header className="flex flex-col md:flex-row justify-between gap-4">
        <div>
          <h2 className="font-h2 text-h2 text-primary">Quản lý đối tác</h2>
          <p className="text-main/70">Duyệt shop mới, theo dõi chất lượng và kiểm soát trạng thái hợp tác.</p>
          <AdminHeaderNav />
        </div>
        <button className="bg-primary text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:scale-105 transition-transform" onClick={openCreateForm}>
          + Thêm đối tác
        </button>
      </header>

      {shouldOpenCreateForm && (
        <section className="glass-card bg-white rounded-3xl p-6 space-y-4 border border-primary/20">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="font-h3 text-h3 text-primary">Tạo đối tác mới</h3>
              <p className="text-main/70 text-sm">Thêm nhanh một shop mới vào danh sách quản trị đối tác.</p>
            </div>
            <button type="button" className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50" onClick={closeCreateForm}>
              Đóng
            </button>
          </div>

          <form className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4" onSubmit={handleCreatePartner}>
            <input className="p-3 rounded-xl border border-slate-300" placeholder="Tên shop" value={form.shopName} onChange={(e) => setForm((prev) => ({ ...prev, shopName: e.target.value }))} />
            <input className="p-3 rounded-xl border border-slate-300" placeholder="Chủ shop" value={form.owner} onChange={(e) => setForm((prev) => ({ ...prev, owner: e.target.value }))} />
            <input className="p-3 rounded-xl border border-slate-300" placeholder="Số điện thoại" value={form.phone} onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))} />
            <input className="p-3 rounded-xl border border-slate-300" placeholder="Khu vực / quận" value={form.district} onChange={(e) => setForm((prev) => ({ ...prev, district: e.target.value }))} />
            <select className="p-3 rounded-xl border border-slate-300" value={form.plan} onChange={(e) => setForm((prev) => ({ ...prev, plan: e.target.value }))}>
              <option value="Cơ bản">Cơ bản</option>
              <option value="Nâng cao">Nâng cao</option>
            </select>
            <select className="p-3 rounded-xl border border-slate-300" value={form.status} onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}>
              <option value="pending">Chờ duyệt</option>
              <option value="active">Đang hoạt động</option>
              <option value="inactive">Tạm ngưng</option>
            </select>
            <div className="md:col-span-2 xl:col-span-3 flex items-center justify-between gap-4">
              <p className="text-sm text-rose-600">{formError}</p>
              <button type="submit" className="px-5 py-3 rounded-xl bg-primary text-white font-bold hover:brightness-110">
                Lưu đối tác
              </button>
            </div>
          </form>
        </section>
      )}

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
          <table className="w-full min-w-[900px] text-left border-collapse">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-4 py-3 text-main/60 text-sm uppercase">Shop</th>
                <th className="px-4 py-3 text-main/60 text-sm uppercase">Chủ shop</th>
                <th className="px-4 py-3 text-main/60 text-sm uppercase">Khu vực</th>
                <th className="px-4 py-3 text-main/60 text-sm uppercase">Gói</th>
                <th className="px-4 py-3 text-main/60 text-sm uppercase">Trạng thái</th>
                <th className="px-4 py-3 text-main/60 text-sm uppercase">Booking / tháng</th>
                <th className="px-4 py-3 text-main/60 text-sm uppercase">Ví</th>
                <th className="px-4 py-3 text-main/60 text-sm uppercase text-right">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filtered.map((partner) => (
                <tr key={partner.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-4">
                    <p className="font-bold text-primary">{partner.shopName}</p>
                    <p className="text-xs text-main/60">Mã: {partner.id}</p>
                  </td>
                  <td className="px-4 py-4">
                    <p className="font-semibold">{partner.owner}</p>
                    <p className="text-xs text-main/60">{partner.phone}</p>
                  </td>
                  <td className="px-4 py-4 text-sm text-main/70">{partner.district}</td>
                  <td className="px-4 py-4 text-sm text-main/70">{partner.plan}</td>
                  <td className="px-4 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusClass(partner.status)}`}>
                      {statusLabel(partner.status)}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm text-main/70">{partner.monthlyBookings}</td>
                  <td className="px-4 py-4 text-sm font-semibold text-primary">{formatVnd(partner.wallet)}</td>
                  <td className="px-4 py-4 text-right">
                    <Link className="px-3 py-1.5 rounded-lg bg-primary text-white text-sm font-bold" to={`/admin/partners/${partner.id}`}>
                      Xem chi tiết
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
