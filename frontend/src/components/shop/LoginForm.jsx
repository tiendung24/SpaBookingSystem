import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useShop } from '../../context/ShopContext'

export default function LoginForm() {
  const navigate = useNavigate()
  const location = useLocation()
  const { loginUnified, shop } = useShop()
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
      } else if (result.role === 'customer') {
        const from = location.state?.from
        const shopHome = shop?.slug ? `/${shop.slug}` : '/'
        const safeFrom = from && !String(from).startsWith('/login') ? from : ''
        navigate(safeFrom || shopHome)
      } else {
        const from = location.state?.from
        let dest = from || '/shop/dashboard'
        // If the saved redirect is onboarding but onboarding is already completed,
        // send the user to dashboard instead.
        if (dest === '/shop/onboarding' && shop?.onboardingCompleted === true) dest = '/shop/dashboard'
        navigate(dest)
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
    <div className="w-full">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Đăng nhập</h1>
        <p className="text-gray-500">Chào mừng trở lại, vui lòng nhập thông tin của bạn</p>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit}>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email hoặc số điện thoại</label>
            <input name="identity" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" placeholder="Nhập email hoặc SĐT" value={formData.identity} onChange={handleChange} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu</label>
            <div className="relative">
              <input name="password" type={showPassword ? 'text' : 'password'} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all pr-12" placeholder="Nhập mật khẩu" value={formData.password} onChange={handleChange} />
              <button type="button" className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-500 hover:text-primary font-medium" onClick={() => setShowPassword((v) => !v)}>{showPassword ? 'Ẩn' : 'Hiện'}</button>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <input id="remember" name="remember" type="checkbox" className="w-4 h-4 text-primary bg-gray-50 border-gray-300 rounded focus:ring-primary/20 accent-primary" checked={formData.remember} onChange={handleChange} />
            <label htmlFor="remember" className="text-sm text-gray-600 cursor-pointer select-none">Ghi nhớ đăng nhập</label>
          </div>
          <Link to="/forgot-password" className="text-sm text-primary font-semibold hover:underline">Quên mật khẩu?</Link>
        </div>
        <button disabled={submitting} className="w-full bg-gradient-to-r from-primary to-[#1a7f96] text-white font-bold py-4 rounded-xl disabled:opacity-60 transition-all shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 active:translate-y-0 active:shadow-primary/20" type="submit">
          {submitting ? 'Đang xử lý...' : 'Đăng nhập'}
        </button>
        <div className="text-center text-sm text-gray-500 mt-4">
          Chưa có tài khoản?{' '}
          <Link to="/customer/register" className="text-primary font-bold hover:underline">
            Đăng ký khách hàng
          </Link>
          <span className="mx-2 text-gray-300">|</span>
          <Link to="/register" className="text-primary font-bold hover:underline">
            Đăng ký đối tác
          </Link>
        </div>
      </form>
    </div>
  )
}


