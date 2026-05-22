import { Link, useLocation, useNavigate } from 'react-router-dom'

const menus = [
  { to: '/shop/dashboard', icon: 'dashboard', label: 'Tổng quan' },
  { to: '/shop/bookings', icon: 'calendar_month', label: 'Lịch hẹn' },
  { to: '/shop/services', icon: 'spa', label: 'Dịch vụ' },
  { to: '/shop/staff', icon: 'group', label: 'Nhân sự' },
  { to: '/shop/wallet', icon: 'account_balance_wallet', label: 'Ví' },
  { to: '/shop/statistics', icon: 'leaderboard', label: 'Thống kê' }
]

export default function ShopSidebar({ onNewBooking }) {
  const location = useLocation()
  const navigate = useNavigate()
  const configActive = location.pathname.startsWith('/shop/config')

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-white/90 backdrop-blur-xl border-r border-slate-200 p-4 flex flex-col z-40">
      <div className="mb-8 px-2">
        <h1 className="font-h3 text-h3 text-primary font-bold">LumiX Partner</h1>
        <p className="text-sm text-main/70">Quản lý cửa hàng</p>
      </div>

      <button
        type="button"
        onClick={() => {
          if (onNewBooking) onNewBooking()
          navigate('/shop/bookings/new')
        }}
        className="w-full bg-primary text-white py-3 px-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg hover:scale-105 transition-transform active:scale-95"
      >
        <span className="material-symbols-outlined">add_circle</span>
        Tạo lịch hẹn mới
      </button>

      <nav className="flex-grow space-y-2 overflow-y-auto pr-1 pt-4">
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
        <Link
          to="/shop/config/shop"
          className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${
            configActive ? 'bg-primary/20 text-primary font-bold translate-x-1' : 'text-main hover:bg-slate-100'
          }`}
        >
          <span className="material-symbols-outlined">settings</span>
          <span className="font-label-bold text-label-bold">Cấu hình hệ thống</span>
        </Link>
        <button type="button" className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-red-600 hover:bg-red-50">
          <span className="material-symbols-outlined">logout</span>
          <span className="font-label-bold text-label-bold">Đăng xuất</span>
        </button>
      </div>
    </aside>
  )
}
