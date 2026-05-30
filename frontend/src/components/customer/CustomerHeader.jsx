import { Link } from 'react-router-dom'
import { useState, useRef } from 'react'
import { useShop } from '../../context/ShopContext'
import CustomerProfilePage from '../../pages/CustomerProfilePage'

const navItems = [
  { key: 'services', label: 'Dịch vụ', hash: '#services' },
  { key: 'staff', label: 'Nhân sự', hash: '#staff' },
  { key: 'contact', label: 'Liên hệ', hash: '#contact' },
  { key: 'bookings', label: 'Lịch hẹn của tôi', path: '/customer/bookings' }
]

export default function CustomerHeader({
  shopName,
  shopSlug,
  activeTab = 'services',
  onTabChange,
  rightSlot = null,
  greeting = '',
  address = ''
}) {
  const basePath = shopSlug ? `/${shopSlug}` : ''
  const { isAuthenticated, user, logout } = useShop()
  const [openProfile, setOpenProfile] = useState(false)
  const dropdownRef = useRef(null)

  const handleLogout = async () => {
    try {
      await logout()
    } catch {
      // ignore
    }
  }

  return (
    <header className="bg-white/80 backdrop-blur-xl border-b border-primary/20 sticky top-0 z-50 h-20 shadow-sm">
      <div className="max-w-[1440px] mx-auto px-6 md:px-10 flex justify-between items-center h-full gap-4">
        <div>
          <h1 className="font-h3 text-h3 tracking-tight text-primary">{shopName || 'LumiX'}</h1>
          {greeting ? <p className="text-xs text-main/60">{greeting}</p> : null}
        </div>

        <nav className="hidden md:flex gap-6">
          {navItems.map((item) => {
            const to = item.path ? `${item.path}` : `${basePath}${item.hash}`
            const isActive = activeTab === item.key
            return (
              <Link
                key={item.key}
                to={to}
                onClick={() => onTabChange?.(item.key)}
                className={isActive
                  ? 'text-primary font-bold border-b-2 border-primary pb-1'
                  : 'text-main/70 hover:text-primary transition-colors'}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="flex items-center gap-3">
          {address ? <div className="hidden xl:block text-sm text-main/60 max-w-[260px] truncate">{address}</div> : null}
          {rightSlot}

          <div className="relative">
            <button
              type="button"
              onClick={() => setOpenProfile((s) => !s)}
              className="flex items-center gap-2 px-3 py-2 rounded-full hover:bg-slate-100"
            >
              <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">{(user?.fullName || user?.name || 'U').slice(0,1).toUpperCase()}</span>
              <span className="hidden sm:inline text-sm text-main/70">{user?.fullName || user?.name || (isAuthenticated ? 'Tài khoản' : 'Khách')}</span>
            </button>

            {openProfile ? (
              <div ref={dropdownRef} className="absolute right-0 mt-2 w-48 bg-white border rounded-2xl shadow-lg p-2 z-50">
                <button
                  type="button"
                  onClick={() => { setOpenProfile(false); /* open profile modal */ document.dispatchEvent(new CustomEvent('openCustomerProfile')) }}
                  className="w-full text-left px-3 py-2 rounded hover:bg-slate-50"
                >
                  Hồ sơ
                </button>
                <button
                  type="button"
                  onClick={() => { setOpenProfile(false); handleLogout() }}
                  className="w-full text-left px-3 py-2 rounded text-rose-600 hover:bg-slate-50"
                >
                  Đăng xuất
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Profile modal listener: pages can also listen for 'openCustomerProfile' event */}
      <CustomerProfileLauncher />
    </header>
  )
}

function CustomerProfileLauncher() {
  const [open, setOpen] = useState(false)
  // open when event fired
  if (typeof window !== 'undefined') {
    window.addEventListener('openCustomerProfile', () => setOpen(true))
  }
  return open ? <CustomerProfilePage isModal onClose={() => setOpen(false)} /> : null
}
