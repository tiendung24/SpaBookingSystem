import { useMemo } from 'react'
import AdminLayout from '../components/admin/AdminLayout'
import AdminHeaderNav from '../components/admin/AdminHeaderNav'
import { adminIncidents, adminOnboardingRequests, adminPartners, adminTickets, adminTransactions } from '../data/adminMockData'

function formatVnd(value) {
  return `${Number(value || 0).toLocaleString('vi-VN')}đ`
}

export default function AdminDashboardPage() {
  const stats = useMemo(() => {
    const totalPartners = adminPartners.length
    const activePartners = adminPartners.filter((p) => p.status === 'active').length
    const pendingPartners = adminPartners.filter((p) => p.status === 'pending').length
    const inactivePartners = adminPartners.filter((p) => p.status === 'inactive').length
    const totalBookings = adminPartners.reduce((sum, p) => sum + p.monthlyBookings, 0)
    const totalWallet = adminPartners.reduce((sum, p) => sum + p.wallet, 0)
    const totalTopup = adminTransactions.filter((t) => t.type === 'topup' && t.status === 'success').reduce((sum, t) => sum + t.amount, 0)
    const openTickets = adminTickets.filter((t) => t.status !== 'resolved').length
    return { totalPartners, activePartners, pendingPartners, inactivePartners, totalBookings, totalWallet, totalTopup, openTickets }
  }, [])

  return (
    <AdminLayout>
      <header className="flex flex-col md:flex-row justify-between gap-4">
        <div>
          <h2 className="font-h2 text-h2 text-primary">Tổng quan hệ thống</h2>
          <p className="text-main/70">Theo dõi sức khỏe hệ thống, tăng trưởng đối tác và vận hành.</p>
          <AdminHeaderNav />
        </div>
        <div className="flex gap-2">
          <button className="px-5 py-3 rounded-xl bg-primary text-white font-bold shadow-lg hover:brightness-110">Tạo đối tác</button>
          <button className="px-5 py-3 rounded-xl bg-white border border-slate-200 text-main font-bold hover:bg-slate-50">Xuất báo cáo</button>
        </div>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <article className="glass-card bg-white rounded-3xl p-6">
          <p className="text-sm text-main/60">Tổng đối tác</p>
          <p className="text-3xl font-bold text-primary mt-1">{stats.totalPartners}</p>
          <p className="text-sm text-main/60 mt-2">Đang hoạt động: <b className="text-emerald-600">{stats.activePartners}</b></p>
        </article>
        <article className="glass-card bg-white rounded-3xl p-6">
          <p className="text-sm text-main/60">Chờ duyệt / onboarding</p>
          <p className="text-3xl font-bold text-amber-600 mt-1">{stats.pendingPartners}</p>
          <p className="text-sm text-main/60 mt-2">Request mới: <b className="text-primary">{adminOnboardingRequests.length}</b></p>
        </article>
        <article className="glass-card bg-white rounded-3xl p-6">
          <p className="text-sm text-main/60">Ví LumiX (tổng)</p>
          <p className="text-3xl font-bold text-primary mt-1">{formatVnd(stats.totalWallet)}</p>
          <p className="text-sm text-main/60 mt-2">Topup hôm nay (mock): <b className="text-primary">{formatVnd(stats.totalTopup)}</b></p>
        </article>
        <article className="glass-card bg-white rounded-3xl p-6">
          <p className="text-sm text-main/60">Ticket hỗ trợ mở</p>
          <p className="text-3xl font-bold text-rose-600 mt-1">{stats.openTickets}</p>
          <p className="text-sm text-main/60 mt-2">Sự cố rủi ro: <b className="text-primary">{adminIncidents.length}</b></p>
        </article>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <article className="glass-card bg-white rounded-3xl p-6 space-y-3">
          <h4 className="font-h3 text-h3 text-primary">Cảnh báo vận hành</h4>
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-sm">
            Có <b>{stats.pendingPartners}</b> đối tác đang chờ duyệt / hoàn tất onboarding.
          </div>
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-main/70 text-sm">
            Gợi ý: theo dõi tỉ lệ hủy/no-show bất thường và ngưỡng ví tối thiểu.
          </div>
        </article>

        <article className="glass-card bg-white rounded-3xl p-6 xl:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-h3 text-h3 text-primary">Tình trạng hệ thống</h4>
            <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">All systems nominal</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: 'API', value: 'OK', color: 'text-emerald-600' },
              { label: 'PayOS', value: 'OK', color: 'text-emerald-600' },
              { label: 'Notification', value: 'OK', color: 'text-emerald-600' }
            ].map((item) => (
              <div key={item.label} className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <p className="text-sm text-main/60">{item.label}</p>
                <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
              </div>
            ))}
          </div>
        </article>
      </section>
    </AdminLayout>
  )
}

