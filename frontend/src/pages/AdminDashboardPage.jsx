import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminLayout from '../components/admin/AdminLayout'
import AdminHeaderNav from '../components/admin/AdminHeaderNav'
import { useToast } from '../components/ui/ToastProvider'
import { useShop } from '../context/ShopContext'
import { apiRequest } from '../lib/api'

function formatVnd(value) {
  return `${Number(value || 0).toLocaleString('vi-VN')}đ`
}

function downloadCsv(filename, rows) {
  const escapeCell = (value) => {
    const text = String(value ?? '')
    if (text.includes(',') || text.includes('"') || text.includes('\n')) return `"${text.replace(/"/g, '""')}"`
    return text
  }
  const csv = rows.map((row) => row.map(escapeCell).join(',')).join('\n')
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export default function AdminDashboardPage() {
  const navigate = useNavigate()
  const { token } = useShop()
  const { pushToast } = useToast()
  const [metrics, setMetrics] = useState({ totalShops: 0, totalBookings: 0, totalFraudReports: 0 })
  const [shops, setShops] = useState([])
  const [frauds, setFrauds] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!token) return
    let mounted = true
    const run = async () => {
      setLoading(true)
      try {
        const [overviewRes, shopsRes, fraudRes] = await Promise.all([
          apiRequest('/api/admin/dashboard/overview', { token }),
          apiRequest('/api/admin/shops', { token }),
          apiRequest('/api/admin/fraud-reports', { token })
        ])
        if (!mounted) return
        setMetrics(overviewRes?.metrics || { totalShops: 0, totalBookings: 0, totalFraudReports: 0 })
        setShops(Array.isArray(shopsRes?.items) ? shopsRes.items : [])
        setFrauds(Array.isArray(fraudRes?.items) ? fraudRes.items : [])
      } catch (error) {
        pushToast({ type: 'error', title: 'Không tải được dashboard', message: error?.message || 'Lỗi không xác định' })
      } finally {
        if (mounted) setLoading(false)
      }
    }
    run()
    return () => { mounted = false }
  }, [token, pushToast])

  const stats = useMemo(() => {
    const totalPartners = shops.length
    const activePartners = shops.filter((p) => p.status === 'active').length
    const pendingPartners = shops.filter((p) => p.status === 'pending').length
    const inactivePartners = shops.filter((p) => p.status === 'inactive' || p.status === 'locked').length
    return {
      totalPartners: metrics.totalShops || totalPartners,
      activePartners,
      pendingPartners,
      inactivePartners,
      totalBookings: metrics.totalBookings || 0,
      totalFraudReports: metrics.totalFraudReports || frauds.length
    }
  }, [metrics, shops, frauds])

  const handleExportReport = () => {
    const rows = [['Section', 'Id', 'Name', 'Status', 'Phone', 'Email']]
    shops.forEach((s) => rows.push(['shop', s._id || s.id, s.name, s.status, s.phone || '', s.email || '']))
    frauds.forEach((f) => rows.push(['fraud', f._id || f.id, f.shopId || '', f.status || '', '', '']))
    downloadCsv(`lumix-admin-report-${new Date().toISOString().slice(0, 10)}.csv`, rows)
  }

  return (
    <AdminLayout>
      <header className="flex flex-col md:flex-row justify-between gap-4">
        <div>
          <h2 className="font-h2 text-h2 text-primary">Tổng quan hệ thống</h2>
          <p className="text-main/70">Theo dõi sức khỏe hệ thống, tăng trưởng đối tác và vận hành.</p>
          <AdminHeaderNav />
        </div>
        <div className="flex gap-2">
          <button className="px-5 py-3 rounded-xl bg-primary text-white font-bold" onClick={() => navigate('/admin/partners?create=1')}>Tạo đối tác</button>
          <button className="px-5 py-3 rounded-xl bg-white border border-slate-200 text-main font-bold" onClick={handleExportReport}>Xuất báo cáo</button>
        </div>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <article className="glass-card bg-white rounded-3xl p-6"><p className="text-sm text-main/60">Tổng đối tác</p><p className="text-3xl font-bold text-primary mt-1">{stats.totalPartners}</p></article>
        <article className="glass-card bg-white rounded-3xl p-6"><p className="text-sm text-main/60">Đang hoạt động</p><p className="text-3xl font-bold text-emerald-600 mt-1">{stats.activePartners}</p></article>
        <article className="glass-card bg-white rounded-3xl p-6"><p className="text-sm text-main/60">Chờ duyệt</p><p className="text-3xl font-bold text-amber-600 mt-1">{stats.pendingPartners}</p></article>
        <article className="glass-card bg-white rounded-3xl p-6"><p className="text-sm text-main/60">Booking toàn hệ thống</p><p className="text-3xl font-bold text-primary mt-1">{stats.totalBookings}</p></article>
      </section>

      <section className="glass-card bg-white rounded-3xl p-6">
        <p className="text-sm text-main/60 mb-3">Shop mới nhất {loading ? '(đang tải...)' : ''}</p>
        <div className="space-y-2">
          {shops.slice(0, 5).map((s) => (
            <div key={s._id} className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div>
                <p className="font-semibold">{s.name || '—'}</p>
                <p className="text-xs text-main/60">{s.phone || 'Chưa có SĐT'}</p>
              </div>
              <span className="text-sm text-main/70">{s.status || 'pending'}</span>
            </div>
          ))}
          {!shops.length && <p className="text-sm text-main/60">Chưa có dữ liệu shop.</p>}
        </div>
      </section>
    </AdminLayout>
  )
}
