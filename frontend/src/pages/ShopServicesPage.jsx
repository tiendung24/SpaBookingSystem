import { useMemo, useState } from 'react'
import ShopSidebar from '../components/shop/ShopSidebar'
import { useShop } from '../context/ShopContext'

const categories = [
  { key: 'all', name: 'Tất cả' },
  { key: 'nail', name: 'Nail' },
  { key: 'spa', name: 'Spa & Skincare' },
  { key: 'massage', name: 'Massage' }
]

const fallbackImage =
  'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=1200&auto=format&fit=crop'

function formatVnd(number) {
  return `${Number(number || 0).toLocaleString('vi-VN')}đ`
}

export default function ShopServicesPage() {
  const { services, addService, updateService, deleteService, staff, uploadImage } = useShop()
  const [activeCategory, setActiveCategory] = useState('all')
  const [query, setQuery] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formError, setFormError] = useState('')
  const [form, setForm] = useState({
    name: '',
    category: 'spa',
    durationMinutes: 45,
    priceVnd: 150000,
    visible: true,
    imageUrl: fallbackImage,
    staffIds: []
  })

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return services.filter((service) => {
      const matchCategory = activeCategory === 'all' || service.category === activeCategory
      const matchQuery = !normalized || String(service.name || '').toLowerCase().includes(normalized)
      return matchCategory && matchQuery
    })
  }, [services, activeCategory, query])

  const counts = useMemo(() => {
    const result = { all: services.length }
    for (const c of categories) result[c.key] = 0
    for (const s of services) result[s.category] = (result[s.category] || 0) + 1
    return result
  }, [services])

  const openCreate = () => {
    setEditingId(null)
    setFormError('')
    setForm({
      name: '',
      category: 'spa',
      durationMinutes: 45,
      priceVnd: 150000,
      visible: true,
      imageUrl: fallbackImage,
      staffIds: []
    })
    setModalOpen(true)
  }

  const openEdit = (service) => {
    setEditingId(service.id)
    setFormError('')
    setForm({
      name: service.name,
      category: service.category,
      durationMinutes: Number(service.durationMinutes || 0),
      priceVnd: Number(service.priceVnd || 0),
      visible: Boolean(service.visible),
      imageUrl: service.imageUrl || fallbackImage,
      staffIds: service.staffIds || []
    })
    setModalOpen(true)
  }

  const saveService = () => {
    const formName = String(form.name || '').trim()
    const formDuration = Number(form.durationMinutes || 0)
    const formPrice = Number(form.priceVnd || 0)

    if (!formName) return setFormError('Vui lòng nhập tên dịch vụ.')
    if (formDuration < 15) return setFormError('Thời gian dịch vụ tối thiểu 15 phút.')
    if (formPrice <= 0) return setFormError('Giá dịch vụ phải lớn hơn 0.')

    const payload = { ...form, name: formName, durationMinutes: formDuration, priceVnd: formPrice }
    if (editingId) updateService(editingId, payload)
    else addService(payload)

    setFormError('')
    setModalOpen(false)
  }

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    const localUrl = URL.createObjectURL(file)
    setForm((prev) => ({ ...prev, imageUrl: localUrl }))

    try {
      const uploadedUrl = await uploadImage(file)
      setForm((prev) => ({ ...prev, imageUrl: uploadedUrl }))
    } catch (err) {
      console.error('Lỗi upload ảnh:', err)
      alert('Lỗi tải ảnh lên server, vui lòng thử lại.')
    }
  }

  const toggleVisibility = (id) => {
    const item = services.find((service) => service.id === id)
    if (!item) return
    updateService(id, { visible: !item.visible })
  }

  return (
    <div className="min-h-screen bg-slate-50 text-main">
      <ShopSidebar onNewBooking={() => console.log('Tạo lịch hẹn mới')} />
      <main className="ml-64 p-6 md:p-10 min-h-screen">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="font-h2 text-h2 text-primary tracking-tight">Quản lý dịch vụ</h1>
            <p className="font-body-md text-body-md text-main/70">Tối ưu danh mục dịch vụ và ảnh hiển thị.</p>
          </div>
          <button type="button" className="bg-primary text-white px-5 py-3 rounded-xl font-bold" onClick={openCreate}>Thêm dịch vụ mới</button>
        </header>

        <section className="bg-white rounded-3xl p-6 border border-slate-200">
          <div className="flex flex-wrap gap-2 mb-4">
            {categories.map((cat) => (
              <button
                key={cat.key}
                type="button"
                onClick={() => setActiveCategory(cat.key)}
                className={`px-4 py-2 rounded-full border ${activeCategory === cat.key ? 'border-primary bg-primary/10 text-primary' : 'border-slate-300 text-main/70'}`}
              >
                {cat.name} ({counts[cat.key] || 0})
              </button>
            ))}
          </div>

          <input
            className="w-full p-3 rounded-xl border border-slate-300"
            placeholder="Tìm theo tên dịch vụ"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-5">
            {filtered.map((service) => (
              <article key={service.id} className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
                <img src={service.imageUrl || fallbackImage} alt={service.name} className="h-44 w-full object-cover" />
                <div className="p-4 space-y-2">
                  <h3 className="font-bold text-lg">{service.name}</h3>
                  <p className="text-sm text-main/70">{service.durationMinutes} phút · {formatVnd(service.priceVnd)}</p>
                  <p className="text-sm text-main/70">Nhân sự: {(service.staffIds || []).length}</p>
                  <div className="flex gap-2">
                    <button type="button" className="px-3 py-2 rounded-lg border border-slate-300" onClick={() => openEdit(service)}>Sửa</button>
                    <button type="button" className="px-3 py-2 rounded-lg border border-slate-300" onClick={() => toggleVisibility(service.id)}>{service.visible ? 'Đang hiển thị' : 'Đã ẩn'}</button>
                    <button type="button" className="px-3 py-2 rounded-lg border border-red-300 text-red-600" onClick={() => deleteService(service.id)}>Xóa</button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>

      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-2xl">
            <div className="flex justify-between items-start">
              <h3 className="font-h3 text-h3 text-primary">{editingId ? 'Sửa dịch vụ' : 'Thêm dịch vụ mới'}</h3>
              <button type="button" onClick={() => setModalOpen(false)} className="text-main/60 hover:text-main">✕</button>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              <input className="p-3 rounded-xl border border-slate-300 md:col-span-2" placeholder="Tên dịch vụ" value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} />
              <select className="p-3 rounded-xl border border-slate-300" value={form.category} onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}>
                {categories.filter((c) => c.key !== 'all').map((c) => <option key={c.key} value={c.key}>{c.name}</option>)}
              </select>
              <input className="p-3 rounded-xl border border-slate-300" type="number" min={15} placeholder="Thời gian (phút)" value={form.durationMinutes} onChange={(e) => setForm((prev) => ({ ...prev, durationMinutes: Number(e.target.value || 0) }))} />
              <input className="p-3 rounded-xl border border-slate-300" type="number" min={0} placeholder="Giá (VNĐ)" value={form.priceVnd} onChange={(e) => setForm((prev) => ({ ...prev, priceVnd: Number(e.target.value || 0) }))} />

              <div className="md:col-span-2">
                <label className="text-sm font-bold text-main/70">Ảnh dịch vụ</label>
                <input type="file" accept="image/*" className="w-full mt-1 p-3 rounded-xl border border-slate-300 bg-white" onChange={handleImageUpload} />
                {form.imageUrl && <img src={form.imageUrl} alt="Preview dịch vụ" className="mt-3 h-32 w-full object-cover rounded-xl border border-slate-200" />}
              </div>
            </div>

            <div className="mt-4">
              <p className="text-sm font-bold text-main/70 mb-2">Gán nhân sự thực hiện</p>
              <div className="grid grid-cols-2 gap-2">
                {staff.map((member) => {
                  const checked = form.staffIds.includes(member.id)
                  return (
                    <label key={member.id} className={`p-3 rounded-xl border cursor-pointer ${checked ? 'border-primary bg-primary/10' : 'border-slate-300'}`}>
                      <input
                        type="checkbox"
                        className="mr-2"
                        checked={checked}
                        onChange={(e) => {
                          if (e.target.checked) setForm((prev) => ({ ...prev, staffIds: [...prev.staffIds, member.id] }))
                          else setForm((prev) => ({ ...prev, staffIds: prev.staffIds.filter((id) => id !== member.id) }))
                        }}
                      />
                      {member.name}
                    </label>
                  )
                })}
              </div>
            </div>

            {formError ? <p className="mt-4 text-sm text-red-600">{formError}</p> : null}

            <div className="mt-5 flex justify-end gap-2">
              <button type="button" className="px-4 py-2 rounded-xl border border-slate-300" onClick={() => setModalOpen(false)}>Hủy</button>
              <button type="button" className="px-4 py-2 rounded-xl bg-primary text-white font-bold" onClick={saveService}>Lưu</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
