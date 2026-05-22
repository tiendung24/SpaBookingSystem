import { useMemo, useState } from 'react';
import ShopSidebar from '../components/shop/ShopSidebar';
import { useShop } from '../context/ShopContext';

const roles = [
  { key: 'all', label: 'Tất cả' },
  { key: 'tech', label: 'Kỹ thuật viên' },
  { key: 'reception', label: 'Lễ tân' },
  { key: 'manager', label: 'Quản lý' }
];

const avatarFallback = 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=500&auto=format&fit=crop';

function roleLabel(roleKey) {
  if (roleKey === 'tech') return 'Kỹ thuật viên';
  if (roleKey === 'reception') return 'Lễ tân';
  return 'Quản lý';
}

function statusBadge(status) {
  if (status === 'working') return { label: 'Đang làm', className: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' };
  return { label: 'Tạm nghỉ', className: 'bg-slate-100 text-slate-700', dot: 'bg-slate-400' };
}

export default function ShopStaffPage() {
  const { staff, addStaff, updateStaff, deleteStaff, services } = useShop();
  const [query, setQuery] = useState('');
  const [activeRole, setActiveRole] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    name: '',
    phone: '',
    role: 'tech',
    status: 'working',
    rating: 5,
    bookingEnabled: true,
    services: [],
    shifts: ['Sáng']
  });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return staff.filter((s) => {
      const matchRole = activeRole === 'all' || s.role === activeRole;
      const matchQuery = !q || s.name.toLowerCase().includes(q) || String(s.phone || '').replace(/\s/g, '').includes(q.replace(/\s/g, ''));
      return matchRole && matchQuery;
    });
  }, [staff, query, activeRole]);

  const stats = useMemo(() => {
    const total = staff.length;
    const working = staff.filter((s) => s.status === 'working').length;
    const bookingsToday = 42;
    const ratingAvg = staff.length === 0 ? 0 : Math.round((staff.reduce((sum, s) => sum + (s.rating ?? 0), 0) / staff.length) * 10) / 10;
    return { total, working, bookingsToday, ratingAvg };
  }, [staff]);

  const openCreate = () => {
    setEditingId(null);
    setForm({ name: '', phone: '', role: 'tech', status: 'working', rating: 5, bookingEnabled: true, services: [], shifts: ['Sáng'] });
    setModalOpen(true);
  };

  const openEdit = (member) => {
    setEditingId(member.id);
    setForm({
      name: member.name,
      phone: member.phone,
      role: member.role,
      status: member.status,
      rating: member.rating,
      bookingEnabled: member.bookingEnabled,
      services: member.services || [],
      shifts: member.shifts || ['Sáng']
    });
    setModalOpen(true);
  };

  const saveMember = () => {
    if (!form.name.trim()) return;
    const payload = { ...form, name: form.name.trim(), avatar: form.avatar || avatarFallback };
    if (editingId) updateStaff(editingId, payload);
    else addStaff(payload);
    setModalOpen(false);
  };

  const handleAvatarUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const localUrl = URL.createObjectURL(file);
    setForm((prev) => ({ ...prev, avatar: localUrl }));
  };

  const toggleBookingEnabled = (id) => updateStaff(id, { bookingEnabled: !staff.find((s) => s.id === id)?.bookingEnabled });
  const remove = (id) => {
    if (!confirm('Bạn có chắc chắn muốn xóa nhân viên này?')) return;
    deleteStaff(id);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-main overflow-x-hidden">
      <ShopSidebar onNewBooking={() => console.log('Tạo lịch hẹn mới')} />

      <main className="ml-64 p-6 md:p-10 min-h-screen">
        <header className="flex justify-between items-center mb-16">
          <div>
            <h2 className="font-h2 text-h2 text-main">Quản lý nhân sự</h2>
            <p className="text-main/70 font-body-md">Quản lý lịch trình, phân quyền và hiệu suất thợ của bạn.</p>
          </div>
          <button type="button" onClick={openCreate} className="bg-primary/15 text-primary px-6 py-3 rounded-xl flex items-center gap-2 font-bold shadow-lg hover:brightness-105 transition-all active:scale-95">
            <span className="material-symbols-outlined">person_add</span>
            Thêm nhân viên mới
          </button>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="glass-card inner-glow p-6 rounded-2xl bg-white/70"><p className="text-main/60 text-xs uppercase font-bold">Tổng nhân viên</p><h3 className="font-h3 text-h3 text-primary mt-2">{stats.total}</h3></div>
          <div className="glass-card inner-glow p-6 rounded-2xl bg-white/70"><p className="text-main/60 text-xs uppercase font-bold">Đang làm việc</p><h3 className="font-h3 text-h3 text-emerald-600 mt-2">{stats.working}</h3></div>
          <div className="glass-card inner-glow p-6 rounded-2xl bg-white/70"><p className="text-main/60 text-xs uppercase font-bold">Lịch hẹn hôm nay</p><h3 className="font-h3 text-h3 text-main mt-2">{stats.bookingsToday}</h3></div>
          <div className="glass-card inner-glow p-6 rounded-2xl bg-white/70"><p className="text-main/60 text-xs uppercase font-bold">Đánh giá TB</p><h3 className="font-h3 text-h3 text-amber-600 mt-2">{stats.ratingAvg}</h3></div>
        </section>

        <div className="flex flex-col md:flex-row gap-6 mb-8 items-center justify-between">
          <div className="relative w-full md:w-96">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
            <input className="w-full pl-12 pr-4 py-3 bg-white/60 border border-slate-200 rounded-xl outline-none" placeholder="Tìm kiếm nhân viên..." value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <div className="flex gap-3 overflow-x-auto w-full md:w-auto">
            {roles.map((r) => (
              <button key={r.key} type="button" onClick={() => setActiveRole(r.key)} className={`px-4 py-2 rounded-full font-label-bold whitespace-nowrap ${activeRole === r.key ? 'bg-primary text-white' : 'glass-card bg-white/60 text-main/70'}`}>{r.label}</button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {filtered.map((member) => {
            const badge = statusBadge(member.status);
            return (
              <div key={member.id} className="glass-card inner-glow rounded-2xl p-6 bg-white/70 flex flex-col md:flex-row gap-6">
                <div className="relative">
                  <img className="w-32 h-32 md:w-40 md:h-40 rounded-2xl object-cover border-2 border-white shadow-md" alt="" src={member.avatar || avatarFallback} />
                  <div className={`absolute -bottom-2 -right-2 w-6 h-6 ${badge.dot} border-4 border-white rounded-full`}></div>
                </div>
                <div className="flex-1 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-h3 text-h3 text-main">{member.name}</h3>
                      <p className="text-main/70 font-label-bold">{member.phone}</p>
                      <p className="text-xs text-main/50 mt-1">{roleLabel(member.role)}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full font-label-bold text-xs ${badge.className}`}>{badge.label}</span>
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs uppercase font-bold mb-1">Dịch vụ phụ trách</p>
                    <div className="flex flex-wrap gap-2">
                      {(member.services || []).map((service) => <span key={service} className="px-2 py-1 bg-slate-100 text-main/70 rounded-lg text-xs">{service}</span>)}
                    </div>
                  </div>
                  <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                    <label className="flex items-center gap-3 text-xs font-bold text-main/70">
                      Khách đặt lịch:
                      <input type="checkbox" checked={member.bookingEnabled} onChange={() => toggleBookingEnabled(member.id)} />
                    </label>
                    <div className="flex gap-2">
                      <button type="button" className="p-2 text-primary hover:bg-primary/5 rounded-full" onClick={() => openEdit(member)}><span className="material-symbols-outlined">edit</span></button>
                      <button type="button" className="p-2 text-red-600 hover:bg-red-50 rounded-full" onClick={() => remove(member.id)}><span className="material-symbols-outlined">delete</span></button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          <button type="button" onClick={openCreate} className="glass-card border-2 border-dashed border-primary/20 rounded-2xl p-6 flex flex-col items-center justify-center gap-4 hover:bg-primary/5">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary"><span className="material-symbols-outlined text-4xl">person_add</span></div>
            <div className="text-center"><p className="font-h3 text-h3 text-primary">Thêm nhân viên mới</p></div>
          </button>
        </div>
      </main>

      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-2xl">
            <div className="flex justify-between items-start">
              <h3 className="font-h3 text-h3 text-primary">{editingId ? 'Sửa nhân sự' : 'Thêm nhân sự mới'}</h3>
              <button onClick={() => setModalOpen(false)} className="text-main/60 hover:text-main">✕</button>
            </div>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              <input className="p-3 rounded-xl border border-slate-300" placeholder="Họ tên" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
              <input className="p-3 rounded-xl border border-slate-300" placeholder="Số điện thoại" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} />
              <select className="p-3 rounded-xl border border-slate-300" value={form.role} onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}>
                <option value="tech">Kỹ thuật viên</option><option value="reception">Lễ tân</option><option value="manager">Quản lý</option>
              </select>
              <select className="p-3 rounded-xl border border-slate-300" value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}>
                <option value="working">Đang làm</option><option value="off">Tạm nghỉ</option>
              </select>
              <div className="md:col-span-2">
                <label className="text-sm font-bold text-main/70">Ảnh đại diện</label>
                <input
                  type="file"
                  accept="image/*"
                  className="w-full mt-1 p-3 rounded-xl border border-slate-300 bg-white"
                  onChange={handleAvatarUpload}
                />
                <img
                  src={form.avatar || avatarFallback}
                  alt="Preview avatar"
                  className="mt-3 h-28 w-28 rounded-2xl object-cover border border-slate-200"
                />
              </div>
            </div>

            <div className="mt-4">
              <p className="text-sm font-bold text-main/70 mb-2">Phân quyền ca làm</p>
              <div className="flex gap-2">
                {['Sáng', 'Chiều', 'Tối'].map((shift) => {
                  const checked = form.shifts.includes(shift);
                  return (
                    <button key={shift} type="button" className={`px-4 py-2 rounded-full border ${checked ? 'border-primary bg-primary/10 text-primary' : 'border-slate-300 text-main/70'}`} onClick={() => checked ? setForm((p) => ({ ...p, shifts: p.shifts.filter((s) => s !== shift) })) : setForm((p) => ({ ...p, shifts: [...p.shifts, shift] }))}>
                      {shift}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-4">
              <p className="text-sm font-bold text-main/70 mb-2">Dịch vụ phụ trách</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {services.map((svc) => {
                  const checked = form.services.includes(svc.name) || form.services.includes(svc.id);
                  return (
                    <label key={svc.id} className={`p-3 rounded-xl border cursor-pointer ${checked ? 'border-primary bg-primary/10' : 'border-slate-300'}`}>
                      <input type="checkbox" className="mr-2" checked={checked} onChange={(e) => e.target.checked ? setForm((p) => ({ ...p, services: [...p.services, svc.name] })) : setForm((p) => ({ ...p, services: p.services.filter((x) => x !== svc.name && x !== svc.id) }))} />
                      {svc.name}
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button className="px-4 py-2 rounded-xl border border-slate-300" onClick={() => setModalOpen(false)}>Hủy</button>
              <button className="px-4 py-2 rounded-xl bg-primary text-white font-bold" onClick={saveMember}>Lưu</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
