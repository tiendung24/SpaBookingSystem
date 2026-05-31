import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { apiRequest } from '../lib/api'
import LumiXLogo from '../assets/lumix-logo.png'

export default function ResetPasswordPage() {
  const { token } = useParams()
  const navigate = useNavigate()
  const [form, setForm] = useState({ newPassword: '', confirmPassword: '' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const onChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }))

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.newPassword || form.newPassword.length < 6) return setError('Mật khẩu mới phải từ 6 ký tự')
    if (form.newPassword !== form.confirmPassword) return setError('Xác nhận mật khẩu chưa khớp')
    setSubmitting(true)
    try {
      await apiRequest('/api/auth/reset-password', { method: 'POST', body: { token, newPassword: form.newPassword } })
      setDone(true)
      setTimeout(() => navigate('/login'), 1500)
    } catch (err) {
      setError(err?.message || 'Không thể đặt lại mật khẩu')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-white font-body-md text-main flex items-center justify-center px-6">
      <div className="w-full max-w-[520px] glass-card inner-glow rounded-2xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <img src={LumiXLogo} alt="LumiX Logo" className="h-12 w-auto" />
          <h1 className="text-2xl font-bold text-primary">Đặt lại mật khẩu</h1>
        </div>

        {done ? (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-green-700">
              Đặt lại mật khẩu thành công. Đang chuyển về đăng nhập...
            </div>
        ) : (
          <form className="space-y-4" onSubmit={onSubmit}>
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            <input name="newPassword" type="password" value={form.newPassword} onChange={onChange} placeholder="Mật khẩu mới" className="w-full p-3 rounded-xl border border-slate-300" required />
            <input name="confirmPassword" type="password" value={form.confirmPassword} onChange={onChange} placeholder="Nhập lại mật khẩu mới" className="w-full p-3 rounded-xl border border-slate-300" required />
            <button disabled={submitting} className="w-full bg-primary text-white font-bold py-3 rounded-xl disabled:opacity-60" type="submit">
              {submitting ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
            </button>
          </form>
        )}

        <div className="mt-4 text-sm">
          <Link to="/login" className="text-primary font-semibold">Quay lại đăng nhập</Link>
        </div>
      </div>
    </div>
  )
}
