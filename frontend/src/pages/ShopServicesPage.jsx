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
  return `${number.toLocaleString('vi-VN')}đ`;
}

export default function ShopServicesPage() {
  const { services, addService, updateService, deleteService, staff } = useShop();
  const [activeCategory, setActiveCategory] = useState('all');
  const [query, setQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: '', category: 'spa', durationMinutes: 45, priceVnd: 150000, visible: true, imageUrl: fallbackImage, staffIds: [] });

  const counts = useMemo(() => {
    const result = { all: services.length };
    for (const cat of categories) result[cat.key] = 0;
    for (const s of services) result[s.category] = (result[s.category] ?? 0) + 1;
    return result;
  }, [services]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return services.filter((s) => {
      const matchCategory = activeCategory === 'all' || s.category === activeCategory;
      const matchQuery = !normalized || s.name.toLowerCase().includes(normalized);
      return matchCategory && matchQuery;
    });
  }, [services, activeCategory, query]);

  const openCreate = () => {
    setEditingId(null);
    setForm({ name: '', category: 'spa', durationMinutes: 45, priceVnd: 150000, visible: true, imageUrl: fallbackImage, staffIds: [] });
    setModalOpen(true);
  };

  const openEdit = (service) => {
    setEditingId(service.id);
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
    if (!form.name.trim()) return;
    if (editingId) updateService(editingId, { ...form, name: form.name.trim() });
    else addService({ ...form, name: form.name.trim() });
    setModalOpen(false);
  };

  const handleImageUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const localUrl = URL.createObjectURL(file);
    setForm((prev) => ({ ...prev, imageUrl: localUrl }));
  };

  const toggleVisibility = (id) => updateService(id, { visible: !services.find((s) => s.id === id)?.visible });

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
            <span className="material-symbols-outlined">add_circle</span>
            <span className="font-label-bold text-label-bold uppercase tracking-wider">Thêm dịch vụ mới</span>
          </button>
        </header>

        <div className="flex gap-6">
          <aside className="w-1/4 space-y-4">
            <div className="glass-card rounded-2xl p-4 bg-white/70">
              <h3 className="font-h3 text-h3 text-primary mb-4 px-2">Danh mục</h3>
              <nav className="space-y-2">
                {categories.map((cat) => {
                  const active = cat.key === activeCategory;
                  return (
                    <button
                      key={cat.key}
                      type="button"
                      onClick={() => setActiveCategory(cat.key)}
                      className={`w-full text-left px-4 py-3 rounded-xl transition-all flex items-center justify-between ${
                        active ? 'bg-white text-primary font-bold shadow-sm border border-primary/10' : 'text-main/70 hover:bg-white/50'
                      }`}
                    >
                      <span>{cat.name}</span>
                      <span className={`${active ? 'bg-primary/10' : 'opacity-50'} px-2 py-0.5 rounded-full text-xs`}>
                        {cat.key === 'all' ? counts.all : counts[cat.key] ?? 0}
                      </span>
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="glass-card rounded-2xl p-4 bg-gradient-to-br from-white/70 to-cyan-100/30">
              <h4 className="font-label-bold text-label-bold text-primary mb-2">Hiệu quả dịch vụ</h4>
              <p className="text-4xl font-bold text-primary">85%</p>
              <p className="text-xs text-main/70">Tỷ lệ đặt lịch trong tháng này</p>
            </div>
          </aside>

          <div className="w-3/4">
            <div className="glass-card rounded-2xl p-3 mb-8 flex items-center justify-between bg-white/70">
              <div className="flex items-center bg-white/60 rounded-full px-4 py-2 w-96">
                <span className="material-symbols-outlined text-primary/60 mr-2">search</span>
                <input
                  className="bg-transparent border-none focus:ring-0 w-full text-body-md outline-none"
                  placeholder="Tìm kiếm dịch vụ..."
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <div className="flex gap-2 pr-2">
                <button type="button" className="p-2 text-main/70 hover:text-primary transition-colors" title="Bộ lọc">
                  <span className="material-symbols-outlined">filter_list</span>
                </button>
                <button type="button" className="p-2 text-main/70 hover:text-primary transition-colors" title="Chế độ lưới">
                  <span className="material-symbols-outlined">grid_view</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filtered.map((service) => (
                <div key={service.id} className="glass-card rounded-2xl overflow-hidden group hover:-translate-y-2 transition-transform duration-300 bg-white/70">
                  <div className="relative h-48 overflow-hidden">
                    <img className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="" src={service.imageUrl || fallbackImage} />
                    <div
                      className={`absolute top-4 right-4 text-xs font-bold px-3 py-1 rounded-full shadow-lg ${
                        service.visible ? 'bg-primary text-white' : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {service.visible ? 'Đang hiện' : 'Đã ẩn'}
                    </div>
                  </div>

                  <div className="p-4">
                    <h3 className="font-h3 text-h3 text-primary mb-1">{service.name}</h3>
                    <div className="flex items-center gap-4 mb-4 text-main/70">
                      <div className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[18px]">schedule</span>
                        <span className="text-xs">{service.durationMinutes}p</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[18px]">payments</span>
                        <span className="text-xs">{formatVnd(service.priceVnd)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-4 border-t border-primary/5">
                      <button
                        type="button"
                        onClick={() => openEdit(service)}
                        className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-primary/10 text-primary font-bold transition-all flex items-center justify-center gap-2"
                      >
                        <span className="material-symbols-outlined text-[18px]">edit</span>
                        Sửa
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleVisibility(service.id)}
                        className={`p-2 rounded-xl transition-all ${
                          service.visible ? 'text-main/70 hover:bg-red-50 hover:text-red-600' : 'text-primary hover:bg-primary/10'
                        }`}
                        title={service.visible ? 'Ẩn dịch vụ' : 'Hiện dịch vụ'}
                      >
                        <span className="material-symbols-outlined">{service.visible ? 'visibility_off' : 'visibility'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteService(service.id)}
                        className="p-2 rounded-xl text-main/70 hover:bg-red-50 hover:text-red-600 transition-all"
                        title="Xóa"
                      >
                        <span className="material-symbols-outlined">delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={openCreate}
                className="border-2 border-dashed border-primary/20 rounded-2xl flex flex-col items-center justify-center p-8 hover:bg-primary/5 hover:border-primary/40 transition-all group min-h-[400px]"
              >
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-primary text-[32px]">add</span>
                </div>
                <span className="font-h3 text-h3 text-primary">Dịch vụ mới</span>
                <p className="text-xs text-main/70 mt-2">Mở rộng danh mục của bạn</p>
              </button>
            </div>
          </div>
        </div>
      </main>

      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-xl">
            <div className="flex justify-between items-start">
              <h3 className="font-h3 text-h3 text-primary">{editingId ? 'Sửa dịch vụ' : 'Thêm dịch vụ mới'}</h3>
              <button onClick={() => setModalOpen(false)} className="text-main/60 hover:text-main">✕</button>
            </div>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              <input className="p-3 rounded-xl border border-slate-300 md:col-span-2" placeholder="Tên dịch vụ" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
              <select className="p-3 rounded-xl border border-slate-300" value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}>
                <option value="nail">Nail</option>
                <option value="spa">Spa & Skincare</option>
                <option value="massage">Massage</option>
              </select>
              <input className="p-3 rounded-xl border border-slate-300" type="number" placeholder="Thời gian (phút)" value={form.durationMinutes} onChange={(e) => setForm((p) => ({ ...p, durationMinutes: Number(e.target.value) }))} />
              <input className="p-3 rounded-xl border border-slate-300" type="number" placeholder="Giá (VNĐ)" value={form.priceVnd} onChange={(e) => setForm((p) => ({ ...p, priceVnd: Number(e.target.value) }))} />
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
                          if (e.target.checked) setForm((p) => ({ ...p, staffIds: [...p.staffIds, member.id] }));
                          else setForm((p) => ({ ...p, staffIds: p.staffIds.filter((id) => id !== member.id) }));
                        }}
                      />
                      {member.name}
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button className="px-4 py-2 rounded-xl border border-slate-300" onClick={() => setModalOpen(false)}>Hủy</button>
              <button className="px-4 py-2 rounded-xl bg-primary text-white font-bold" onClick={saveService}>Lưu</button>
            </div>
          </div>
        </div>
      )}

      <footer className="ml-64 w-auto py-8 px-10 flex flex-col items-center gap-4 mt-16 bg-slate-100/80 border-t border-slate-200">
        <div className="font-h3 text-h3 text-primary">LumiX Partner</div>
        <div className="flex gap-8 flex-wrap justify-center">
          <a className="text-main/70 hover:text-primary transition-colors font-body-md" href="#">Điều khoản</a>
          <a className="text-main/70 hover:text-primary transition-colors font-body-md" href="#">Bảo mật</a>
          <a className="text-main/70 hover:text-primary transition-colors font-body-md" href="#">Cookie</a>
          <a className="text-main/70 hover:text-primary transition-colors font-body-md" href="#">Hỗ trợ</a>
        </div>
        <div className="font-body-sm text-body-sm text-main/60">© 2024 LumiX Partner. Nền tảng Spa & Salon cao cấp.</div>
      </footer>
    </div>
  );
}
