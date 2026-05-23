import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import AdminLayout from '../components/admin/AdminLayout'
import AdminHeaderNav from '../components/admin/AdminHeaderNav'
import { adminPartners } from '../data/adminMockData'

function formatVnd(value) {
  return `${Number(value || 0).toLocaleString('vi-VN')}d`
}

function statusLabel(status) {
  if (status === 'active') return 'Ðang ho?t d?ng'
  if (status === 'pending') return 'Ch? duy?t'
  return 'T?m ngung'
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
  plan: 'Co b?n',
  status: 'pending'
}

export default function AdminPartnersPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [partners, setPartners] = useState(adminPartners)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const [showCreateForm, setShowCreateForm] = useState(searchParams.get('create') === '1')
  const [form, setForm] = useState(emptyForm)
  const [formError, setFormError] = useState('')

  useEffect(() => {
    const shouldOpen = searchParams.get('create') === '1'
    setShowCreateForm(shouldOpen)
  }, [searchParams])

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
    setShowCreateForm(true)
    setSearchParams({ create: '1' })
  }

  const closeCreateForm = () => {
    setShowCreateForm(false)
    setForm(emptyForm)
    setFormError('')
    setSearchParams({})
  }

  const handleCreatePartner = (event) => {
    event.preventDefault()

    if (!form.shopName.trim() || !form.owner.trim() || !form.phone.trim() || !form.district.trim()) {
      setFormError('Vui lòng nh?p d?y d? thông tin d?i tác.')
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
          <h2 className="font-h2 text-h2 text-primary">Qu?n lý d?i tác</h2>
          <p className="text-main/70">Duy?t shop m?i, theo dõi ch?t lu?ng và ki?m soát tr?ng thái h?p tác.</p>
          <AdminHeaderNav />
        </div>
        <button className="bg-primary text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:scale-105 transition-transform" onClick={openCreateForm}>
          + Thêm d?i tác
        </button>
      </header>

      {showCreateForm && (
        <section className="glass-card bg-white rounded-3xl p-6 space-y-4 border border-primary/20">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="font-h3 text-h3 text-primary">T?o d?i tác m?i</h3>
              <p className="text-main/70 text-sm">Thêm nhanh m?t shop m?i vào danh sách qu?n tr? d?i tác.</p>
            </div>
            <button type="button" className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50" onClick={closeCreateForm}>
              Ðóng
            </button>
          </div>

          <form className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4" onSubmit={handleCreatePartner}>
            <input className="p-3 rounded-xl border border-slate-300" placeholder="Tên shop" value={form.shopName} onChange={(e) => setForm((prev) => ({ ...prev, shopName: e.target.value }))} />
            <input className="p-3 rounded-xl border border-slate-300" placeholder="Ch? shop" value={form.owner} onChange={(e) => setForm((prev) => ({ ...prev, owner: e.target.value }))} />
            <input className="p-3 rounded-xl border border-slate-300" placeholder="S? di?n tho?i" value={form.phone} onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))} />
            <input className="p-3 rounded-xl border border-slate-300" placeholder="Khu v?c / qu?n" value={form.district} onChange={(e) => setForm((prev) => ({ ...prev, district: e.target.value }))} />
            <select className="p-3 rounded-xl border border-slate-300" value={form.plan} onChange={(e) => setForm((prev) => ({ ...prev, plan: e.target.value }))}>
              <option value="Co b?n">Co b?n</option>
              <option value="Nâng cao">Nâng cao</option>
            </select>
            <select className="p-3 rounded-xl border border-slate-300" value={form.status} onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}>
              <option value="pending">Ch? duy?t</option>
              <option value="active">Ðang ho?t d?ng</option>
              <option value="inactive">T?m ngung</option>
            </select>
            <div className="md:col-span-2 xl:col-span-3 flex items-center justify-between gap-4">
              <p className="text-sm text-rose-600">{formError}</p>
              <button type="submit" className="px-5 py-3 rounded-xl bg-primary text-white font-bold hover:brightness-110">
                Luu d?i tác
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <article className="glass-card bg-white rounded-3xl p-6">
          <p className="text-main/60 text-sm">T?ng d?i tác</p>
          <p className="text-3xl font-bold text-primary mt-1">{stats.total}</p>
        </article>
        <article className="glass-card bg-white rounded-3xl p-6">
          <p className="text-main/60 text-sm">Ðang ho?t d?ng</p>
          <p className="text-3xl font-bold text-emerald-600 mt-1">{stats.active}</p>
        </article>
        <article className="glass-card bg-white rounded-3xl p-6">
          <p className="text-main/60 text-sm">Ch? duy?t</p>
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
              placeholder="Tìm theo tên shop, ch? shop, s? di?n tho?i..."
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {[
              { id: 'all', label: 'T?t c?' },
              { id: 'active', label: 'Ðang ho?t d?ng' },
              { id: 'pending', label: 'Ch? duy?t' },
              { id: 'inactive', label: 'T?m ngung' }
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
                <th className="px-4 py-3 text-main/60 text-sm uppercase">Ch? shop</th>
                <th className="px-4 py-3 text-main/60 text-sm uppercase">Khu v?c</th>
                <th className="px-4 py-3 text-main/60 text-sm uppercase">Gói</th>
                <th className="px-4 py-3 text-main/60 text-sm uppercase">Tr?ng thái</th>
                <th className="px-4 py-3 text-main/60 text-sm uppercase">Booking / tháng</th>
                <th className="px-4 py-3 text-main/60 text-sm uppercase">Ví</th>
                <th className="px-4 py-3 text-main/60 text-sm uppercase text-right">Chi ti?t</th>
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
                      Xem chi ti?t
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
