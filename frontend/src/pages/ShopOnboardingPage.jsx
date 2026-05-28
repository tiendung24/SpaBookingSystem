import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ShopSidebar from '../components/shop/ShopSidebar';
import { useShop } from '../context/ShopContext';
import { apiRequest } from '../lib/api'

function slugifyVietnamese(input) {
  if (!input) return '';
  return input
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\u0111/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
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

function toMinutes(timeHHmm) {
  const [hour, minute] = String(timeHHmm || '00:00').split(':').map((value) => Number(value));
  return hour * 60 + minute;
}

export default function ShopOnboardingPage() {
  const navigate = useNavigate();
  const { shop, setShop, services, addService, staff, addStaff, token } = useShop();
  const [step, setStep] = useState(1);

  const [newService, setNewService] = useState({ name: '', priceVnd: 150000, durationMinutes: 45, category: 'spa', visible: true });
  const [newStaff, setNewStaff] = useState({ name: '', phone: '', role: 'tech', status: 'working', rating: 5.0, bookingEnabled: true, services: [] });
  const [hours, setHours] = useState(shop.hours || { open: '09:00', close: '20:00', slotDuration: 60, capacity: 1 });

  const bookingLink = useMemo(() => `${window.location.origin}/${shop.slug || slugifyVietnamese(shop.name) || 'ten-tiem'}`, [shop.slug, shop.name]);

  const toSafeNumber = (value) => {
    const digitsOnly = String(value ?? '').replace(/\D/g, '');
    return Number(digitsOnly || 0);
  };

  const serviceDraftValid = newService.name.trim() && Number(newService.priceVnd) > 0 && Number(newService.durationMinutes) >= 15;
  const staffPhoneNormalized = normalizePhone(newStaff.phone);
  const staffDraftValid = newStaff.name.trim() && isValidPhone(staffPhoneNormalized);
  const hoursValid = toMinutes(hours.close) > toMinutes(hours.open) && Number(hours.capacity) >= 1 && Number(hours.slotDuration) >= 15;

  const canNext = () => {
    if (step === 1) return services.length > 0;
    if (step === 2) return staff.length > 0;
    return hoursValid;
  };

  const next = () => {
    if (!canNext()) return;
    setStep((current) => Math.min(3, current + 1));
  };

  const back = () => setStep((current) => Math.max(1, current - 1));

  const finish = () => {
    if (!hoursValid) return;
    const patch = { hours, onboardingCompleted: true }
    // persist onboardingCompleted and hours to server
    (async () => {
      try {
        await apiRequest('/api/shops/me', { method: 'PUT', token, body: patch })
      } catch {
        // ignore failures; still update client to avoid blocking UX
      }
      setShop((prev) => ({ ...prev, hours, onboardingCompleted: true }));
      navigate('/shop/dashboard');
    })()
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
          ].map((item) => (
            <div key={item.s} className={`px-4 py-2 rounded-full border ${step === item.s ? 'bg-primary text-white border-primary' : 'bg-white/60 border-slate-200 text-main/70'}`}>
              <b>{item.s}.</b> {item.t}
            </div>
          ))}
        </div>

        {step === 1 && (
          <section className="glass-card bg-white/70 rounded-3xl p-6">
            <h2 className="font-h3 text-h3 text-primary mb-4">Thiết lập dịch vụ</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <input className="p-3 rounded-xl border border-slate-300" placeholder="Tên dịch vụ" value={newService.name} onChange={(e) => setNewService((prev) => ({ ...prev, name: e.target.value }))} />
              <input className="p-3 rounded-xl border border-slate-300" type="text" inputMode="numeric" placeholder="Giá (VNĐ)" value={newService.priceVnd} onChange={(e) => setNewService((prev) => ({ ...prev, priceVnd: toSafeNumber(e.target.value) }))} />
              <input className="p-3 rounded-xl border border-slate-300" type="text" inputMode="numeric" placeholder="Thời gian (phút)" value={newService.durationMinutes} onChange={(e) => setNewService((prev) => ({ ...prev, durationMinutes: toSafeNumber(e.target.value) }))} />
              <button
                type="button"
                className="rounded-xl bg-primary text-white font-bold"
                onClick={() => {
                  if (!serviceDraftValid) return;
                  addService({
                    ...newService,
                    name: newService.name.trim(),
                    priceVnd: Number(newService.priceVnd || 0),
                    durationMinutes: Number(newService.durationMinutes || 0)
                  });
                  setNewService((prev) => ({ ...prev, name: '' }));
                }}
              >
                Thêm dịch vụ
              </button>
            </div>

            <div className="mt-5 text-xs text-main/60">
              Dịch vụ cần có tên, giá &gt; 0 và thời lượng tối thiểu 15 phút.
            </div>

            <div className="mt-5">
              <p className="text-sm font-bold text-main/70 mb-2">Danh sách dịch vụ ({services.length})</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {services.map((item) => (
                  <div key={item.id} className="p-4 rounded-2xl border border-slate-200 bg-white">
                    <p className="font-bold text-primary">{item.name}</p>
                    <p className="text-xs text-main/60">{item.durationMinutes} phút • {Number(item.priceVnd || 0).toLocaleString('vi-VN')}đ</p>
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
              <input className="p-3 rounded-xl border border-slate-300" placeholder="Tên nhân viên" value={newStaff.name} onChange={(e) => setNewStaff((prev) => ({ ...prev, name: e.target.value }))} />
              <input className="p-3 rounded-xl border border-slate-300" placeholder="Số điện thoại" value={newStaff.phone} onChange={(e) => setNewStaff((prev) => ({ ...prev, phone: e.target.value }))} />
              <select className="p-3 rounded-xl border border-slate-300" value={newStaff.role} onChange={(e) => setNewStaff((prev) => ({ ...prev, role: e.target.value }))}>
                <option value="tech">Kỹ thuật viên</option>
                <option value="reception">Lễ tân</option>
                <option value="manager">Quản lý</option>
              </select>
              <button
                type="button"
                className="rounded-xl bg-primary text-white font-bold"
                onClick={() => {
                  if (!staffDraftValid) return;
                  addStaff({
                    ...newStaff,
                    name: newStaff.name.trim(),
                    phone: staffPhoneNormalized,
                    services: services.slice(0, 2).map((service) => service.id)
                  });
                  setNewStaff({ name: '', phone: '', role: 'tech', status: 'working', rating: 5.0, bookingEnabled: true, services: [] });
                }}
              >
                Thêm nhân viên
              </button>
            </div>

            <div className="mt-5 text-xs text-main/60">
              Nhân viên cần có tên; số điện thoại nếu nhập phải đúng định dạng Việt Nam.
            </div>

            <div className="mt-5">
              <p className="text-sm font-bold text-main/70 mb-2">Danh sách nhân sự ({staff.length})</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {staff.map((member) => (
                  <div key={member.id} className="p-4 rounded-2xl border border-slate-200 bg-white">
                    <p className="font-bold text-primary">{member.name}</p>
                    <p className="text-xs text-main/60">{member.phone} • {member.role === 'tech' ? 'Kỹ thuật viên' : member.role === 'reception' ? 'Lễ tân' : 'Quản lý'}</p>
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
                <input className="w-full mt-1 p-3 rounded-xl border border-slate-300" type="time" value={hours.open} onChange={(e) => setHours((prev) => ({ ...prev, open: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-bold text-main/70">Giờ đóng cửa</label>
                <input className="w-full mt-1 p-3 rounded-xl border border-slate-300" type="time" value={hours.close} onChange={(e) => setHours((prev) => ({ ...prev, close: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-bold text-main/70">Độ dài slot (phút)</label>
                <select className="w-full mt-1 p-3 rounded-xl border border-slate-300" value={hours.slotDuration} onChange={(e) => setHours((prev) => ({ ...prev, slotDuration: Number(e.target.value) }))}>
                  <option value={30}>30</option>
                  <option value={45}>45</option>
                  <option value={60}>60</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-bold text-main/70">Sức chứa (khách/slot)</label>
                <input className="w-full mt-1 p-3 rounded-xl border border-slate-300" type="number" min="1" value={hours.capacity} onChange={(e) => setHours((prev) => ({ ...prev, capacity: Number(e.target.value) }))} />
              </div>
            </div>

            <div className="mt-5 text-xs text-main/60">
              Giờ đóng phải sau giờ mở, slot tối thiểu 15 phút và sức chứa tối thiểu 1.
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
            <button type="button" onClick={finish} className={`px-5 py-3 rounded-xl font-bold ${hoursValid ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}>
              Hoàn tất & vào dashboard
            </button>
          )}
        </div>
      </main>
    </div>
  );
}