import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import ShopSidebar from '../components/shop/ShopSidebar'
import { useShop } from '../context/ShopContext'

function dateOnlyLocal(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export default function ShopSchedulePage() {
  const { shop, bookings } = useShop()
  const [selectedDate, setSelectedDate] = useState(dateOnlyLocal())

  const daysOff = useMemo(() => {
    return Array.isArray(shop?.hours?.daysOff) 
      ? shop.hours.daysOff.map(d => Number(d) === 7 ? 0 : Number(d)) 
      : []
  }, [shop?.hours?.daysOff])

  const isDayOff = useMemo(() => {
    const targetDate = new Date(`${selectedDate}T00:00:00`)
    return daysOff.includes(targetDate.getDay())
  }, [selectedDate, daysOff])

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
      const slotBookings = validBookings.filter(b => {
        const bDate = new Date(b.time)
        const bHour = String(bDate.getHours()).padStart(2, '0')
        const bMin = String(bDate.getMinutes()).padStart(2, '0')
        return `${bHour}:${bMin}` === slotTime
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
              return (
                <div 
                  key={slot.time} 
                  className={`p-3 rounded-xl text-center border transition-all shadow-sm flex flex-col items-center justify-center gap-1 ${
                    hasBooking 
                      ? 'bg-primary text-white border-primary shadow-md' 
                      : 'bg-white border-primary/20 text-main hover:bg-primary/5'
                  }`}
                >
                  <span className="font-bold text-lg">{slot.time}</span>
                  <span className={`text-[11px] font-bold uppercase ${hasBooking ? 'text-white/80' : 'text-main/50'}`}>
                    {hasBooking ? 'Đã có lịch' : 'Trống'}
                  </span>
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
