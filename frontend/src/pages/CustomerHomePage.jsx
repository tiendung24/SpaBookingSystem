import { useEffect, useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useShop } from '../context/ShopContext'

const heroImage =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuARsefIDC5KnErn7e0YLKhJ6VDKWD_Whwd3vMpSePIQhTbcW-3ir8LX_5NvArJmY8_qpqH2pFNuVaHQLY4PLoI835HlxMznHdjbr3UBB6jhvtmnXohn5AZIB9DuWeDh1th-hAUFfjO8bOYPFRhuy_Cy-WkhwRfuYq1lYY_THLyMeSyOqQPHLNGxNJmVMgFDtusyYOTuDqZ3LXXCcmKYmUgvHuswyeU9jurfwRApFrs68u8vjbwZ4stCSE-ymo9xGYNzQPJ5bbTK3JCJ'

const cardFallback =
  'https://images.unsplash.com/photo-1519014816548-bf5fe059798b?q=80&w=1200&auto=format&fit=crop'

function formatVnd(v) {
  return `${Number(v || 0).toLocaleString('vi-VN')}đ`
}

export default function CustomerHomePage() {
  const { slug } = useParams()
  const { shop, services, staff, loadPublicShop, isAuthenticated, role, user, logout } = useShop()

  useEffect(() => {
    if (!slug) return
    loadPublicShop(slug).catch(() => {})
  }, [slug, loadPublicShop])

  const isCorrectSlug = !slug || slug === shop.slug
  const featuredServices = services.filter((item) => item.visible).slice(0, 4)
  const serviceStats = useMemo(
    () => ({
      totalStaff: staff.length,
      totalServices: services.length,
      years: 5
    }),
    [staff.length, services.length]
  )

  return (
    <div className="font-body-md text-main bg-slate-50 selection:bg-primary/20 selection:text-main">
      {!isCorrectSlug && (
        <div className="bg-amber-100 border-b border-amber-300 text-amber-900 px-4 py-2 text-sm text-center">
          Bạn đang mở slug <b>{slug}</b> không khớp shop hiện tại. Demo đang hiển thị dữ liệu của <b>{shop.name}</b>.
        </div>
      )}

      <header className="bg-white/80 backdrop-blur-xl border-b border-primary/20 sticky top-0 z-50 h-20 shadow-sm">
        <div className="max-w-[1440px] mx-auto px-6 md:px-10 flex justify-between items-center h-full">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-white">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                spa
              </span>
            </div>
            <h1 className="font-h3 text-h3 tracking-tight text-primary">{shop.name}</h1>
          </div>
          <nav className="hidden md:flex gap-6">
            <a className="text-primary font-bold border-b-2 border-primary pb-1" href="#services">
              Dịch vụ
            </a>
            <a className="text-main/70 hover:text-primary transition-colors" href="#staff">
              Nhân sự
            </a>
            <a className="text-main/70 hover:text-primary transition-colors" href="#reviews">
              Đánh giá
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <Link className="bg-primary text-white px-6 py-3 rounded-full font-bold hover:brightness-110 transition-all" to={`/${shop.slug}/book`}>
              Đặt lịch ngay
            </Link>
            {isAuthenticated && role === 'shop' ? (
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold">
                  {user?.fullName?.charAt(0)?.toUpperCase() || user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <button onClick={logout} className="text-main/70 hover:text-primary">Đăng xuất</button>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      <main>
        <section className="relative min-h-[680px] flex items-center hero-mesh">
          <div className="absolute inset-0 z-0">
            <img className="w-full h-full object-cover opacity-20" src={heroImage} alt="" />
          </div>
          <div className="max-w-[1440px] mx-auto px-6 md:px-10 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center relative z-10">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-100/60 border border-cyan-200 text-secondary">
                <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  verified
                </span>
                <span className="font-label-bold text-label-bold">PREMIUM WELLNESS</span>
              </div>
              <h2 className="text-5xl font-bold text-primary leading-tight">
                {shop.name}
                <br />
                <span className="text-amber-700">Nơi khởi đầu sự thư thái</span>
              </h2>
              <p className="text-lg text-main/70 max-w-xl">
                Trải nghiệm dịch vụ chăm sóc sắc đẹp và sức khỏe đẳng cấp trong không gian thiền định hiện đại.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <Link to={`/${shop.slug}/book`} className="bg-primary text-white px-10 py-4 rounded-xl font-bold flex items-center justify-center gap-2">
                  Đặt lịch ngay <span className="material-symbols-outlined">calendar_month</span>
                </Link>
                <a href="#services" className="glass-card px-10 py-4 rounded-xl font-bold text-primary text-center hover:bg-white transition-all">
                  Xem dịch vụ
                </a>
              </div>
            </div>

            <div className="hidden lg:block">
              <div className="glass-card p-4 rounded-3xl shadow-2xl">
                <img className="rounded-2xl w-full h-[500px] object-cover" src={cardFallback} alt="" />
              </div>
            </div>
          </div>
        </section>

        <section id="staff" className="py-16 max-w-[1440px] mx-auto px-6 md:px-10 grid md:grid-cols-3 gap-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined">location_on</span>
            </div>
            <div>
              <h4 className="font-h3 text-h3 text-primary">Địa chỉ</h4>
              <p className="text-main/70">{shop.address}</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined">call</span>
            </div>
            <div>
              <h4 className="font-h3 text-h3 text-primary">Số điện thoại</h4>
              <p className="text-main/70">{shop.phone}</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined">schedule</span>
            </div>
            <div>
              <h4 className="font-h3 text-h3 text-primary">Giờ mở cửa</h4>
              <p className="text-main/70">{`${shop.hours?.open || '09:00'} - ${shop.hours?.close || '20:00'}`}</p>
            </div>
          </div>
        </section>

        <section id="services" className="py-16 max-w-[1440px] mx-auto px-6 md:px-10">
          <div className="text-center mb-12 space-y-2">
            <h3 className="font-label-bold text-label-bold text-secondary uppercase tracking-widest">Dịch vụ nổi bật</h3>
            <h2 className="font-h2 text-h2 text-main">Trải nghiệm đẳng cấp tại {shop.name}</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredServices.map((service) => (
              <div key={service.id} className="group glass-card rounded-2xl overflow-hidden hover:-translate-y-2 transition-all duration-500 bg-white/80">
                <div className="h-56 overflow-hidden">
                  <img className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" src={service.imageUrl || cardFallback} alt="" />
                </div>
                <div className="p-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <h4 className="font-h3 text-h3 text-primary">{service.name}</h4>
                    <span className="text-amber-700 font-bold">{formatVnd(service.priceVnd)}</span>
                  </div>
                  <p className="text-xs text-main/60">{service.durationMinutes} phút</p>
                  <Link
                    className="block w-full mt-4 py-2 border border-primary/20 rounded-lg text-primary font-label-bold hover:bg-primary hover:text-white transition-colors text-center"
                    to={`/${shop.slug}/book`}
                  >
                    Đặt lịch
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="reviews" className="py-16 bg-slate-100/70">
          <div className="max-w-[1440px] mx-auto px-6 md:px-10 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="glass-card rounded-2xl p-4 text-center bg-white/80">
              <p className="text-3xl font-bold text-primary">{serviceStats.years}+</p>
              <p className="text-xs text-main/60">Năm kinh nghiệm</p>
            </div>
            <div className="glass-card rounded-2xl p-4 text-center bg-white/80">
              <p className="text-3xl font-bold text-primary">{serviceStats.totalServices}+</p>
              <p className="text-xs text-main/60">Dịch vụ</p>
            </div>
            <div className="glass-card rounded-2xl p-4 text-center bg-white/80">
              <p className="text-3xl font-bold text-primary">{serviceStats.totalStaff}+</p>
              <p className="text-xs text-main/60">Nhân sự</p>
            </div>
            <div className="glass-card rounded-2xl p-4 text-center bg-white/80">
              <p className="text-3xl font-bold text-primary">4.9</p>
              <p className="text-xs text-main/60">Đánh giá trung bình</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-slate-100 border-t border-slate-200 mt-12">
        <div className="py-8 px-6 md:px-10 max-w-[1440px] mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h5 className="font-h3 text-h3 text-primary">{shop.name}</h5>
            <p className="text-xs text-main/60">© 2024 LumiX Partner. All rights reserved.</p>
          </div>
          <div className="flex gap-6">
            <Link className="text-main/70 hover:text-primary" to="/shop/dashboard">
              Khu quản trị
            </Link>
            <a className="text-main/70 hover:text-primary" href="#">
              Điều khoản
            </a>
            <a className="text-main/70 hover:text-primary" href="#">
              Bảo mật
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
