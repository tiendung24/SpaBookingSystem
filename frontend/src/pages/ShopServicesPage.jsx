import { useMemo, useState } from 'react';
import ShopSidebar from '../components/shop/ShopSidebar';
import { useShop } from '../context/ShopContext';

const categories = [
  { key: 'all', name: 'Tất cả' },
  { key: 'nail', name: 'Nail' },
  { key: 'spa', name: 'Spa & Skincare' },
  { key: 'massage', name: 'Massage' }
];

const fallbackImage =
  'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=1200&auto=format&fit=crop';

function formatVnd(number) {
  return `${Number(number || 0).toLocaleString('vi-VN')}đ`;
}

export default function ShopServicesPage() {
  const { services, addService, updateService, deleteService, staff, uploadImage } = useShop();
  const [activeCategory, setActiveCategory] = useState('all');
  const [query, setQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: '', category: 'spa', durationMinutes: 45, priceVnd: 150000, visible: true, imageUrl: fallbackImage, staffIds: [] });
  const [formError, setFormError] = useState('');

  const toSafeNumber = (value) => {
    const digitsOnly = String(value ?? '').replace(/\D/g, '');
    return Number(digitsOnly || 0);
  };

  const formName = String(form.name || '').trim();
  const formPrice = Number(form.priceVnd || 0);
  const formDuration = Number(form.durationMinutes || 0);

  const counts = useMemo(() => {
    const result = { all: services.length };
    for (const cat of categories) result[cat.key] = 0;
    for (const service of services) result[service.category] = (result[service.category] ?? 0) + 1;
    return result;
  }, [services]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return services.filter((service) => {
      const matchCategory = activeCategory === 'all' || service.category === activeCategory;
      const matchQuery = !normalized || service.name.toLowerCase().includes(normalized);
      return matchCategory && matchQuery;
    });
  }, [services, activeCategory, query]);

  const openCreate = () => {
    setEditingId(null);
    setFormError('');
    setForm({ name: '', category: 'spa', durationMinutes: 45, priceVnd: 150000, visible: true, imageUrl: fallbackImage, staffIds: [] });
    setModalOpen(true);
  };

  const openEdit = (service) => {
    setEditingId(service.id);
    setFormError('');
    setForm({
      name: service.name,
      category: service.category,
      durationMinutes: service.durationMinutes,
      priceVnd: service.priceVnd,
      visible: service.visible,
      imageUrl: service.imageUrl || fallbackImage,
      staffIds: service.staffIds || []
    });
    setModalOpen(true);
  };

  const saveService = () => {
    if (!formName) {
      setFormError('Vui lòng nhập tên dịch vụ.');
      return;
    }
    if (formDuration < 15) {
      setFormError('Thời gian dịch vụ tối thiểu 15 phút.');
      return;
    }
    if (formPrice <= 0) {
      setFormError('Giá dịch vụ phải lớn hơn 0.');
      return;
    }

    const payload = {
      ...form,
      name: formName,
      durationMinutes: formDuration,
      priceVnd: formPrice
    };

    if (editingId) updateService(editingId, payload);
    else addService(payload);

    setFormError('');
    setModalOpen(false);
  };

  const handleImageUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const localUrl = URL.createObjectURL(file);
    setForm((prev) => ({ ...prev, imageUrl: localUrl }));

    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const base64 = reader.result;
        const uploadedUrl = await uploadImage(base64);
        setForm((prev) => ({ ...prev, imageUrl: uploadedUrl }));
      } catch (err) {
        console.error('Lỗi upload ảnh:', err);
        alert('Lỗi tải ảnh lên server, vui lòng thử lại.');
      }
    };
    reader.readAsDataURL(file);
  };

  const toggleVisibility = (id) => updateService(id, { visible: !services.find((service) => service.id === id)?.visible });

  const handleDeleteService = (id) => {
    if (!confirm('Bạn có chắc chắn muốn xóa dịch vụ này?')) return;
    deleteService(id);
  };

  return (
    <div
      className="min-h-screen text-main"
      style={{
        backgroundColor: '#f9f9ff',
        backgroundImage:
          'radial-gradient(at 0% 0%, rgba(94, 164, 184, 0.1) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(139, 209, 230, 0.1) 0px, transparent 50%)'
      }}
    >
      <ShopSidebar onNewBooking={() => console.log('Tạo lịch hẹn mới')} />

      <main className="ml-64 p-6 md:p-10 min-h-screen">
        <header className="flex justify-between items-center mb-16">
          <div>
            <h1 className="font-h2 text-h2 text-primary tracking-tight">Quản lý dịch vụ</h1>
            <p className="font-body-md text-body-md text-main/70">Tối ưu hóa trải nghiệm khách hàng với danh mục chuyên nghiệp.</p>
          </div>
          <button type="button" onClick={openCreate} className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-full shadow-lg hover:shadow-primary/30 transition-all hover:scale-105 active:scale-95">
            <span className="material-symbols-outlined">add</span>
            Thêm dịch vụ mới
          </button>
        </header>

        <section className="mb-8 glass-card bg-white/70 rounded-3xl p-6">
          <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => setActiveCategory(cat.key)}
                  className={`px-4 py-2 rounded-full font-label-bold text-label-bold transition-all ${
                    activeCategory === cat.key
                      ? 'bg-primary text-white shadow-md'
                      : 'bg-slate-100 text-main/70 hover:bg-slate-200'
                  }`}
                >
                  {cat.name} ({counts[cat.key] ?? 0})
                </button>
              ))}
            </div>

            <div className="relative w-full md:w-80">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-main/40">search</span>
              <input
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 bg-white/80"
                placeholder="Tìm theo tên dịch vụ"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>
        </section>

        <section>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filtered.map((service) => (
              <article key={service.id} className="glass-card bg-white/80 rounded-3xl overflow-hidden">
                <img className="w-full h-44 object-cover" src={service.imageUrl || fallbackImage} alt={service.name} />
                <div className="p-5 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-h3 text-h3 text-primary">{service.name}</h3>
                      <p className="text-sm text-main/60">{service.durationMinutes} phút</p>
                    </div>
                    <span className="text-amber-700 font-bold">{formatVnd(service.priceVnd)}</span>
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs">
                    {(service.staffIds || []).slice(0, 3).map((id) => {
                      const member = staff.find((item) => item.id === id);
                      return (
                        <span key={id} className="px-2 py-1 rounded-full bg-primary/10 text-primary">
                          {member?.name || 'Nhân sự'}
                        </span>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <button
                      className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-white"
                      type="button"
                      onClick={() => openEdit(service)}
                    >
                      Sửa
                    </button>
                    <button
                      className={`px-3 py-2 rounded-xl border ${service.visible ? 'border-emerald-200 text-emerald-700' : 'border-slate-200 text-main/60'}`}
                      type="button"
                      onClick={() => toggleVisibility(service.id)}
                    >
                      {service.visible ? 'Đang hiển thị' : 'Đã ẩn'}
                    </button>
                    <button
                      className="px-3 py-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50"
                      type="button"
                      onClick={() => handleDeleteService(service.id)}
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              </article>
            ))}

            {!filtered.length && (
              <div className="col-span-full glass-card bg-white/80 rounded-3xl p-10 text-center">
                <p className="font-h3 text-h3 text-primary">Không tìm thấy dịch vụ phù hợp</p>
                <p className="text-main/70 mt-2">Mở rộng danh mục của bạn</p>
                <button
                  type="button"
                  className="mt-4 px-5 py-3 rounded-xl bg-primary text-white font-bold"
                  onClick={openCreate}
                >
                  Thêm dịch vụ
                </button>
              </div>
            )}
          </div>
        </section>
      </main>

      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-xl">
            <div className="flex justify-between items-start">
              <h3 className="font-h3 text-h3 text-primary">{editingId ? 'Sửa dịch vụ' : 'Thêm dịch vụ mới'}</h3>
              <button type="button" onClick={() => setModalOpen(false)} className="text-main/60 hover:text-main">✕</button>
            </div>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              <input className="p-3 rounded-xl border border-slate-300 md:col-span-2" placeholder="Tên dịch vụ" value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} />
              <select className="p-3 rounded-xl border border-slate-300" value={form.category} onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}>
                <option value="nail">Nail</option>
                <option value="spa">Spa & Skincare</option>
                <option value="massage">Massage</option>
              </select>
              <input className="p-3 rounded-xl border border-slate-300" type="text" inputMode="numeric" placeholder="Thời gian (phút)" value={form.durationMinutes} onChange={(e) => setForm((prev) => ({ ...prev, durationMinutes: toSafeNumber(e.target.value) }))} />
              <input className="p-3 rounded-xl border border-slate-300" type="text" inputMode="numeric" placeholder="Giá (VNĐ)" value={form.priceVnd} onChange={(e) => setForm((prev) => ({ ...prev, priceVnd: toSafeNumber(e.target.value) }))} />
              <div className="md:col-span-2">
                <label className="text-sm font-bold text-main/70">Ảnh dịch vụ</label>
                <input
                  type="file"
                  accept="image/*"
                  className="w-full mt-1 p-3 rounded-xl border border-slate-300 bg-white"
                  onChange={handleImageUpload}
                />
                {form.imageUrl && (
                  <img src={form.imageUrl} alt="Preview dịch vụ" className="mt-3 h-32 w-full object-cover rounded-xl border border-slate-200" />
                )}
              </div>
            </div>

            <div className="mt-4">
              <p className="text-sm font-bold text-main/70 mb-2">Gán nhân sự thực hiện</p>
              <div className="grid grid-cols-2 gap-2">
                {staff.map((member) => {
                  const checked = form.staffIds.includes(member.id);
                  return (
                    <label key={member.id} className={`p-3 rounded-xl border cursor-pointer ${checked ? 'border-primary bg-primary/10' : 'border-slate-300'}`}>
                      <input
                        type="checkbox"
                        className="mr-2"
                        checked={checked}
                        onChange={(e) => {
                          if (e.target.checked) setForm((prev) => ({ ...prev, staffIds: [...prev.staffIds, member.id] }));
                          else setForm((prev) => ({ ...prev, staffIds: prev.staffIds.filter((id) => id !== member.id) }));
                        }}
                      />
                      {member.name}
                    </label>
                  );
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

      <footer className="ml-64 w-auto py-8 px-10 flex flex-col items-center gap-4 mt-16 bg-slate-100/80 border-t border-slate-200">
        <div className="font-h3 text-h3 text-primary">LumiX Partner</div>
        <div className="flex gap-8 flex-wrap justify-center">
          <a className="text-main/70 hover:text-primary transition-colors font-body-md" href="/terms" onClick={(e) => e.preventDefault()}>Điều khoản</a>
          <a className="text-main/70 hover:text-primary transition-colors font-body-md" href="/privacy" onClick={(e) => e.preventDefault()}>Bảo mật</a>
          <a className="text-main/70 hover:text-primary transition-colors font-body-md" href="/cookies" onClick={(e) => e.preventDefault()}>Cookie</a>
          <a className="text-main/70 hover:text-primary transition-colors font-body-md" href="/support" onClick={(e) => e.preventDefault()}>Hỗ trợ</a>
        </div>
        <div className="font-body-sm text-body-sm text-main/60">© 2024 LumiX Partner. Nền tảng Spa & Salon cao cấp.</div>
      </footer>
    </div>
  );
}