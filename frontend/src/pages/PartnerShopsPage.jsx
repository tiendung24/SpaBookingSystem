import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { apiRequest } from '../lib/api'

const fallbackImages = [
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBu_3a1O6wyzqN-UXiVV1EOXOH0FjB95HD-HSD0qLEOrg46l1aaqyJpU283cGDugATKpYkN7Ito7bAPgo6_A-clkKtqNgvkhiHDhbrMgB9ec7hpjhpWWZzvUPVAqVHPwrlg4sTRkRuV9tHfB9CbJlfO4JmKI_yTxSVCDL7eKrq6DUxPibiVESP2CTEF5vKknSjm5IgbnDaLg1jKWi6AoatL4lKvqKLu-ytKC7JNPZUn4f3bKh1cp9tZuHbG4fI1W_b-flpxn31sLH19',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuC-o33JdlTelOfJiw32EfTaPxK664ZRE8RkpphaT0jgrxqVJaXQbrfhDFV8rzqKTaKHCjOIQAY6hexLHHDcthCwE_VmhCuwWjB0VWeSCVx16CcctE4Lmqfre6X8ILDz3d5qZcXZs7Lv8uxs77UZVufQrKB-mTNwD16g44Jrkl8rpOBi90SeWbfbdo12oJZ6nmQQBx51__U6YgwwDRGysFsJVwPwDEAyD5cqyxhx6gzdDLlLghfADlaTDqak1-SBoDbg5mjNZ5N0n4IT',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCAyHB075jhxsuV9V-TicuKqsVbEW7UhB9HGQ-t-EbBuwDSF95mEUdUYrK87l_Q_uIWiX3pJ0i4425KhCzoFB4TtuaBiuVup7Gk4V6RwYvFspVyCrdkCIiewo3KS9WNPPACK5BiZ2x_yhHmJfW1qTCYbMapCwJuTXGIQHkiZZv-TJkRgRTIwX9pyD9krzeErzTNAPzFsImv9TuBW75mxKtB6C_UV7iomodVsc6udSQKcCU4hC9qcumKgxb2HZfdtSN-QMcOrvsXf-Qs',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBTbJjhqY77xOUV52Ek6d2FKnLvhHH6ehjXRkOdU9os0mVTuXeXIb_ff4BLo3FdHOQPPhEglNllhKg2MyN3SMs8EoOEjHwxLZIk3r_TdrjPlz3mDxJRKtiU8_UPAiCKarRQSwAaRnT9OpZ3-KfU3UlNY3EmwrH19u2f9900G4WA9vLxOM4-qw0SpKvDrg32LlcpY9r5W-xRLRmYQaCW05k5LHzXV_kjLZhBIFK3l8eC_NeJRMEcyFNnmg9DBie7eGUD_2NvWiODhyeA',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAvk5AmyZ0YRyEYEPtFfMy7KnXannIw2KeoFKReRtdn2Xw9Ws0bwHFJPMMBxfI0d7gG1XKFgsaAjrRaz2gAgPJ1TB5YvVfN__jkdZzLxwL4FdL7EPfV-YNajpQignsCyWNPbeDa65k7Ryc43HQjAkkBAARDyLeFVGA9HUleOe6RtOhF-J7l-ZkjcXD6BmFBHwJLz9iL7nsvvN0gulloVQJUgTFeIZ7v4uxji8zH6QWE1kQuFwxNk1j9R-EjJD_PXJshQi_mgaoo5nbf',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDVGvQ1pz0Lptd-bWDjmKD2PsbxrmB1dOTQceazSJcxubVGZA0wYdlK9unSwFWt2r1rEmX414qRakaCLpx6Tegc9nuNllqoVaQf_gJVFDsxj6JzPrTPLhE7bgHGnzDSLZZPwJQC62--NhGRc6naQ1FuiYPFdcYEN70ciFv6UnaPnleB6FfZlhsuRRCTcJAMyg_l632gstaUuvYDlITBXA-nRKGKrDgXceb3H1N-n8M_J24n1Pe5FKWXf7OKSv4DA5nu6GrHAlKxBdeW'
]

