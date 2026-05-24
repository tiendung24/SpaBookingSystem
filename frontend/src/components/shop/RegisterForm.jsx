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
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
}

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
    slug: '',
    address: ''
  })
  const [slugTouched, setSlugTouched] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const handleChange = (e) => {
    const { name, value } = e.target
    if (name === 'slug') {
      setSlugTouched(true)
      setFormData((prev) => ({ ...prev, slug: value }))
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      // Normalize email giống backend
      const normalizedEmail = formData.email ? String(formData.email).toLowerCase().trim() : ''
      
      await registerShop({
        fullName: formData.ownerName,
        phone: formData.phone.trim(),
        email: normalizedEmail || undefined,
        password: formData.password,
        shopName: formData.shopName,
        slug: formData.slug.trim()
      })
      
      // Đăng ký thành công, chuyển đến trang đăng nhập
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
        <input name="slug" value={formData.slug} onChange={handleChange} placeholder="/ slug shop (vd: my-spa-name)" className="w-full p-3 rounded-xl border border-slate-300" required />
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
