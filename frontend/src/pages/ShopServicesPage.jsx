import { useMemo, useState } from 'react'
import ShopSidebar from '../components/shop/ShopSidebar'
import { useShop } from '../context/ShopContext'



const fallbackImage =
  'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=1200&auto=format&fit=crop'

function formatVnd(number) {
  return `${Number(number || 0).toLocaleString('vi-VN')}đ`
}

export default function ShopServicesPage() {
  const { services, addService, updateService, deleteService, staff, uploadImage, categories, addCategory, updateCategory, deleteCategory } = useShop()
  const [query, setQuery] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [categoryModalOpen, setCategoryModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editingCategoryId, setEditingCategoryId] = useState(null)
  const [formError, setFormError] = useState('')
  const [categoryFormError, setCategoryFormError] = useState('')
  const [form, setForm] = useState({
    name: '',
    category: categories[0]?._id || '',
    durationMinutes: 60,
    priceVnd: 150000,
    visible: true,
    imageUrl: fallbackImage,
    staffIds: [],
    shortDescription: '',
    detailedDescription: ''
  })
  const [categoryForm, setCategoryForm] = useState({
    name: ''
  })

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return services.filter((service) => {
      const matchQuery = !normalized || String(service.name || '').toLowerCase().includes(normalized)
      return matchQuery
    })
  }, [services, query])

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
      category: categories[0]?._id || '',
      durationMinutes: 60,
      priceVnd: 150000,
      visible: true,
      imageUrl: fallbackImage,
      staffIds: [],
      shortDescription: '',
      detailedDescription: ''
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
      staffIds: service.staffIds || [],
      shortDescription: service.shortDescription || '',
      detailedDescription: service.detailedDescription || ''
    })
    setModalOpen(true)
  }

  const saveService = () => {
    const formName = String(form.name || '').trim()
    const formDuration = Number(form.durationMinutes || 0)
    const formPrice = Number(form.priceVnd || 0)

    if (!formName) return setFormError('Vui lòng nhập tên dịch vụ.')
    if (!form.category) return setFormError('Vui lòng chọn danh mục.')
    if (![15, 30, 60, 90].includes(formDuration)) return setFormError('Thời lượng dịch vụ chỉ được chọn 15, 30, 60 hoặc 90 phút.')
    if (formPrice <= 0) return setFormError('Giá dịch vụ phải lớn hơn 0.')

    const payload = { ...form, name: formName, durationMinutes: formDuration, priceVnd: formPrice }
    if (editingId) updateService(editingId, payload)
    else addService(payload)

    setFormError('')
    setModalOpen(false)
  }

  const openCategoryCreate = () => {
    setEditingCategoryId(null)
    setCategoryFormError('')
    setCategoryForm({ name: '' })
    setCategoryModalOpen(true)
  }

  const saveCategory = async () => {
    const name = String(categoryForm.name || '').trim()
    if (!name) return setCategoryFormError('Vui lòng nhập tên danh mục.')
    
    try {
      if (editingCategoryId) {
        await updateCategory(editingCategoryId, { name })
      } else {
        await addCategory({ name })
      }
      setCategoryFormError('')
      setCategoryForm({ name: '' })
      setEditingCategoryId(null)
    } catch (err) {
      setCategoryFormError(err?.message || 'Có lỗi xảy ra.')
    }
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
          <div className="flex gap-2">
            <button type="button" className="bg-primary text-white px-5 py-3 rounded-xl font-bold" onClick={openCreate}>Thêm dịch vụ mới</button>
            <button type="button" className="bg-white border border-slate-300 text-main px-5 py-3 rounded-xl font-bold" onClick={() => setCategoryModalOpen(true)}>Quản lý danh mục</button>
          </div>
        </header>

        <section className="bg-white rounded-3xl p-6 border border-slate-200">
          <input
            className="w-full p-3 rounded-xl border border-slate-300 mb-6"
            placeholder="Tìm theo tên dịch vụ"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />

          <div className="space-y-8">
            {categories.map((cat) => {
              const catServices = filtered.filter((s) => String(s.category) === String(cat._id))
              if (catServices.length === 0) return null
              
              return (
                <div key={cat._id}>
                  <div className="flex items-center gap-3 mb-4 pb-2 border-b border-slate-100">
                    <h2 className="text-xl font-bold text-main">{cat.name}</h2>
                    <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full text-xs font-bold">{catServices.length}</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {catServices.map((service) => (
                      <article key={service.id} className="border border-slate-200 rounded-2xl overflow-hidden bg-white hover:shadow-md transition-shadow">
                        <img src={service.imageUrl || fallbackImage} alt={service.name} className="h-44 w-full object-cover" />
                        <div className="p-4 space-y-2">
                          <h3 className="font-bold text-lg">{service.name}</h3>
                          <p className="text-sm text-main/70">{service.durationMinutes} phút · {formatVnd(service.priceVnd)}</p>
                          {service.shortDescription ? <p className="text-sm text-main/60">{service.shortDescription}</p> : null}
                          <p className="text-sm text-main/70">Nhân sự: {(service.staffIds || []).length}</p>
                          <div className="flex gap-2">
                            <button type="button" className="flex-1 py-2 rounded-lg border border-slate-300 font-bold hover:bg-slate-50" onClick={() => openEdit(service)}>Sửa</button>
                            <button type="button" className={`flex-1 py-2 rounded-lg border font-bold ${service.visible ? 'border-primary/20 text-primary bg-primary/5' : 'border-slate-300 text-slate-500 bg-slate-50'}`} onClick={() => toggleVisibility(service.id)}>{service.visible ? 'Đang hiển thị' : 'Đã ẩn'}</button>
                            <button type="button" className="px-3 py-2 rounded-lg border border-red-300 text-red-600 font-bold hover:bg-red-50" onClick={() => deleteService(service.id)}>Xóa</button>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              )
            })}
            
            {/* Uncategorized services fallback */}
            {(() => {
              const uncategorized = filtered.filter((s) => !categories.find(c => String(c._id) === String(s.category)))
              if (uncategorized.length === 0) return null
              return (
                <div>
                  <div className="flex items-center gap-3 mb-4 pb-2 border-b border-slate-100">
                    <h2 className="text-xl font-bold text-main">Dịch vụ chưa phân loại</h2>
                    <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full text-xs font-bold">{uncategorized.length}</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {uncategorized.map((service) => (
                      <article key={service.id} className="border border-slate-200 rounded-2xl overflow-hidden bg-white hover:shadow-md transition-shadow">
                        <img src={service.imageUrl || fallbackImage} alt={service.name} className="h-44 w-full object-cover" />
                        <div className="p-4 space-y-2">
                          <h3 className="font-bold text-lg">{service.name}</h3>
                          <p className="text-sm text-main/70">{service.durationMinutes} phút · {formatVnd(service.priceVnd)}</p>
                          {service.shortDescription ? <p className="text-sm text-main/60">{service.shortDescription}</p> : null}
                          <p className="text-sm text-main/70">Nhân sự: {(service.staffIds || []).length}</p>
                          <div className="flex gap-2">
                            <button type="button" className="flex-1 py-2 rounded-lg border border-slate-300 font-bold hover:bg-slate-50" onClick={() => openEdit(service)}>Sửa</button>
                            <button type="button" className={`flex-1 py-2 rounded-lg border font-bold ${service.visible ? 'border-primary/20 text-primary bg-primary/5' : 'border-slate-300 text-slate-500 bg-slate-50'}`} onClick={() => toggleVisibility(service.id)}>{service.visible ? 'Đang hiển thị' : 'Đã ẩn'}</button>
                            <button type="button" className="px-3 py-2 rounded-lg border border-red-300 text-red-600 font-bold hover:bg-red-50" onClick={() => deleteService(service.id)}>Xóa</button>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              )
            })()}

            {filtered.length === 0 && (
              <div className="text-center py-10">
                <p className="text-main/60">Không tìm thấy dịch vụ nào.</p>
              </div>
            )}
          </div>
        </section>
      </main>

      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start">
              <h3 className="font-h3 text-h3 text-primary">{editingId ? 'Sửa dịch vụ' : 'Thêm dịch vụ mới'}</h3>
              <button type="button" onClick={() => setModalOpen(false)} className="text-main/60 hover:text-main">✕</button>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              <input className="p-3 rounded-xl border border-slate-300 md:col-span-2" placeholder="Tên dịch vụ" value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} />
              <select className="p-3 rounded-xl border border-slate-300" value={form.category} onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}>
                {categories.length > 0 ? categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>) : <option value="">-- Cần tạo danh mục trước --</option>}
              </select>
              <select className="p-3 rounded-xl border border-slate-300 bg-white" value={Number(form.durationMinutes || 60)} onChange={(e) => setForm((prev) => ({ ...prev, durationMinutes: Number(e.target.value) }))}>
                <option value={15}>15 phút</option>
                <option value={30}>30 phút</option>
                <option value={60}>60 phút</option>
                <option value={90}>90 phút</option>
              </select>
              <input className="p-3 rounded-xl border border-slate-300" type="number" min={0} placeholder="Giá (VNĐ)" value={form.priceVnd} onChange={(e) => setForm((prev) => ({ ...prev, priceVnd: Number(e.target.value || 0) }))} />

              <div className="md:col-span-2">
                <label className="text-sm font-bold text-main/70">Ảnh dịch vụ</label>
                <input type="file" accept="image/*" className="w-full mt-1 p-3 rounded-xl border border-slate-300 bg-white" onChange={handleImageUpload} />
                {form.imageUrl && <img src={form.imageUrl} alt="Preview dịch vụ" className="mt-3 h-32 w-full object-cover rounded-xl border border-slate-200" />}
              </div>

              <div className="md:col-span-2">
                <label className="text-sm font-bold text-main/70">Mô tả ngắn</label>
                <input
                  className="w-full p-3 rounded-xl border border-slate-300 mt-1"
                  placeholder="Mô tả ngắn hiển thị trong danh sách"
                  value={form.shortDescription}
                  onChange={(e) => setForm((prev) => ({ ...prev, shortDescription: e.target.value }))}
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-sm font-bold text-main/70">Mô tả chi tiết</label>
                <textarea
                  className="w-full p-3 rounded-xl border border-slate-300 mt-1"
                  rows={4}
                  placeholder="Mô tả chi tiết hiển thị trên trang dịch vụ"
                  value={form.detailedDescription}
                  onChange={(e) => setForm((prev) => ({ ...prev, detailedDescription: e.target.value }))}
                />
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

      {categoryModalOpen && (
        <div className="fixed inset-0 bg-black/40 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md">
            <div className="flex justify-between items-start mb-6">
              <h3 className="font-h3 text-h3 text-primary">Quản lý danh mục</h3>
              <button type="button" onClick={() => { setCategoryModalOpen(false); setEditingCategoryId(null); }} className="text-main/60 hover:text-main">✕</button>
            </div>

            <div className="space-y-3 max-h-[50vh] overflow-y-auto mb-6">
              {categories.length === 0 && <p className="text-sm text-main/60">Chưa có danh mục nào.</p>}
              {categories.map(cat => (
                <div key={cat._id} className="flex items-center justify-between p-3 border border-slate-200 rounded-xl bg-slate-50">
                  <span className="font-bold text-main">{cat.name}</span>
                  <div className="flex gap-2">
                    <button type="button" className="text-sm font-bold text-primary hover:underline" onClick={() => { setEditingCategoryId(cat._id); setCategoryForm({ name: cat.name }) }}>Sửa</button>
                    <button type="button" className="text-sm font-bold text-red-600 hover:underline" onClick={() => {
                      if (confirm('Bạn có chắc muốn xóa danh mục này? Các dịch vụ thuộc danh mục sẽ bị mất phân loại.')) deleteCategory(cat._id)
                    }}>Xóa</button>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-200 pt-4">
              <p className="text-sm font-bold text-main/70 mb-2">{editingCategoryId ? 'Sửa tên danh mục' : 'Thêm danh mục mới'}</p>
              <div className="flex gap-2">
                <input
                  className="flex-1 p-3 rounded-xl border border-slate-300"
                  placeholder="Tên danh mục..."
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ name: e.target.value })}
                  onKeyDown={e => { if (e.key === 'Enter') saveCategory() }}
                />
                <button type="button" className="px-4 py-2 rounded-xl bg-primary text-white font-bold" onClick={saveCategory}>
                  {editingCategoryId ? 'Lưu' : 'Thêm'}
                </button>
              </div>
              {editingCategoryId && (
                <button type="button" className="mt-2 text-sm text-primary hover:underline" onClick={openCategoryCreate}>+ Chuyển sang thêm mới</button>
              )}
              {categoryFormError ? <p className="mt-2 text-sm text-red-600">{categoryFormError}</p> : null}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
