import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import ShopSidebar from '../components/shop/ShopSidebar'
import { useShop } from '../context/ShopContext'

const statusMeta = {
  awaiting_deposit: { label: 'Chờ thanh toán cọc', color: 'text-amber-700' },
  pending: { label: 'Chờ xác nhận', color: 'text-amber-700' },
  confirmed: { label: 'Đã xác nhận', color: 'text-primary' },
  checked_in: { label: 'Đang phục vụ', color: 'text-primary' },
  completed: { label: 'Hoàn thành', color: 'text-emerald-600' },
  canceled: { label: 'Đã hủy', color: 'text-red-600' },
  cancelled: { label: 'Đã hủy', color: 'text-red-600' },
  no_show: { label: 'Không đến', color: 'text-red-600' }
}

function fmtVnd(v) {
  return `${Number(v || 0).toLocaleString('vi-VN')}đ`
}

export default function ShopBookingDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { bookings, services, staff, shop, updateBooking } = useShop()

  const booking = bookings.find((b) => b.id === id)
  const service = services.find((s) => s.id === booking?.serviceId)
  const employee = staff.find((s) => s.id === booking?.staffId)
  const meta = statusMeta[booking?.status] ?? { label: 'Không rõ', color: 'text-main' }

  const [cancelMode, setCancelMode] = useState(null)
  const [cancelReason, setCancelReason] = useState('Có việc đột xuất')
  const [refund, setRefund] = useState({ bank: '', account: '', name: '' })
  const [nowTick, setNowTick] = useState(() => Date.now())

  const isCancelable = booking && !['completed', 'canceled', 'cancelled', 'no_show'].includes(booking.status)

  const cancelPolicy = useMemo(() => {
    const hours = shop.deposit.cancelHours ?? 4
    return { hours }
  }, [shop.deposit.cancelHours])

  const cancelDecision = (() => {
    if (!booking?.startTime) return { type: 'late', refundPercent: 0, remainingHours: 0 }
    const remainingHours = (new Date(booking.startTime).getTime() - nowTick) / (60 * 60 * 1000)
    const isValid = remainingHours >= cancelPolicy.hours
    return { type: isValid ? 'valid' : 'late', refundPercent: isValid ? 100 : 0, remainingHours }
  })()

  useEffect(() => {
    const timer = setInterval(() => setNowTick(Date.now()), 30000)
    return () => clearInterval(timer)
  }, [])

  if (!booking) {
    return (
      <div className="min-h-screen bg-slate-50 text-main">
        <ShopSidebar onNewBooking={() => {}} />
        <main className="ml-64 p-10">
          <p>Không tìm thấy booking.</p>
          <Link className="text-primary underline" to="/shop/bookings">Quay lại danh sách</Link>
        </main>
      </div>
    )
  }

  const setStatus = (status) => updateBooking(booking.id, { status })
  const confirmBooking = () => setStatus('confirmed')
  const checkIn = () => setStatus('checked_in')
  const checkOut = () => setStatus('completed')

  const cancelBookingNow = () => {
    const isValid = cancelDecision.type === 'valid'
    if (isValid && (!refund.bank || !refund.account || !refund.name)) {
      alert('Vui lòng nhập đủ thông tin hoàn tiền.')
      return
    }
    updateBooking(booking.id, {
      status: 'canceled',
      reason: cancelReason,
      cancellationType: isValid ? 'valid' : 'late',
      refundPercent: isValid ? 100 : 0,
      refundInfo: isValid ? refund : undefined
    })
    setCancelMode(null)
  }

  const markNoShow = () => {
    updateBooking(booking.id, { status: 'no_show', cancellationType: 'no_show', refundPercent: 0, reason: cancelReason })
    setCancelMode(null)
  }

  return (
    <div className="min-h-screen bg-slate-50 text-main">
      <ShopSidebar onNewBooking={() => {}} />
      <main className="ml-64 p-6 md:p-10 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Link className="text-primary hover:underline" to="/shop/bookings">← Danh sách lịch hẹn</Link>
            <h1 className="font-h2 text-h2 text-primary mt-2">{`Booking #${booking.bookingCode || booking.id}`}</h1>
            <p className={`font-bold ${meta.color}`}>{meta.label}</p>
            {booking.status === 'awaiting_deposit' ? (
              <div className="mt-2 inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm font-bold">
                <span className="material-symbols-outlined text-[18px]">warning</span>
                <span>Khách chưa thanh toán cọc. Không nên xác nhận trước khi hệ thống ghi nhận PayOS.</span>
              </div>
            ) : null}
          </div>
          <button className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-white" type="button" onClick={() => navigate(-1)}>
            Đóng
          </button>
        </div>

        <section className="glass-card bg-white/70 rounded-3xl p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-2">
            <p className="text-xs text-main/60 uppercase font-bold">Khách hàng</p>
            <p className="font-bold text-lg">{booking.customer}</p>
            <p className="text-main/70">{booking.phone}</p>
          </div>
          <div className="space-y-2">
            <p className="text-xs text-main/60 uppercase font-bold">Dịch vụ</p>
            <p className="font-bold text-lg">{service?.name ?? 'Dịch vụ'}</p>
            <p className="text-main/70">{`${service?.durationMinutes ?? 0} phút`}</p>
          </div>
          <div className="space-y-2">
            <p className="text-xs text-main/60 uppercase font-bold">Nhân viên</p>
            <p className="font-bold text-lg">{employee?.name ?? 'Chưa phân công'}</p>
            <p className="text-main/70">{employee?.phone ?? ''}</p>
          </div>
        </section>

        <section className="glass-card bg-white/70 rounded-3xl p-6">
          <h2 className="font-h3 text-h3 text-primary mb-4">Dòng tiền</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-white rounded-2xl border border-slate-200">
              <p className="text-xs text-main/60 uppercase font-bold">Tổng bill</p>
              <p className="font-bold text-lg text-main">{fmtVnd(booking.total)}</p>
            </div>
            <div className="p-4 bg-white rounded-2xl border border-slate-200">
              <p className="text-xs text-main/60 uppercase font-bold">Tiền cọc</p>
              <p className="font-bold text-lg text-primary">{fmtVnd(booking.deposit)}</p>
            </div>
            <div className="p-4 bg-white rounded-2xl border border-slate-200">
              <p className="text-xs text-main/60 uppercase font-bold">Phí nền tảng</p>
              <p className="font-bold text-lg text-main">{fmtVnd(10000)}</p>
              <p className="text-xs text-main/60">(Trừ khi booking hoàn thành)</p>
            </div>
          </div>
        </section>

        <section className="glass-card bg-white/70 rounded-3xl p-6">
          <h2 className="font-h3 text-h3 text-primary mb-4">Thao tác trạng thái</h2>
          <div className="flex flex-wrap gap-3">
            {booking.status === 'awaiting_deposit' && (
              <button className="px-5 py-3 rounded-xl bg-slate-200 text-slate-500 font-bold cursor-not-allowed" type="button" disabled title="Chờ hệ thống ghi nhận thanh toán cọc PayOS">
                Chờ khách thanh toán cọc
              </button>
            )}
            {booking.status === 'pending' && (
              <button className="px-5 py-3 rounded-xl bg-primary text-white font-bold hover:opacity-90" onClick={confirmBooking} type="button">
                Xác nhận
              </button>
            )}
            {booking.status === 'confirmed' && (
              <button className="px-5 py-3 rounded-xl bg-primary text-white font-bold hover:opacity-90" onClick={checkIn} type="button">
                Đánh dấu đến
              </button>
            )}
            {booking.status === 'checked_in' && (
              <button className="px-5 py-3 rounded-xl bg-emerald-600 text-white font-bold hover:opacity-90" onClick={checkOut} type="button">
                Hoàn thành
              </button>
            )}

            {isCancelable && (
              <button className="px-5 py-3 rounded-xl border border-slate-300 hover:bg-white font-bold" type="button" onClick={() => setCancelMode('cancel')}>
                Hủy lịch
              </button>
            )}

            {isCancelable && (
              <button className="px-5 py-3 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 font-bold" type="button" onClick={() => setCancelMode('no_show')}>
                Không đến
              </button>
            )}
          </div>

          {cancelMode && (
            <div className="mt-6 p-4 rounded-2xl border border-slate-200 bg-white">
              <div className="flex items-center justify-between mb-3">
                <p className="font-bold text-main">
                  {cancelMode === 'cancel'
                    ? cancelDecision.type === 'valid'
                      ? `Hủy hợp lệ (>= ${cancelPolicy.hours} giờ)`
                      : `Hủy muộn (< ${cancelPolicy.hours} giờ)`
                    : 'Không đến'}
                </p>
                <button type="button" className="text-main/60 hover:text-main" onClick={() => setCancelMode(null)}>Đóng</button>
              </div>

              {cancelMode === 'cancel' ? (
                <div className="mb-4 rounded-2xl p-4 border border-slate-200 bg-slate-50 text-sm text-main/80">
                  <p>
                    Dựa trên thời gian hiện tại, đây là trạng thái{' '}
                    <b className={cancelDecision.type === 'valid' ? 'text-emerald-600' : 'text-amber-600'}>
                      {cancelDecision.type === 'valid' ? 'hủy hợp lệ' : 'hủy muộn'}
                    </b>{' '}
                    và khách sẽ {cancelDecision.refundPercent > 0 ? 'được hoàn cọc theo chính sách shop.' : 'không được hoàn cọc theo chính sách shop.'}
                  </p>
                </div>
              ) : null}

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-bold text-main/70">Lý do hủy</label>
                  <select className="w-full mt-1 p-3 rounded-xl border border-slate-300 bg-white" value={cancelReason} onChange={(e) => setCancelReason(e.target.value)}>
                    <option>Có việc đột xuất</option>
                    <option>Đặt nhầm lịch</option>
                    <option>Tìm được chỗ khác</option>
                    <option>Lý do khác</option>
                  </select>
                </div>

                {cancelMode === 'cancel' && cancelDecision.type === 'valid' && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="text-sm font-bold text-main/70">Ngân hàng</label>
                      <input className="w-full mt-1 p-3 rounded-xl border border-slate-300" value={refund.bank} onChange={(e) => setRefund((p) => ({ ...p, bank: e.target.value }))} placeholder="VD: Vietcombank" />
                    </div>
                    <div>
                      <label className="text-sm font-bold text-main/70">Số tài khoản</label>
                      <input className="w-full mt-1 p-3 rounded-xl border border-slate-300" value={refund.account} onChange={(e) => setRefund((p) => ({ ...p, account: e.target.value }))} placeholder="0123456789" />
                    </div>
                    <div>
                      <label className="text-sm font-bold text-main/70">Chủ tài khoản</label>
                      <input className="w-full mt-1 p-3 rounded-xl border border-slate-300" value={refund.name} onChange={(e) => setRefund((p) => ({ ...p, name: e.target.value }))} placeholder="NGUYEN VAN A" />
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  {cancelMode === 'cancel' && (
                    <button type="button" className="px-5 py-3 rounded-xl bg-primary text-white font-bold" onClick={cancelBookingNow}>
                      Xác nhận hủy
                    </button>
                  )}
                  {cancelMode === 'no_show' && (
                    <button type="button" className="px-5 py-3 rounded-xl bg-red-600 text-white font-bold" onClick={markNoShow}>
                      Xác nhận không đến
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
