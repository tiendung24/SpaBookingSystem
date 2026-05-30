import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useShop } from '../context/ShopContext'
import LumiXLogo from '../assets/lumix-logo.png'

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

  const onChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }))

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const fullName = String(form.fullName || '').trim()
      const phone = normalizePhone(form.phone)
      const email = String(form.email || '').trim().toLowerCase()
      const password = String(form.password || '')

      if (!fullName || !email || !password) throw new Error('Vui l?ng nh?p ??y ?? th?ng tin b?t bu?c')
      if (!isValidEmail(email)) throw new Error('Email kh?ng h?p l?')
      if (phone && !isValidPhone(phone)) throw new Error('S? ?i?n tho?i kh?ng h?p l?')
      if (password.length < 6) throw new Error('M?t kh?u ph?i t? 6 k? t?')

      await registerCustomer({ fullName, phone: phone || undefined, email, password })
      navigate('/login', { state: { flash: '??ng k? kh?ch th?nh c?ng. Vui l?ng ??ng nh?p.' } })
    } catch (err) {
      setError(err?.message || '??ng k? th?t b?i')
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
              <h1 className="font-headline-lg text-headline-lg text-primary mb-2">T?o t?i kho?n kh?ch h?ng</h1>
              <p className="text-main/70 mb-6">??ng k? ?? qu?n l? l?ch h?n v? ho?n c?c nhanh h?n.</p>
              <form className="space-y-4" onSubmit={onSubmit}>
                {error ? <p className="text-sm text-red-600">{error}</p> : null}
                <input name="fullName" value={form.fullName} onChange={onChange} placeholder="H? v? t?n" className="w-full p-3 rounded-xl border border-slate-300" required />
                <input name="phone" value={form.phone} onChange={onChange} placeholder="S? ?i?n tho?i (kh?ng b?t bu?c)" className="w-full p-3 rounded-xl border border-slate-300" />
                <input name="email" type="email" value={form.email} onChange={onChange} placeholder="Email" className="w-full p-3 rounded-xl border border-slate-300" required />
                <input name="password" type="password" value={form.password} onChange={onChange} placeholder="M?t kh?u" className="w-full p-3 rounded-xl border border-slate-300" required />
                <button disabled={submitting} className="w-full bg-primary text-white font-bold py-3 rounded-xl disabled:opacity-60" type="submit">
                  {submitting ? '?ang t?o t?i kho?n...' : '??ng k? kh?ch h?ng'}
                </button>
              </form>
              <p className="text-sm text-main/70 mt-4">
                ?? c? t?i kho?n? <Link className="text-primary font-bold" to="/login">??ng nh?p</Link>
              </p>
            </div>
          </div>
        </section>

        <section className="hidden md:flex md:w-5/12 lg:w-1/2 bg-[#f5f9fb] relative items-center justify-center overflow-hidden">
          <div className="absolute top-[-10%] right-[-10%] w-[420px] h-[420px] bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-[-5%] left-[-5%] w-[320px] h-[320px] bg-tertiary/10 rounded-full blur-3xl" />
        </section>
      </main>
    </div>
  )
}
