import { Link } from 'react-router-dom'

const heroCoverUrl = 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=1440&q=80';

export default function HeroSection() {
  return (
    <section className="relative isolate overflow-hidden w-full h-[600px] flex items-center">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <img
          src={heroCoverUrl}
          alt="Luxury Spa Background"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-10 w-full relative z-10">
        <div className="max-w-2xl text-white">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-2 rounded-full w-fit mb-6 border border-white/20">
            <span className="material-symbols-outlined text-[18px] text-[#afecff]">verified</span>
            <span className="font-semibold tracking-wide uppercase text-sm">Giải pháp số 1 cho Spa & Salon</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-[1.1]" style={{ fontFamily: 'Quicksand, sans-serif' }}>
            Quản lý tiệm làm đẹp dễ dàng cùng LumiX
          </h1>
          <p className="text-lg md:text-xl text-white/90 max-w-lg leading-relaxed mb-8">
            Nền tảng chuyên biệt giúp tối ưu vận hành, quản lý lịch hẹn thông minh và bứt phá doanh thu cho cửa hàng của bạn.
          </p>
          <div className="flex flex-wrap gap-4 items-center">
            <Link to="/register" className="bg-[#14677a] text-white px-8 py-4 rounded-full font-bold text-lg hover:brightness-110 shadow-xl transition-all hover:scale-105 active:scale-95 border border-[#14677a]">
              Trở thành đối tác ngay
            </Link>
            <a href="#features" className="bg-white/10 backdrop-blur-md text-white font-bold px-8 py-4 rounded-full hover:bg-white/20 transition-all text-lg border border-white/30 hover:scale-105 active:scale-95">
              Tìm hiểu tính năng
            </a>
          </div>
          
          <div className="flex items-center gap-4 mt-8 pt-6 border-t border-white/20">
            <div className="flex -space-x-3">
              <img alt="Partner 1" className="w-12 h-12 rounded-full border-2 border-primary object-cover shadow-lg" src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80" />
              <img alt="Partner 2" className="w-12 h-12 rounded-full border-2 border-primary object-cover shadow-lg" src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=150&q=80" />
              <img alt="Partner 3" className="w-12 h-12 rounded-full border-2 border-primary object-cover shadow-lg" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80" />
            </div>
            <div>
              <p className="font-bold text-lg text-white">Tăng 40% doanh thu</p>
              <p className="text-sm text-white/70">Tối ưu hóa thời gian trống</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
