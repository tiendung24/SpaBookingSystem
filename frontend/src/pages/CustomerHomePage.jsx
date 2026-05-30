import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useShop } from '../context/ShopContext'
import LumiXLogo from '../assets/lumix-logo.png'

const heroImage =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuARsefIDC5KnErn7e0YLKhJ6VDKWD_Whwd3vMpSePIQhTbcW-3ir8LX_5NvArJmY8_qpqH2pFNuVaHQLY4PLoI835HlxMznHdjbr3UBB6jhvtmnXohn5AZIB9DuWeDh1th-hAUFfjO8bOYPFRhuy_Cy-WkhwRfuYq1lYY_THLyMeSyOqQPHLNGxNJmVMgFDtusyYOTuDqZ3LXXCcmKYmUgvHuswyeU9jurfwRApFrs68u8vjbwZ4stCSE-ymo9xGYNzQPJ5bbTK3JCJ'

const cardFallback =
  'https://images.unsplash.com/photo-1519014816548-bf5fe059798b?q=80&w=1200&auto=format&fit=crop'

const staffFallback = 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=600&auto=format&fit=crop'

function formatVnd(v) {
  return `${Number(v || 0).toLocaleString('vi-VN')}đ`
}

function staffRoleLabel(role) {
  if (role === 'tech') return 'Kỹ thuật viên'
  return role || 'Kỹ thuật viên'
}

function staffExperienceLabel(member) {
  const directYears = Number(member?.experienceYears || member?.yearsExperience || 0)
  if (Number.isFinite(directYears) && directYears > 0) return `${directYears}+ năm`

  const sinceYear = Number(member?.sinceYear || 0)
  if (Number.isFinite(sinceYear) && sinceYear > 1900) {
    const years = new Date().getFullYear() - sinceYear
    if (years > 0) return `${years}+ năm`
  }

  return 'Đang cập nhật'
}

