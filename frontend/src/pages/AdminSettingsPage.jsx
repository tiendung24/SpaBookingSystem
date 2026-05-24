import { useEffect, useMemo, useState } from 'react'
import AdminHeaderNav from '../components/admin/AdminHeaderNav'
import AdminLayout from '../components/admin/AdminLayout'
import { useShop } from '../context/ShopContext'
import { useToast } from '../components/ui/ToastProvider'
import { apiRequest } from '../lib/api'

const DEFAULTS = {
  maintenanceMode: false,
  otpLimit: 5,
  minWallet: 100000,
  cancelThreshold: 25,
  whistleblowerReward: 20000,
  shopPenalty: 50000
}

function toNumberSafe(value, fallback = 0) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

export default function AdminSettingsPage() {
  const { token } = useShop()
  const { pushToast } = useToast()

  const [maintenanceMode, setMaintenanceMode] = useState(DEFAULTS.maintenanceMode)
  const [otpLimit, setOtpLimit] = useState(DEFAULTS.otpLimit)
  const [minWallet, setMinWallet] = useState(DEFAULTS.minWallet)
  const [cancelThreshold, setCancelThreshold] = useState(DEFAULTS.cancelThreshold)
  const [whistleblowerReward, setWhistleblowerReward] = useState(DEFAULTS.whistleblowerReward)
  const [shopPenalty, setShopPenalty] = useState(DEFAULTS.shopPenalty)

  const [formError, setFormError] = useState('')
  const [formSuccess, setFormSuccess] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!token) return
    let mounted = true
    const run = async () => {
      try {
        const res = await apiRequest('/api/admin/settings', { token })
        if (!mounted) return
        const map = Object.fromEntries((res?.items || []).map((item) => [item.key, item.value]))
        setMaintenanceMode(Boolean(map.maintenanceMode ?? DEFAULTS.maintenanceMode))
        setOtpLimit(toNumberSafe(map.otpLimit, DEFAULTS.otpLimit))
        setMinWallet(toNumberSafe(map.minWallet, DEFAULTS.minWallet))
        setCancelThreshold(toNumberSafe(map.cancelThreshold, DEFAULTS.cancelThreshold))
        setWhistleblowerReward(toNumberSafe(map.whistleblowerReward, DEFAULTS.whistleblowerReward))
        setShopPenalty(toNumberSafe(map.shopPenalty, DEFAULTS.shopPenalty))
      } catch (error) {
        pushToast({ type: 'error', title: 'Không tải được settings', message: error?.message || 'Lỗi không xác định' })
      }
    }
    run()
    return () => { mounted = false }
  }, [token, pushToast])

  const payload = useMemo(
    () => ({
      maintenanceMode: Boolean(maintenanceMode),
      otpLimit: toNumberSafe(otpLimit, DEFAULTS.otpLimit),
      minWallet: toNumberSafe(minWallet, DEFAULTS.minWallet),
      cancelThreshold: toNumberSafe(cancelThreshold, DEFAULTS.cancelThreshold),
      whistleblowerReward: toNumberSafe(whistleblowerReward, DEFAULTS.whistleblowerReward),
      shopPenalty: toNumberSafe(shopPenalty, DEFAULTS.shopPenalty)
    }),
    [maintenanceMode, otpLimit, minWallet, cancelThreshold, whistleblowerReward, shopPenalty]
  )

  const validate = () => {
    if (payload.otpLimit < 1 || payload.otpLimit > 20) return 'Giới hạn OTP phải trong khoảng 1 - 20.'
    if (payload.minWallet < 0) return 'Ngưỡng ví tối thiểu không được âm.'
    if (payload.cancelThreshold < 0 || payload.cancelThreshold > 100) return 'Ngưỡng cảnh báo tỷ lệ hủy phải trong khoảng 0 - 100%.'
    if (payload.whistleblowerReward < 0) return 'Thưởng khách tố giác không được âm.'
    if (payload.shopPenalty <= 0) return 'Phạt shop vi phạm phải lớn hơn 0.'
    if (payload.shopPenalty < payload.whistleblowerReward) return 'Phạt shop phải >= thưởng khách.'
    return ''
  }

  const restoreDefaults = () => {
    setMaintenanceMode(DEFAULTS.maintenanceMode)
    setOtpLimit(DEFAULTS.otpLimit)
    setMinWallet(DEFAULTS.minWallet)
    setCancelThreshold(DEFAULTS.cancelThreshold)
    setWhistleblowerReward(DEFAULTS.whistleblowerReward)
    setShopPenalty(DEFAULTS.shopPenalty)
    setFormError('')
    setFormSuccess('Đã khôi phục giá trị mặc định trên form.')
  }

  const save = async () => {
    const message = validate()
    setFormError(message)
    setFormSuccess('')
    if (message) return

    setSaving(true)
    try {
      await apiRequest('/api/admin/settings', { method: 'PUT', token, body: payload })
      setFormSuccess('Đã lưu cấu hình hệ thống thành công.')
    } catch (error) {
      setFormError(error?.message || 'Không thể lưu cấu hình.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AdminLayout>
      <header>
        <h2 className="font-h2 text-h2 text-primary">Cấu hình hệ thống</h2>
        <p className="text-main/70">Thiết lập tham số vận hành chung cho toàn bộ nền tảng.</p>
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
              <input type="number" min={1} max={20} value={otpLimit} onChange={(e) => setOtpLimit(Number(e.target.value))} className="w-full px-4 py-3 rounded-xl border border-slate-200" />
            </label>
          </div>
        </article>

        <article className="glass-card bg-white rounded-3xl p-6 space-y-4">
          <h4 className="font-h3 text-h3 text-primary">Policy vận hành</h4>
          <div className="space-y-4">
            <label className="block">
              <p className="text-sm text-main/60 mb-1">Ngưỡng ví tối thiểu mặc định (đ)</p>
              <input type="number" min={0} value={minWallet} onChange={(e) => setMinWallet(Number(e.target.value))} className="w-full px-4 py-3 rounded-xl border border-slate-200" />
            </label>
            <label className="block">
              <p className="text-sm text-main/60 mb-1">Ngưỡng cảnh báo tỷ lệ hủy (%)</p>
              <input type="number" min={0} max={100} value={cancelThreshold} onChange={(e) => setCancelThreshold(Number(e.target.value))} className="w-full px-4 py-3 rounded-xl border border-slate-200" />
            </label>
          </div>
        </article>
      </section>

      <section className="glass-card p-6 rounded-3xl bg-white space-y-4 mt-6">
        <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600"><span className="material-symbols-outlined text-[28px]">policy</span></div>
          <div>
            <h3 className="font-h3 text-h3 text-main">Smart Deposit & chống gian lận</h3>
            <p className="text-xs text-main/70">Thiết lập chung mức phạt vi phạm và phần thưởng tố giác toàn hệ thống.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
          <div>
            <label className="text-sm font-bold text-main/70 mb-2 block">Thưởng khách tố giác (VND)</label>
            <input className="w-full p-4 rounded-xl border border-slate-200" type="number" min={0} value={whistleblowerReward} onChange={(e) => setWhistleblowerReward(Number(e.target.value))} />
          </div>
          <div>
            <label className="text-sm font-bold text-main/70 mb-2 block">Phạt shop vi phạm (VND)</label>
            <input className="w-full p-4 rounded-xl border border-slate-200" type="number" min={1} value={shopPenalty} onChange={(e) => setShopPenalty(Number(e.target.value))} />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-900 text-sm">
          Nếu shop yêu cầu khách tự hủy để lách phí nền tảng, hệ thống sẽ phạt shop <b>{Number(shopPenalty || 0).toLocaleString('vi-VN')}đ</b> trừ thẳng vào ví LumiX và thưởng <b>{Number(whistleblowerReward || 0).toLocaleString('vi-VN')}đ</b> cho khách báo cáo gian lận thành công.
        </div>
      </section>

      <section className="glass-card bg-white rounded-3xl p-6">
        {formError ? <p className="text-sm text-rose-600 mb-3">{formError}</p> : null}
        {formSuccess ? <p className="text-sm text-emerald-600 mb-3">{formSuccess}</p> : null}
        <div className="flex items-center justify-end gap-2">
          <button type="button" className="px-5 py-3 rounded-xl bg-slate-100 text-main/70 font-bold" onClick={restoreDefaults}>Khôi phục mặc định</button>
          <button type="button" disabled={saving} className="px-5 py-3 rounded-xl bg-primary text-white font-bold disabled:opacity-60" onClick={save}>Lưu cấu hình</button>
        </div>
      </section>
    </AdminLayout>
  )
}
