import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { apiRequest } from '../lib/api'

const heroImageUrl = 'https://lh3.googleusercontent.com/aida/ADBb0uhwDGZpSodoXlb4EzkEERsps1TN9DTccujJvi2s90ftR6gzYt5DI62TxGjcLhLEwhr2tpHBDonxEo9bppoU2q_HCEnFqo49BxJQKIIq5RTEXv90y-8r3YX3ycwxG0n6ScAk6RDaFZhm7bp53vD_YvFHjJSpJgnRKOfMxir7rioE5dquh43993Dh7jbq79IEwiQdorJJNoIE4HIWQMXPece322awNhRe_xLwcfcuNYgQZOPASJLEDBD7awCT'
const bookingProcessImageUrl = 'https://lh3.googleusercontent.com/aida-public/AB6AXuBhra6yeHfGlKGWvFOIPvAo7-D40da0dcM0hGbH6kayF_663DSc_AfKideRack5vk9Q7vtpHpCCOtYDgkaoqFN8gLMj41b9b2JgMBh1m0Xe56Yd-ml-pIdNkA6kF-uqOZuW7dk-d3Zzl-tt0Z6-KwU9upepOaJxftYrNpZKsE1h4Od6chGdBlkwN3R_zyQgot8h9_UrCedoSvpTuFJcD2JYCL-apW7OHYau3cxK6N8jYv3ZEwovKoIdcRinGJdoJqjRYPnHKuWarjWd'

