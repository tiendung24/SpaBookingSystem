import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Mail } from 'lucide-react'
import { apiRequest } from '../../lib/api'

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await apiRequest('/api/auth/forgot-password', {
        method: 'POST',
        body: { email: String(email || '').trim().toLowerCase() }
      })
      setSubmitted(true)
    } catch (err) {
      setError(err?.message || 'Không gửi được hướng dẫn đặt lại mật khẩu')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="w-full space-y-6 text-center">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-primary">Kiểm tra email của bạn</h2>
          <p className="text-main">Nếu email tồn tại, LumiX sẽ gửi hướng dẫn đặt lại mật khẩu.</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
          <p className="text-green-700 font-medium">Vui lòng kiểm tra hộp thư, kể cả mục Spam.</p>
        </div>
        <a 
          href="https://mail.google.com/mail/u/0/#inbox" 
          target="_blank" 
          rel="noopener noreferrer"
          className="w-full py-3 px-4 bg-primary text-white font-semibold rounded-xl hover:brightness-110 shadow-md transition-all duration-300 flex items-center justify-center gap-2 mb-4"
        >
          <Mail size={18} />
          Mở Gmail
        </a>
        <div className="mt-4">
          <Link to="/login" className="inline-block text-primary hover:text-primary/80 font-semibold transition-colors">
            Quay lại đăng nhập
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-primary">Đặt lại mật khẩu</h1>
        <p className="text-main">Nhập email để nhận hướng dẫn đặt lại mật khẩu.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-main uppercase tracking-wider">Email</label>
          <div className="custom-input relative">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-main/60">
              <Mail size={18} />
            </span>
            <input
              type="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full pl-12 pr-4 py-3 bg-white/50 border border-gray-200 rounded-xl outline-none transition-all placeholder-gray-400 text-main"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 px-4 bg-gradient-to-r from-primary to-secondary text-white font-semibold rounded-xl hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2 cta-3d disabled:opacity-60"
        >
          {submitting ? 'Đang gửi...' : 'Gửi hướng dẫn'}
          <span className="material-symbols-outlined text-xl">arrow_forward</span>
        </button>
      </form>

      <div className="text-center">
        <Link to="/login" className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-semibold transition-colors">
          <ArrowLeft size={18} />
          Quay lại đăng nhập
        </Link>
      </div>
    </div>
  )
}
