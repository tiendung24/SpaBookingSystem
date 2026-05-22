import { useState } from 'react'
import AdminHeaderNav from '../components/admin/AdminHeaderNav'
import AdminLayout from '../components/admin/AdminLayout'

export default function AdminSettingsPage() {
  const [maintenanceMode, setMaintenanceMode] = useState(false)
  const [otpLimit, setOtpLimit] = useState(5)
  const [minWallet, setMinWallet] = useState(100000)
  const [cancelThreshold, setCancelThreshold] = useState(25)

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

      <section className="glass-card bg-white rounded-3xl p-6">
        <div className="flex items-center justify-end gap-2">
          <button className="px-5 py-3 rounded-xl bg-slate-100 text-main/70 font-bold">Khôi phục mặc định</button>
          <button className="px-5 py-3 rounded-xl bg-primary text-white font-bold">Lưu cấu hình</button>
        </div>
      </section>
    </AdminLayout>
  )
}

