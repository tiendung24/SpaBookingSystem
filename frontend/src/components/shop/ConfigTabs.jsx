import { Link, useLocation } from 'react-router-dom';

const tabs = [
  { to: '/shop/config/deposit', label: 'Đặt cọc & chính sách', icon: 'payments' },
  { to: '/shop/config/slots', label: 'Slot & giờ hoạt động', icon: 'schedule' }
];

export default function ConfigTabs() {
  const location = useLocation();

  return (
    <div className="mb-8 flex flex-wrap gap-3">
      {tabs.map((tab) => {
        const active = location.pathname === tab.to;
        return (
          <Link
            key={tab.to}
            to={tab.to}
            className={`inline-flex items-center gap-2 px-5 py-3 rounded-full border transition-all ${
              active
                ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20'
                : 'bg-white/70 text-main border-slate-200 hover:border-primary hover:text-primary'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">{tab.icon}</span>
            <span className="font-label-bold text-label-bold">{tab.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
