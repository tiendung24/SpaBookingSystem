import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ShopSidebar from '../components/shop/ShopSidebar'
import { useShop } from '../context/ShopContext'

function normalizePhone(input) {
  return String(input || '')
    .trim()
    .replace(/[\s.-]/g, '')
}

function isValidPhone(input) {
  return /^(?:\+84|0)\d{9,10}$/.test(input)
}

export default function ShopCreateBookingPage() {
  const navigate = useNavigate()
  const { shop, services, staff, createBookingFromDraft, setBookingDraft } = useShop()

  const availableStaff = useMemo(() => staff.filter((item) => item.bookingEnabled), [staff])
  const [formError, setFormError] = useState('')
  const [form, setForm] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    serviceId: services[0]?.id || '',
    staffId: availableStaff[0]?.id || 'random',
    date: new Date().toISOString().slice(0, 10),
    time: '09:00',
    note: ''
  })

  const handleCreate = async () => {
    const customerName = String(form.customerName || '').trim()
    const customerPhone = normalizePhone(form.customerPhone)
    const customerEmail = String(form.customerEmail || '').trim()

    if (!customerName) {
      setFormError('Vui lòng nhập họ tên khách hàng.')
      return
    }
    if (!isValidPhone(customerPhone)) {
      setFormError('Số điện thoại không hợp lệ (0 hoặc +84, 10-11 số).')
      return
    }
    if (!customerEmail) {
      setFormError('Vui lòng nhập email khách hàng.')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
      setFormError('Email không hợp lệ.')
      return
    }
    if (!form.serviceId) {
      setFormError('Vui lòng chọn dịch vụ.')
      return
    }
    if (!form.date || !form.time) {
      setFormError('Vui lòng chọn ngày giờ hẹn.')
      return
    }

    setFormError('')
    setBookingDraft({
      serviceId: form.serviceId,
      staffId: form.staffId || 'random',
      date: form.date,
      time: form.time,
      customerName,
      customerPhone,
      customerEmail,
      note: form.note
    })

    let created = null
    try {
      created = await createBookingFromDraft(shop.slug)
    } catch (err) {
      // Surface friendly message to admin and stop
      window.alert(err?.message || 'Không thể tạo lịch hẹn: Lỗi không xác định')
      return
    }

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
            <div>
              <input className="w-full px-4 py-3 rounded-xl border border-slate-200" placeholder="Họ tên khách hàng" value={form.customerName} onChange={(e) => setForm((prev) => ({ ...prev, customerName: e.target.value }))} />
            </div>
            <div>
              <input className="w-full px-4 py-3 rounded-xl border border-slate-200" placeholder="Số điện thoại" value={form.customerPhone} onChange={(e) => setForm((prev) => ({ ...prev, customerPhone: e.target.value }))} />
              {(!normalizePhone(form.customerPhone)) ? (
                <p className="text-xs text-red-600 mt-2">Vui lòng nhập số điện thoại.</p>
              ) : (!isValidPhone(normalizePhone(form.customerPhone)) ? (
                <p className="text-xs text-red-600 mt-2">Số điện thoại không hợp lệ (bắt đầu bằng 0 hoặc +84, 10-11 chữ số).</p>
              ) : null)}
            </div>
            <div>
              <input className="w-full px-4 py-3 rounded-xl border border-slate-200" placeholder="Email khách hàng" value={form.customerEmail} onChange={(e) => setForm((prev) => ({ ...prev, customerEmail: e.target.value }))} />
              {(!String(form.customerEmail || '').trim()) ? (
                <p className="text-xs text-red-600 mt-2">Vui lòng nhập email khách hàng.</p>
              ) : (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(form.customerEmail || '').trim()) ? (
                <p className="text-xs text-red-600 mt-2">Email không hợp lệ.</p>
              ) : null)}
            </div>
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

          {formError ? <p className="text-sm text-red-600">{formError}</p> : null}

          <div className="flex gap-3">
            <button type="button" className="px-5 py-3 rounded-xl bg-primary text-white font-bold" onClick={handleCreate}>Tạo lịch hẹn</button>
            <button type="button" className="px-5 py-3 rounded-xl bg-slate-100 text-main/70 font-bold" onClick={() => navigate('/shop/bookings')}>Quay lại</button>
          </div>
        </section>
      </main>
    </div>
  )
}