import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { useShop } from '../../context/ShopContext'

const navItems = [
   { key: 'partner-shops', label: 'Các cửa hàng đối tác', path: '/partner-shops' },
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
  const { shop, isAuthenticated, role, user, logout, customerLoyalty, loadCustomerLoyalty, token } = useShop()
  const [profileOpen, setProfileOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const resolvedSlug = shopSlug || params.slug || shop?.slug || ''
  const isCustomerArea = location.pathname.startsWith('/customer')
  const basePath = resolvedSlug ? `/${resolvedSlug}` : '/'
  const bookingPath = resolvedSlug ? `/${resolvedSlug}/book` : '/'
  const customerBookingsPath = resolvedSlug
    ? `/customer/bookings?shopSlug=${encodeURIComponent(resolvedSlug)}`
    : '/customer/bookings'
  const customerNavItems = [
    { key: 'book', label: 'Đặt lịch', path: bookingPath },
    { key: 'bookings', label: 'Lịch hẹn của tôi', path: customerBookingsPath },
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
  useEffect(() => {
    if (!isAuthenticated || role !== 'customer') return
    // Always refresh loyalty when entering customer area so points update after shop marks booking completed.
    void loadCustomerLoyalty(token).catch(() => {})
  }, [isAuthenticated, role, token, loadCustomerLoyalty, location.pathname])

  const loyaltyPoints = Math.max(0, Number(customerLoyalty?.pointsBalance || 0))
  const loyaltyValue = Math.max(0, Number(customerLoyalty?.redeemValueVnd || 0))


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

  const closeMobileMenu = () => setMobileMenuOpen(false)

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
          {/* {displayAddress ? <div className="hidden xl:block text-sm text-main/60 max-w-[260px] truncate">{displayAddress}</div> : null} */}
          <div className="flex items-center gap-3 relative">
            {isAuthenticated && role === 'customer' ? (
              <Link to="/customer/bookings" className="hidden lg:flex flex-col px-3 py-1.5 rounded-xl border border-primary/20 bg-primary/5 hover:bg-primary/10">
                <span className="text-[11px] text-primary/80 font-semibold leading-none">Điểm LumiX</span>
                <span className="text-sm font-bold text-primary leading-tight">{loyaltyPoints.toLocaleString('vi-VN')} điểm ≈ {loyaltyValue.toLocaleString('vi-VN')}đ</span>
              </Link>
            ) : null}
            <Link className="bg-primary text-white px-5 py-2.5 rounded-full font-bold hover:brightness-110 transition-all whitespace-nowrap" to={bookingPath}>
              Đặt lịch ngay
            </Link>

            <button
              type="button"
              className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-full border border-slate-200 bg-white hover:bg-slate-50 active:scale-95 transition"
              onClick={() => setMobileMenuOpen((v) => !v)}
              aria-label="Mở menu"
            >
              <span className="material-symbols-outlined">{mobileMenuOpen ? 'close' : 'menu'}</span>
            </button>

            {mobileMenuOpen ? (
              <div className="md:hidden absolute right-0 top-[52px] w-[280px] bg-white border border-slate-200 rounded-2xl shadow-xl p-2 z-50">
                <div className="px-2 py-2">
                  <div className="text-xs text-main/50">Menu</div>
                </div>

                {headerNavItems.map((item) => {
                  const to = item.path ? item.path : `${basePath}${item.hash}`
                  const isActive = resolvedActiveTab === item.key
                  return (
                    <Link
                      key={item.key}
                      to={to}
                      onClick={(event) => {
                        handleNavClick(event, item)
                        closeMobileMenu()
                      }}
                      className={
                        isActive
                          ? 'block px-3 py-2 rounded-xl bg-primary/5 text-primary font-bold'
                          : 'block px-3 py-2 rounded-xl hover:bg-slate-50 text-main'
                      }
                    >
                      {item.label}
                    </Link>
                  )
                })}

                <div className="h-px bg-slate-100 my-2" />

                {isAuthenticated && role === 'customer' ? (
                  <>
                    <Link to="/customer/profile" onClick={closeMobileMenu} className="block px-3 py-2 rounded-xl hover:bg-slate-50 text-main">
                      Chỉnh sửa hồ sơ
                    </Link>
                    <button type="button" onClick={() => { closeMobileMenu(); logout() }} className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 text-rose-600">
                      Đăng xuất
                    </button>
                  </>
                ) : (
                  <>
                    <Link to="/login" onClick={closeMobileMenu} className="block px-3 py-2 rounded-xl hover:bg-slate-50 text-main">
                      Đăng nhập
                    </Link>
                    <Link to="/customer/register" onClick={closeMobileMenu} className="block px-3 py-2 rounded-xl hover:bg-slate-50 text-main">
                      Đăng ký
                    </Link>
                  </>
                )}
              </div>
            ) : null}
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
