import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import AdminLayout from '../components/admin/AdminLayout'
import AdminHeaderNav from '../components/admin/AdminHeaderNav'
import { useShop } from '../context/ShopContext'
import { useToast } from '../components/ui/ToastProvider'
import { apiRequest } from '../lib/api'
import { getAddressText } from '../lib/maps'

function formatVnd(value) {
  return `${Number(value || 0).toLocaleString('vi-VN')}đ`
}

function statusLabel(status) {
  if (status === 'active') return 'Đang hoạt động'
  if (status === 'pending') return 'Chờ duyệt'
  if (status === 'locked') return 'Đã khóa'
  return 'Tạm ngưng'
}

function statusClass(status) {
  if (status === 'active') return 'bg-emerald-100 text-emerald-700'
  if (status === 'pending') return 'bg-amber-100 text-amber-700'
  if (status === 'locked') return 'bg-rose-100 text-rose-700'
  return 'bg-slate-200 text-slate-700'
}

function linkStatusLabel(partner) {
  if (partner.status === 'locked') return 'Đã khóa thủ công'
  if (partner.status === 'pending') return 'Chờ duyệt'
  if (partner.linkActive) return 'Link đang hoạt động'
  if (!partner.walletHealthy) return 'Ví dưới mức duy trì'
  return 'Tạm ngưng'
}

function linkStatusClass(partner) {
  if (partner.linkActive) return 'bg-emerald-100 text-emerald-700'
  if (!partner.walletHealthy) return 'bg-amber-100 text-amber-700'
  if (partner.status === 'locked') return 'bg-rose-100 text-rose-700'
  return 'bg-slate-200 text-slate-700'
}

const emptyForm = {
  shopName: '',
  owner: '',
  phone: '',
  email: '',
  district: '',
  slug: '',
  password: '',
  plan: 'Cơ bản',
  status: 'pending'
}

function normalizePhone(input) {
  return String(input || '').trim().replace(/[\s.-]/g, '')
}

function normalizeSlug(input) {
  return String(input || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
}

function isValidPhone(input) {
  return /^(?:\+84|0)\d{9,10}$/.test(input)
}

function isValidEmail(input) {
  return !input || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input)
}

function mapShopToPartner(shop) {
  const wallet = shop?.wallet || {}
  const walletBalance = Number(shop?.stats?.walletBalance ?? wallet.balance ?? 0)
  const walletMinBalance = Number(shop?.stats?.walletMinBalance ?? wallet.minBalance ?? 100000)
  const walletHealthy = Boolean(shop?.stats?.walletHealthy ?? walletBalance >= walletMinBalance)
  return {
    id: shop?._id || shop?.id || '',
    shopName: shop?.name || '—',
    owner: shop?.ownerName || 'Chưa cập nhật',
    phone: shop?.phone || '',
    district: getAddressText(shop?.address) || 'Chưa cập nhật',
    plan: shop?.plan || 'Cơ bản',
    joinedAt: shop?.createdAt || new Date().toISOString(),
    status: shop?.status || 'pending',
    rating: Number(shop?.stats?.rating || 0),
    monthlyBookings: Number(shop?.stats?.completedBookings || 0),
    wallet: walletBalance,
    walletMinBalance,
    walletHealthy,
    linkActive: Boolean(shop?.stats?.bookingLinkActive ?? (shop?.status === 'active' && shop?.onlineBookingEnabled !== false && walletHealthy))
  }
}

