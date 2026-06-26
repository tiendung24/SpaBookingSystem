import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import ShopSidebar from '../components/shop/ShopSidebar'
import { useShop } from '../context/ShopContext'
import { apiRequest } from '../lib/api'
import { useEffect } from 'react'

function dateOnlyLocal(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export default function ShopSchedulePage() {
  const { shop, bookings, token } = useShop()
  const [selectedDate, setSelectedDate] = useState(dateOnlyLocal())
  const [lockedSlots, setLockedSlots] = useState([])

  const daysOff = useMemo(() => {
    return Array.isArray(shop?.hours?.daysOff) 
      ? shop.hours.daysOff.map(d => Number(d) === 7 ? 0 : Number(d)) 
      : []
  }, [shop?.hours?.daysOff])

  const isDayOff = useMemo(() => {
    const targetDate = new Date(`${selectedDate}T00:00:00`)
    return daysOff.includes(targetDate.getDay())
  }, [selectedDate, daysOff])

  useEffect(() => {
    if (!token || isDayOff) {
      setLockedSlots([])
      return
    }
    apiRequest(`/api/shop/slot-locks?date=${selectedDate}`, { token })
      .then(res => setLockedSlots(res || []))
      .catch(err => console.error(err))
  }, [selectedDate, token, isDayOff])

  const toggleLock = async (time) => {
    const isLocked = lockedSlots.includes(time)
    try {
      if (isLocked) {
        await apiRequest(`/api/shop/slot-locks`, {
          method: 'DELETE',
          token,
          body: { date: selectedDate, time }
        })
        setLockedSlots(prev => prev.filter(t => t !== time))
      } else {
        await apiRequest(`/api/shop/slot-locks`, {
          method: 'POST',
          token,
          body: { date: selectedDate, time }
        })
        setLockedSlots(prev => [...prev, time])
      }
    } catch (err) {
      console.error('Lock error:', err)
      alert(err.message || 'Không thể cập nhật trạng thái khóa slot')
    }
  }

  const shopSlots = useMemo(() => {
    const open = shop?.hours?.open || '09:00'
    const close = shop?.hours?.close || '20:00'
    const slotDuration = 15
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

  const scheduleData = useMemo(() => {
    // 1. Filter valid bookings for the selected date
    const targetDate = new Date(`${selectedDate}T00:00:00`)
    
    const validBookings = (bookings || []).filter(b => {
      if (['canceled', 'rejected'].includes(b.status)) return false
      const bDate = new Date(b.time)
      return bDate.getFullYear() === targetDate.getFullYear() &&
             bDate.getMonth() === targetDate.getMonth() &&
             bDate.getDate() === targetDate.getDate()
    })

    // 2. Map slots to bookings
    return shopSlots.map(slotTime => {
      const [slotHour, slotMin] = slotTime.split(':').map(Number)
      const slotStart = new Date(targetDate)
      slotStart.setHours(slotHour, slotMin, 0, 0)
      
      // Each grid slot is 15 minutes long
      const slotEnd = new Date(slotStart.getTime() + 15 * 60000)

      const slotBookings = validBookings.filter(b => {
        const bStart = new Date(b.startTime || b.time)
        const durationMin = Number(b.serviceDurationMinutes || 60)
        const bEnd = b.endTime ? new Date(b.endTime) : new Date(bStart.getTime() + durationMin * 60000)
        
        // Check if the 15-minute slot overlaps with the booking's time span
        return slotStart < bEnd && slotEnd > bStart
      })

      return {
        time: slotTime,
        bookings: slotBookings
      }
    })
  }, [selectedDate, shopSlots, bookings])

  const nextDay = () => {
    const d = new Date(selectedDate)
    d.setDate(d.getDate() + 1)
    setSelectedDate(dateOnlyLocal(d))
  }

  const prevDay = () => {
    const d = new Date(selectedDate)
    d.setDate(d.getDate() - 1)
    setSelectedDate(dateOnlyLocal(d))
  }

  const setToday = () => {
    setSelectedDate(dateOnlyLocal())
  }

  return (
    <div className="min-h-screen bg-slate-50 text-main overflow-x-hidden">
      <ShopSidebar onNewBooking={() => {}} />
      <main className="ml-64 p-6 md:p-10">
        <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="font-h2 text-h2 text-primary">Theo dõi Slot</h2>
            <p className="text-main/70">Kiểm tra thời khóa biểu và các khung giờ rảnh trong ngày.</p>
          </div>
          
          <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
            <button onClick={prevDay} className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-100 text-main/70">
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
            <input 
              type="date" 
              className="bg-transparent border-none font-bold text-primary focus:ring-0 cursor-pointer"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
            />
            <button onClick={nextDay} className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-100 text-main/70">
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
            <button onClick={setToday} className="px-4 py-2 ml-2 rounded-xl bg-primary/10 text-primary font-bold hover:bg-primary/20 transition-colors">
              Hôm nay
            </button>
          </div>
        </header>

        <section className="glass-card bg-white/70 rounded-3xl p-6 min-h-[300px]">
          {isDayOff ? (
            <div className="flex flex-col items-center justify-center h-full text-main/50 py-20">
              <span className="material-symbols-outlined text-6xl mb-4 text-slate-300">event_busy</span>
              <p className="font-h3 text-h3 text-slate-500">Ngày nghỉ định kỳ</p>
              <p className="mt-2 text-sm">Shop không hoạt động và không nhận khách vào ngày này.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
              {scheduleData.map((slot) => {
                const hasBooking = slot.bookings.length > 0;
                const isLocked = lockedSlots.includes(slot.time);
                
                let bgColor = 'bg-white border-primary/20 text-main hover:bg-primary/5';
                let icon = '';
                let statusText = 'Trống';
                let statusColor = 'text-main/50';

                if (hasBooking) {
                  bgColor = 'bg-primary text-white border-primary shadow-md';
                  statusText = 'Đã có lịch';
                  statusColor = 'text-white/80';
                } else if (isLocked) {
                  bgColor = 'bg-slate-100 border-slate-300 text-slate-400';
                  icon = 'lock';
                  statusText = 'Đã khóa';
                  statusColor = 'text-slate-500';
                }

                return (
                  <div 
                    key={slot.time} 
                    className={`p-3 rounded-xl text-center border transition-all shadow-sm flex flex-col items-center justify-center gap-1 relative group cursor-pointer ${bgColor}`}
                    onClick={() => toggleLock(slot.time)}
                    title={isLocked ? "Bấm để mở khóa" : "Bấm để khóa"}
                  >
                    <span className="font-bold text-lg">{slot.time}</span>
                    <div className="flex items-center gap-1">
                      {icon && <span className="material-symbols-outlined text-[12px]">{icon}</span>}
                      <span className={`text-[11px] font-bold uppercase ${statusColor}`}>
                        {statusText}
                      </span>
                    </div>
                    {/* Hover tooltip hint */}
                    <div className="absolute inset-0 bg-black/80 text-white text-[10px] font-bold uppercase rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      {isLocked ? 'Mở khóa' : 'Khóa'}
                    </div>
                  </div>
                );
              })}
          </div>
          )}
        </section>
      </main>
    </div>
  )
}
