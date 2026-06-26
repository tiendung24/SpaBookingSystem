import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useShop } from '../../context/ShopContext'
import LumiXLogo from '../../assets/lumix-logo.png'

const menus = [
  { to: '/shop/dashboard', icon: 'dashboard', label: 'Tổng quan' },
  { to: '/shop/bookings', icon: 'calendar_month', label: 'Lịch hẹn' },
  { to: '/shop/schedule', icon: 'event_available', label: 'Theo dõi Slot' },
  { to: '/shop/services', icon: 'spa', label: 'Dịch vụ' },
  { to: '/shop/staff', icon: 'group', label: 'Nhân sự' },
  { to: '/shop/wallet', icon: 'account_balance_wallet', label: 'Ví' },
  { to: '/shop/statistics', icon: 'leaderboard', label: 'Thống kê' }
]

export default function ShopSidebar({ onNewBooking }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { logout, unreadNotificationCount, shop } = useShop()
  const configActive = location.pathname.startsWith('/shop/config')
  const walletBalance = Number(shop.wallet?.balance || 0)
  const walletMinBalance = Number(shop.wallet?.minBalance || 100000)
  const isWalletHealthy = walletBalance >= walletMinBalance

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-white/90 backdrop-blur-xl border-r border-slate-200 p-4 flex flex-col z-40">
      <div className="mb-8 px-2">
        <div className="flex items-center gap-3">
          <img src={LumiXLogo} alt="LumiX" className="h-9 w-auto" />
          <div className="min-w-0">
            <h1 className="font-h3 text-h3 text-primary font-bold leading-tight">LumiX Partner</h1>
            <p className="text-sm text-main/70">Quản lý cửa hàng</p>
          </div>
        </div>
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

      <div className={`mt-4 rounded-2xl border px-4 py-3 ${isWalletHealthy ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`}>
        <div className="flex items-start gap-3">
          <span className={`material-symbols-outlined ${isWalletHealthy ? 'text-emerald-600' : 'text-amber-700'}`}>
            {isWalletHealthy ? 'check_circle' : 'warning'}
          </span>
          <div className="min-w-0">
            <p className={`text-sm font-bold ${isWalletHealthy ? 'text-emerald-700' : 'text-amber-800'}`}>
              {isWalletHealthy ? 'Ví LumiX đang hoạt động' : 'Ví LumiX dưới mức duy trì'}
            </p>
            <p className="text-xs text-main/70 mt-1">
              {isWalletHealthy
                ? `Số dư ${walletBalance.toLocaleString('vi-VN')}đ, ngưỡng tối thiểu ${walletMinBalance.toLocaleString('vi-VN')}đ.`
                : `Còn ${walletBalance.toLocaleString('vi-VN')}đ. Cần nạp tối thiểu ${walletMinBalance.toLocaleString('vi-VN')}đ để link hoạt động.`}
            </p>
          </div>
        </div>
      </div>

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
                {menu.to === '/shop/bookings' && unreadNotificationCount > 0 ? (
                  <span className="ml-auto min-w-6 h-6 px-2 rounded-full bg-rose-500 text-white text-xs font-bold flex items-center justify-center">
                    {unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}
                  </span>
                ) : null}
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
        <button type="button" className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-red-600 hover:bg-red-50" onClick={() => { logout(); navigate('/login') }}>
          <span className="material-symbols-outlined">logout</span>
          <span className="font-label-bold text-label-bold">Đăng xuất</span>
        </button>
      </div>
    </aside>
  )
}

