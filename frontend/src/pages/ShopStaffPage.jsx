import { useMemo, useState } from 'react'
import ShopSidebar from '../components/shop/ShopSidebar'
import { useShop } from '../context/ShopContext'

const roles = [
  { key: 'all', label: 'Tất cả' },
  { key: 'tech', label: 'Kỹ thuật viên' }
]

const avatarFallback = 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=500&auto=format&fit=crop'

function roleLabel() {
  return 'Kỹ thuật viên'
}

function statusBadge(status) {
  if (status === 'working') return { label: 'Đang làm', className: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' }
  return { label: 'Tạm nghỉ', className: 'bg-slate-100 text-slate-700', dot: 'bg-slate-400' }
}

function normalizePhone(input) {
  return String(input || '').trim().replace(/[\s.-]/g, '')
}

function isValidPhone(input) {
  if (!input) return true
  return /^(?:\+84|0)\d{9,10}$/.test(input)
}

export default function ShopStaffPage() {
  const { staff, addStaff, updateStaff, deleteStaff, bookings, uploadImage, shop } = useShop()

  const [query, setQuery] = useState('')
  const [activeRole, setActiveRole] = useState('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formError, setFormError] = useState('')
  const [form, setForm] = useState({
    name: '',
    phone: '',
    role: 'tech',
    status: 'working',
    rating: 5,
    bookingEnabled: true,
    shortBio: '',
    bio: '',
    specialties: [],
    slotAssignments: [],
    avatar: avatarFallback
  })

  const shopSlots = useMemo(() => {
    const open = shop?.hours?.open || '09:00'
    const close = shop?.hours?.close || '20:00'
    const slotDuration = Number(shop?.hours?.slotDuration || 60)
    const [openHour, openMinute] = String(open).split(':').map(Number)
    const [closeHour, closeMinute] = String(close).split(':').map(Number)
    const start = openHour * 60 + openMinute
    const end = closeHour * 60 + closeMinute
    const slots = []
    for (let current = start; current < end; current += slotDuration) {
      const hour = String(Math.floor(current / 60)).padStart(2, '0')
      const minute = String(current % 60).padStart(2, '0')
      slots.push(`${hour}:${minute}`)
    }
    return slots
  }, [shop?.hours?.open, shop?.hours?.close, shop?.hours?.slotDuration])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return staff.filter((member) => {
      const matchRole = activeRole === 'all' || member.role === activeRole
      const phoneText = String(member.phone || '').replace(/\s/g, '')
      const qPhone = q.replace(/\s/g, '')
      const matchQuery = !q || String(member.name || '').toLowerCase().includes(q) || phoneText.includes(qPhone)
      return matchRole && matchQuery
    })
  }, [staff, query, activeRole])

  const stats = useMemo(() => {
    const total = staff.length
    const working = staff.filter((s) => s.status === 'working').length
    const bookingsToday = (bookings || []).filter((b) => {
      const d = new Date(b.time)
      const now = new Date()
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate()
    }).length
    const ratingAvg = staff.length === 0 ? 0 : Math.round((staff.reduce((sum, s) => sum + (s.rating ?? 0), 0) / staff.length) * 10) / 10
    return { total, working, bookingsToday, ratingAvg }
  }, [staff, bookings])

  const openCreate = () => {
    setEditingId(null)
    setFormError('')
    setForm({
      name: '',
      phone: '',
      role: 'tech',
      status: 'working',
      rating: 5,
      bookingEnabled: true,
      shortBio: '',
      bio: '',
      specialties: [],
      slotAssignments: [],
      avatar: avatarFallback
    })
    setModalOpen(true)
  }

  const openEdit = (member) => {
    setEditingId(member.id)
    setFormError('')
    setForm({
      name: member.name || '',
      phone: member.phone || '',
      role: 'tech',
      status: member.status || 'working',
      rating: Number(member.rating || 5),
      bookingEnabled: Boolean(member.bookingEnabled),
      shortBio: member.shortBio || '',
      bio: member.bio || '',
      specialties: member.specialties || [],
      slotAssignments: member.slotAssignments || [],
      avatar: member.avatar || avatarFallback
    })
    setModalOpen(true)
  }

  const saveMember = () => {
    const name = String(form.name || '').trim()
    const phoneNormalized = normalizePhone(form.phone)
    if (!name) return setFormError('Vui lòng nhập họ tên.')
    if (!isValidPhone(phoneNormalized)) return setFormError('Số điện thoại không hợp lệ (0 hoặc +84, 10-11 số).')

    const payload = {
      ...form,
      role: 'tech',
      name,
      phone: phoneNormalized,
      avatar: form.avatar || avatarFallback
    }

    if (editingId) updateStaff(editingId, payload)
    else addStaff(payload)

    setFormError('')
    setModalOpen(false)
  }

  const handleAvatarUpload = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    const localUrl = URL.createObjectURL(file)
    setForm((prev) => ({ ...prev, avatar: localUrl }))

    try {
      const uploadedUrl = await uploadImage(file)
      setForm((prev) => ({ ...prev, avatar: uploadedUrl }))
    } catch (err) {
      console.error('Lỗi upload avatar:', err)
      alert('Lỗi tải ảnh lên server.')
    }
  }

  const toggleBookingEnabled = (id) => {
    const member = staff.find((item) => item.id === id)
    if (!member) return
    updateStaff(id, { bookingEnabled: !member.bookingEnabled })
  }

  return (
    <div className="min-h-screen bg-slate-50 text-main overflow-x-hidden">
      <ShopSidebar onNewBooking={() => {}} />
      <main className="ml-64 p-6 md:p-10">
        <section className="glass-card bg-white/70 rounded-3xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-h2 text-h2 text-primary">Quản lý nhân sự</h2>
              <p className="text-main/70">Theo dõi trạng thái làm việc và dịch vụ phụ trách của kỹ thuật viên.</p>
            </div>
            <button type="button" className="px-4 py-2 rounded-xl bg-primary text-white font-bold" onClick={openCreate}>+ Thêm nhân sự</button>
          </div>

          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-5">
            <div className="bg-white rounded-2xl border border-slate-200 p-4"><p className="text-main/60 text-sm">Tổng nhân sự</p><p className="text-2xl font-bold">{stats.total}</p></div>
            <div className="bg-white rounded-2xl border border-slate-200 p-4"><p className="text-main/60 text-sm">Đang làm</p><p className="text-2xl font-bold text-emerald-600">{stats.working}</p></div>
            <div className="bg-white rounded-2xl border border-slate-200 p-4"><p className="text-main/60 text-sm">Booking hôm nay</p><p className="text-2xl font-bold text-primary">{stats.bookingsToday}</p></div>
            <div className="bg-white rounded-2xl border border-slate-200 p-4"><p className="text-main/60 text-sm">Rating trung bình</p><p className="text-2xl font-bold text-amber-500">{stats.ratingAvg}</p></div>
          </div>

          <div className="flex gap-2 flex-wrap mb-4">
            {roles.map((r) => (
              <button key={r.key} type="button" onClick={() => setActiveRole(r.key)} className={`px-4 py-2 rounded-full border ${activeRole === r.key ? 'border-primary bg-primary/10 text-primary' : 'border-slate-300 text-main/70'}`}>{r.label}</button>
            ))}
          </div>

          <input className="w-full p-3 rounded-xl border border-slate-300" placeholder="Tìm theo tên hoặc số điện thoại..." value={query} onChange={(e) => setQuery(e.target.value)} />

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-5">
            {filtered.map((member) => {
              const badge = statusBadge(member.status)
              return (
                <article key={member.id} className="border border-slate-200 rounded-2xl p-4 bg-white">
                  <div className="flex items-center gap-3">
                    <img src={member.avatar || avatarFallback} alt={member.name} className="h-14 w-14 rounded-xl object-cover" />
                    <div>
                      <h3 className="font-bold">{member.name}</h3>
                      <p className="text-sm text-main/70">{roleLabel(member.role)}</p>
                      {member.shortBio ? <p className="text-sm text-main/60">{member.shortBio}</p> : null}
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-main/70">{member.phone || 'Chưa có số điện thoại'}</p>
                  <p className={`mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs ${badge.className}`}><span className={`w-2 h-2 rounded-full ${badge.dot}`} />{badge.label}</p>
                  <div className="mt-3 flex gap-2">
                    <button type="button" className="px-3 py-2 rounded-lg border border-slate-300" onClick={() => openEdit(member)}>Sửa</button>
                    <button type="button" className="px-3 py-2 rounded-lg border border-slate-300" onClick={() => toggleBookingEnabled(member.id)}>{member.bookingEnabled ? 'Nhận lịch' : 'Tạm tắt'}</button>
                    <button type="button" className="px-3 py-2 rounded-lg border border-red-300 text-red-600" onClick={() => deleteStaff(member.id)}>Xóa</button>
                  </div>
                </article>
              )
            })}
          </div>
        </section>
      </main>

      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-h3 text-h3 text-primary">{editingId ? 'Cập nhật nhân sự' : 'Thêm nhân sự'}</h3>
              <button type="button" className="text-main/60 hover:text-main" onClick={() => setModalOpen(false)}>Đóng</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input className="p-3 rounded-xl border border-slate-300" placeholder="Họ tên" value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} />
              <input className="p-3 rounded-xl border border-slate-300" placeholder="Số điện thoại" value={form.phone} onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))} />
              <select className="p-3 rounded-xl border border-slate-300" value="tech" onChange={() => {}} disabled>
                <option value="tech">Kỹ thuật viên</option>
              </select>
              <select className="p-3 rounded-xl border border-slate-300" value={form.status} onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}>
                <option value="working">Đang làm</option>
                <option value="off">Tạm nghỉ</option>
              </select>

              <input className="p-3 rounded-xl border border-slate-300 md:col-span-2" placeholder="Mô tả ngắn (chuyên môn)" value={form.shortBio || ''} onChange={(e) => setForm((prev) => ({ ...prev, shortBio: e.target.value }))} />

              <div className="md:col-span-2">
                <label className="text-sm font-bold text-main/70">Mô tả chi tiết (chuyên môn)</label>
                <textarea className="w-full p-3 rounded-xl border border-slate-300 mt-1" rows={3} placeholder="Mô tả chi tiết về chuyên môn, chứng chỉ..." value={form.bio || ''} onChange={(e) => setForm((prev) => ({ ...prev, bio: e.target.value }))} />
              </div>

              <input className="p-3 rounded-xl border border-slate-300 md:col-span-2" placeholder="Chuyên môn (phân tách bằng dấu phẩy)" value={(Array.isArray(form.specialties) ? form.specialties.join(', ') : form.specialties) || ''} onChange={(e) => setForm((prev) => ({ ...prev, specialties: String(e.target.value || '').split(',').map((s) => s.trim()).filter(Boolean) }))} />

              <div className="md:col-span-2">
                <label className="text-sm font-bold text-main/70">Ảnh đại diện</label>
                <input type="file" accept="image/*" className="w-full mt-1 p-3 rounded-xl border border-slate-300 bg-white" onChange={handleAvatarUpload} />
                <img src={form.avatar || avatarFallback} alt="Preview avatar" className="mt-3 h-28 w-28 rounded-2xl object-cover border border-slate-200" />
              </div>
            </div>

            <div className="mt-4">
              <p className="text-sm font-bold text-main/70 mb-2">Phân quyền theo slot giờ</p>
              <p className="text-xs text-main/60 mb-2">Nếu không chọn slot nào, nhân viên được hiểu là làm tất cả slot.</p>
              <div className="flex gap-2 flex-wrap max-h-40 overflow-y-auto rounded-2xl border border-slate-200 p-3">
                {shopSlots.map((slot) => {
                  const checked = form.slotAssignments.includes(slot)
                  return (
                    <button
                      key={slot}
                      type="button"
                      className={`px-4 py-2 rounded-full border ${checked ? 'border-primary bg-primary/10 text-primary' : 'border-slate-300 text-main/70'}`}
                      onClick={() =>
                        checked
                          ? setForm((prev) => ({ ...prev, slotAssignments: prev.slotAssignments.filter((s) => s !== slot) }))
                          : setForm((prev) => ({ ...prev, slotAssignments: [...prev.slotAssignments, slot] }))
                      }
                    >
                      {slot}
                    </button>
                  )
                })}
              </div>
            </div>

            {formError ? <p className="mt-4 text-sm text-red-600">{formError}</p> : null}

            <div className="mt-5 flex justify-end gap-2">
              <button type="button" className="px-4 py-2 rounded-xl border border-slate-300" onClick={() => setModalOpen(false)}>Hủy</button>
              <button type="button" className="px-4 py-2 rounded-xl bg-primary text-white font-bold" onClick={saveMember}>Lưu</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
