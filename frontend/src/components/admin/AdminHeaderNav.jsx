import { Link, useLocation } from 'react-router-dom'

const items = [
  { to: '/admin/dashboard', label: 'Tổng quan' },
  { to: '/admin/partners', label: 'Đối tác' },
  { to: '/admin/approvals', label: 'Duyệt shop' },
  { to: '/admin/finance', label: 'Tài chính' },
  { to: '/admin/payouts', label: 'Rút tiền' },
  { to: '/admin/risk', label: 'Rủi ro' },
  { to: '/admin/support', label: 'Hỗ trợ' },
  { to: '/admin/settings', label: 'Cấu hình' }
]

export default function AdminHeaderNav() {
  const location = useLocation()

  return (
    <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1">
      {items.map((item) => {
        const active = location.pathname === item.to

        return (
          <Link
            key={item.to}
            to={item.to}
            className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-colors ${
              active ? 'bg-primary text-white' : 'bg-slate-100 text-main/70 hover:bg-slate-200'
            }`}
          >
            {item.label}
          </Link>
        )
      })}
    </div>
  )
}
