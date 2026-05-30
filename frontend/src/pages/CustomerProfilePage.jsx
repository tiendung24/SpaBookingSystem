import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useShop } from '../context/ShopContext'
import { apiRequest } from '../lib/api'

export default function CustomerProfilePage() {
  const { token, user, loadMeAndShop } = useShop()
  const [form, setForm] = useState({ fullName: '', phone: '', email: '' })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    setForm({
      fullName: user?.fullName || '',
      phone: user?.phone || '',
      email: user?.email || ''
    })
  }, [user])

  const onChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))

  const onSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')
    setError('')
    try {
      await apiRequest('/api/customer/me', { method: 'PUT', token, body: { fullName: form.fullName, phone: form.phone } })
      await loadMeAndShop(token)
      setMessage('Cập nhật hồ sơ thành công')
    } catch (err) {
      setError(err?.message || 'Không thể cập nhật hồ sơ')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-main p-6 md:p-10">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-primary">Hồ sơ khách hàng</h1>
          <Link to="/customer/bookings" className="px-4 py-2 rounded-xl border">Lịch hẹn của tôi</Link>
        </div>

        <form onSubmit={onSubmit} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          {message ? <p className="text-sm text-emerald-600">{message}</p> : null}
          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <div>
            <label className="text-sm font-semibold">Họ và tên</label>
            <input name="fullName" value={form.fullName} onChange={onChange} className="w-full mt-1 p-3 rounded-xl border" />
          </div>

          <div>
            <label className="text-sm font-semibold">Số điện thoại</label>
            <input name="phone" value={form.phone} onChange={onChange} className="w-full mt-1 p-3 rounded-xl border" />
          </div>

          <div>
            <label className="text-sm font-semibold">Email</label>
            <input value={form.email} readOnly className="w-full mt-1 p-3 rounded-xl border bg-slate-50" />
            <p className="text-xs text-main/60 mt-1">Email đăng nhập hiện không cho chỉnh sửa tại đây.</p>
          </div>

          <button disabled={saving} className="px-5 py-3 rounded-xl bg-primary text-white font-bold disabled:opacity-60" type="submit">
            {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </form>
      </div>
    </div>
  )
}
