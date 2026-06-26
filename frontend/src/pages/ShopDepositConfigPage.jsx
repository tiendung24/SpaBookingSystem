import { useMemo, useState } from 'react'
import ShopSidebar from '../components/shop/ShopSidebar'
import SystemConfigTabs from '../components/shop/SystemConfigTabs'
import { useShop } from '../context/ShopContext'

const quickDepositValues = [50000, 100000, 200000]

export default function ShopDepositConfigPage() {
  const { shop, updateDepositConfig } = useShop()
  const [depositEnabled, setDepositEnabled] = useState(shop.deposit.enabled)
  const [depositType, setDepositType] = useState(shop.deposit.type)
  const [depositValue, setDepositValue] = useState(shop.deposit.value)
  const [cancelHours, setCancelHours] = useState(shop.deposit.cancelHours)
  const [formError, setFormError] = useState('')
  const servicePrice = 250000

  const previewDeposit = useMemo(() => {
    if (!depositEnabled) return 0
    if (depositType === 'percent') {
      return Math.round((servicePrice * Number(depositValue || 0)) / 100)
    }
    return Number(depositValue || 0)
  }, [depositEnabled, depositType, depositValue])

  const depositSuffix = depositType === 'percent' ? '%' : 'VNĐ'

  const save = async () => {
    const nextValue = Number(depositValue)
    const nextCancelHours = Number(cancelHours)

    if (depositEnabled) {
      if (depositType === 'percent' && (nextValue < 1 || nextValue > 100)) {
        setFormError('Phần trăm đặt cọc phải trong khoảng 1% - 100%.')
        return
      }
      if (depositType === 'fixed' && nextValue <= 0) {
        setFormError('Tiền cọc cố định phải lớn hơn 0.')
        return
      }
    }

    if (nextCancelHours < 0 || nextCancelHours > 72) {
      setFormError('Số giờ hủy hợp lệ phải trong khoảng 0 - 72 giờ.')
      return
    }

    setFormError('')

    try {
      await updateDepositConfig({
        enabled: depositEnabled,
        type: depositType,
        value: nextValue,
        cancelHours: nextCancelHours
      })
      alert('Đã lưu cấu hình đặt cọc thành công!')
    } catch (error) {
      console.error('Lỗi khi lưu cấu hình đặt cọc:', error)
      setFormError(error?.message || 'Có lỗi xảy ra khi lưu cấu hình.')
    }
  }

  return (
    <div
      className="font-body-md text-main min-h-screen"
      style={{
        background: 'radial-gradient(circle at top right, #e7eeff, #f9f9ff)'
      }}
    >
      <ShopSidebar onNewBooking={() => console.log('Tạo lịch hẹn mới')} />

      <main className="md:ml-64 p-6 md:p-10 min-h-screen">
        <header className="mb-16 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <nav className="flex items-center gap-2 text-main/60 mb-2">
              <span className="text-xs">Cấu hình hệ thống</span>
              <span className="material-symbols-outlined text-[16px]">chevron_right</span>
              <span className="text-xs font-bold text-primary">Cấu hình đặt cọc & chính sách</span>
            </nav>
            <h2 className="font-h2 text-h2 text-primary tracking-tight">Thiết lập đặt cọc</h2>
            <p className="text-body-md text-main/70 max-w-2xl">
              Quản lý cách khách hàng đặt trước dịch vụ và các chính sách bảo vệ doanh thu cho cửa hàng.
            </p>
          </div>
          <button
            type="button"
            onClick={save}
            className="bg-primary text-white px-8 py-3 rounded-xl font-label-bold shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined">save</span>
            Lưu thay đổi
          </button>
        </header>

        <SystemConfigTabs />

        {formError ? <p className="mb-4 text-sm text-red-600 font-bold">{formError}</p> : null}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-6">
            <section className="glass-card p-6 rounded-3xl bg-white/70">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-[28px]">payments</span>
                  </div>
                  <div>
                    <h3 className="font-h3 text-h3 text-main">Yêu cầu đặt cọc</h3>
                    <p className="text-xs text-main/70">Bật để khách hàng phải trả trước một khoản phí khi đặt lịch.</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    className="sr-only peer"
                    type="checkbox"
                    checked={depositEnabled}
                    onChange={(e) => setDepositEnabled(e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-slate-300 rounded-full peer-checked:bg-primary after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:bg-white after:rounded-full after:transition-transform peer-checked:after:translate-x-full"></div>
                </label>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setDepositType('fixed')}
                  className={`rounded-2xl border p-5 text-left transition-all ${depositType === 'fixed' ? 'border-primary bg-primary/5' : 'border-slate-200 bg-white'
                    }`}
                >
                  <span className="font-label-bold block">Số tiền cố định</span>
                  <span className="text-xs text-main/70">Khách cọc một mức phí đồng nhất.</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDepositType('percent')}
                  className={`rounded-2xl border p-5 text-left transition-all ${depositType === 'percent' ? 'border-primary bg-primary/5' : 'border-slate-200 bg-white'
                    }`}
                >
                  <span className="font-label-bold block">Phần trăm hóa đơn (%)</span>
                  <span className="text-xs text-main/70">Cọc dựa trên tổng giá trị dịch vụ.</span>
                </button>
              </div>

              <div className="mt-6">
                <label className="font-label-bold text-main block mb-2">Mức tiền cọc</label>
                <div className="relative">
                  <input
                    type="number"
                    value={depositValue}
                    onChange={(e) => setDepositValue(e.target.value)}
                    placeholder="Nhập số tiền"
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 pr-16 outline-none focus:border-primary"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-main/60 font-bold">{depositSuffix}</span>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {depositType === 'fixed'
                    ? quickDepositValues.map((value) => (
                      <button
                        key={value}
                        type="button"
                        className="px-4 py-2 rounded-full border border-slate-300 hover:border-primary hover:text-primary"
                        onClick={() => setDepositValue(value)}
                      >
                        {Number(value || 0).toLocaleString('vi-VN')}đ
                      </button>
                    ))
                    : [10, 20, 30, 50].map((value) => (
                      <button
                        key={value}
                        type="button"
                        className="px-4 py-2 rounded-full border border-slate-300 hover:border-primary hover:text-primary"
                        onClick={() => setDepositValue(value)}
                      >
                        {value}%
                      </button>
                    ))}
                </div>
              </div>
            </section>

            <section className="glass-card p-6 rounded-3xl bg-white/70">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                  <span className="material-symbols-outlined text-[28px]">policy</span>
                </div>
                <div>
                  <h3 className="font-h3 text-h3 text-main">Chính sách hủy & hoàn tiền</h3>
                  <p className="text-xs text-main/70">Thiết lập các quy tắc để bảo vệ quyền lợi giữa khách và chủ shop.</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <p className="font-label-bold text-main">Hủy trước thời gian quy định</p>
                  <div className="mt-3 flex items-end gap-2">
                    <span className="text-xs">Trước</span>
                    <input
                      type="number"
                      value={cancelHours}
                      onChange={(e) => setCancelHours(e.target.value)}
                      className="w-24 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-center font-bold"
                    />
                    <span className="text-xs">giờ so với giờ hẹn</span>
                  </div>
                  <div className="mt-4 rounded-xl bg-emerald-50 border border-emerald-100 p-4">
                    <p className="text-xs text-main/70 mb-1">Hoàn tiền</p>
                    <p className="font-bold text-emerald-700">100% tiền cọc</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <p className="font-label-bold text-main">Hủy sát giờ / Không đến</p>
                  <p className="text-xs text-main/70 mt-3">Trong vòng {cancelHours} giờ trước lịch hẹn hoặc không đến.</p>
                  <div className="mt-4 rounded-xl bg-rose-50 border border-rose-100 p-4">
                    <p className="text-xs text-main/70 mb-1">Hoàn tiền</p>
                    <p className="font-bold text-rose-700">0% tiền cọc</p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                className="mt-4 text-primary font-bold hover:underline"
                onClick={() => window.alert('Tính năng thêm mốc thời gian hoàn tiền sẽ được mở rộng sau.')}
              >
                Thêm mốc thời gian hoàn tiền khác
              </button>
            </section>
          </div>

          <div className="lg:col-span-4 space-y-6">
            <div className="glass-card p-6 rounded-3xl bg-white/70 border border-slate-200">
              <div className="flex items-center gap-3 mb-4 text-emerald-600">
                <span className="material-symbols-outlined text-[28px]">shield_lock</span>
                <h4 className="font-h3 text-h3 text-main">Cơ chế LumiX Escrow</h4>
              </div>
              <div className="space-y-4 text-sm leading-6 text-main/80">
                <p>
                  Tiền cọc của khách hàng sẽ được <b className="text-main">LumiX giữ trung gian</b>. Tiền chỉ được chuyển vào ví của bạn sau khi:
                </p>
                <ul className="space-y-3 text-xs">
                  <li className="flex gap-3">
                    <span className="material-symbols-outlined text-[18px] text-emerald-500">check_circle</span>
                    <span>Lịch hẹn hoàn tất thành công.</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="material-symbols-outlined text-[18px] text-emerald-500">check_circle</span>
                    <span>Quá thời hạn khách có thể yêu cầu hoàn tiền theo chính sách của bạn.</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="material-symbols-outlined text-[18px] text-emerald-500">check_circle</span>
                    <span>Khách hàng hủy lịch muộn (theo cấu hình bên trái).</span>
                  </li>
                </ul>
                <div className="mt-6 p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                  <p className="text-[11px] uppercase tracking-widest text-emerald-600/70 mb-1 font-bold">Trạng thái hiện tại</p>
                  <div className="flex items-center justify-between text-emerald-700">
                    <span className="font-bold">Đang bảo vệ 24/7</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  </div>
                </div>
              </div>
            </div>

            <div className="glass-card p-6 rounded-3xl border-dashed border-primary/30 bg-white/70">
              <h4 className="font-label-bold text-main/70 mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">visibility</span>
                Xem trước phía khách hàng
              </h4>
              <div className="bg-white rounded-xl p-4 shadow-sm space-y-4">
                <div className="flex justify-between items-start border-b border-slate-200 pb-3">
                  <div>
                    <p className="text-xs text-main/60">Dịch vụ</p>
                    <p className="font-bold text-primary">Gội đầu dưỡng sinh</p>
                  </div>
                  <p className="font-bold">{Number(servicePrice || 0).toLocaleString('vi-VN')}đ</p>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span>Tổng cộng:</span>
                    <span>{Number(servicePrice || 0).toLocaleString('vi-VN')}đ</span>
                  </div>
                  <div className="flex justify-between items-center py-2 px-3 bg-primary/5 rounded border border-primary/10">
                    <span className="font-bold text-primary">Tiền cọc cần trả:</span>
                    <span className="font-bold text-primary">
                      {depositEnabled ? `${Number(previewDeposit || 0).toLocaleString('vi-VN')}đ` : '0đ'}
                    </span>
                  </div>
                </div>
                <div className="bg-slate-100 p-3 rounded text-[11px] text-main/70">
                  <p className="font-bold mb-1">Lưu ý về chính sách:</p>
                  Hoàn 100% tiền cọc nếu bạn hủy trước {cancelHours} giờ so với giờ hẹn. Sau thời gian này tiền cọc sẽ không được hoàn lại.
                </div>
              </div>
            </div>
          </div>
        </div>

        <footer className="w-full py-8 px-6 mt-16 bg-slate-100 border-t border-slate-200 rounded-t-3xl">
          <div className="flex flex-col md:flex-row items-center justify-between w-full mx-auto gap-4">
            <div>
              <span className="font-h3 text-h3 text-primary">LumiX Partner</span>
              <p className="text-xs text-main/60 mt-1">© 2024 LumiX Partner. Nền tảng Spa & Salon cao cấp.</p>
            </div>
            <div className="flex gap-6">
              <a className="text-main/70 hover:text-primary transition-colors font-body-md" href="/" onClick={(e) => e.preventDefault()}>Điều khoản</a>
              <a className="text-main/70 hover:text-primary transition-colors font-body-md" href="/" onClick={(e) => e.preventDefault()}>Bảo mật</a>
              <a className="text-main/70 hover:text-primary transition-colors font-body-md" href="/" onClick={(e) => e.preventDefault()}>Hỗ trợ</a>
            </div>
          </div>
        </footer>
      </main>
    </div>
  )
}
