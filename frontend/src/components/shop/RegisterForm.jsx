import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useShop } from '../../context/ShopContext'
function slugifyVietnamese(input) {
  if (!input) return ''
  return input
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\u0111/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
    }

function normalizePhone(input) {
  return String(input || '')
    .trim()
    .replace(/[\s.-]/g, '')
}

function isValidPhone(input) {
  return /^(?:\+84|0)\d{9,10}$/.test(input)
}

function isValidEmail(input) {
  if (!input) return true
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input)
}

const BUSINESS_TYPE_OPTIONS = [
  { value: 'spa-salon', label: 'Spa/Salon' },
  { value: 'nail', label: 'Nail' },
  { value: 'goi-dau-duong-sinh', label: 'Gội đầu dưỡng sinh' },
  { value: 'cham-soc-da', label: 'Chăm sóc da' }
]

export default function RegisterForm() {
  const navigate = useNavigate()
  const { registerShop } = useShop()
  const [formData, setFormData] = useState({
    ownerName: '',
    phone: '',
    email: '',
    password: '',
    shopName: '',
    category: '',
    businessTypes: [],
    slug: '',
    address: ''
  })
  const [slugTouched, setSlugTouched] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const slugPreview = slugifyVietnamese(formData.slug || formData.shopName) || 'ten-tiem'
  const bookingLinkPreview = `${window.location.origin}/${slugPreview}`

  const handleChange = (e) => {
    const { name, value } = e.target

    if (name === 'slug') {
      setSlugTouched(true)
      const sanitized = slugifyVietnamese(value)
      setFormData((prev) => ({ ...prev, slug: sanitized }))
      return
    }

    if (name === 'shopName') {
      setFormData((prev) => ({
        ...prev,
        shopName: value,
        slug: slugTouched ? prev.slug : slugifyVietnamese(value)
      }))
      return
    }

    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const toggleBusinessType = (value) => {
    setFormData((prev) => {
      const current = Array.isArray(prev.businessTypes) ? prev.businessTypes : []
      const next = current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value]
      return { ...prev, businessTypes: next }
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    const ownerNameText = String(formData.ownerName || '').trim()
    const shopNameText = String(formData.shopName || '').trim()
    const phoneNormalized = normalizePhone(formData.phone)
    const emailText = formData.email ? String(formData.email).toLowerCase().trim() : ''
    const slugSanitized = slugifyVietnamese(formData.slug || shopNameText)
    const passwordText = String(formData.password || '')
    const selectedBusinessTypes = Array.isArray(formData.businessTypes) ? formData.businessTypes : []

    if (!ownerNameText || !shopNameText || !phoneNormalized || !passwordText) {
      setError('Vui lòng nhập đầy đủ thông tin bắt buộc')
      setSubmitting(false)
      return
    }
    if (!isValidPhone(phoneNormalized)) {
      setError('Số điện thoại không hợp lệ (0 hoặc +84, 10-11 số)')
      setSubmitting(false)
      return
    }
    if (!isValidEmail(emailText)) {
      setError('Email không hợp lệ')
      setSubmitting(false)
      return
    }
    if (passwordText.length < 6) {
      setError('Mật khẩu phải từ 6 ký tự trở lên')
      setSubmitting(false)
      return
    }
    if (!slugSanitized) {
      setError('Slug không hợp lệ')
      setSubmitting(false)
      return
    }
    if (selectedBusinessTypes.length === 0) {
      setError('Vui lòng chọn ít nhất một loại hình shop')
      setSubmitting(false)
      return
    }

    try {
      await registerShop({
        fullName: ownerNameText,
        phone: phoneNormalized,
        email: emailText || undefined,
        password: passwordText,
        shopName: shopNameText,
        slug: slugSanitized,
        businessTypes: selectedBusinessTypes
      })
      navigate('/login')
    } catch (err) {
      console.error('Register error:', err)
      setError(err?.message || 'Đăng ký thất bại')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="glass-card inner-glow w-full p-8 md:p-10 rounded-2xl">
      <div className="text-center mb-8">
        <h1 className="font-headline-lg text-headline-lg text-primary mb-2">Tạo tài khoản LumiX Partner</h1>
      </div>
      <form className="space-y-4" onSubmit={handleSubmit}>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <input name="ownerName" value={formData.ownerName} onChange={handleChange} placeholder="Tên chủ shop" className="w-full p-3 rounded-xl border border-slate-300" required />
        <input name="phone" value={formData.phone} onChange={handleChange} placeholder="Số điện thoại" className="w-full p-3 rounded-xl border border-slate-300" required />
        <input name="email" type="email" value={formData.email} onChange={handleChange} placeholder="Email công việc" className="w-full p-3 rounded-xl border border-slate-300" />
        <input name="password" type="password" value={formData.password} onChange={handleChange} placeholder="Mật khẩu" className="w-full p-3 rounded-xl border border-slate-300" required />
        <input name="shopName" value={formData.shopName} onChange={handleChange} placeholder="Tên tiệm" className="w-full p-3 rounded-xl border border-slate-300" required />
        <div className="rounded-2xl border border-slate-200 p-4 bg-white/60">
          <p className="text-sm font-bold text-main/70 mb-3">Loại hình shop</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {BUSINESS_TYPE_OPTIONS.map((option) => {
              const active = formData.businessTypes.includes(option.value)
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => toggleBusinessType(option.value)}
                  className={`px-4 py-2 rounded-xl border text-sm font-bold text-left transition-all ${active ? 'bg-primary text-white border-primary' : 'bg-white text-main border-slate-200 hover:border-primary/40'}`}
                >
                  {option.label}
                </button>
              )
            })}
          </div>
        </div>
        <input name="slug" value={formData.slug} onChange={handleChange} placeholder="slug shop (vd: my-spa-name)" className="w-full p-3 rounded-xl border border-slate-300" required />
        <p className="text-xs text-main/70 -mt-1">Link đặt lịch của bạn: <span className="font-bold text-primary">{bookingLinkPreview}</span></p>
        <input name="address" value={formData.address} onChange={handleChange} placeholder="Địa chỉ tiệm" className="w-full p-3 rounded-xl border border-slate-300" />
        <button disabled={submitting} type="submit" className="w-full bg-primary text-white font-bold py-4 rounded-xl disabled:opacity-60">
          {submitting ? 'Đang tạo tài khoản...' : 'Tạo tài khoản'}
        </button>
      </form>
      <div className="mt-6 text-center">
        <p>Đã có tài khoản? <Link to="/login" className="text-primary font-bold">Đăng nhập</Link></p>
      </div>
    </div>
  )
}
