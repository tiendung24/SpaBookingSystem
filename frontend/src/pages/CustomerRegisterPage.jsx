import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useShop } from '../context/ShopContext'
import LumiXLogo from '../assets/lumix-logo.png'

const sideImage = 'https://file.hstatic.net/200000827051/article/hinh-anh-goi-dau-duong-sinh_12_65344a182040435dae6ec3ba33e80b86.jpg'

function normalizePhone(input) {
  return String(input || '').trim().replace(/[\s.-]/g, '')
}

function isValidPhone(input) {
  return /^(?:\+84|0)\d{9,10}$/.test(input)
}

function isValidEmail(input) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(input || ''))
}

export default function CustomerRegisterPage() {
  const navigate = useNavigate()
  const { registerCustomer } = useShop()
  const [form, setForm] = useState({ fullName: '', phone: '', email: '', password: '' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const onChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const fullName = String(form.fullName || '').trim()
      const phone = normalizePhone(form.phone)
      const email = String(form.email || '').trim().toLowerCase()
      const password = String(form.password || '')

      if (!fullName || !phone || !email || !password) throw new Error('Vui lòng điền đầy đủ thông tin')
      if (!isValidEmail(email)) throw new Error('Email không hợp lệ')
      if (!isValidPhone(phone)) throw new Error('Số điện thoại không đúng định dạng')
      if (password.length < 6) throw new Error('Mật khẩu phải có ít nhất 6 ký tự')

      await registerCustomer({ fullName, phone, email, password })
      navigate('/login', { state: { flash: 'Đăng ký thành công. Vui lòng đăng nhập.' } })
    } catch (err) {
      setError(err?.message || 'Đăng ký thất bại')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-white font-body-md text-main overflow-x-hidden bg-3d-elements">
      <main className="min-h-screen flex flex-col md:flex-row">
        <section className="w-full md:w-7/12 lg:w-1/2 flex flex-col justify-center px-6 md:px-10 py-12 md:py-16 relative z-10">
          <div className="max-w-[620px] mx-auto w-full">
            <div className="flex items-center gap-3 mb-8">
              <img src={LumiXLogo} alt="LumiX Logo" className="h-14 w-auto" />
              <span className="font-headline-lg text-headline-lg text-primary tracking-tight">LumiX Customer</span>
            </div>

            <div className="glass-card inner-glow w-full p-8 md:p-10 rounded-2xl">
              <h1 className="font-headline-lg text-headline-lg text-primary mb-2">Tạo tài khoản khách hàng</h1>
              <p className="text-main/70 mb-6">Đăng ký để quản lý lịch hẹn, theo dõi hoàn cọc và đặt lịch nhanh hơn.</p>

              <form className="space-y-4" onSubmit={onSubmit}>
                {error ? <p className="text-sm text-red-600">{error}</p> : null}
                <input name="fullName" value={form.fullName} onChange={onChange} placeholder="Họ và tên" className="w-full p-3 rounded-xl border border-slate-300" required />
                <input name="phone" value={form.phone} onChange={onChange} placeholder={'S\u1ed1 \u0111i\u1ec7n tho\u1ea1i'} className="w-full p-3 rounded-xl border border-slate-300" required />
                <input name="email" type="email" value={form.email} onChange={onChange} placeholder="Email" className="w-full p-3 rounded-xl border border-slate-300" required />
                <input name="password" type="password" value={form.password} onChange={onChange} placeholder="Mật khẩu" className="w-full p-3 rounded-xl border border-slate-300" required />
                <button disabled={submitting} className="w-full bg-primary text-white font-bold py-3 rounded-xl disabled:opacity-60" type="submit">
                  {submitting ? 'Đang tạo tài khoản...' : 'Đăng ký khách hàng'}
                </button>
              </form>

              <p className="text-sm text-main/70 mt-4">
                {'Đã có tài khoản?'} <Link className="text-primary font-bold" to="/login">Đăng nhập</Link>
              </p>
            </div>
          </div>
        </section>

        <section className="hidden md:flex md:w-5/12 lg:w-1/2 bg-[#f5f9fb] relative items-center justify-center overflow-hidden">
          <div className="absolute inset-0">
            <img src={sideImage} alt="Kh\u00e1ch h\u00e0ng LumiX" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-slate-900/35" />
          </div>
          <div className="absolute top-[-10%] right-[-10%] w-[420px] h-[420px] bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-[-5%] left-[-5%] w-[320px] h-[320px] bg-tertiary/10 rounded-full blur-3xl" />

          <div className="relative z-10 w-full max-w-[520px] px-10 text-white">
            <div className="glass-card rounded-3xl p-6 bg-white/10 border border-white/20 backdrop-blur-xl">
              <p className="text-xs uppercase tracking-[0.3em] text-white/70">LumiX Customer</p>
              <h2 className="mt-3 text-3xl font-black leading-tight">LumiX – Dịch vụ đặt lịch và quản lý</h2>
              <div className="mt-6 space-y-3 text-sm text-white/90">
                <p>• Đặt lịch nhanh chóng và quản lý lịch hẹn mọi lúc.</p>
                <p>• Theo dõi tình trạng cọc và lịch sử giao dịch.</p>
                <p>• Nhận thông báo và ưu đãi từ cửa hàng.</p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
