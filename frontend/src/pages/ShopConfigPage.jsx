import ShopSidebar from '../components/shop/ShopSidebar'
import SystemConfigTabs from '../components/shop/SystemConfigTabs'
import { useShop } from '../context/ShopContext'

export default function ShopConfigPage() {
  const { shop, setShop } = useShop()

  const update = (patch) => setShop((prev) => ({ ...prev, ...patch }))

  return (
    <div className="min-h-screen bg-slate-50 text-main">
      <ShopSidebar onNewBooking={() => {}} />
      <main className="ml-64 p-6 md:p-10">
        <header className="mb-10">
          <h1 className="font-h2 text-h2 text-primary">Cấu hình hệ thống</h1>
          <p className="text-main/70">Thông tin shop, thông báo và các thiết lập vận hành.</p>
        </header>

        <SystemConfigTabs />

        <section className="glass-card bg-white/70 rounded-3xl p-6">
          <h2 className="font-h3 text-h3 text-primary mb-4">Thông tin shop</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-bold text-main/70">Tên shop</label>
              <input className="w-full mt-1 p-3 rounded-xl border border-slate-300" value={shop.name || ''} onChange={(e) => update({ name: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-bold text-main/70">Slug</label>
              <input className="w-full mt-1 p-3 rounded-xl border border-slate-300" value={shop.slug || ''} onChange={(e) => update({ slug: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-bold text-main/70">Số điện thoại</label>
              <input className="w-full mt-1 p-3 rounded-xl border border-slate-300" value={shop.phone || ''} onChange={(e) => update({ phone: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-bold text-main/70">Địa chỉ</label>
              <input className="w-full mt-1 p-3 rounded-xl border border-slate-300" value={shop.address || ''} onChange={(e) => update({ address: e.target.value })} />
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