export default function AdminPartnersPage() {
  const { token } = useShop()
  const { pushToast } = useToast()
  const [searchParams, setSearchParams] = useSearchParams()
  const [partners, setPartners] = useState([])
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const shouldOpenCreateForm = searchParams.get('create') === '1'
  const [form, setForm] = useState(emptyForm)
  const [formError, setFormError] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const loadPartners = async () => {
    const res = await apiRequest('/api/admin/shops', { token })
    setPartners((res?.items || []).map(mapShopToPartner))
  }

  useEffect(() => {
    if (!token) return
    let mounted = true
    const run = async () => {
      setLoading(true)
      try {
        const res = await apiRequest('/api/admin/shops', { token })
        if (!mounted) return
        setPartners((res?.items || []).map(mapShopToPartner))
      } catch (error) {
        pushToast({ type: 'error', title: 'Không tải được danh sách đối tác', message: error?.message || 'Lỗi không xác định' })
      } finally {
        if (mounted) setLoading(false)
      }
    }
    run()
    return () => { mounted = false }
  }, [token, pushToast])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return partners.filter((partner) => {
      const matchStatus = status === 'all' || partner.status === status
      const matchText = !q || partner.shopName.toLowerCase().includes(q) || partner.owner.toLowerCase().includes(q) || partner.phone.includes(q)
      return matchStatus && matchText
    })
  }, [partners, query, status])

  const stats = useMemo(() => {
    const total = partners.length
    const active = partners.filter((item) => item.linkActive).length
    const pending = partners.filter((item) => item.status === 'pending').length
    const walletPaused = partners.filter((item) => !item.walletHealthy && item.status === 'active').length
    const totalBookings = partners.reduce((sum, item) => sum + item.monthlyBookings, 0)
    return { total, active, pending, walletPaused, totalBookings }
  }, [partners])

  const openCreateForm = () => setSearchParams({ create: '1' })
  const closeCreateForm = () => {
    setForm(emptyForm)
    setFormError('')
    setSearchParams({})
  }

  const handleShopNameChange = (value) => {
    const nextSlug = normalizeSlug(value)
    setForm((prev) => ({ ...prev, shopName: value, slug: prev.slug || nextSlug }))
  }

  const handleCreatePartner = async (event) => {
    event.preventDefault()

    const shopNameText = String(form.shopName || '').trim()
    const ownerText = String(form.owner || '').trim()
    const districtText = String(form.district || '').trim()
    const phoneNormalized = normalizePhone(form.phone)
    const slugText = normalizeSlug(form.slug || shopNameText)
    const emailText = String(form.email || '').trim().toLowerCase()

    if (!shopNameText || !ownerText || !phoneNormalized || !districtText || !slugText) return setFormError('Vui lòng nhập đầy đủ thông tin đối tác.')
    if (shopNameText.length < 2) return setFormError('Tên shop phải từ 2 ký tự trở lên.')
    if (ownerText.length < 2) return setFormError('Tên chủ shop phải từ 2 ký tự trở lên.')
    if (districtText.length < 2) return setFormError('Khu vực / quận phải từ 2 ký tự trở lên.')
    if (!isValidPhone(phoneNormalized)) return setFormError('Số điện thoại không hợp lệ (0 hoặc +84, 10-11 số).')
    if (!isValidEmail(emailText)) return setFormError('Email không hợp lệ.')
    if (slugText.length < 3) return setFormError('Slug phải từ 3 ký tự trở lên.')

    setSaving(true)
    setFormError('')

    try {
      const res = await apiRequest('/api/admin/shops', {
        method: 'POST',
        token,
        body: {
          shopName: shopNameText,
          owner: ownerText,
          phone: phoneNormalized,
          email: emailText || undefined,
          district: districtText,
          slug: slugText,
          password: String(form.password || '').trim() || undefined,
          status: form.status,
          plan: form.plan
        }
      })

      await loadPartners()
      closeCreateForm()
      pushToast({
        type: 'success',
        title: 'Tạo đối tác thành công',
        message: `Slug: ${res?.shop?.slug || slugText}. Mật khẩu tạm: ${res?.tempPassword || '(đã nhập tay)'}`
      })
    } catch (error) {
      setFormError(error?.message || 'Không thể tạo đối tác.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AdminLayout>
      <header className="flex flex-col md:flex-row justify-between gap-4">
        <div>
          <h2 className="font-h2 text-h2 text-primary">Quản lý đối tác</h2>
          <p className="text-main/70">Duyệt shop mới, theo dõi chất lượng và kiểm soát trạng thái hợp tác.</p>
          <AdminHeaderNav />
        </div>
        <button className="bg-primary text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:scale-105 transition-transform" onClick={openCreateForm}>+ Thêm đối tác</button>
      </header>

      {shouldOpenCreateForm && (
        <section className="glass-card bg-white rounded-3xl p-6">
          <h3 className="font-h3 text-h3 text-primary mb-4">Tạo đối tác mới</h3>
          <form className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3" onSubmit={handleCreatePartner}>
            <input className="p-3 rounded-xl border border-slate-300" placeholder="Tên shop" value={form.shopName} onChange={(e) => handleShopNameChange(e.target.value)} />
            <input className="p-3 rounded-xl border border-slate-300" placeholder="Chủ shop" value={form.owner} onChange={(e) => setForm((p) => ({ ...p, owner: e.target.value }))} />
            <input className="p-3 rounded-xl border border-slate-300" placeholder="Số điện thoại" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} />
            <input className="p-3 rounded-xl border border-slate-300" placeholder="Email (không bắt buộc)" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
            <input className="p-3 rounded-xl border border-slate-300" placeholder="Khu vực" value={form.district} onChange={(e) => setForm((p) => ({ ...p, district: e.target.value }))} />
            <input className="p-3 rounded-xl border border-slate-300" placeholder="Slug" value={form.slug} onChange={(e) => setForm((p) => ({ ...p, slug: normalizeSlug(e.target.value) }))} />
            <input className="p-3 rounded-xl border border-slate-300" placeholder="Mật khẩu tạm (để trống = tự sinh)" value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} />
            <select className="p-3 rounded-xl border border-slate-300" value={form.plan} onChange={(e) => setForm((p) => ({ ...p, plan: e.target.value }))}>
              <option value="Cơ bản">Cơ bản</option>
              <option value="Tiêu chuẩn">Tiêu chuẩn</option>
              <option value="Nâng cao">Nâng cao</option>
            </select>
            <select className="p-3 rounded-xl border border-slate-300" value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}>
              <option value="pending">Chờ duyệt</option>
              <option value="active">Đang hoạt động</option>
              <option value="inactive">Tạm ngưng</option>
            </select>
            <div className="md:col-span-2 xl:col-span-3 text-sm text-main/60">Link preview: {form.slug ? `/${form.slug}` : '/ten-shop'}</div>
            <div className="md:col-span-2 xl:col-span-3 flex items-center justify-between gap-4">
              <p className="text-sm text-rose-600">{formError}</p>
              <div className="flex gap-2">
                <button type="button" className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50" onClick={closeCreateForm}>Hủy</button>
                <button type="submit" disabled={saving} className="px-5 py-3 rounded-xl bg-primary text-white font-bold hover:brightness-110 disabled:opacity-60">Tạo đối tác</button>
              </div>
            </div>
          </form>
        </section>
      )}

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <article className="glass-card bg-white rounded-3xl p-6"><p className="text-main/60 text-sm">Tổng shop</p><p className="text-3xl font-bold text-primary mt-1">{stats.total}</p></article>
        <article className="glass-card bg-white rounded-3xl p-6"><p className="text-main/60 text-sm">Link đang hoạt động</p><p className="text-3xl font-bold text-emerald-600 mt-1">{stats.active}</p></article>
        <article className="glass-card bg-white rounded-3xl p-6"><p className="text-main/60 text-sm">Ví dưới mức duy trì</p><p className="text-3xl font-bold text-amber-600 mt-1">{stats.walletPaused}</p></article>
        <article className="glass-card bg-white rounded-3xl p-6"><p className="text-main/60 text-sm">Booking tháng này</p><p className="text-3xl font-bold text-primary mt-1">{stats.totalBookings}</p></article>
      </section>

      <section className="glass-card bg-white rounded-3xl p-6 space-y-4">
        <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-md">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-main/40">search</span>
            <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tìm theo tên shop, chủ shop, số điện thoại..." className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {[{ id: 'all', label: 'Tất cả' }, { id: 'active', label: 'Đang hoạt động' }, { id: 'pending', label: 'Chờ duyệt' }, { id: 'inactive', label: 'Tạm ngưng' }, { id: 'locked', label: 'Đã khóa' }].map((item) => (
              <button key={item.id} onClick={() => setStatus(item.id)} className={`px-4 py-2 rounded-xl text-sm font-bold ${status === item.id ? 'bg-primary text-white' : 'bg-slate-100 text-main/70'}`}>{item.label}</button>
            ))}
          </div>
        </div>

        {loading ? <p className="text-sm text-main/60">Đang tải dữ liệu...</p> : null}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left border-collapse">
            <thead><tr className="bg-slate-50"><th className="px-4 py-3 text-main/60 text-sm uppercase">Shop</th><th className="px-4 py-3 text-main/60 text-sm uppercase">Chủ shop</th><th className="px-4 py-3 text-main/60 text-sm uppercase">Khu vực</th><th className="px-4 py-3 text-main/60 text-sm uppercase">Trạng thái shop</th><th className="px-4 py-3 text-main/60 text-sm uppercase">Link đặt lịch</th><th className="px-4 py-3 text-main/60 text-sm uppercase">Booking thành công</th><th className="px-4 py-3 text-main/60 text-sm uppercase">Ví</th><th className="px-4 py-3 text-main/60 text-sm uppercase text-right">Chi tiết</th></tr></thead>
            <tbody className="divide-y divide-slate-200">
              {filtered.map((partner) => (
                <tr key={partner.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-4"><p className="font-bold text-primary">{partner.shopName}</p><p className="text-xs text-main/60">Mã: {partner.id}</p></td>
                  <td className="px-4 py-4"><p className="font-semibold">{partner.owner}</p><p className="text-xs text-main/60">{partner.phone}</p></td>
                  <td className="px-4 py-4 text-sm text-main/70">{partner.district}</td>
                  <td className="px-4 py-4"><span className={`px-3 py-1 rounded-full text-xs font-bold ${statusClass(partner.status)}`}>{statusLabel(partner.status)}</span></td>
                  <td className="px-4 py-4"><span className={`px-3 py-1 rounded-full text-xs font-bold ${linkStatusClass(partner)}`}>{linkStatusLabel(partner)}</span></td>
                  <td className="px-4 py-4 text-sm text-main/70">{partner.monthlyBookings}</td>
                  <td className="px-4 py-4 text-sm font-semibold text-primary"><p>{formatVnd(partner.wallet)}</p><p className="text-xs text-main/50">Ngưỡng {formatVnd(partner.walletMinBalance)}</p></td>
                  <td className="px-4 py-4 text-right"><Link className="px-3 py-1.5 rounded-lg bg-primary text-white text-sm font-bold" to={`/admin/partners/${partner.id}`}>Xem chi tiết</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AdminLayout>
  )
}
