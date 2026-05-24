import { useMemo, useState } from 'react';
import ShopSidebar from '../components/shop/ShopSidebar';
import { useShop } from '../context/ShopContext';

const roles = [
  { key: 'all', label: 'Tất cả' },
  { key: 'tech', label: 'Kỹ thuật viên' },
  { key: 'reception', label: 'Lễ tân' },
  { key: 'manager', label: 'Quản lý' }
];

const shiftsMaster = ['Sáng', 'Chiều', 'Tối'];

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

function normalizePhone(input) {
  return String(input || '')
    .trim()
    .replace(/[\s.-]/g, '');
}

function isValidPhone(input) {
  if (!input) return true;
  return /^(?:\+84|0)\d{9,10}$/.test(input);
}

export default function ShopStaffPage() {
  const { staff, addStaff, updateStaff, deleteStaff, services, bookings, uploadImage } = useShop();

  const [query, setQuery] = useState('');
  const [activeRole, setActiveRole] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formError, setFormError] = useState('');

  const [form, setForm] = useState({
    name: '',
    phone: '',
    role: 'tech',
    status: 'working',
    rating: 5,
    bookingEnabled: true,
    services: [],
    shifts: ['Sáng'],
    avatar: avatarFallback
  });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return staff.filter((member) => {
      const matchRole = activeRole === 'all' || member.role === activeRole;
      const phoneText = String(member.phone || '').replace(/\s/g, '');
      const qPhone = q.replace(/\s/g, '');
      const matchQuery =
        !q ||
        String(member.name || '').toLowerCase().includes(q) ||
        phoneText.includes(qPhone);
      return matchRole && matchQuery;
    });
  }, [staff, query, activeRole]);

  const stats = useMemo(() => {
    const total = staff.length;
    const working = staff.filter((s) => s.status === 'working').length;
    const bookingsToday = (bookings || []).filter((b) => {
      const d = new Date(b.time);
      const now = new Date();
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
    }).length;
    const ratingAvg = staff.length === 0 ? 0 : Math.round((staff.reduce((sum, s) => sum + (s.rating ?? 0), 0) / staff.length) * 10) / 10;
    return { total, working, bookingsToday, ratingAvg };
  }, [staff, bookings]);

  const openCreate = () => {
    setEditingId(null);
    setFormError('');
    setForm({
      name: '',
      phone: '',
      role: 'tech',
      status: 'working',
      rating: 5,
      bookingEnabled: true,
      services: [],
      shifts: ['Sáng'],
      avatar: avatarFallback
    });
    setModalOpen(true);
  };

  const openEdit = (member) => {
    setEditingId(member.id);
    setFormError('');
    setForm({
      name: member.name,
      phone: member.phone,
      role: member.role,
      status: member.status,
      rating: member.rating,
      bookingEnabled: member.bookingEnabled,
      services: member.services || [],
      shifts: member.shifts || ['Sáng'],
      avatar: member.avatar || avatarFallback
    });
    setModalOpen(true);
  };

  const saveMember = () => {
    const nameText = String(form.name || '').trim();
    const phoneNormalized = normalizePhone(form.phone);

    if (!nameText) {
      setFormError('Vui lòng nhập họ tên nhân viên.');
      return;
    }

    if (!isValidPhone(phoneNormalized)) {
      setFormError('Số điện thoại không hợp lệ (0 hoặc +84, 10-11 số).');
      return;
    }

    if (!Array.isArray(form.shifts) || form.shifts.length === 0) {
      setFormError('Vui lòng chọn ít nhất 1 ca làm.');
      return;
    }

    const payload = {
      ...form,
      name: nameText,
      phone: phoneNormalized,
      avatar: form.avatar || avatarFallback
    };

    if (editingId) updateStaff(editingId, payload);
    else addStaff(payload);

    setFormError('');
    setModalOpen(false);
  };

  const handleAvatarUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const localUrl = URL.createObjectURL(file);
    setForm((prev) => ({ ...prev, avatar: localUrl }));

    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const base64 = reader.result;
        const uploadedUrl = await uploadImage(base64);
        setForm((prev) => ({ ...prev, avatar: uploadedUrl }));
      } catch (err) {
        console.error('Lỗi upload avatar:', err);
        alert('Lỗi tải ảnh lên server, vui lòng thử lại.');
      }
    };
    reader.readAsDataURL(file);
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
            <p className="text-main/70">Quản lý danh sách kỹ thuật viên, lễ tân và quản lý.</p>
          </div>
          <button type="button" onClick={openCreate} className="bg-primary text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:scale-105 transition-transform">
            + Thêm nhân viên
          </button>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">
          <article className="glass-card bg-white rounded-3xl p-6">
            <p className="text-main/60 text-sm">Tổng nhân sự</p>
            <p className="text-3xl font-bold text-primary mt-1">{stats.total}</p>
          </article>
          <article className="glass-card bg-white rounded-3xl p-6">
            <p className="text-main/60 text-sm">Đang làm</p>
            <p className="text-3xl font-bold text-emerald-600 mt-1">{stats.working}</p>
          </article>
          <article className="glass-card bg-white rounded-3xl p-6">
            <p className="text-main/60 text-sm">Booking hôm nay</p>
            <p className="text-3xl font-bold text-primary mt-1">{stats.bookingsToday}</p>
          </article>
          <article className="glass-card bg-white rounded-3xl p-6">
            <p className="text-main/60 text-sm">Điểm TB</p>
            <p className="text-3xl font-bold text-primary mt-1">{stats.ratingAvg}</p>
          </article>
        </section>

        <section className="glass-card bg-white rounded-3xl p-6 space-y-4">
          <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-md">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-main/40">search</span>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Tìm theo tên hoặc số điện thoại..."
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {roles.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  className={`px-4 py-2 rounded-full border text-sm ${activeRole === item.key ? 'border-primary bg-primary/10 text-primary font-bold' : 'border-slate-200 text-main/70 hover:bg-slate-50'}`}
                  onClick={() => setActiveRole(item.key)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((member) => {
              const badge = statusBadge(member.status);
              return (
                <article key={member.id} className="glass-card bg-slate-50/50 rounded-3xl p-5 border border-slate-200">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <img src={member.avatar || avatarFallback} alt={member.name} className="w-14 h-14 rounded-2xl object-cover border border-slate-200" />
                      <div>
                        <p className="font-bold text-primary">{member.name}</p>
                        <p className="text-xs text-main/60">{member.phone || 'Chưa có SĐT'}</p>
                        <p className="text-xs text-main/60">{roleLabel(member.role)}</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${badge.className}`}>
                      <span className={`inline-block w-2 h-2 rounded-full mr-2 ${badge.dot}`} />
                      {badge.label}
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button type="button" className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-white" onClick={() => openEdit(member)}>
                      Sửa
                    </button>
                    <button type="button" className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-white" onClick={() => toggleBookingEnabled(member.id)}>
                      {member.bookingEnabled ? 'Nhận lịch' : 'Tạm tắt'}
                    </button>
                    <button type="button" className="px-3 py-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50" onClick={() => remove(member.id)}>
                      Xóa
                    </button>
                  </div>
                </article>
              );
            })}

            {!filtered.length && (
              <button type="button" onClick={openCreate} className="glass-card bg-white rounded-3xl p-10 border border-dashed border-primary/30 flex flex-col items-center justify-center gap-4 hover:bg-primary/5">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-4xl">person_add</span>
                </div>
                <div className="text-center">
                  <p className="font-h3 text-h3 text-primary">Thêm nhân viên mới</p>
                </div>
              </button>
            )}
          </div>
        </section>
      </main>

      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-2xl">
            <div className="flex justify-between items-start">
              <h3 className="font-h3 text-h3 text-primary">{editingId ? 'Sửa nhân sự' : 'Thêm nhân sự mới'}</h3>
              <button type="button" onClick={() => setModalOpen(false)} className="text-main/60 hover:text-main">✕</button>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              <input className="p-3 rounded-xl border border-slate-300" placeholder="Họ tên" value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} />
              <input className="p-3 rounded-xl border border-slate-300" placeholder="Số điện thoại" value={form.phone} onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))} />
              <select className="p-3 rounded-xl border border-slate-300" value={form.role} onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value }))}>
                <option value="tech">Kỹ thuật viên</option>
                <option value="reception">Lễ tân</option>
                <option value="manager">Quản lý</option>
              </select>
              <select className="p-3 rounded-xl border border-slate-300" value={form.status} onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}>
                <option value="working">Đang làm</option>
                <option value="off">Tạm nghỉ</option>
              </select>

              <div className="md:col-span-2">
                <label className="text-sm font-bold text-main/70">Ảnh đại diện</label>
                <input type="file" accept="image/*" className="w-full mt-1 p-3 rounded-xl border border-slate-300 bg-white" onChange={handleAvatarUpload} />
                <img src={form.avatar || avatarFallback} alt="Preview avatar" className="mt-3 h-28 w-28 rounded-2xl object-cover border border-slate-200" />
              </div>
            </div>

            <div className="mt-4">
              <p className="text-sm font-bold text-main/70 mb-2">Phân quyền ca làm</p>
              <div className="flex gap-2 flex-wrap">
                {shiftsMaster.map((shift) => {
                  const checked = form.shifts.includes(shift);
                  return (
                    <button
                      key={shift}
                      type="button"
                      className={`px-4 py-2 rounded-full border ${checked ? 'border-primary bg-primary/10 text-primary' : 'border-slate-300 text-main/70'}`}
                      onClick={() =>
                        checked
                          ? setForm((prev) => ({ ...prev, shifts: prev.shifts.filter((s) => s !== shift) }))
                          : setForm((prev) => ({ ...prev, shifts: [...prev.shifts, shift] }))
                      }
                    >
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
                  const checked = form.services.includes(svc.id);
                  return (
                    <label key={svc.id} className={`p-3 rounded-xl border cursor-pointer ${checked ? 'border-primary bg-primary/10' : 'border-slate-300'}`}>
                      <input
                        type="checkbox"
                        className="mr-2"
                        checked={checked}
                        onChange={(e) => {
                          if (e.target.checked) setForm((prev) => ({ ...prev, services: [...prev.services, svc.id] }));
                          else setForm((prev) => ({ ...prev, services: prev.services.filter((x) => x !== svc.id) }));
                        }}
                      />
                      {svc.name}
                    </label>
                  );
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
  );
}