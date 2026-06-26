import { useState, useEffect } from 'react'
import ShopSidebar from '../components/shop/ShopSidebar'
import SystemConfigTabs from '../components/shop/SystemConfigTabs'
import { useShop } from '../context/ShopContext'
import { apiRequest } from '../lib/api'

export default function ShopSecurityConfigPage() {
  const { user, token } = useShop()

  const [authForm, setAuthForm] = useState({
    email: '',
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [authNotice, setAuthNotice] = useState('')
  const [authError, setAuthError] = useState('')

  useEffect(() => {
    if (user?.email && !authForm.email) {
      setAuthForm(prev => ({ ...prev, email: user.email }))
    }
  }, [user?.email])

  const handleUpdateEmail = async () => {
    if (!token) return
    setAuthNotice('')
    setAuthError('')
    try {
      const res = await apiRequest('/api/auth/change-email', { method: 'PUT', token, body: { newEmail: authForm.email } })
      if (res?.success) setAuthNotice('Đổi email thành công.')
    } catch (err) {
      setAuthError(err?.message || 'Không thể đổi email.')
    }
  }

  const handleUpdatePassword = async () => {
    if (!token) return
    if (authForm.newPassword !== authForm.confirmPassword) {
      return setAuthError('Mật khẩu xác nhận không khớp.')
    }
    setAuthNotice('')
    setAuthError('')
    try {
      const res = await apiRequest('/api/auth/change-password', { method: 'PUT', token, body: { oldPassword: authForm.oldPassword, newPassword: authForm.newPassword } })
      if (res?.success) {
        setAuthNotice('Đổi mật khẩu thành công.')
        setAuthForm(prev => ({ ...prev, oldPassword: '', newPassword: '', confirmPassword: '' }))
      }
    } catch (err) {
      setAuthError(err?.message || 'Không thể đổi mật khẩu.')
    }
  }

  const handleForgotPassword = async () => {
    setAuthNotice('')
    setAuthError('')
    try {
      const res = await apiRequest('/api/auth/forgot-password', { method: 'POST', body: { email: authForm.email } })
      if (res?.success) {
        setAuthNotice('Hệ thống đã gửi hướng dẫn đặt lại mật khẩu vào email của bạn. Vui lòng kiểm tra hộp thư.')
      }
    } catch (err) {
      setAuthError('Có lỗi xảy ra khi gửi yêu cầu.')
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-main">
      <ShopSidebar onNewBooking={() => {}} />
      <main className="ml-64 p-6 md:p-10">
        <header className="mb-10">
          <h1 className="font-h2 text-h2 text-primary">Cấu hình hệ thống</h1>
          <p className="text-main/70">Thông tin shop, thông báo và các thiết lập vận hành.</p>
        </header>

        <SystemConfigTabs />

        <section className="glass-card bg-white/70 rounded-3xl p-6 mt-8 mb-20">
          <h2 className="font-h3 text-h3 text-primary mb-6">Tài khoản bảo mật</h2>
          <div className="mb-6">
            {authNotice && (
              <div className="mb-4 rounded-2xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-emerald-700 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <span>{authNotice}</span>
                {authNotice.includes('Hệ thống đã gửi hướng dẫn') && (
                  <a
                    href={
                      authForm.email.endsWith('@gmail.com') ? 'https://mail.google.com/' :
                      authForm.email.endsWith('@yahoo.com') ? 'https://mail.yahoo.com/' :
                      (authForm.email.endsWith('@outlook.com') || authForm.email.endsWith('@hotmail.com')) ? 'https://outlook.live.com/' :
                      `https://${authForm.email.split('@')[1]}`
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors w-max"
                  >
                    Mở hộp thư ngay
                  </a>
                )}
              </div>
            )}
            {authError && <div className="mb-4 rounded-2xl bg-red-50 border border-red-200 px-4 py-3 text-red-600">{authError}</div>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex flex-col gap-4 bg-slate-50 border border-slate-200 p-5 rounded-2xl">
              <h3 className="font-bold text-main">Đổi Email</h3>
              <div>
                <label className="text-sm font-bold text-main/70">Email đăng nhập</label>
                <input
                  type="email"
                  className="w-full mt-1 p-3 rounded-xl border border-slate-300"
                  value={authForm.email}
                  onChange={e => setAuthForm(p => ({ ...p, email: e.target.value }))}
                />
              </div>
              <button onClick={handleUpdateEmail} className="px-5 py-3 rounded-xl bg-slate-200 text-main font-bold hover:bg-slate-300 w-max">
                Cập nhật Email
              </button>
            </div>

            <div className="flex flex-col gap-4 bg-slate-50 border border-slate-200 p-5 rounded-2xl">
              <h3 className="font-bold text-main">Đổi Mật khẩu</h3>
              <div>
                <label className="text-sm font-bold text-main/70">Mật khẩu hiện tại</label>
                <input
                  type="password"
                  className="w-full mt-1 p-3 rounded-xl border border-slate-300"
                  value={authForm.oldPassword}
                  onChange={e => setAuthForm(p => ({ ...p, oldPassword: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-bold text-main/70">Mật khẩu mới</label>
                <input
                  type="password"
                  className="w-full mt-1 p-3 rounded-xl border border-slate-300"
                  value={authForm.newPassword}
                  onChange={e => setAuthForm(p => ({ ...p, newPassword: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-bold text-main/70">Xác nhận mật khẩu mới</label>
                <input
                  type="password"
                  className="w-full mt-1 p-3 rounded-xl border border-slate-300"
                  value={authForm.confirmPassword}
                  onChange={e => setAuthForm(p => ({ ...p, confirmPassword: e.target.value }))}
                />
              </div>
              <div className="flex items-center gap-4">
                <button onClick={handleUpdatePassword} className="px-5 py-3 rounded-xl bg-slate-200 text-main font-bold hover:bg-slate-300 w-max">
                  Đổi mật khẩu
                </button>
                {authError === 'Mật khẩu hiện tại không chính xác' && (
                  <button onClick={handleForgotPassword} className="px-5 py-3 rounded-xl border border-primary text-primary font-bold hover:bg-primary/5 w-max">
                    Quên mật khẩu?
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
