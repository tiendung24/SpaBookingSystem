import { useState } from 'react'
import AdminHeaderNav from '../components/admin/AdminHeaderNav'
import AdminLayout from '../components/admin/AdminLayout'

export default function AdminSettingsPage() {
  const [maintenanceMode, setMaintenanceMode] = useState(false)
  const [otpLimit, setOtpLimit] = useState(5)
  const [minWallet, setMinWallet] = useState(100000)
  const [cancelThreshold, setCancelThreshold] = useState(25)
  const [whistleblowerReward, setWhistleblowerReward] = useState(20000)
  const [shopPenalty, setShopPenalty] = useState(50000)

  return (
    <AdminLayout>
      <header>
        <h2 className="font-h2 text-h2 text-primary">Cấu hình hệ thống</h2>
        <p className="text-main/70">Thiết lập ngưỡng vận hành, bảo mật và policy toàn hệ thống.</p>
        <AdminHeaderNav />
      </header>

      <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <article className="glass-card bg-white rounded-3xl p-6 space-y-4">
          <h4 className="font-h3 text-h3 text-primary">Bảo mật & truy cập</h4>
          <div className="space-y-4">
            <label className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div>
                <p className="font-semibold">Maintenance mode</p>
                <p className="text-sm text-main/60">Tạm khóa thao tác đặt lịch từ client.</p>
              </div>
              <input type="checkbox" checked={maintenanceMode} onChange={(e) => setMaintenanceMode(e.target.checked)} />
            </label>
            <label className="block">
              <p className="text-sm text-main/60 mb-1">Giới hạn OTP / giờ / tài khoản</p>
              <input
                type="number"
                min={1}
                value={otpLimit}
                onChange={(e) => setOtpLimit(Number(e.target.value))}
                className="w-full px-4 py-3 rounded-xl border border-slate-200"
              />
            </label>
          </div>
        </article>

        <article className="glass-card bg-white rounded-3xl p-6 space-y-4">
          <h4 className="font-h3 text-h3 text-primary">Policy vận hành</h4>
          <div className="space-y-4">
            <label className="block">
              <p className="text-sm text-main/60 mb-1">Ngưỡng ví tối thiểu mặc định (đ)</p>
              <input
                type="number"
                min={0}
                value={minWallet}
                onChange={(e) => setMinWallet(Number(e.target.value))}
                className="w-full px-4 py-3 rounded-xl border border-slate-200"
              />
            </label>
            <label className="block">
              <p className="text-sm text-main/60 mb-1">Ngưỡng cảnh báo tỉ lệ hủy (%)</p>
              <input
                type="number"
                min={0}
                max={100}
                value={cancelThreshold}
                onChange={(e) => setCancelThreshold(Number(e.target.value))}
                className="w-full px-4 py-3 rounded-xl border border-slate-200"
              />
            </label>
          </div>
        </article>
      </section>

      <section className="glass-card p-6 rounded-3xl bg-white space-y-4 mt-6">
        <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600">
            <span className="material-symbols-outlined text-[28px]">policy</span>
          </div>
          <div>
            <h3 className="font-h3 text-h3 text-main">Smart Deposit & Chống gian lận</h3>
            <p className="text-xs text-main/70">Thiết lập chung mức phạt vi phạm và phần thưởng tố giác toàn hệ thống.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
          <div>
            <label className="text-sm font-bold text-main/70 mb-2 block">Thưởng khách tố giác (VND)</label>
            <input className="w-full p-4 rounded-xl border border-slate-200" type="number" value={whistleblowerReward} onChange={(e) => setWhistleblowerReward(Number(e.target.value))} />
          </div>
          <div>
            <label className="text-sm font-bold text-main/70 mb-2 block">Phạt shop vi phạm (VND)</label>
            <input className="w-full p-4 rounded-xl border border-slate-200" type="number" value={shopPenalty} onChange={(e) => setShopPenalty(Number(e.target.value))} />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-900 text-sm">
          Nếu shop yêu cầu khách tự hủy để lách phí nền tảng, hệ thống sẽ phạt shop <b>{Number(shopPenalty).toLocaleString('vi-VN')}đ</b> trừ thẳng vào ví LumiX và thưởng <b>{Number(whistleblowerReward).toLocaleString('vi-VN')}đ</b> cho khách báo cáo gian lận thành công.
        </div>
      </section>

      <section className="glass-card bg-white rounded-3xl p-6">
        <div className="flex items-center justify-end gap-2">
          <button className="px-5 py-3 rounded-xl bg-slate-100 text-main/70 font-bold">Khôi phục mặc định</button>
          <button className="px-5 py-3 rounded-xl bg-primary text-white font-bold">Lưu cấu hình</button>
        </div>
      </section>
    </AdminLayout>
  )
}