const fallbackShops = [
  { id: 'demo-1', name: 'Urban Serenity Spa', slug: '', coverUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAYF_tXq78I7rLq1R76w8H0Zz_N5h1P7l6f9i4o2v3t4r5y6u7i8o9p0', address: { fullText: 'Quận 1, TP.HCM' } },
  { id: 'demo-2', name: 'Glow Nail & Beauty', slug: '', coverUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAYF_tXq78I7rLq1R76w8H0Zz_N5h1P7l6f9i4o2v3t4r5y6u7i8o9p1', address: { fullText: 'Hoàn Kiếm, Hà Nội' } },
  { id: 'demo-3', name: 'LumiX Hair Salon', slug: '', coverUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAYF_tXq78I7rLq1R76w8H0Zz_N5h1P7l6f9i4o2v3t4r5y6u7i8o9p2', address: { fullText: 'Thanh Xuân, Hà Nội' } },
  { id: 'demo-4', name: 'Aura Skin Center', slug: '', coverUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAYF_tXq78I7rLq1R76w8H0Zz_N5h1P7l6f9i4o2v3t4r5y6u7i8o9p3', address: { fullText: 'Cầu Giấy, Hà Nội' } }
]

function shopAddress(shop) {
  const address = shop?.address || {}
  return String(address.fullText || [address.district, address.city].filter(Boolean).join(', ') || 'Đang cập nhật').trim()
}

function brandItem(icon, name) {
  return (
    <div className="flex items-center gap-4 px-8 py-4 bg-white rounded-full shadow-sm border border-outline-variant/30 grayscale hover:grayscale-0 transition-all">
      <span className="material-symbols-outlined text-primary text-3xl">{icon}</span>
      <span className="font-display-lg text-headline-md text-on-surface-variant">{name}</span>
    </div>
  )
}

export default function PlatformLandingPage() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [shops, setShops] = useState([])
  const [loading, setLoading] = useState(false)

  const displayShops = useMemo(() => (shops.length ? shops.slice(0, 4) : fallbackShops), [shops])

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      try {
        const res = await apiRequest('/api/public/shops?limit=4')
        if (mounted) setShops(Array.isArray(res?.items) ? res.items : [])
      } finally {
        if (mounted) setLoading(false)
      }
    }
    void load()
    return () => { mounted = false }
  }, [])

  const handleSearch = (event) => {
    event.preventDefault()
    const q = String(query || '').trim()
    navigate(`/partner-shops${q ? `?q=${encodeURIComponent(q)}` : ''}`)
  }

  return (
    <div className="bg-[#f9f9ff] text-[#111c2c] font-body-md selection:bg-[#5ea4b8] selection:text-[#003843]" style={{ fontFamily: 'Nunito Sans, sans-serif' }}>
      <style>{`
        .lumix-platform-page .glass-card { background: rgba(255, 255, 255, 0.7); backdrop-filter: blur(20px); border: 1px solid rgba(20, 103, 122, 0.1); }
        .lumix-platform-page .custom-shadow { box-shadow: 0 20px 40px rgba(94, 164, 184, 0.12); }
        .lumix-platform-page .hover-lift { transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1); }
        .lumix-platform-page .hover-lift:hover { transform: translateY(-8px); box-shadow: 0 30px 60px rgba(20, 103, 122, 0.15); }
        .lumix-platform-page .scrollbar-hide::-webkit-scrollbar { display: none; }
        .lumix-platform-page .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        .lumix-platform-page .hero-gradient { background: linear-gradient(to right, rgba(0, 0, 0, 0.7) 0%, rgba(0, 0, 0, 0.4) 50%, rgba(0, 0, 0, 0) 100%); }
        .lumix-platform-page { scroll-behavior: smooth; }
        @keyframes lumix-marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .lumix-platform-page .animate-marquee { animation: lumix-marquee 30s linear infinite; }
        @keyframes pulse-glow { 0%, 100% { text-shadow: 0 0 10px rgba(175, 236, 255, 0.4); transform: scale(1); } 50% { text-shadow: 0 0 25px rgba(175, 236, 255, 0.8), 0 0 45px rgba(175, 236, 255, 0.4); transform: scale(1.02); } }
        .lumix-platform-page .cta-animated-link { animation: pulse-glow 3s ease-in-out infinite; display: inline-flex; align-items: center; gap: 12px; transition: all 0.3s ease; }
        .lumix-platform-page .cta-animated-link:hover { opacity: 0.9; transform: scale(1.05) translateX(5px); }
      `}</style>
      <div className="lumix-platform-page">
        <header className="bg-white/80 backdrop-blur-xl border-b border-[#14677a]/10 full-width top-0 sticky z-50 shadow-sm">
          <div className="max-w-[1440px] mx-auto px-10 flex justify-between items-center h-20">
            <div className="flex items-center gap-4">
              <span className="text-2xl tracking-tight text-[#14677a] font-bold" style={{ fontFamily: 'Quicksand, sans-serif' }}>LumiX</span>
            </div>
            <nav className="hidden lg:flex items-center gap-8">
              <a className="text-xl font-semibold text-[#3f484b] hover:text-[#14677a] transition-all" href="#">Tổng quan</a>
              <a className="text-xl font-semibold text-[#3f484b] hover:text-[#14677a] transition-all" href="#search-section">Cửa hàng đối tác</a>
            </nav>
            <div className="flex items-center gap-4">
              <Link to="/shop-landing" className="text-[#14677a] border border-[#14677a] px-6 py-2.5 rounded-full text-xl font-semibold hover:bg-[#14677a]/5 active:scale-95 transition-all">Đăng ký làm đối tác</Link>
              <Link to="/partner-shops" className="bg-[#14677a] text-white px-8 py-2.5 rounded-full text-xl font-semibold hover:brightness-110 active:scale-95 transition-all shadow-md">Đặt lịch ngay</Link>
            </div>
          </div>
        </header>

        <section className="relative h-[600px] w-full overflow-hidden">
          <img alt="Luxury Spa Experience" className="absolute inset-0 w-full h-full object-cover" src={heroImageUrl} />
          <div className="absolute inset-0 hero-gradient flex items-center">
            <div className="max-w-[1440px] mx-auto px-10 w-full">
              <div className="max-w-2xl text-white">
                <h1 className="text-[56px] leading-[1.1] mb-4 drop-shadow-lg font-bold" style={{ fontFamily: 'Quicksand, sans-serif' }}>Khám Phá Thiên Đường Làm Đẹp Tại LumiX</h1>
                <p className="text-lg leading-[1.6] text-white/90 mb-8 max-w-xl">Tìm kiếm, đặt lịch và trải nghiệm những dịch vụ Spa ; Salon đẳng cấp nhất với LumiX Partner. Tiện lợi, nhanh chóng và luôn có ưu đãi.</p>
                <div>
                  <a className="inline-flex items-center gap-3 bg-white/95 px-6 py-3 rounded-xl shadow-xl border font-bold animate-bounce transition-all hover:scale-105 active:scale-95 group border-[#14677a]/20 text-[#14677a]" href="#search-section">
                    <span className="material-symbols-outlined text-[#14677a]" style={{ fontVariationSettings: "'FILL' 1", opacity: 0 }}>spa</span>
                    <span className="text-lg tracking-wide group-hover:underline font-semibold" style={{ fontFamily: 'Quicksand, sans-serif' }}>Hãy sử dụng nền tảng LumiX ngay</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        <main className="max-w-[1440px] mx-auto px-10">
          <section className="mb-16 -mt-12 relative z-10" id="search-section">
            <form onSubmit={handleSearch} className="bg-white p-6 rounded-2xl shadow-xl border border-[#14677a]/5 flex flex-col lg:flex-row items-center gap-6">
              <div className="relative flex-grow w-full">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#14677a]">search</span>
                <input className="bg-[#f0f3ff] border-none rounded-xl pl-12 pr-6 py-4 w-full focus:ring-2 focus:ring-[#14677a]/30 transition-all text-[#111c2c]" placeholder="Tìm kiếm cửa hàng spa/salon, địa điểm" type="text" value={query} onChange={(e) => setQuery(e.target.value)} />
              </div>
              <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide py-1 w-full lg:w-auto">
                <button className="px-6 py-3 rounded-xl bg-[#14677a] text-white text-xl font-semibold whitespace-nowrap shadow-sm" type="submit">{loading ? 'Đang tải...' : 'Tìm kiếm'}</button>
              </div>
            </form>
          </section>

          <section className="mb-16">
            <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
              <div className="max-w-xl">
                <span className="text-[#14677a] text-sm font-bold uppercase tracking-widest mb-2 block">Khám phá</span>
                <h2 className="text-[32px] leading-[1.3] font-semibold text-[#111c2c]" style={{ fontFamily: 'Quicksand, sans-serif' }}>Tất cả cửa hàng đối tác</h2>
              </div>
              <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide py-1" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {displayShops.map((shop) => {
                const detailTo = shop.slug ? `/${shop.slug}` : '/partner-shops'
                return (
                  <div key={shop.id || shop.slug || shop.name} className="bg-white rounded-2xl overflow-hidden border border-[#bfc8cc]/30 hover-lift group">
                    <div className="aspect-video overflow-hidden"><img alt={shop.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" src={shop.coverUrl || shop.logoUrl || fallbackShops[0].coverUrl} /></div>
                    <div className="p-4">
                      <div className="flex justify-between items-start mb-2"><h3 className="text-xl font-semibold text-[#111c2c]" style={{ fontFamily: 'Quicksand, sans-serif' }}>{shop.name}</h3><div className="flex items-center text-[#14677a]"><span className="material-symbols-outlined text-sm">star</span><span className="font-bold ml-1"><br /></span></div></div>
                      <p className="text-[#3f484b] text-xs mb-4 flex items-center"><span className="material-symbols-outlined text-sm mr-1">location_on</span>{shopAddress(shop)}</p>
                      <Link to={detailTo} className="block text-center w-full bg-[#5ea4b8]/10 text-[#14677a] py-2 rounded-xl text-xl font-semibold hover:bg-[#14677a] hover:text-white transition-all">Chi tiết</Link>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="mt-8 text-center">
              <Link to="/partner-shops" className="inline-flex border border-[#14677a] text-[#14677a] px-10 py-4 rounded-full text-xl font-semibold hover:bg-[#14677a]/5 transition-all">Xem thêm cửa hàng</Link>
            </div>
          </section>

          <section className="mb-16">
            <div className="text-center mb-8">
              <span className="text-[#14677a] text-sm font-bold uppercase tracking-widest mb-2 block">Về chúng tôi</span>
              <h2 className="text-[32px] leading-[1.3] font-semibold text-[#111c2c]" style={{ fontFamily: 'Quicksand, sans-serif' }}>Giải Pháp Làm Đẹp Thông Minh LumiX</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-8 rounded-2xl border border-[#bfc8cc]/30 hover:border-[#14677a]/30 transition-all group"><div className="w-16 h-16 bg-[#5ea4b8]/10 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform"><span className="material-symbols-outlined text-[#14677a] text-4xl">calendar_month</span></div><h3 className="text-2xl leading-[1.4] font-semibold text-[#111c2c] mb-3" style={{ fontFamily: 'Quicksand, sans-serif' }}>Đặt lịch liền tay</h3><p className="text-[#3f484b] text-base leading-[1.6]">Không còn phải chờ đợi hay gọi điện. Chỉ với vài cú chạm, bạn đã có thể giữ chỗ tại cơ sở yêu thích vào bất kỳ lúc nào.</p></div>
              <div className="bg-white p-8 rounded-2xl border border-[#bfc8cc]/30 hover:border-[#14677a]/30 transition-all group"><div className="w-16 h-16 bg-[#5ea4b8]/10 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform"><span className="material-symbols-outlined text-[#14677a] text-4xl">inventory_2</span></div><h3 className="text-2xl leading-[1.4] font-semibold text-[#111c2c] mb-3" style={{ fontFamily: 'Quicksand, sans-serif' }}>Quản lý thông minh</h3><p className="text-[#3f484b] text-base leading-[1.6]">Theo dõi lịch hẹn, nhắc lịch tự động và lưu lại lịch sử làm đẹp của bạn một cách khoa học nhất.</p></div>
              <div className="bg-white p-8 rounded-2xl border border-[#bfc8cc]/30 hover:border-[#14677a]/30 transition-all group"><div className="w-16 h-16 bg-[#5ea4b8]/10 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform"><span className="material-symbols-outlined text-[#14677a] text-4xl">verified_user</span></div><h3 className="text-2xl leading-[1.4] font-semibold text-[#111c2c] mb-3" style={{ fontFamily: 'Quicksand, sans-serif' }}>Trải nghiệm cao cấp</h3><p className="text-[#3f484b] text-base leading-[1.6]">Chúng tôi kết nối bạn với những đối tác hàng đầu, đảm bảo chất lượng dịch vụ chuẩn 5 sao và quy trình chuyên nghiệp.</p></div>
            </div>
          </section>

          <section className="mb-16"><div className="bg-[#e7eeff] rounded-3xl p-12 lg:p-16"><div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center"><div><span className="block text-[#14677a] text-[40px] lg:text-[48px] mb-2 font-bold" style={{ fontFamily: 'Quicksand, sans-serif' }}>5,000+</span><span className="text-[#3f484b] text-sm font-bold uppercase">Đối tác Spa &amp; Salon</span></div><div><span className="block text-[#14677a] text-[40px] lg:text-[48px] mb-2 font-bold" style={{ fontFamily: 'Quicksand, sans-serif' }}>1M+</span><span className="text-[#3f484b] text-sm font-bold uppercase">Lượt đặt lịch thành công</span></div><div><span className="block text-[#14677a] text-[40px] lg:text-[48px] mb-2 font-bold" style={{ fontFamily: 'Quicksand, sans-serif' }}>4.9/5</span><span className="text-[#3f484b] text-sm font-bold uppercase">Đánh giá hài lòng</span></div><div><span className="block text-[#14677a] text-[40px] lg:text-[48px] mb-2 font-bold" style={{ fontFamily: 'Quicksand, sans-serif' }}>34</span><span className="text-[#3f484b] text-sm font-bold uppercase">Tỉnh thành&nbsp; toàn quốc</span></div></div></div></section>

          <section className="mb-16"><div className="flex flex-col lg:flex-row items-center gap-16"><div className="lg:w-1/2"><span className="text-[#14677a] text-sm font-bold uppercase tracking-widest mb-2 block">Quy trình đơn giản</span><h2 className="text-[32px] leading-[1.3] font-semibold text-[#111c2c] mb-8" style={{ fontFamily: 'Quicksand, sans-serif' }}>Trải nghiệm làm đẹp chỉ trong 3 bước</h2><div className="space-y-8"><div className="flex gap-6"><div className="flex-shrink-0 w-12 h-12 bg-[#14677a] text-white rounded-full flex items-center justify-center font-bold text-xl">1</div><div><h4 className="text-xl font-semibold text-[#111c2c] mb-2" style={{ fontFamily: 'Quicksand, sans-serif' }}>Tìm kiếm dịch vụ</h4><p className="text-[#3f484b]">Lựa chọn loại hình làm đẹp, khu vực hoặc tên cửa hàng mà bạn yêu thích ngay trên thanh tìm kiếm.</p></div></div><div className="flex gap-6"><div className="flex-shrink-0 w-12 h-12 bg-[#14677a] text-white rounded-full flex items-center justify-center font-bold text-xl">2</div><div><h4 className="text-xl font-semibold text-[#111c2c] mb-2" style={{ fontFamily: 'Quicksand, sans-serif' }}>Chọn lịch và nhân viên</h4><p className="text-[#3f484b]">Xem lịch trống thực tế của cửa hàng và chọn nhân viên tay nghề cao mà bạn tin tưởng nhất.</p></div></div><div className="flex gap-6"><div className="flex-shrink-0 w-12 h-12 bg-[#14677a] text-white rounded-full flex items-center justify-center font-bold text-xl">3</div><div><h4 className="text-xl font-semibold text-[#111c2c] mb-2" style={{ fontFamily: 'Quicksand, sans-serif' }}>Xác nhận và trải nghiệm</h4><p className="text-[#3f484b]">Nhận thông báo xác nhận ngay lập tức và chỉ việc đến đúng giờ để tận hưởng dịch vụ hoàn hảo.</p></div></div></div></div><div className="lg:w-1/2 relative"><div className="bg-[#14677a]/5 rounded-3xl p-8 aspect-square flex items-center justify-center overflow-hidden"><img alt="Booking Process" className="rounded-2xl shadow-2xl object-cover w-full h-full rotate-3 hover:rotate-0 transition-transform duration-500" src={bookingProcessImageUrl} /></div><div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-xl shadow-xl border border-[#14677a]/10 animate-bounce"><div className="flex items-center gap-3"><span className="material-symbols-outlined text-green-500">check_circle</span><span className="font-bold text-[#111c2c]">Đặt lịch thành công!</span></div></div></div></div></section>

          <section className="mb-16"><div className="bg-[#14677a] overflow-hidden rounded-3xl relative shadow-2xl"><div className="absolute right-0 top-0 w-1/3 h-full opacity-10 pointer-events-none"><svg className="w-full h-full fill-white" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" /></svg></div><div className="p-12 md:p-16 flex flex-col md:flex-row items-center justify-between gap-8 relative z-10"><div className="text-center md:text-left"><h3 className="text-5xl leading-[1.2] tracking-[-0.02em] font-bold text-white mb-4" style={{ fontFamily: 'Quicksand, sans-serif' }}>Chương trình Tích điểm Thành viên</h3><p className="text-lg leading-[1.6] text-[#afecff] max-w-lg">Mỗi lượt đặt lịch là một bước tiến gần hơn đến những ưu đãi đặc quyền. Tích lũy điểm thưởng từ mọi dịch vụ để quy đổi thành các gói chăm sóc cao cấp hoàn toàn miễn phí.</p></div><div className="flex flex-col items-center gap-4"><div className="flex gap-4 mb-2"><div className="bg-white/10 backdrop-blur-md rounded-xl p-4 text-center min-w-[100px]"><span className="block text-xs text-white/70 uppercase">Hạng Bạc</span><span className="block text-2xl text-white font-bold">500 đ</span></div><div className="bg-white/10 backdrop-blur-md rounded-xl p-4 text-center min-w-[100px] border border-white/30 scale-110"><span className="block text-xs text-white/70 uppercase">Hạng Vàng</span><span className="block text-2xl text-white font-bold">1500 đ</span></div><div className="bg-white/10 backdrop-blur-md rounded-xl p-4 text-center min-w-[100px]"><span className="block text-xs text-white/70 uppercase">Kim Cương</span><span className="block text-2xl text-white font-bold">5000 đ</span></div></div></div></div></div></section>

          <section className="mb-16 overflow-hidden"><div className="text-center mb-8"><span className="text-[#14677a] text-sm font-bold uppercase tracking-widest mb-2 block">Đối tác tin cậy</span><h2 className="text-[32px] leading-[1.3] font-semibold text-[#111c2c]" style={{ fontFamily: 'Quicksand, sans-serif' }}>Đồng hành cùng hơn 500 thương hiệu hàng đầu</h2></div><div className="relative flex overflow-hidden"><div className="flex space-x-12 animate-marquee whitespace-nowrap py-8">{brandItem('spa', 'PureZen')}{brandItem('content_cut', 'HairLab')}{brandItem('face_5', 'GlowUp')}{brandItem('wash', 'AuraSkin')}{brandItem('health_and_safety', 'EliteCare')}{brandItem('diamond', 'DiamondNails')}{brandItem('spa', 'PureZen')}{brandItem('content_cut', 'HairLab')}{brandItem('face_5', 'GlowUp')}</div></div></section>
        </main>

        <footer className="bg-[#d8e3fa] border-t border-[#bfc8cc] full-width"><div className="py-8 px-10 max-w-[1440px] mx-auto flex flex-col md:flex-row justify-between items-center"><div className="flex flex-col gap-2 mb-4 md:mb-0"><span className="text-sm font-bold uppercase tracking-widest text-[#14677a]">LUMIX</span><p className="text-xs text-[#3f484b] max-w-xs">Giải pháp quản lý và đặt lịch hàng đầu cho ngành làm đẹp tại Việt Nam.</p></div><div className="flex flex-wrap justify-center gap-8"><a className="text-xs text-[#3f484b] hover:text-[#14677a] transition-all" href="https://www.lumix.io.vn">www.lumix.io.vn</a><a className="text-xs text-[#3f484b] hover:text-[#14677a] transition-all" href="tel:0352033029">0352033029</a><a className="text-xs text-[#3f484b] hover:text-[#14677a] transition-all" href="#">Fanpage: Trạm đặt lịch - LumiX</a></div><p className="text-xs text-[#3f484b] mt-4 md:mt-0">© 2026 LumiX&nbsp;</p></div></footer>
      </div>
    </div>
  )
}
