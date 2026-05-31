import { useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { useShop } from '../../context/ShopContext'

const navItems = [
  { key: 'services', label: 'Dịch vụ', hash: '#services' },
  { key: 'staff', label: 'Nhân sự', hash: '#staff' },
  { key: 'contact', label: 'Liên hệ', hash: '#contact' },
  { key: 'bookings', label: 'Lịch hẹn của tôi', path: '/customer/bookings' }
]

export default function CustomerHeader({
  shopName,
  shopSlug,
  activeTab,
  onTabChange,
  greeting = '',
  address = ''
}) {
  const location = useLocation()
  const navigate = useNavigate()
  const params = useParams()
  const { shop, isAuthenticated, role, user, logout } = useShop()
  const [profileOpen, setProfileOpen] = useState(false)

  const resolvedSlug = shopSlug || params.slug || shop?.slug || ''
  const isCustomerArea = location.pathname.startsWith('/customer')
  const basePath = resolvedSlug ? `/${resolvedSlug}` : '/'
  const bookingPath = resolvedSlug ? `/${resolvedSlug}/book` : '/'
  const customerNavItems = [
    { key: 'book', label: 'Đặt lịch', path: bookingPath },
    { key: 'bookings', label: 'Lịch hẹn của tôi', path: '/customer/bookings' },
    { key: 'profile', label: 'Hồ sơ', path: '/customer/profile' }
  ]
  const headerNavItems = isCustomerArea ? customerNavItems : navItems
  const resolvedActiveTab = activeTab || (
    isCustomerArea
      ? (location.pathname.startsWith('/customer/profile') ? 'profile' : location.pathname.startsWith('/customer/bookings') ? 'bookings' : 'bookings')
      : (String(location.hash || '#services').replace('#', '') || 'services')
  )
  const displayName = shopName || shop?.name || 'LumiX'
  const displayAddress = address || shop?.address || ''
  const displayGreeting = greeting || (isAuthenticated && role === 'customer' ? `Xin chào ${user?.fullName || user?.email || 'Khách hàng'}.` : '')

  const handleNavClick = (event, item) => {
    onTabChange?.(item.key)
    if (isCustomerArea) return
    if (!item.hash) return

    const targetId = item.hash.replace('#', '')
    const sameHomePath = location.pathname === basePath

    if (sameHomePath) {
      event.preventDefault()
      if (location.hash !== item.hash) {
        navigate(`${basePath}${item.hash}`)
      }
      const target = document.getElementById(targetId)
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }
  }

  return (
    <header className="bg-white/80 backdrop-blur-xl border-b border-primary/20 sticky top-0 z-50 h-20 shadow-sm">
      <div className="max-w-[1440px] mx-auto px-6 md:px-10 flex justify-between items-center h-full gap-4">
        <div className="min-w-0">
          <Link to={basePath} className="font-h3 text-h3 tracking-tight text-primary block truncate">{displayName}</Link>
          {displayGreeting ? <p className="text-xs text-main/60 truncate">{displayGreeting}</p> : null}
        </div>

        <nav className="hidden md:flex gap-6 items-center">
          {headerNavItems.map((item) => {
            const to = item.path ? item.path : `${basePath}${item.hash}`
            const isActive = resolvedActiveTab === item.key
            return (
              <Link
                key={item.key}
                to={to}
                onClick={(event) => handleNavClick(event, item)}
                className={isActive
                  ? 'text-primary font-bold border-b-2 border-primary pb-1 whitespace-nowrap'
                  : 'text-main/70 hover:text-primary transition-colors whitespace-nowrap'}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="flex items-center gap-3">
          {displayAddress ? <div className="hidden xl:block text-sm text-main/60 max-w-[260px] truncate">{displayAddress}</div> : null}
          <div className="flex items-center gap-3 relative">
            <Link className="bg-primary text-white px-5 py-2.5 rounded-full font-bold hover:brightness-110 transition-all whitespace-nowrap" to={bookingPath}>
              Đặt lịch ngay
            </Link>
            {isAuthenticated && role === 'customer' ? (
              <div className="relative">
                <button type="button" onClick={() => setProfileOpen((v) => !v)} className="flex items-center gap-2 px-3 py-2 rounded-full border border-slate-200 bg-white hover:bg-slate-50">
                  <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold">
                    {(user?.fullName || user?.email || 'U').charAt(0).toUpperCase()}
                  </span>
                  <span className="hidden lg:block max-w-[140px] truncate text-sm font-semibold text-main">{user?.fullName || user?.email}</span>
                </button>
                {profileOpen ? (
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-lg p-2 z-50">
                    <Link to="/customer/profile" onClick={() => setProfileOpen(false)} className="block w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 text-sm">Chỉnh sửa hồ sơ</Link>
                    <button type="button" onClick={logout} className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 text-sm text-rose-600">Đăng xuất</button>
                  </div>
                ) : null}
              </div>
            ) : (
              <>
                <Link to="/login" className="hidden sm:inline-flex px-4 py-2 rounded-xl border border-slate-200 text-main hover:border-primary hover:text-primary transition-colors whitespace-nowrap">Đăng nhập</Link>
                <Link to="/customer/register" className="hidden sm:inline-flex px-4 py-2 rounded-xl bg-white border border-primary text-primary hover:bg-primary/5 font-semibold whitespace-nowrap">Đăng ký</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
