import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useShop } from '../context/ShopContext'
import CustomerHeader from '../components/customer/CustomerHeader'

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

const serviceFallbackImage = 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=1200&auto=format&fit=crop'
const staffFallbackImage = 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=300&auto=format&fit=crop'

export default function CustomerSelectServicePage({ isModal = false, onClose, onNext } = {}) {
  const navigate = useNavigate()
  const { slug } = useParams()
  const { shop, services, staff, bookingDraft, setBookingDraft, loadPublicShop } = useShop()

  const [category, setCategory] = useState('all')
  const [query, setQuery] = useState('')
  const [selectedServiceId, setSelectedServiceId] = useState(bookingDraft.serviceId || null)
  const [selectedStaffId, setSelectedStaffId] = useState(bookingDraft.staffId || 'random')

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
      const matchQuery = !q || String(s.name || '').toLowerCase().includes(q)
      return matchCategory && matchQuery
    })
  }, [visibleServices, category, query])

  const selectedService = services.find((s) => s.id === selectedServiceId) || null
  const availableStaff = useMemo(() => staff.filter((s) => s.bookingEnabled), [staff])
  const selectedStaff = staff.find((s) => s.id === selectedStaffId) || null
  const showSlotCompatibility = Boolean(bookingDraft.time && !bookingDraft.holdToken)
  const serviceStaffIds = useMemo(() => {
    if (!selectedService) return []
    return Array.isArray(selectedService.staffIds) ? selectedService.staffIds.filter(Boolean) : []
  }, [selectedService])

  const staffCanDoSelectedService = (member) => {
    if (!selectedService) return true
    if (!serviceStaffIds.length) return true
    return serviceStaffIds.includes(member.id)
  }

  const staffWorksSelectedSlot = (member) => {
    if (!showSlotCompatibility) return true
    const selectedSlot = bookingDraft.time || ''
    const slots = Array.isArray(member?.slotAssignments) ? member.slotAssignments : []
    if (!slots.length) return true
    return slots.includes(selectedSlot)
  }

  const totalMinutes = selectedService?.durationMinutes ?? 0
  const totalPrice = selectedService?.priceVnd ?? 0

  useEffect(() => {
    if (!bookingDraft?.serviceId) return
    const serviceChanged = String(bookingDraft.serviceId || '') !== String(selectedServiceId || '')
    const staffChanged = String(bookingDraft.staffId || 'random') !== String(selectedStaffId || 'random')
    if (!serviceChanged && !staffChanged) return
    setBookingDraft((prev) => ({
      ...prev,
      time: '',
      date: '',
      holdToken: '',
      holdExpiresAt: ''
    }))
  }, [selectedServiceId, selectedStaffId, bookingDraft?.serviceId, bookingDraft?.staffId, setBookingDraft])

  useEffect(() => {
    if (selectedStaffId === 'random') return
    if (availableStaff.some((member) => member.id === selectedStaffId)) return
    setSelectedStaffId('random')
  }, [selectedStaffId, availableStaff])

  const goNext = () => {
    if (!selectedServiceId) return
    setBookingDraft((prev) => {
      const serviceChanged = String(prev.serviceId || '') !== String(selectedServiceId || '')
      const staffChanged = String(prev.staffId || 'random') !== String(selectedStaffId || 'random')
      const mustResetSlot = serviceChanged || staffChanged

      return {
        ...prev,
        serviceId: selectedServiceId,
        staffId: selectedStaffId,
        time: mustResetSlot ? '' : prev.time,
        date: mustResetSlot ? '' : prev.date,
        holdToken: mustResetSlot ? '' : prev.holdToken,
        holdExpiresAt: mustResetSlot ? '' : prev.holdExpiresAt
      }
    })
    if (isModal && typeof onNext === 'function') {
      onNext({ serviceId: selectedServiceId, staffId: selectedStaffId })
    } else {
      navigate(`/${slug || shop.slug}/book/time`)
    }
  }

  const isCorrectSlug = !slug || slug === shop.slug

  const content = (
    <div className="min-h-screen bg-slate-50 text-main">
      <CustomerHeader />
      {!isCorrectSlug && (
        <div className="bg-amber-100 border-b border-amber-300 text-amber-900 px-4 py-2 text-sm text-center">
          Bạn đang mở slug <b>{slug}</b> không khớp shop hiện tại. Demo đang hiển thị dữ liệu của <b>{shop.name}</b>.
        </div>
      )}

      {/* header replaced by CustomerHeader */}

      <main className="max-w-[1440px] mx-auto px-6 md:px-10 py-12">
        <div className="flex flex-col lg:flex-row gap-6 relative">
          <div className="flex-grow flex flex-col gap-12">
            <section className="glass-card bg-white/60 p-6 rounded-3xl">
              <div className="flex items-center justify-between relative max-w-2xl mx-auto">
                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-200 -translate-y-1/2" />
                {[{ n: 1, t: 'Chọn dịch vụ', active: true }, { n: 2, t: 'Chọn thời gian' }, { n: 3, t: 'Thanh toán' }].map((step) => (
                  <div key={step.n} className="relative z-10 flex flex-col items-center gap-2">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold ${step.active ? 'bg-primary text-white' : 'bg-white border border-slate-200 text-main/60'}`}>{step.n}</div>
                    <span className={`text-sm font-bold ${step.active ? 'text-primary' : 'text-main/60'}`}>{step.t}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-6">
              <div className="space-y-2">
                <h2 className="font-h2 text-h2 text-primary">Chọn dịch vụ</h2>
                <p className="text-main/70">Tận hưởng trải nghiệm chăm sóc sắc đẹp cao cấp.</p>
              </div>

              <div className="flex gap-2 flex-wrap">
                {categories.map((c) => {
                  const active = c === category
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCategory(c)}
                      className={`px-7 py-3 rounded-full font-bold whitespace-nowrap transition-colors ${active ? 'bg-primary text-white shadow-md' : 'bg-white border border-primary/20 text-main/70 hover:bg-slate-50'}`}
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
                      <div className="mb-4 overflow-hidden rounded-2xl border border-slate-200">
                        <img src={service.imageUrl || serviceFallbackImage} alt={service.name} className="w-full h-40 object-cover" />
                      </div>
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <h3 className="font-h3 text-h3 text-main">{service.name}</h3>
                        <span className="font-bold text-primary">{formatVnd(service.priceVnd)}</span>
                      </div>
                      <p className="text-sm text-main/70 mb-4 line-clamp-3">{service.description || 'Dịch vụ chất lượng cao, thực hiện bởi đội ngũ chuyên gia.'}</p>
                      <div className="flex items-center gap-4 text-sm text-main/70 mb-5">
                        <div className="flex items-center gap-1"><span className="material-symbols-outlined text-[18px] text-primary">schedule</span><span>{service.durationMinutes} phút</span></div>
                        <div className="flex items-center gap-1"><span className="material-symbols-outlined text-[18px] text-primary">payments</span><span>{formatVnd(service.priceVnd)}</span></div>
                      </div>
                      <button type="button" onClick={() => setSelectedServiceId(service.id)} className={`w-full py-3 rounded-2xl font-bold transition-all active:scale-[0.98] ${selected ? 'bg-primary text-white' : 'bg-white border-2 border-primary text-primary hover:bg-primary hover:text-white'}`}>
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
                  className={`flex flex-col items-center gap-2 p-4 rounded-3xl transition-transform active:scale-95 ${selectedStaffId === 'random' ? 'bg-primary/10 border-2 border-primary shadow-lg' : 'bg-white/60 border border-primary/10 hover:bg-white'}`}
                >
                  <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center text-white shadow-inner">
                    <span className="material-symbols-outlined text-[40px]">shuffle</span>
                  </div>
                  <span className="font-bold text-primary text-center">Chọn ngẫu nhiên</span>
                </button>

                {availableStaff.slice(0, 9).map((m) => {
                  const isSelected = selectedStaffId === m.id
                  const worksThisSlot = staffWorksSelectedSlot(m)
                  const canDoService = staffCanDoSelectedService(m)
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => canDoService && setSelectedStaffId(m.id)}
                      disabled={!canDoService}
                      className={`flex flex-col items-center gap-2 p-4 rounded-3xl transition-transform active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 ${isSelected ? 'bg-primary/10 border-2 border-primary shadow-lg' : 'bg-white/60 border border-primary/10 hover:bg-white'}`}
                    >
                      <div className={`w-20 h-20 rounded-full overflow-hidden border p-1 bg-white ${isSelected ? 'border-primary' : 'border-transparent'}`}>
                        <img className="w-full h-full object-cover rounded-full" alt={m.name} src={m.avatar || staffFallbackImage} />
                      </div>
                      <span className="font-bold text-center text-main">{m.name}</span>
                      <span className="text-xs text-main/60 font-bold">{m.role || 'Chuyên viên'}</span>
                      {!canDoService ? <span className="text-[11px] px-2 py-1 rounded-full bg-red-100 text-red-700 font-bold">Không phụ trách dịch vụ này</span> : null}
                      {!worksThisSlot ? <span className="text-[11px] px-2 py-1 rounded-full bg-amber-100 text-amber-700 font-bold">Không làm slot này</span> : null}
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
                <div className="border-b border-slate-200 pb-4">
                  <div className="flex items-start gap-3">
                    <img src={selectedService.imageUrl || serviceFallbackImage} alt={selectedService.name} className="w-14 h-14 rounded-xl object-cover border border-slate-200" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-bold text-main line-clamp-2">{selectedService.name}</span>
                        <span className="font-bold text-primary whitespace-nowrap">{formatVnd(selectedService.priceVnd)}</span>
                      </div>
                      <span className="text-xs text-main/60">Thợ: {selectedStaffId === 'random' ? 'Ngẫu nhiên' : selectedStaff?.name ?? '—'}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-main/60 text-sm">Chưa chọn dịch vụ.</div>
              )}

              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center text-main/70"><span>Tạm tính:</span><span>{formatVnd(totalPrice)}</span></div>
                <div className="flex justify-between items-center text-main/70"><span>Giảm giá:</span><span>0đ</span></div>
                <div className="flex justify-between items-center mt-3 border-t border-slate-200 pt-3">
                  <span className="font-bold text-main">Tổng cộng:</span>
                  <div className="flex flex-col items-end">
                    <span className="font-bold text-primary">{formatVnd(totalPrice)}</span>
                    <span className="text-xs text-secondary font-bold">{totalMinutes ? `~ ${totalMinutes} phút` : ''}</span>
                  </div>
                </div>
              </div>

              <button type="button" disabled={!selectedServiceId} onClick={goNext} className={`w-full py-4 rounded-2xl font-bold shadow-xl transition-all active:scale-[0.98] ${selectedServiceId ? 'bg-primary text-white hover:scale-[1.02]' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}>
                Tiếp tục
              </button>
              <p className="text-xs text-main/60 text-center">Bước tiếp theo: Chọn thời gian phù hợp.</p>
            </div>
          </aside>
        </div>
      </main>

      <footer className="bg-slate-100 border-t border-slate-200 mt-12 py-8">
        <div className="max-w-[1440px] mx-auto px-6 md:px-10 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="font-label-bold text-label-bold uppercase tracking-widest text-primary">LumiX Partner</div>
          <div className="flex gap-6 flex-wrap justify-center">
            <a className="text-main/70 hover:text-primary text-xs" href="#">Chính sách bảo mật</a>
            <a className="text-main/70 hover:text-primary text-xs" href="#">Điều khoản</a>
            <a className="text-main/70 hover:text-primary text-xs" href="#">Liên hệ</a>
            <a className="text-main/70 hover:text-primary text-xs" href="#">Hỗ trợ</a>
          </div>
          <p className="text-xs text-main/60">© 2026 LumiX Partner. Powered by LumiX.</p>
        </div>
      </footer>
    </div>
  )

  if (isModal) {
    return (
      <div className="fixed inset-0 z-[90] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => onClose && onClose()}>
        <div className="bg-white rounded-3xl max-w-[1100px] w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
          {content}
        </div>
      </div>
    )
  }

  return content
}
