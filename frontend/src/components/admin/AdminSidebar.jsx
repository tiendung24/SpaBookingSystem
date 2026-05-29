import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useShop } from '../../context/ShopContext'

const menus = [
  { to: '/admin/dashboard', icon: 'space_dashboard', label: 'Tổng quan hệ thống' },
  { to: '/admin/partners', icon: 'handshake', label: 'Quản lý đối tác' },
  { to: '/admin/approvals', icon: 'fact_check', label: 'Duyệt onboarding' },
  { to: '/admin/finance', icon: 'account_balance', label: 'Tài chính hệ thống' },
  { to: '/admin/risk', icon: 'gpp_maybe', label: 'Rủi ro & gian lận' },
  { to: '/admin/support', icon: 'support_agent', label: 'Hỗ trợ đối tác' },
  { to: '/admin/settings', icon: 'tune', label: 'Cấu hình hệ thống' }
]

export default function AdminSidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { logout } = useShop()

  return (
    <aside className="fixed left-0 top-0 h-full w-72 bg-white/90 backdrop-blur-xl border-r border-slate-200 p-4 flex flex-col z-40">
      <div className="mb-8 px-2">
        <h1 className="font-h3 text-h3 text-primary font-bold">LumiX Admin</h1>
        <p className="text-sm text-main/70">Điều hành hệ thống</p>
      </div>

      <nav className="flex-grow space-y-2 overflow-y-auto pr-1">
        {menus.map((menu) => {
          const active = location.pathname === menu.to
          return (
            <Link
              key={menu.to}
              to={menu.to}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all ${
                active ? 'bg-primary/20 text-primary font-bold translate-x-1' : 'text-main hover:bg-slate-100'
              }`}
            >
              <span className="material-symbols-outlined">{menu.icon}</span>
              <span className="font-label-bold text-label-bold">{menu.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="mt-auto border-t border-slate-200 pt-3 space-y-2">
        <button type="button" className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-red-600 hover:bg-red-50" onClick={() => { logout(); navigate("/login") }}>
          <span className="material-symbols-outlined">logout</span>
          <span className="font-label-bold text-label-bold">Đăng xuất</span>
        </button>
      </div>
    </aside>
  )
}