export default function CustomerHomePage() {
  const { slug } = useParams()
  const { shop, services, staff, loadPublicShop, isAuthenticated, role, user, logout } = useShop()
  const [serviceDetail, setServiceDetail] = useState(null)
  const [staffDetail, setStaffDetail] = useState(null)

  useEffect(() => {
    if (!slug) return
    loadPublicShop(slug).catch(() => {})
  }, [slug, loadPublicShop])

  const isCorrectSlug = !slug || slug === shop.slug
  const visibleServices = useMemo(() => services.filter((item) => item.visible), [services])
  const featuredServices = visibleServices.slice(0, 6)
  const visibleStaff = useMemo(() => staff.filter((member) => member.bookingEnabled !== false), [staff])
  const featuredStaff = visibleStaff.slice(0, 8)
  const bookUrl = `/${slug || shop.slug}/book`

  const serviceStats = useMemo(
    () => ({
      totalStaff: visibleStaff.length,
      totalServices: visibleServices.length,
      years: 5
    }),
    [visibleStaff.length, visibleServices.length]
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
            <img src={LumiXLogo} alt="LumiX" className="h-12 w-auto" />
            <h1 className="font-h3 text-h3 tracking-tight text-primary">{shop.name}</h1>
          </div>
          <nav className="hidden md:flex gap-6">
            <a className="text-primary font-bold border-b-2 border-primary pb-1" href="#services">
              Dịch vụ
            </a>
            <a className="text-main/70 hover:text-primary transition-colors" href="#staff">
              Nhân sự
            </a>
            <a className="text-main/70 hover:text-primary transition-colors" href="#contact">
              Liên hệ
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <Link className="bg-primary text-white px-6 py-3 rounded-full font-bold hover:brightness-110 transition-all" to={bookUrl}>
              Đặt lịch ngay
            </Link>
            {!isAuthenticated ? (
              <>
                <Link className="hidden sm:inline-flex px-5 py-3 rounded-full border border-slate-200 text-main font-bold hover:bg-slate-50" to="/login">
                  {'\u0110\u0103ng nh\u1eadp'}
                </Link>
                <Link className="hidden sm:inline-flex px-5 py-3 rounded-full border border-primary/20 text-primary font-bold hover:bg-primary/5" to="/register">
                  {'\u0110\u0103ng k\u00fd'}
                </Link>
              </>
            ) : null}
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
                Trải nghiệm dịch vụ chăm sóc sắc đẹp và sức khỏe đẳng cấp tại {shop.name}. Đặt lịch trực tuyến dễ dàng, nhanh chóng.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl">
                <div className="rounded-2xl bg-white/75 border border-primary/10 p-4 shadow-sm">
                  <span className="material-symbols-outlined text-primary text-[22px]">bolt</span>
                  <p className="mt-2 text-sm font-bold text-main">Đặt lịch siêu tốc</p>
                  <p className="text-xs text-main/60 mt-1">Chỉ cần chọn dịch vụ, nhân sự và khung giờ.</p>
                </div>
                <div className="rounded-2xl bg-white/75 border border-primary/10 p-4 shadow-sm">
                  <span className="material-symbols-outlined text-primary text-[22px]">groups</span>
                  <p className="mt-2 text-sm font-bold text-main">Chọn thợ yêu thích</p>
                  <p className="text-xs text-main/60 mt-1">Xem nhân sự và slot làm việc phù hợp.</p>
                </div>
                <div className="rounded-2xl bg-white/75 border border-primary/10 p-4 shadow-sm">
                  <span className="material-symbols-outlined text-primary text-[22px]">event_available</span>
                  <p className="mt-2 text-sm font-bold text-main">Giờ trống realtime</p>
                  <p className="text-xs text-main/60 mt-1">Chủ động chọn lịch còn trống ngay trên web.</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link className="bg-primary text-white px-7 py-3 rounded-full font-bold shadow-lg hover:brightness-110 transition-all" to={bookUrl}>
                  Đặt lịch ngay
                </Link>
                {!isAuthenticated ? (
                  <>
                    <Link className="bg-white border border-slate-200 text-main px-7 py-3 rounded-full font-bold hover:bg-slate-50" to="/login">
                      {'\u0110\u0103ng nh\u1eadp'}
                    </Link>
                    <Link className="bg-white border border-primary/20 text-primary px-7 py-3 rounded-full font-bold hover:bg-primary/5" to="/register">
                      {'\u0110\u0103ng k\u00fd'}
                    </Link>
                  </>
                ) : null}
                <a className="bg-white border border-primary/20 text-primary px-7 py-3 rounded-full font-bold hover:bg-primary/5" href="#services">
                  Xem dịch vụ
                </a>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm text-main/60">
                <span className="inline-flex items-center gap-1">
                  <span className="material-symbols-outlined text-[18px] text-emerald-600">check_circle</span>
                  Không cần tải app
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="material-symbols-outlined text-[18px] text-emerald-600">check_circle</span>
                  Không cần tạo tài khoản
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="material-symbols-outlined text-[18px] text-emerald-600">check_circle</span>
                  Xác nhận lịch nhanh chóng
                </span>
              </div>
            </div>

            <div className="glass-card rounded-[2rem] p-5 bg-white/70 border border-white/60">
              <div className="relative overflow-hidden rounded-[1.5rem]">
                <img className="w-full h-[480px] object-cover" src={shop.coverImageUrl || heroImage} alt={shop.name || 'Spa'} />
                <div className="absolute left-5 right-5 bottom-5 rounded-3xl bg-white/90 backdrop-blur-xl p-4 shadow-xl border border-white/80">
                  <p className="text-xs font-bold text-main/50 uppercase tracking-widest">Thông tin hôm nay</p>
                  <div className="mt-2 grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-main/50">Giờ mở cửa</p>
                      <p className="font-bold text-primary">{shop.hours?.open || '09:00'} - {shop.hours?.close || '20:00'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-main/50">Dịch vụ</p>
                      <p className="font-bold text-primary">{visibleServices.length}+ lựa chọn</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="contact" className="py-16 max-w-[1440px] mx-auto px-6 md:px-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
              <span className="material-symbols-outlined text-primary">location_on</span>
              <h3 className="font-black text-main mt-3">Địa chỉ</h3>
              <p className="text-main/60 mt-1">{shop.address || 'Chưa cập nhật địa chỉ'}</p>
            </div>
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
              <span className="material-symbols-outlined text-primary">call</span>
              <h3 className="font-black text-main mt-3">Điện thoại</h3>
              <p className="text-main/60 mt-1">{shop.phone || 'Chưa cập nhật'}</p>
            </div>
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
              <span className="material-symbols-outlined text-primary">schedule</span>
              <h3 className="font-black text-main mt-3">Giờ hoạt động</h3>
              <p className="text-main/60 mt-1">{`${shop.hours?.open || '09:00'} - ${shop.hours?.close || '20:00'}`}</p>
            </div>
          </div>
        </section>

        <section id="services" className="py-16 max-w-[1440px] mx-auto px-6 md:px-10">
          <div className="text-center mb-12 space-y-2">
            <h3 className="font-label-bold text-label-bold text-secondary uppercase tracking-widest">Dịch vụ nổi bật</h3>
            <h2 className="font-h2 text-h2 text-main">Trải nghiệm đẳng cấp tại {shop.name}</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredServices.map((service) => (
              <div key={service.id} className="group glass-card rounded-2xl overflow-hidden hover:-translate-y-2 transition-all duration-500 bg-white/80 h-full flex flex-col">
                <div className="h-56 overflow-hidden">
                  <img className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" src={service.imageUrl || cardFallback} alt="" />
                </div>
                <div className="p-4 space-y-3 flex-1 flex flex-col">
                  <div className="flex justify-between items-center gap-3">
                    <h4 className="font-h3 text-h3 text-primary line-clamp-1">{service.name}</h4>
                    <span className="text-amber-700 font-bold whitespace-nowrap">{formatVnd(service.priceVnd)}</span>
                  </div>
                  <p className="text-xs text-main/60">{service.durationMinutes} phút dự kiến</p>
                  <p className="text-sm text-main/70 line-clamp-2 break-words">{service.shortDescription || service.description || 'Shop chưa cập nhật mô tả ngắn.'}</p>

                  <div className="flex gap-2 pt-1 mt-auto">
                    <button
                      type="button"
                      onClick={() => setServiceDetail(service)}
                      className="flex-1 py-2 rounded-xl border border-primary/20 text-primary font-label-bold hover:bg-primary/5 transition-colors"
                    >
                      Xem chi tiết
                    </button>
                    <Link
                      className="flex-1 py-2 rounded-xl bg-primary text-white font-label-bold hover:brightness-110 transition-all text-center"
                      to={bookUrl}
                    >
                      Đặt lịch
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="staff" className="py-16 bg-white border-y border-slate-200">
          <div className="max-w-[1440px] mx-auto px-6 md:px-10">
            <div className="text-center mb-12 space-y-2">
              <h3 className="font-label-bold text-label-bold text-secondary uppercase tracking-widest">Đội ngũ nhân sự</h3>
              <h2 className="font-h2 text-h2 text-main">Kỹ thuật viên của {shop.name}</h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
              {featuredStaff.map((member) => (
                <article
                  key={member.id}
                  className="bg-slate-50 rounded-[1.5rem] p-4 border border-slate-200 hover:bg-white hover:shadow-xl transition-all text-center h-full flex flex-col"
                >
                  <img
                    className="w-28 h-28 rounded-full object-cover mx-auto border-4 border-white shadow-md"
                    src={member.avatar || staffFallback}
                    alt={member.name}
                  />
                  <h3 className="mt-4 font-black text-main line-clamp-1">{member.name}</h3>
                  <p className="text-xs text-main/60 font-bold">{staffRoleLabel(member.role)}</p>
                  {member.shortBio ? <p className="text-xs text-main/60 mt-2 line-clamp-2 min-h-[2.5rem]">{member.shortBio}</p> : <div className="min-h-[2.5rem]" />}
                  <button
                    type="button"
                    onClick={() => setStaffDetail(member)}
                    className="mt-auto w-full py-2.5 rounded-xl bg-white border border-primary/15 text-primary font-bold hover:bg-primary hover:text-white transition-colors"
                  >
                    Xem chi tiết
                  </button>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 max-w-[1440px] mx-auto px-6 md:px-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="glass-card rounded-3xl p-6 bg-white/80">
              <p className="text-3xl font-bold text-primary">{serviceStats.years}+</p>
              <p className="text-xs text-main/60">Năm kinh nghiệm</p>
            </div>
            <div className="glass-card rounded-3xl p-6 bg-white/80">
              <p className="text-3xl font-bold text-primary">{serviceStats.totalServices}+</p>
              <p className="text-xs text-main/60">Dịch vụ</p>
            </div>
            <div className="glass-card rounded-3xl p-6 bg-white/80">
              <p className="text-3xl font-bold text-primary">{serviceStats.totalStaff}+</p>
              <p className="text-xs text-main/60">Nhân sự</p>
            </div>
            <div className="glass-card rounded-3xl p-6 bg-white/80">
              <p className="text-sm font-bold text-main/60">Giờ mở cửa</p>
              <p className="text-lg font-bold text-primary mt-1">{`${shop.hours?.open || '09:00'} - ${shop.hours?.close || '20:00'}`}</p>
            </div>
          </div>

        </section>
      </main>

      <footer className="bg-slate-100 border-t border-slate-200 mt-12">
        <div className="py-8 px-6 md:px-10 max-w-[1440px] mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h5 className="font-h3 text-h3 text-primary">{shop.name}</h5>
            <p className="text-xs text-main/60">© 2026 LumiX Partner. Powered by LumiX.</p>
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

      {serviceDetail ? (
        <div
          className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setServiceDetail(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <img className="w-full h-72 object-cover rounded-t-3xl" src={serviceDetail.imageUrl || cardFallback} alt={serviceDetail.name} />
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <p className="text-xs font-bold text-secondary uppercase tracking-widest">Chi tiết dịch vụ</p>
                  <h3 className="text-2xl font-black text-main mt-1">{serviceDetail.name}</h3>
                </div>
                <button type="button" onClick={() => setServiceDetail(null)} className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200">
                  ✕
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-primary/5 p-4">
                  <p className="text-xs text-main/50">Giá dịch vụ</p>
                  <p className="font-black text-primary">{formatVnd(serviceDetail.priceVnd)}</p>
                </div>
                <div className="rounded-2xl bg-primary/5 p-4">
                  <p className="text-xs text-main/50">Thời gian dự kiến</p>
                  <p className="font-black text-primary">{serviceDetail.durationMinutes} phút</p>
                </div>
              </div>
              <p className="text-main/70 leading-relaxed whitespace-pre-line break-words">
                {serviceDetail.detailedDescription || serviceDetail.shortDescription || 'Shop chưa cập nhật mô tả chi tiết cho dịch vụ này.'}
              </p>
              <Link className="block w-full py-4 rounded-2xl bg-primary text-white text-center font-bold" to={bookUrl}>
                Đặt dịch vụ này
              </Link>
            </div>
          </div>
        </div>
      ) : null}

      {staffDetail ? (
        <div
          className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setStaffDetail(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex justify-between items-start gap-4">
              <div className="flex items-center gap-4">
                <img className="w-24 h-24 rounded-3xl object-cover border border-slate-200" src={staffDetail.avatar || staffFallback} alt={staffDetail.name} />
                <div>
                  <p className="text-xs font-bold text-secondary uppercase tracking-widest">Chi tiết nhân sự</p>
                  <h3 className="text-2xl font-black text-main mt-1">{staffDetail.name}</h3>
                  <p className="text-sm text-main/60 font-bold">{staffRoleLabel(staffDetail.role)}</p>
                </div>
              </div>
              <button type="button" onClick={() => setStaffDetail(null)} className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200">
                ✕
              </button>
            </div>
            <div className="mt-6 space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-primary/5 p-4">
                  <p className="text-xs text-main/50">Vai trò</p>
                  <p className="font-black text-primary">{staffRoleLabel(staffDetail.role)}</p>
                </div>
                <div className="rounded-2xl bg-primary/5 p-4">
                  <p className="text-xs text-main/50">Kinh nghiệm</p>
                  <p className="font-black text-primary">{staffExperienceLabel(staffDetail)}</p>
                </div>
              </div>

              {staffDetail.specialties?.length ? (
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-sm font-bold text-main/70 mb-2">Chuyên môn</p>
                  <div className="flex flex-wrap gap-2">
                    {staffDetail.specialties.map((item) => (
                      <span key={item} className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
              <div className="rounded-2xl border border-slate-200 p-4">
                <p className="text-sm font-bold text-main/70 mb-2">Giới thiệu</p>
                <p className="text-main/70 leading-relaxed whitespace-pre-line break-words">
                  {staffDetail.bio || staffDetail.shortBio || 'Shop chưa cập nhật giới thiệu chi tiết cho nhân sự này.'}
                </p>
              </div>
              {staffDetail.slotAssignments?.length ? (
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-sm font-bold text-main/70 mb-2">Slot làm việc</p>
                  <div className="flex flex-wrap gap-2">
                    {staffDetail.slotAssignments.map((slotValue) => (
                      <span key={slotValue} className="px-3 py-1.5 rounded-full bg-slate-100 text-main/70 text-xs font-bold">
                        {slotValue}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
              <Link className="block w-full py-4 rounded-2xl bg-primary text-white text-center font-bold" to={bookUrl}>
                Đặt lịch với nhân sự này
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

