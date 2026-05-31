import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { apiRequest } from '../lib/api'

function safeText(value) {
  return String(value || '').trim()
}

function buildShopLocation(shop) {
  const address = shop?.address || {}
  return safeText(address.fullText) || [address.district, address.city].filter(Boolean).join(', ') || '—'
}

const heroImageUrl =
  'https://lh3.googleusercontent.com/aida/ADBb0uhwDGZpSodoXlb4EzkEERsps1TN9DTccujJvi2s90ftR6gzYt5DI62TxGjcLhLEwhr2tpHBDonxEo9bppoU2q_HCEnFqo49BxJQKIIq5RTEXv90y-8r3YX3ycwxG0n6ScAk6RDaFZhm7bp53vD_YvFHjJSpJgnRKOfMxir7rioE5dquh43993Dh7jbq79IEwiQdorJJNoIE4HIWQMXPece322awNhRe_xLwcfcuNYgQZOPASJLEDBD7awCT'

export default function PlatformLandingPage() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [shops, setShops] = useState([])
  const [loading, setLoading] = useState(false)

  const topShops = useMemo(() => shops.slice(0, 4), [shops])

  const fetchShops = async (q = '') => {
    setLoading(true)
    try {
      const res = await apiRequest(`/api/public/shops?q=${encodeURIComponent(q || '')}&limit=16`)
      setShops(Array.isArray(res?.items) ? res.items : [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchShops('')
  }, [])

  const onSearch = (e) => {
    e?.preventDefault?.()
    const q = String(query || '').trim()
    navigate(`/partner-shops${q ? `?q=${encodeURIComponent(q)}` : ''}`)
  }

  return (
    <div className="bg-surface text-on-background font-body-md selection:bg-primary-container selection:text-on-primary-container">
      <header className="bg-white/80 backdrop-blur-xl border-b border-primary/10 w-full top-0 sticky z-50 shadow-sm">
        <div className="max-w-[1440px] mx-auto px-6 md:px-10 flex justify-between items-center h-20">
          <div className="flex items-center gap-4">
            <span className="font-display-lg text-headline-md tracking-tight text-primary">LumiX</span>
          </div>
          <nav className="hidden lg:flex items-center gap-8">
            <a className="font-title-lg text-on-surface-variant hover:text-primary transition-all" href="#">Tổng quan</a>
            <a className="font-title-lg text-on-surface-variant hover:text-primary transition-all" href="#search-section">Cửa hàng đối tác</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link to="/shop-landing" className="text-primary border border-primary px-6 py-2.5 rounded-full font-title-lg hover:bg-primary/5 active:scale-95 transition-all">
              Đăng ký làm đối tác
            </Link>
            <Link to="/partner-shops" className="bg-primary text-on-primary px-8 py-2.5 rounded-full font-title-lg hover:brightness-110 active:scale-95 transition-all shadow-md">
              Đặt lịch ngay
            </Link>
          </div>
        </div>
      </header>

      <section className="relative h-[600px] w-full overflow-hidden">
        <img alt="Luxury Spa Experience" className="absolute inset-0 w-full h-full object-cover" src={heroImageUrl} />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent flex items-center">
          <div className="max-w-[1440px] mx-auto px-6 md:px-10 w-full">
            <div className="max-w-2xl text-white">
              <h1 className="font-display-lg text-[56px] leading-[1.1] mb-4 drop-shadow-lg">Khám Phá Thiên Đường Làm Đẹp Tại LumiX</h1>
              <p className="font-body-lg text-white/90 mb-8 max-w-xl">
                Tìm kiếm, đặt lịch và trải nghiệm những dịch vụ Spa & Salon đẳng cấp nhất với LumiX Partner. Tiện lợi, nhanh chóng và luôn có ưu đãi.
              </p>
              <div>
                <a
                  className="inline-flex items-center gap-3 bg-white/95 px-6 py-3 rounded-xl shadow-xl border font-bold transition-all hover:scale-105 active:scale-95 group border-primary/20 text-primary"
                  href="#search-section"
                >
                  <span className="font-title-lg text-lg tracking-wide group-hover:underline">Hãy sử dụng nền tảng LumiX ngay</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="max-w-[1440px] mx-auto px-6 md:px-10">
        <section className="mb-16 -mt-12 relative z-10" id="search-section">
          <form onSubmit={onSearch} className="bg-white p-6 rounded-2xl shadow-xl border border-primary/5 flex flex-col lg:flex-row items-center gap-6">
            <div className="relative flex-grow w-full">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-primary">search</span>
              <input
                className="bg-surface-container-low border-none rounded-xl pl-12 pr-6 py-4 w-full focus:ring-2 focus:ring-primary/30 font-body-md transition-all text-on-surface"
                placeholder="Tìm kiếm cửa hàng spa/salon, địa điểm"
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide py-1 w-full lg:w-auto">
              <button type="submit" className="px-6 py-3 rounded-xl bg-primary text-on-primary font-title-lg whitespace-nowrap shadow-sm">
                {loading ? 'Đang tìm...' : 'Tìm kiếm'}
              </button>
              <Link to="/partner-shops" className="px-6 py-3 rounded-xl bg-white border border-primary text-primary font-title-lg whitespace-nowrap hover:bg-primary/5">
                Cửa hàng đối tác
              </Link>
            </div>
          </form>
        </section>

        <section className="mb-16">
          <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
            <div className="max-w-xl">
              <span className="text-primary font-label-md uppercase tracking-widest mb-2 block">Khám phá</span>
              <h2 className="font-headline-lg text-headline-lg text-on-surface">Tất cả cửa hàng đối tác</h2>
            </div>
            <div className="flex items-center gap-3">
              <Link to="/partner-shops" className="border border-primary text-primary px-6 py-3 rounded-full font-title-lg hover:bg-primary/5 transition-all">
                Xem tất cả
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {topShops.map((shop) => (
              <div key={shop.id} className="bg-white rounded-2xl overflow-hidden border border-outline-variant/30 hover:shadow-2xl transition-all group">
                <div className="aspect-video overflow-hidden">
                  <img
                    alt={shop.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    src={shop.coverUrl || shop.logoUrl || heroImageUrl}
                  />
                </div>
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-title-lg text-on-surface">{shop.name}</h3>
                  </div>
                  <p className="text-on-surface-variant text-caption mb-4 flex items-center">
                    <span className="material-symbols-outlined text-sm mr-1">location_on</span>
                    {buildShopLocation(shop)}
                  </p>
                  <Link
                    to={`/${shop.slug}`}
                    className="w-full inline-flex justify-center bg-primary-container/10 text-primary py-2 rounded-xl font-title-lg hover:bg-primary hover:text-white transition-all"
                  >
                    Chi tiết
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {!topShops.length ? (
            <div className="mt-8 text-center text-on-surface-variant">Chưa có cửa hàng đối tác để hiển thị.</div>
          ) : null}
        </section>

        <section className="mb-16">
          <div className="text-center mb-8">
            <span className="text-primary font-label-md uppercase tracking-widest mb-2 block">Về chúng tôi</span>
            <h2 className="font-headline-lg text-headline-lg text-on-surface">Giải Pháp Làm Đẹp Thông Minh LumiX</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-8 rounded-2xl border border-outline-variant/30 hover:border-primary/30 transition-all group">
              <div className="w-16 h-16 bg-primary-container/10 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-primary text-4xl">calendar_month</span>
              </div>
              <h3 className="font-headline-md text-on-surface mb-3">Đặt lịch liền tay</h3>
              <p className="text-on-surface-variant font-body-md">Không còn phải chờ đợi hay gọi điện. Chỉ với vài cú chạm, bạn đã có thể giữ chỗ tại cơ sở yêu thích vào bất kỳ lúc nào.</p>
            </div>
            <div className="bg-white p-8 rounded-2xl border border-outline-variant/30 hover:border-primary/30 transition-all group">
              <div className="w-16 h-16 bg-primary-container/10 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-primary text-4xl">inventory_2</span>
              </div>
              <h3 className="font-headline-md text-on-surface mb-3">Quản lý thông minh</h3>
              <p className="text-on-surface-variant font-body-md">Theo dõi lịch hẹn, nhắc lịch tự động và lưu lại lịch sử làm đẹp của bạn một cách khoa học nhất.</p>
            </div>
            <div className="bg-white p-8 rounded-2xl border border-outline-variant/30 hover:border-primary/30 transition-all group">
              <div className="w-16 h-16 bg-primary-container/10 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-primary text-4xl">verified_user</span>
              </div>
              <h3 className="font-headline-md text-on-surface mb-3">Trải nghiệm cao cấp</h3>
              <p className="text-on-surface-variant font-body-md">Chúng tôi kết nối bạn với những đối tác hàng đầu, đảm bảo chất lượng dịch vụ chuẩn 5 sao và quy trình chuyên nghiệp.</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-surface-container-highest border-t border-outline-variant w-full">
        <div className="py-8 px-6 md:px-10 max-w-[1440px] mx-auto flex flex-col md:flex-row justify-between items-center">
          <div className="flex flex-col gap-2 mb-4 md:mb-0">
            <span className="font-label-md text-label-md uppercase tracking-widest text-primary">LUMIX</span>
            <p className="font-caption text-caption text-on-surface-variant max-w-xs">Giải pháp quản lý và đặt lịch hàng đầu cho ngành làm đẹp tại Việt Nam.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-8">
            <a className="font-caption text-caption text-on-surface-variant hover:text-primary transition-all" href="https://www.lumix.io.vn">www.lumix.io.vn</a>
            <a className="font-caption text-caption text-on-surface-variant hover:text-primary transition-all" href="tel:0352033029">0352033029</a>
            <span className="font-caption text-caption text-on-surface-variant">Fanpage: Trạm đặt lịch - LumiX</span>
          </div>
          <p className="font-caption text-caption text-on-surface-variant mt-4 md:mt-0">© 2026 LumiX</p>
        </div>
      </footer>
    </div>
  )
}
