import { useMemo, useState } from 'react';
import ShopSidebar from '../components/shop/ShopSidebar';
import SystemConfigTabs from '../components/shop/SystemConfigTabs';
import { useShop } from '../context/ShopContext';

const weekDays = [
  { key: 1, label: 'Thứ 2' },
  { key: 2, label: 'Thứ 3' },
  { key: 3, label: 'Thứ 4' },
  { key: 4, label: 'Thứ 5' },
  { key: 5, label: 'Thứ 6' },
  { key: 6, label: 'Thứ 7' },
  { key: 0, label: 'Chủ Nhật' }
];

function toMinutes(timeHHmm) {
  const [h, m] = timeHHmm.split(':').map((v) => Number(v));
  return h * 60 + m;
}

function toHHmm(totalMinutes) {
  const h = String(Math.floor(totalMinutes / 60)).padStart(2, '0');
  const m = String(totalMinutes % 60).padStart(2, '0');
  return `${h}:${m}`;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export default function ShopSlotsConfigPage() {
  const { shop, setShop, staff } = useShop();
  const hours = shop.hours || {};
  const [openTime, setOpenTime] = useState(hours.open || '09:00');
  const [closeTime, setCloseTime] = useState(hours.close || '20:00');
  const [daysOff, setDaysOff] = useState(new Set(hours.daysOff ?? [0]));
  const [slotDuration, setSlotDuration] = useState(Number(hours.slotDuration || 60));
  const [capacity, setCapacity] = useState(Number(hours.capacity || 1));
  const [toastVisible, setToastVisible] = useState(false);

  const timelineSlots = useMemo(() => {
    const start = toMinutes(openTime);
    const end = toMinutes(closeTime);
    const duration = clamp(Number(slotDuration) || 45, 15, 240);
    const safeEnd = Math.max(start, end);

    const slots = [];
    let cursor = start;
    let index = 1;
    while (cursor + duration <= safeEnd) {
      slots.push({
        index,
        start: cursor,
        end: cursor + duration,
        booked: index === 2 ? 2 : index === 3 ? capacity : index === 4 ? 1 : 0
      });
      cursor += duration;
      index += 1;
      if (index > 200) break;
    }
    return slots;
  }, [openTime, closeTime, slotDuration, capacity]);

  const totalSlots = timelineSlots.length;

  const toggleDayOff = (dayKey) => {
    setDaysOff((prev) => {
      const next = new Set(prev);
      if (next.has(dayKey)) next.delete(dayKey);
      else next.add(dayKey);
      return next;
    });
  };

  const saveConfig = () => {
    setShop((prev) => ({
      ...prev,
      hours: {
        ...prev.hours,
        open: openTime,
        close: closeTime,
        daysOff: [...daysOff],
        slotDuration,
        capacity
      }
    }));
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 3000);
    console.log('Lưu cấu hình slot:', { openTime, closeTime, daysOff: [...daysOff], slotDuration, capacity });
  };

  return (
    <div
      className="font-body-md text-main min-h-screen"
      style={{ background: 'radial-gradient(circle at top left, #f0f3ff 0%, #ffffff 100%)' }}
    >
      <ShopSidebar onNewBooking={() => console.log('Tạo lịch hẹn mới')} />

      <main className="ml-64 p-6 md:p-10">
        <header className="mb-16 flex justify-between items-end">
          <div>
            <nav className="flex items-center gap-2 text-xs text-main/60 mb-2">
              <span>Cấu hình</span>
              <span className="material-symbols-outlined text-[12px]">chevron_right</span>
              <span className="text-primary font-bold">Slot & giờ hoạt động</span>
            </nav>
            <h2 className="font-h1 text-h1 text-primary tracking-tight">Thiết lập vận hành</h2>
          </div>
          <button
            type="button"
            onClick={saveConfig}
            className="bg-primary text-white px-8 py-3 rounded-full font-bold shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined">save</span>
            Lưu cấu hình
          </button>
        </header>
        <SystemConfigTabs />

        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-5 space-y-6">
            <section className="glass-card p-6 rounded-3xl bg-white/70">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined">schedule</span>
                </div>
                <h3 className="font-h3 text-h3 text-primary">Thời gian mở cửa</h3>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="font-label-bold text-main/70">Giờ mở cửa</label>
                    <input
                      className="w-full bg-white/60 border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-primary/20 outline-none transition-all shadow-inner"
                      type="time"
                      value={openTime}
                      onChange={(e) => setOpenTime(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="font-label-bold text-main/70">Giờ đóng cửa</label>
                    <input
                      className="w-full bg-white/60 border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-primary/20 outline-none transition-all shadow-inner"
                      type="time"
                      value={closeTime}
                      onChange={(e) => setCloseTime(e.target.value)}
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <label className="font-label-bold text-main/70 mb-3 block">Ngày nghỉ định kỳ</label>
                  <div className="flex flex-wrap gap-2">
                    {weekDays.map((d) => {
                      const off = daysOff.has(d.key);
                      return (
                        <button
                          key={d.key}
                          type="button"
                          onClick={() => toggleDayOff(d.key)}
                          className={`px-4 py-2 rounded-full border transition-all font-label-bold ${
                            off ? 'bg-primary text-white border-primary shadow-md' : 'border-slate-300 text-main/70 hover:border-primary'
                          }`}
                        >
                          {d.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </section>

            <section className="glass-card p-6 rounded-3xl bg-white/70">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-cyan-100 flex items-center justify-center text-secondary">
                  <span className="material-symbols-outlined">hourglass_top</span>
                </div>
                <h3 className="font-h3 text-h3 text-primary">Cấu hình slot</h3>
              </div>

              <div className="space-y-8">
                <div className="space-y-3">
                  <label className="font-label-bold text-main/70">Độ dài mỗi slot (phút)</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[30, 45, 60].map((v) => (
                      <label key={v} className="cursor-pointer">
                        <input
                          className="sr-only peer"
                          name="slot_duration"
                          type="radio"
                          value={v}
                          checked={slotDuration === v}
                          onChange={() => setSlotDuration(v)}
                        />
                        <div className="text-center p-3 border border-slate-300 rounded-xl peer-checked:bg-primary peer-checked:text-white peer-checked:border-primary transition-all font-bold">
                          {v}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="font-label-bold text-main/70">Sức chứa tối đa (khách/slot)</label>
                    <span className="bg-primary/15 text-primary px-3 py-1 rounded-full font-bold">{capacity} khách</span>
                  </div>
                  <input
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary"
                    max="20"
                    min="1"
                    type="range"
                    value={capacity}
                    onChange={(e) => setCapacity(Number(e.target.value))}
                  />
                  <div className="flex justify-between text-xs text-main/60">
                    <span>1</span>
                    <span>10</span>
                    <span>20</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-100 border border-slate-200">
                  <p className="text-sm font-bold text-main">Gợi ý theo số nhân sự</p>
                  <p className="text-xs text-main/60 mt-1">
                    Hiện có <b>{staff.filter((s) => s.bookingEnabled).length}</b> nhân sự sẵn sàng nhận lịch. Bạn có thể đặt sức chứa bằng hoặc thấp hơn con số này để an toàn vận hành.
                  </p>
                </div>
              </div>
            </section>
          </div>

          <div className="col-span-12 lg:col-span-7">
            <section className="glass-card p-6 rounded-3xl bg-white/70 h-full border border-primary/10">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-700">
                    <span className="material-symbols-outlined">timeline</span>
                  </div>
                  <h3 className="font-h3 text-h3 text-primary">Xem trước timeline</h3>
                </div>
                <div className="flex gap-2 items-center">
                  <button type="button" className="p-2 rounded-full hover:bg-slate-100 transition-colors">
                    <span className="material-symbols-outlined">chevron_left</span>
                  </button>
                  <span className="font-bold text-main">Hôm nay</span>
                  <button type="button" className="p-2 rounded-full hover:bg-slate-100 transition-colors">
                    <span className="material-symbols-outlined">chevron_right</span>
                  </button>
                </div>
              </div>

              <div className="relative overflow-y-auto pr-2" style={{ maxHeight: 580 }}>
                <div className="space-y-4">
                  {timelineSlots.slice(0, 8).map((slot) => (
                    <div key={slot.index} className="flex gap-6 items-start">
                      <div className="w-16 pt-2 text-right">
                        <span className="text-sm font-bold text-main/70">{toHHmm(slot.start)}</span>
                      </div>
                      <div className="flex-1 grid grid-cols-2 gap-4">
                        {[0, 1].map((col) => {
                          const idx = slot.index + col;
                          const s = timelineSlots.find((x) => x.index === idx);
                          if (!s) return <div key={col} />;
                          const full = s.booked >= capacity;
                          return (
                            <div
                              key={col}
                              className={`p-4 rounded-2xl border shadow-sm flex justify-between items-center cursor-pointer transition-all hover:-translate-y-1 ${
                                full ? 'bg-primary/10 border-primary/20' : 'bg-white border-primary/10'
                              }`}
                            >
                              <div>
                                <p className="font-bold text-primary">{`Slot ${s.index}`}</p>
                                <p className="text-xs text-main/60">{`${toHHmm(s.start)} - ${toHHmm(s.end)}`}</p>
                              </div>
                              <div className={`flex items-center gap-1 ${full ? 'text-primary' : 'text-main/60'}`}>
                                <span className="material-symbols-outlined text-[18px]">group</span>
                                <span className="font-bold">{`${s.booked}/${capacity}`}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}

                  {timelineSlots.length > 10 && (
                    <div className="flex gap-6 items-start opacity-40">
                      <div className="w-16 pt-2 text-right">
                        <span className="text-sm font-bold text-main/70">...</span>
                      </div>
                      <div className="flex-1 text-center py-4 border-2 border-dashed border-slate-300 rounded-2xl">
                        <span className="text-xs text-main/60">Tải thêm các khung giờ tiếp theo</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 p-4 bg-cyan-50 rounded-2xl border border-cyan-200 flex gap-4 items-center">
                <span className="material-symbols-outlined text-secondary">info</span>
                <p className="text-xs text-cyan-900">
                  Tổng cộng có <b>{totalSlots} slot</b> khả dụng mỗi ngày với cấu hình hiện tại. Khách hàng sẽ thấy các slot này khi đặt lịch.
                </p>
              </div>
            </section>
          </div>
        </div>
      </main>

      <div
        className={`fixed bottom-10 right-10 px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 z-50 transition-all duration-500 ${
          toastVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'
        } bg-slate-900 text-white`}
      >
        <span className="material-symbols-outlined text-cyan-200">check_circle</span>
        <p className="font-label-bold">Đã lưu cấu hình slot thành công!</p>
      </div>
    </div>
  );
}
