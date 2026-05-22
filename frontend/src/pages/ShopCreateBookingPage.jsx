import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ShopSidebar from '../components/shop/ShopSidebar'
import { useShop } from '../context/ShopContext'

export default function ShopCreateBookingPage() {
  const navigate = useNavigate()
  const { shop, services, staff, createBookingFromDraft, setBookingDraft } = useShop()

  const availableStaff = useMemo(() => staff.filter((item) => item.bookingEnabled), [staff])
  const [form, setForm] = useState({
    customerName: '',
    customerPhone: '',
    serviceId: services[0]?.id || '',
    staffId: availableStaff[0]?.id || 'random',
    date: new Date().toISOString().slice(0, 10),
    time: '09:00',
    note: ''
  })

  const handleCreate = async () => {
    setBookingDraft({
      serviceId: form.serviceId,
      staffId: form.staffId || 'random',
      date: form.date,
      time: form.time,
      customerName: form.customerName,
      customerPhone: form.customerPhone,
      note: form.note
    })

    const created = await createBookingFromDraft(shop.slug)
    const booking = created?.booking
    if (!booking) {
      alert('Vui lòng nhập đầy đủ thông tin để tạo lịch hẹn.')
      return
    }
    navigate(`/shop/bookings/${booking._id}`)
  }

  return (
    <div className="min-h-screen bg-slate-50 text-main">
      <ShopSidebar />
      <main className="ml-64 p-6 md:p-10 space-y-8">
        <header>
          <h1 className="font-h2 text-h2 text-primary">Tạo lịch hẹn mới</h1>
          <p className="text-main/70">Nhân viên shop có thể tạo nhanh lịch hẹn thủ công cho khách.</p>
        </header>

        <section className="glass-card bg-white rounded-3xl p-6 space-y-5 max-w-4xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input className="px-4 py-3 rounded-xl border border-slate-200" placeholder="Họ tên khách hàng" value={form.customerName} onChange={(e) => setForm((prev) => ({ ...prev, customerName: e.target.value }))} />
            <input className="px-4 py-3 rounded-xl border border-slate-200" placeholder="Số điện thoại" value={form.customerPhone} onChange={(e) => setForm((prev) => ({ ...prev, customerPhone: e.target.value }))} />
            <select className="px-4 py-3 rounded-xl border border-slate-200" value={form.serviceId} onChange={(e) => setForm((prev) => ({ ...prev, serviceId: e.target.value }))}>
              {services.map((service) => (
                <option key={service.id} value={service.id}>{service.name}</option>
              ))}
            </select>
            <select className="px-4 py-3 rounded-xl border border-slate-200" value={form.staffId} onChange={(e) => setForm((prev) => ({ ...prev, staffId: e.target.value }))}>
              <option value="random">Ngẫu nhiên</option>
              {availableStaff.map((member) => (
                <option key={member.id} value={member.id}>{member.name}</option>
              ))}
            </select>
            <input type="date" className="px-4 py-3 rounded-xl border border-slate-200" value={form.date} onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))} />
            <input type="time" className="px-4 py-3 rounded-xl border border-slate-200" value={form.time} onChange={(e) => setForm((prev) => ({ ...prev, time: e.target.value }))} />
          </div>

          <textarea rows={4} className="w-full px-4 py-3 rounded-xl border border-slate-200" placeholder="Ghi chú thêm..." value={form.note} onChange={(e) => setForm((prev) => ({ ...prev, note: e.target.value }))} />

          <div className="flex gap-3">
            <button className="px-5 py-3 rounded-xl bg-primary text-white font-bold" onClick={handleCreate}>Tạo lịch hẹn</button>
            <button className="px-5 py-3 rounded-xl bg-slate-100 text-main/70 font-bold" onClick={() => navigate('/shop/bookings')}>Quay lại</button>
          </div>
        </section>
      </main>
    </div>
  )
}

