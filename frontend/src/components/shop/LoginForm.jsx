import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useShop } from '../../context/ShopContext'

export default function LoginForm() {
  const navigate = useNavigate()
  const { loginUnified } = useShop()
  const [formData, setFormData] = useState({ identity: '', password: '', remember: false })
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      // Normalize identity - trim whitespace
      const normalizedIdentity = formData.identity.trim()
      if (!normalizedIdentity || !formData.password) {
        setError('Vui lòng nhập đầy đủ thông tin')
        setSubmitting(false)
        return
      }

      const result = await loginUnified({ identity: normalizedIdentity, password: formData.password })
      if (result.role === 'admin') {
        navigate('/admin/dashboard')
      } else {
        navigate('/shop/dashboard')
      }
    } catch (err) {
      console.error('Login error:', err)
      // Provide more specific error messages
      if (err?.status === 403) {
        setError('Bạn không có quyền đăng nhập. Vui lòng kiểm tra lại tài khoản hoặc liên hệ hỗ trợ.')
      } else if (err?.status === 401) {
        setError('Sai số điện thoại/email hoặc mật khẩu')
      } else {
        setError(err?.message || 'Đăng nhập thất bại')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="glass-card inner-glow w-full p-8 md:p-12 rounded-2xl transition-all duration-500 hover:shadow-[0_30px_60px_rgba(94,164,184,0.2)]">
      <div className="text-center mb-10">
        <h1 className="font-headline-lg text-headline-lg text-primary mb-2">Chào mừng trở lại</h1>
        <p className="font-body-md text-body-md text-main">Vui lòng đăng nhập vào tài khoản của bạn</p>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit}>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <input name="identity" className="w-full p-4 border rounded-lg" placeholder="Email hoặc số điện thoại" value={formData.identity} onChange={handleChange} />
        <div className="relative">
          <input name="password" type={showPassword ? 'text' : 'password'} className="w-full p-4 border rounded-lg pr-12" placeholder="Mật khẩu" value={formData.password} onChange={handleChange} />
          <button type="button" className="absolute right-3 top-3 text-sm" onClick={() => setShowPassword((v) => !v)}>{showPassword ? 'Ẩn' : 'Hiện'}</button>
        </div>
        <div className="flex items-center gap-2">
          <input id="remember" name="remember" type="checkbox" checked={formData.remember} onChange={handleChange} />
          <label htmlFor="remember">Ghi nhớ đăng nhập</label>
          <Link to="/forgot-password" className="ml-auto text-primary">Quên mật khẩu?</Link>
        </div>
        <button disabled={submitting} className="w-full bg-primary text-white font-bold py-4 rounded-lg disabled:opacity-60" type="submit">
          {submitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
        </button>
      </form>
    </div>
  )
}
