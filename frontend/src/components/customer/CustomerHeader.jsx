import { Link } from 'react-router-dom'

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
        </div>
      </div>
    </header>
  )
}