function getAddress(shop) {
  const address = shop?.address
  if (typeof address === 'string') {
    const text = address.trim()
    return text || 'Đang cập nhật địa chỉ'
  }
  const obj = address || {}
  return String(obj.fullText || [obj.line1, obj.district, obj.city].filter(Boolean).join(', ') || 'Đang cập nhật địa chỉ').trim()
}

function getCover(shop, index) {
  return shop.coverUrl || shop.logoUrl || fallbackImages[index % fallbackImages.length]
}

export default function PartnerShopsPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const initialQuery = new URLSearchParams(location.search).get('q') || ''
  const [query, setQuery] = useState(initialQuery)
  const [shops, setShops] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [page, setPage] = useState(1)

  const pageSize = 6
  const totalPages = Math.max(1, Math.ceil(shops.length / pageSize))
  const visibleShops = useMemo(() => shops.slice((page - 1) * pageSize, page * pageSize), [shops, page])

  const fetchShops = async (q = '') => {
    setLoading(true)
    setLoadError('')
    try {
      const res = await apiRequest(`/api/public/shops?q=${encodeURIComponent(q || '')}&limit=48`)
      try { console.log('[PartnerShopsPage] public shops fetched', { q, count: Array.isArray(res?.items) ? res.items.length : 0, res }) } catch {}
      setShops(Array.isArray(res?.items) ? res.items : [])
      setPage(1)
    } catch (error) {
      try { console.error('[PartnerShopsPage] public shops failed', error) } catch {}
      setShops([])
      setLoadError(error?.message || 'Không tải được danh sách cửa hàng từ backend.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const q = new URLSearchParams(location.search).get('q') || ''
    setQuery(q)
    void fetchShops(q)
  }, [location.search])

  const onSearch = (event) => {
    event.preventDefault()
    const q = String(query || '').trim()
    navigate(`/partner-shops${q ? `?q=${encodeURIComponent(q)}` : ''}`)
  }

  return (
    <div className="min-h-screen bg-[#f9f9ff] text-[#111c2c] selection:bg-[#5ea4b8]/30" style={{ fontFamily: 'Nunito Sans, sans-serif' }}>
      <header className="fixed top-0 w-full z-50 bg-[#f9f9ff]/70 backdrop-blur-xl border-b border-[#14677a]/10 shadow-[0_20px_40px_rgba(94,164,184,0.12)]">
        <div className="flex justify-between items-center px-6 md:px-10 py-4 max-w-[1440px] mx-auto relative">
          <Link to="/" className="font-bold text-[#14677a] tracking-tight text-3xl" style={{ fontFamily: 'Quicksand, sans-serif' }}>
            LumiX
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-base absolute left-1/2 -translate-x-1/2">
            <Link className="text-[#3f484b] hover:text-[#14677a] transition-colors" to="/">Tổng quan</Link>
            <Link className="text-[#14677a] font-bold" to="/partner-shops">Cửa hàng đối tác</Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link to="/shop-landing" className="bg-[#14677a] text-white px-6 py-2.5 rounded-full font-bold tracking-wide hover:shadow-lg hover:shadow-[#14677a]/20 transition-all active:scale-95">
              Đăng ký làm đối tác
            </Link>
          </div>
        </div>
      </header>

      <main className="pt-32 pb-20 px-6 md:px-10 max-w-[1440px] mx-auto">
        <section className="mb-16">
          <div className="text-center mb-10">
            <h1 className="text-4xl md:text-5xl font-bold text-[#111c2c] mb-4 tracking-tight" style={{ fontFamily: 'Quicksand, sans-serif' }}>
              Cửa hàng đối tác
            </h1>
            <p className="text-[#3f484b] text-lg">Khám phá thiên đường làm đẹp tại LumiX</p>
          </div>

          <form onSubmit={onSearch} className="max-w-4xl mx-auto bg-white/70 backdrop-blur-[20px] border border-[#14677a]/10 p-3 rounded-full shadow-[0_20px_40px_rgba(94,164,184,0.12)] flex flex-col md:flex-row gap-2">
            <div className="flex-1 flex items-center px-6 gap-3 border-b md:border-b-0 md:border-r border-[#bfc8cc]/30 py-2 md:py-0">
              <span className="material-symbols-outlined text-[#5ea4b8]">search</span>
              <input
                className="w-full bg-transparent border-none focus:ring-0 text-[#111c2c] placeholder:text-[#6f797c] py-2"
                placeholder="Tìm kiếm cửa hàng spa/salon, địa điểm"
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <button className="bg-[#14677a] text-white px-10 py-3 rounded-full font-bold text-md hover:brightness-110 transition-all active:scale-95 shadow-md" type="submit">
              {loading ? 'Đang tìm...' : 'Tìm kiếm'}
            </button>
          </form>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {visibleShops.map((shop, index) => (
            <article key={shop.id || shop.slug} className="group bg-white/70 backdrop-blur-[20px] rounded-3xl overflow-hidden hover:shadow-[0_32px_64px_rgba(94,164,184,0.18)] transition-all duration-500 flex flex-col border border-white/40">
              <div className="relative h-64 overflow-hidden">
                <img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={shop.name} src={getCover(shop, index)} />
                <div className="absolute top-4 left-4 bg-white/80 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
                  <span className="material-symbols-outlined text-yellow-500 text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  <span className="text-sm font-bold text-[#111c2c]">LumiX</span>
                </div>
              </div>
              <div className="p-8 flex flex-col flex-1">
                <h3 className="text-2xl font-bold text-[#111c2c] mb-2" style={{ fontFamily: 'Quicksand, sans-serif' }}>{shop.name}</h3>
                <p className="text-[#3f484b] text-md mb-6 flex items-start gap-2">
                  <span className="material-symbols-outlined text-[#14677a] text-lg">location_on</span>
                  {getAddress(shop)}
                </p>
                {Array.isArray(shop.businessTypes) && shop.businessTypes.length ? (
                  <div className="mb-6 flex flex-wrap gap-2">
                    {shop.businessTypes.slice(0, 3).map((type) => (
                      <span key={type} className="px-3 py-1 rounded-full bg-[#14677a]/5 text-[#14677a] text-xs font-bold">{type}</span>
                    ))}
                  </div>
                ) : null}
                <div className="mt-auto flex gap-3">
                  <Link to={`/${shop.slug}`} className="flex-1 text-center py-3 px-4 rounded-2xl border border-[#14677a]/20 text-[#14677a] font-bold hover:bg-[#14677a]/5 transition-all active:scale-95">
                    Chi tiết
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </section>

        {loadError ? (
          <div className="mt-12 rounded-3xl bg-white/70 border border-red-200 p-10 text-center text-red-600">
            {loadError}
          </div>
        ) : null}

        {!loadError && !visibleShops.length ? (
          <div className="mt-12 rounded-3xl bg-white/70 border border-[#14677a]/10 p-10 text-center text-[#3f484b]">
            {loading ? 'Đang tải danh sách cửa hàng...' : 'Chưa có cửa hàng đối tác phù hợp.'}
          </div>
        ) : null}

        {shops.length > pageSize ? (
          <nav className="mt-20 flex justify-center items-center gap-3">
            <button
              className="w-12 h-12 flex items-center justify-center rounded-full border border-[#14677a]/10 text-[#3f484b] hover:bg-[#14677a]/5 transition-all disabled:opacity-40"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              type="button"
            >
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
            {Array.from({ length: totalPages }).slice(0, 5).map((_, i) => {
              const pageNumber = i + 1
              const active = pageNumber === page
              return (
                <button
                  key={pageNumber}
                  className={`w-12 h-12 flex items-center justify-center rounded-full font-bold transition-all ${active ? 'bg-[#14677a] text-white shadow-md shadow-[#14677a]/20' : 'bg-white border border-[#14677a]/10 text-[#3f484b] hover:bg-[#14677a]/5'}`}
                  onClick={() => setPage(pageNumber)}
                  type="button"
                >
                  {pageNumber}
                </button>
              )
            })}
            <button
              className="w-12 h-12 flex items-center justify-center rounded-full border border-[#14677a]/10 text-[#3f484b] hover:bg-[#14677a]/5 transition-all disabled:opacity-40"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              type="button"
            >
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </nav>
        ) : null}
      </main>
    </div>
  )
}
