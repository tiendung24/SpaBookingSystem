import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ShopSidebar from '../components/shop/ShopSidebar';
import { useShop } from '../context/ShopContext';

function slugifyVietnamese(input) {
  if (!input) return '';
  return input
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

export default function ShopOnboardingPage() {
  const navigate = useNavigate();
  const { shop, setShop, services, addService, staff, addStaff } = useShop();
  const [step, setStep] = useState(1);

  const [newService, setNewService] = useState({ name: '', priceVnd: 150000, durationMinutes: 45, category: 'spa', visible: true });
  const [newStaff, setNewStaff] = useState({ name: '', phone: '', role: 'tech', status: 'working', rating: 5.0, bookingEnabled: true, services: [] });
  const [hours, setHours] = useState(shop.hours);

  const bookingLink = useMemo(() => `lumix.vn/${shop.slug || slugifyVietnamese(shop.name) || 'ten-tiem'}`, [shop.slug, shop.name]);

  const canNext = () => {
    if (step === 1) return services.length > 0;
    if (step === 2) return staff.length > 0;
    return true;
  };

  const next = () => {
    if (!canNext()) return;
    setStep((s) => Math.min(3, s + 1));
  };
  const back = () => setStep((s) => Math.max(1, s - 1));

  const finish = () => {
    setShop((prev) => ({ ...prev, hours, onboardingCompleted: true }));
    navigate('/shop/dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-main">
      <ShopSidebar onNewBooking={() => {}} />
      <main className="ml-64 p-6 md:p-10 space-y-6">
        <header className="glass-card bg-white/70 rounded-3xl p-6">
          <h1 className="font-h2 text-h2 text-primary">Onboarding tạo shop</h1>
          <p className="text-main/70 mt-1">Thiết lập nhanh để shop có thể nhận lịch online trong 5 phút.</p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-xs text-main/60">Link đặt lịch:</span>
            <span className="px-3 py-1 rounded-full bg-primary/10 text-primary font-bold">{bookingLink}</span>
          </div>
        </header>

        <div className="flex gap-2">
          {[
            { s: 1, t: 'Dịch vụ' },
            { s: 2, t: 'Nhân sự' },
            { s: 3, t: 'Slot & giờ' }
          ].map((x) => (
            <div key={x.s} className={`px-4 py-2 rounded-full border ${step === x.s ? 'bg-primary text-white border-primary' : 'bg-white/60 border-slate-200 text-main/70'}`}>
              <b>{x.s}.</b> {x.t}
            </div>
          ))}
        </div>

        {step === 1 && (
          <section className="glass-card bg-white/70 rounded-3xl p-6">
            <h2 className="font-h3 text-h3 text-primary mb-4">Thiết lập dịch vụ</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <input className="p-3 rounded-xl border border-slate-300" placeholder="Tên dịch vụ" value={newService.name} onChange={(e) => setNewService((p) => ({ ...p, name: e.target.value }))} />
              <input className="p-3 rounded-xl border border-slate-300" type="number" placeholder="Giá (VNĐ)" value={newService.priceVnd} onChange={(e) => setNewService((p) => ({ ...p, priceVnd: Number(e.target.value) }))} />
              <input className="p-3 rounded-xl border border-slate-300" type="number" placeholder="Thời gian (phút)" value={newService.durationMinutes} onChange={(e) => setNewService((p) => ({ ...p, durationMinutes: Number(e.target.value) }))} />
              <button
                type="button"
                className="rounded-xl bg-primary text-white font-bold"
                onClick={() => {
                  if (!newService.name.trim()) return;
                  addService({ ...newService, name: newService.name.trim() });
                  setNewService((p) => ({ ...p, name: '' }));
                }}
              >
                Thêm dịch vụ
              </button>
            </div>

            <div className="mt-5">
              <p className="text-sm font-bold text-main/70 mb-2">Danh sách dịch vụ ({services.length})</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {services.map((s) => (
                  <div key={s.id} className="p-4 rounded-2xl border border-slate-200 bg-white">
                    <p className="font-bold text-primary">{s.name}</p>
                    <p className="text-xs text-main/60">{s.durationMinutes} phút • {s.priceVnd.toLocaleString('vi-VN')}đ</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {step === 2 && (
          <section className="glass-card bg-white/70 rounded-3xl p-6">
            <h2 className="font-h3 text-h3 text-primary mb-4">Thiết lập nhân sự</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <input className="p-3 rounded-xl border border-slate-300" placeholder="Tên nhân viên" value={newStaff.name} onChange={(e) => setNewStaff((p) => ({ ...p, name: e.target.value }))} />
              <input className="p-3 rounded-xl border border-slate-300" placeholder="Số điện thoại" value={newStaff.phone} onChange={(e) => setNewStaff((p) => ({ ...p, phone: e.target.value }))} />
              <select className="p-3 rounded-xl border border-slate-300" value={newStaff.role} onChange={(e) => setNewStaff((p) => ({ ...p, role: e.target.value }))}>
                <option value="tech">Kỹ thuật viên</option>
                <option value="reception">Lễ tân</option>
                <option value="manager">Quản lý</option>
              </select>
              <button
                type="button"
                className="rounded-xl bg-primary text-white font-bold"
                onClick={() => {
                  if (!newStaff.name.trim()) return;
                  addStaff({ ...newStaff, name: newStaff.name.trim(), services: services.slice(0, 2).map((s) => s.id) });
                  setNewStaff({ name: '', phone: '', role: 'tech', status: 'working', rating: 5.0, bookingEnabled: true, services: [] });
                }}
              >
                Thêm nhân viên
              </button>
            </div>

            <div className="mt-5">
              <p className="text-sm font-bold text-main/70 mb-2">Danh sách nhân sự ({staff.length})</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {staff.map((m) => (
                  <div key={m.id} className="p-4 rounded-2xl border border-slate-200 bg-white">
                    <p className="font-bold text-primary">{m.name}</p>
                    <p className="text-xs text-main/60">{m.phone} • {m.role === 'tech' ? 'Kỹ thuật viên' : m.role === 'reception' ? 'Lễ tân' : 'Quản lý'}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {step === 3 && (
          <section className="glass-card bg-white/70 rounded-3xl p-6">
            <h2 className="font-h3 text-h3 text-primary mb-4">Cấu hình slot & giờ hoạt động</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-bold text-main/70">Giờ mở cửa</label>
                <input className="w-full mt-1 p-3 rounded-xl border border-slate-300" type="time" value={hours.open} onChange={(e) => setHours((p) => ({ ...p, open: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-bold text-main/70">Giờ đóng cửa</label>
                <input className="w-full mt-1 p-3 rounded-xl border border-slate-300" type="time" value={hours.close} onChange={(e) => setHours((p) => ({ ...p, close: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-bold text-main/70">Độ dài slot (phút)</label>
                <select className="w-full mt-1 p-3 rounded-xl border border-slate-300" value={hours.slotDuration} onChange={(e) => setHours((p) => ({ ...p, slotDuration: Number(e.target.value) }))}>
                  <option value={30}>30</option>
                  <option value={45}>45</option>
                  <option value={60}>60</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-bold text-main/70">Sức chứa (khách/slot)</label>
                <input className="w-full mt-1 p-3 rounded-xl border border-slate-300" type="number" value={hours.capacity} onChange={(e) => setHours((p) => ({ ...p, capacity: Number(e.target.value) }))} />
              </div>
            </div>

            <div className="mt-6 p-4 rounded-2xl bg-cyan-50 border border-cyan-200 text-cyan-900">
              <b>Gợi ý:</b> Bạn có thể chỉnh chi tiết hơn tại <span className="underline">Cấu hình hệ thống → Slot & giờ hoạt động</span>.
            </div>
          </section>
        )}

        <div className="flex justify-between">
          <button type="button" onClick={back} className="px-5 py-3 rounded-xl border border-slate-300 hover:bg-white" disabled={step === 1}>
            Quay lại
          </button>
          {step < 3 ? (
            <button type="button" onClick={next} className={`px-5 py-3 rounded-xl font-bold ${canNext() ? 'bg-primary text-white' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}>
              Tiếp tục
            </button>
          ) : (
            <button type="button" onClick={finish} className="px-5 py-3 rounded-xl bg-emerald-600 text-white font-bold">
              Hoàn tất & vào dashboard
            </button>
          )}
        </div>
      </main>
    </div>
  );
}

