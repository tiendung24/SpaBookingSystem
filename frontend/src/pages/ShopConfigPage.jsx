import ShopSidebar from '../components/shop/ShopSidebar'
import SystemConfigTabs from '../components/shop/SystemConfigTabs'
import { useShop } from '../context/ShopContext'

function slugifyVietnamese(input) {
  return String(input || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\u0111/g, 'd')
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '')
}

function normalizePhone(input) {
  return String(input || '')
    .trim()
    .replace(/[\s.-]/g, '')
}

function isValidPhone(input) {
  if (!input) return true
  return /^(?:\+84|0)\d{9,10}$/.test(input)
}

function isValidSlug(input) {
  if (!input) return true
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(input)
}

export default function ShopConfigPage() {
  const { shop, setShop } = useShop()

  const update = (patch) => setShop((prev) => ({ ...prev, ...patch }))

  const slug = shop.slug || ''
  const phone = shop.phone || ''
  const slugValid = isValidSlug(slug)
  const phoneValid = isValidPhone(phone)

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
              <input
                className="w-full mt-1 p-3 rounded-xl border border-slate-300"
                value={shop.name || ''}
                onChange={(e) => update({ name: e.target.value })}
              />
            </div>

            <div>
              <label className="text-sm font-bold text-main/70">Slug</label>
              <input
                className={`w-full mt-1 p-3 rounded-xl border ${slugValid ? 'border-slate-300' : 'border-red-300'}`}
                value={slug}
                onChange={(e) => update({ slug: slugifyVietnamese(e.target.value) })}
                placeholder="vd: spa-quan-1"
              />
              <p className={`mt-1 text-xs ${slugValid ? 'text-main/60' : 'text-red-600'}`}>
                {slugValid ? 'Slug chỉ gồm a-z, 0-9 và dấu -.' : 'Slug không hợp lệ. Vui lòng chỉ dùng a-z, 0-9 và dấu -.'}
              </p>
            </div>

            <div>
              <label className="text-sm font-bold text-main/70">Số điện thoại</label>
              <input
                className={`w-full mt-1 p-3 rounded-xl border ${phoneValid ? 'border-slate-300' : 'border-red-300'}`}
                value={phone}
                onChange={(e) => update({ phone: normalizePhone(e.target.value) })}
                placeholder="0xxxxxxxxx hoặc +84xxxxxxxxx"
              />
              <p className={`mt-1 text-xs ${phoneValid ? 'text-main/60' : 'text-red-600'}`}>
                {phoneValid ? 'Định dạng hợp lệ: 0 hoặc +84, 10-11 số.' : 'Số điện thoại không hợp lệ.'}
              </p>
            </div>

            <div>
              <label className="text-sm font-bold text-main/70">Địa chỉ</label>
              <input
                className="w-full mt-1 p-3 rounded-xl border border-slate-300"
                value={shop.address || ''}
                onChange={(e) => update({ address: e.target.value })}
              />
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}