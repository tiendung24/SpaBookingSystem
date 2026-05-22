import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useShop } from '../context/ShopContext'

function formatVnd(v) {
  return `${Number(v || 0).toLocaleString('vi-VN')}đ`
}

const categoryLabels = {
  all: 'Tất cả',
  nail: 'Nail',
  massage: 'Massage',
  spa: 'Spa & Skincare',
  other: 'Khác'
}

export default function CustomerSelectServicePage() {
  const navigate = useNavigate()
  const { slug } = useParams()
  const { shop, services, staff, bookingDraft, setBookingDraft, loadPublicShop } = useShop()

  const [category, setCategory] = useState('all')
  const [query, setQuery] = useState('')
  const [selectedServiceId, setSelectedServiceId] = useState(bookingDraft.serviceId || null)
  const [selectedStaffId, setSelectedStaffId] = useState(bookingDraft.staffId || 'random') // random | staffId

  useEffect(() => {
    if (!slug) return
    loadPublicShop(slug).catch(() => {})
  }, [slug, loadPublicShop])

  const visibleServices = services.filter((s) => s.visible)

  const categories = useMemo(() => {
    const set = new Set(visibleServices.map((s) => s.category))
    return ['all', ...Array.from(set)]
  }, [visibleServices])

  const filteredServices = useMemo(() => {
    const q = query.trim().toLowerCase()
    return visibleServices.filter((s) => {
      const matchCategory = category === 'all' || s.category === category
      const matchQuery = !q || s.name.toLowerCase().includes(q)
      return matchCategory && matchQuery
    })
  }, [visibleServices, category, query])

  const availableStaff = useMemo(() => staff.filter((s) => s.bookingEnabled), [staff])

  const selectedService = services.find((s) => s.id === selectedServiceId) || null
  const selectedStaff = staff.find((s) => s.id === selectedStaffId) || null

  const totalMinutes = selectedService?.durationMinutes ?? 0
  const totalPrice = selectedService?.priceVnd ?? 0

  const goNext = () => {
    if (!selectedServiceId) return
    setBookingDraft((prev) => ({
      ...prev,
      serviceId: selectedServiceId,
      staffId: selectedStaffId
    }))
    navigate(`/${shop.slug}/book/time`)
  }

  const isCorrectSlug = !slug || slug === shop.slug

  return (
    <div className="min-h-screen bg-slate-50 text-main">
      {!isCorrectSlug && (
        <div className="bg-amber-100 border-b border-amber-300 text-amber-900 px-4 py-2 text-sm text-center">
          Bạn đang mở slug <b>{slug}</b> không khớp shop hiện tại. Demo đang hiển thị dữ liệu của <b>{shop.name}</b>.
        </div>
      )}

      <nav className="bg-white/80 backdrop-blur-xl border-b border-primary/20 sticky top-0 z-50 shadow-sm">
        <div className="max-w-[1440px] mx-auto px-6 md:px-10 flex justify-between items-center h-20">
          <div className="font-h3 text-h3 tracking-tight text-primary">{shop.name}</div>
          <div className="hidden md:flex items-center gap-6">
            <Link className="text-primary font-bold border-b-2 border-primary pb-1" to={`/${shop.slug}#services`}>
              Dịch vụ
            </Link>
            <Link className="text-main/70 hover:text-primary transition-colors" to={`/${shop.slug}#staff`}>
              Nhân sự
            </Link>
            <Link className="text-main/70 hover:text-primary transition-colors" to={`/${shop.slug}#reviews`}>
              Đánh giá
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex bg-slate-100 border border-slate-200 rounded-full px-4 py-2 items-center gap-2">
              <span className="material-symbols-outlined text-primary">search</span>
              <input
                className="bg-transparent border-none outline-none w-32 md:w-48"
                placeholder="Tìm dịch vụ..."
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <Link className="bg-primary text-white px-6 py-2.5 rounded-full font-bold shadow-lg active:scale-95 transition-transform" to={`/${shop.slug}/book`}>
              Đặt lịch
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-[1440px] mx-auto px-6 md:px-10 py-12">
        <div className="flex flex-col lg:flex-row gap-6 relative">
          <div className="flex-grow flex flex-col gap-12">
            <section className="glass-card bg-white/60 p-6 rounded-3xl">
              <div className="flex items-center justify-between relative max-w-2xl mx-auto">
                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-200 -translate-y-1/2" />
                <div className="absolute top-1/2 left-0 w-1/4 h-0.5 bg-primary -translate-y-1/2 transition-all duration-700" />
                {[
                  { n: 1, t: 'Chọn dịch vụ', active: true },
                  { n: 2, t: 'Thời gian', active: false },
                  { n: 3, t: 'Thanh toán', active: false }
                ].map((s) => (
                  <div key={s.n} className="relative z-10 flex flex-col items-center gap-2">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold shadow-md ${s.active ? 'bg-primary text-white' : 'bg-white border-2 border-slate-200 text-main/60'}`}>
                      {s.n}
                    </div>
                    <span className={`text-sm font-bold ${s.active ? 'text-primary' : 'text-main/60'}`}>{s.t}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-6">
              <div className="space-y-2">
                <h2 className="font-h2 text-h2 text-primary">Chọn dịch vụ</h2>
                <p className="text-main/70">Tận hưởng trải nghiệm chăm sóc sắc đẹp cao cấp.</p>
              </div>

              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {categories.map((c) => {
                  const active = category === c
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCategory(c)}
                      className={`px-7 py-3 rounded-full font-bold whitespace-nowrap transition-colors ${
                        active ? 'bg-primary text-white shadow-md' : 'bg-white border border-primary/20 text-main/70 hover:bg-slate-50'
                      }`}
                    >
                      {categoryLabels[c] || c}
                    </button>
                  )
                })}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredServices.map((service) => {
                  const selected = service.id === selectedServiceId
                  return (
                    <div key={service.id} className={`glass-card bg-white/70 p-6 rounded-3xl transition-all border ${selected ? 'border-primary shadow-xl' : 'border-primary/10 hover:shadow-lg'}`}>
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <h3 className="font-h3 text-h3 text-main">{service.name}</h3>
                        <span className="font-bold text-primary">{formatVnd(service.priceVnd)}</span>
                      </div>
                      <p className="text-sm text-main/70 mb-4 line-clamp-3">{service.description || 'Dịch vụ chất lượng cao, thực hiện bởi đội ngũ chuyên gia.'}</p>
                      <div className="flex items-center gap-4 text-sm text-main/70 mb-5">
                        <div className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[18px] text-primary">schedule</span>
                          <span>{service.durationMinutes} phút</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[18px] text-primary">payments</span>
                          <span>{formatVnd(service.priceVnd)}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedServiceId(service.id)}
                        className={`w-full py-3 rounded-2xl font-bold transition-all active:scale-[0.98] ${
                          selected ? 'bg-primary text-white' : 'bg-white border-2 border-primary text-primary hover:bg-primary hover:text-white'
                        }`}
                      >
                        {selected ? 'Đã chọn' : 'Chọn'}
                      </button>
                    </div>
                  )
                })}
              </div>
            </section>

            <section className="space-y-6">
              <div className="space-y-2">
                <h2 className="font-h2 text-h2 text-primary">Chọn nhân viên</h2>
                <p className="text-main/70">Gặp gỡ đội ngũ chuyên gia tận tâm của chúng tôi.</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                <button
                  type="button"
                  onClick={() => setSelectedStaffId('random')}
                  className={`flex flex-col items-center gap-2 p-4 rounded-3xl transition-transform active:scale-95 ${
                    selectedStaffId === 'random' ? 'bg-primary/10 border-2 border-primary shadow-lg' : 'bg-white/60 border border-primary/10 hover:bg-white'
                  }`}
                >
                  <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center text-white shadow-inner">
                    <span className="material-symbols-outlined text-[40px]">shuffle</span>
                  </div>
                  <span className="font-bold text-primary text-center">Chọn ngẫu nhiên</span>
                </button>

                {availableStaff.slice(0, 9).map((m) => {
                  const isSelected = selectedStaffId === m.id
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setSelectedStaffId(m.id)}
                      className={`flex flex-col items-center gap-2 p-4 rounded-3xl transition-transform active:scale-95 ${
                        isSelected ? 'bg-primary/10 border-2 border-primary shadow-lg' : 'bg-white/60 border border-primary/10 hover:bg-white'
                      }`}
                    >
                      <div className={`w-20 h-20 rounded-full overflow-hidden border p-1 bg-white ${isSelected ? 'border-primary' : 'border-transparent'}`}>
                        <img className="w-full h-full object-cover rounded-full" alt={m.name} src={m.avatar || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=300&auto=format&fit=crop'} />
                      </div>
                      <span className="font-bold text-center text-main">{m.name}</span>
                      <span className="text-xs text-main/60 font-bold">{m.role || 'Chuyên viên'}</span>
                    </button>
                  )
                })}
              </div>
            </section>
          </div>

          <aside className="w-full lg:w-80 flex flex-col gap-4 lg:sticky lg:top-24 h-fit">
            <div className="glass-card bg-white/80 p-6 rounded-3xl border border-primary/20 flex flex-col gap-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-[28px]">shopping_basket</span>
                </div>
                <h4 className="font-h3 text-h3 text-main">Tóm tắt</h4>
              </div>

              {selectedService ? (
                <div className="flex justify-between items-start border-b border-slate-200 pb-4">
                  <div className="flex flex-col">
                    <span className="font-bold text-main">{selectedService.name}</span>
                    <span className="text-xs text-main/60">Thợ: {selectedStaffId === 'random' ? 'Ngẫu nhiên' : selectedStaff?.name ?? '—'}</span>
                  </div>
                  <span className="font-bold text-primary">{formatVnd(selectedService.priceVnd)}</span>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-main/60 text-sm">Chưa chọn dịch vụ.</div>
              )}

              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center text-main/70">
                  <span>Tạm tính:</span>
                  <span>{formatVnd(totalPrice)}</span>
                </div>
                <div className="flex justify-between items-center text-main/70">
                  <span>Giảm giá:</span>
                  <span>0đ</span>
                </div>
                <div className="flex justify-between items-center mt-3 border-t border-slate-200 pt-3">
                  <span className="font-bold text-main">Tổng cộng:</span>
                  <div className="flex flex-col items-end">
                    <span className="font-bold text-primary">{formatVnd(totalPrice)}</span>
                    <span className="text-xs text-secondary font-bold">{totalMinutes ? `~ ${totalMinutes} phút` : ''}</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                disabled={!selectedServiceId}
                onClick={goNext}
                className={`w-full py-4 rounded-2xl font-bold shadow-xl transition-all active:scale-[0.98] ${
                  selectedServiceId ? 'bg-primary text-white hover:scale-[1.02]' : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                Tiếp tục
              </button>
              <p className="text-xs text-main/60 text-center">Bước tiếp theo: Chọn thời gian phù hợp.</p>
            </div>

            <div className="glass-card bg-amber-50 p-4 rounded-2xl border border-amber-200 flex items-center gap-3">
              <span className="material-symbols-outlined text-amber-700">auto_awesome</span>
              <p className="text-xs text-amber-900">
                Nhập mã <b>LUMIX10</b> để được giảm ngay 10% dịch vụ đầu tiên!
              </p>
            </div>
          </aside>
        </div>
      </main>

      <footer className="bg-slate-100 border-t border-slate-200 mt-12 py-8">
        <div className="max-w-[1440px] mx-auto px-6 md:px-10 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="font-label-bold text-label-bold uppercase tracking-widest text-primary">LumiX Partner</div>
          <div className="flex gap-6 flex-wrap justify-center">
            <a className="text-main/70 hover:text-primary text-xs" href="#">
              Chính sách bảo mật
            </a>
            <a className="text-main/70 hover:text-primary text-xs" href="#">
              Điều khoản
            </a>
            <a className="text-main/70 hover:text-primary text-xs" href="#">
              Liên hệ
            </a>
            <a className="text-main/70 hover:text-primary text-xs" href="#">
              Hỗ trợ
            </a>
          </div>
          <p className="text-xs text-main/60">© 2024 LumiX Partner. Powered by LumiX.</p>
        </div>
      </footer>
    </div>
  )
}
