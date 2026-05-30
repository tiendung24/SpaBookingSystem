import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useShop } from '../context/ShopContext'
import { apiRequest } from '../lib/api'

function fmtVnd(v) {
  return `${Number(v || 0).toLocaleString('vi-VN')}?`
}

function statusText(status) {
  const key = String(status || '')
  if (key === 'pending') return 'Ch? x?c nh?n'
  if (key === 'confirmed') return '?? x?c nh?n'
  if (key === 'checked_in') return '?ang ph?c v?'
  if (key === 'completed') return 'Ho?n th?nh'
  if (key === 'cancelled' || key === 'canceled') return '?? h?y'
  if (key === 'cancelled_waiting_refund_info') return '?? h?y - ch? nh?p STK'
  if (key === 'cancelled_refund_pending') return '?? h?y - ch? ho?n ti?n'
  if (key === 'cancelled_refunded') return '?? h?y - ?? ho?n ti?n'
  if (key === 'no_show') return 'Kh?ng ??n'
  return key || '?'
}

export default function CustomerAccountBookingsPage() {
  const { customerBookings, user, token, logout, loadCustomerBookings } = useShop()
  const [searchParams] = useSearchParams()
  const focusCode = String(searchParams.get('bookingCode') || '').trim().toUpperCase()
  const [activeCode, setActiveCode] = useState('')
  const [detailCode, setDetailCode] = useState('')
  const [form, setForm] = useState({ bankName: '', accountNumber: '', accountName: '' })
  const [saving, setSaving] = useState(false)

  const items = useMemo(() => {
    const raw = Array.isArray(customerBookings) ? customerBookings.slice() : []
    return raw.sort((a, b) => new Date(b.startTime || b.createdAt || 0).getTime() - new Date(a.startTime || a.createdAt || 0).getTime())
  }, [customerBookings])

  const openDetail = (code) => {
    setDetailCode(code)
  }

  const cancelBooking = async (item) => {
    const code = String(item?.bookingCode || '')
    if (!code) return

    const start = item?.startTime ? new Date(item.startTime) : null
    const hoursLeft = start ? ((start.getTime() - Date.now()) / (60 * 60 * 1000)) : 0
    const isValid = hoursLeft >= 4

    const ok = window.confirm(
      isValid
        ? `B?n x?c nh?n h?y l?ch ${code}?
B?n s? nh?n l?i c?c sau khi nh?p STK.`
        : `B?n x?c nh?n h?y mu?n ${code}?
B?n s? m?t c?c, LumiX thu 10.000?, ph?n c?n l?i chuy?n cho shop.`
    )
    if (!ok) return

    try {
      const reason = window.prompt('L? do h?y l?ch (t?y ch?n):', '') || ''
      await apiRequest(`/api/customer/bookings/${encodeURIComponent(code)}/cancel`, { method: 'POST', token, body: { reason } })
      await loadCustomerBookings()
      alert('?? h?y l?ch th?nh c?ng')
    } catch (err) {
      alert(err?.message || 'Kh?ng th? h?y l?ch')
    }
  }

  const submitRefund = async (bookingCode) => {
    if (!form.bankName.trim() || !form.accountNumber.trim() || !form.accountName.trim()) {
      alert('Vui l?ng nh?p ?? th?ng tin ng?n h?ng')
      return
    }
    setSaving(true)
    try {
      await apiRequest(`/api/customer/refunds/${encodeURIComponent(bookingCode)}/bank-info`, {
        method: 'POST',
        token,
        body: { ...form }
      })
      setActiveCode('')
      setForm({ bankName: '', accountNumber: '', accountName: '' })
      await loadCustomerBookings()
      alert('?? g?i th?ng tin nh?n ho?n c?c th?nh c?ng')
    } catch (err) {
      alert(err?.message || 'Kh?ng g?i ???c th?ng tin ho?n c?c')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-main p-6 md:p-10">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-primary">L?ch h?n c?a t?i</h1>
            <p className="text-sm text-main/70">Xin ch?o {user?.fullName || user?.email || 'Kh?ch h?ng'}.</p>
          </div>
          <div className="flex gap-2">
            <Link to="/" className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-100">Trang ch?</Link>
            <button type="button" onClick={logout} className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200">??ng xu?t</button>
          </div>
        </header>

        <section className="bg-white rounded-2xl border border-slate-200 p-5 overflow-x-auto">
          <table className="w-full min-w-[1000px] text-sm">
            <thead>
              <tr className="bg-slate-50 text-left">
                <th className="p-3">M? booking</th>
                <th className="p-3">Shop</th>
                <th className="p-3">D?ch v?</th>
                <th className="p-3">Th?i gian h?n</th>
                <th className="p-3">Ti?n c?c</th>
                <th className="p-3">T?ng bill</th>
                <th className="p-3">C?n l?i</th>
                <th className="p-3">Tr?ng th?i</th>
                <th className="p-3">Thanh to?n</th>
                <th className="p-3">H?nh ??ng</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {items.map((item) => {
                const code = String(item.bookingCode || '')
                const highlight = focusCode && code === focusCode
                const remain = Math.max(0, Number(item.totalAmount || 0) - Number(item.depositAmount || 0))
                const canInputRefund = item.status === 'cancelled_waiting_refund_info'

                return (
                  <tr key={item._id} className={highlight ? 'bg-amber-50' : ''}>
                    <td className="p-3 font-bold text-primary">{code || item._id}</td>
                    <td className="p-3">{item.shopName || '?'}</td>
                    <td className="p-3">{item.serviceName || '?'}</td>
                    <td className="p-3">{item.startTime ? new Date(item.startTime).toLocaleString('vi-VN') : '?'}</td>
                    <td className="p-3">{fmtVnd(item.depositAmount || 0)}</td>
                    <td className="p-3">{fmtVnd(item.totalAmount || 0)}</td>
                    <td className="p-3">{fmtVnd(remain)}</td>
                    <td className="p-3">{statusText(item.status)}</td>
                    <td className="p-3">{item.paymentStatusInfo?.text || '?'}</td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <button className="px-3 py-1.5 rounded-lg border" onClick={() => openDetail(code)}>Xem chi ti?t</button>
                        {['pending', 'confirmed'].includes(String(item.status || '')) ? (
                          <button className="px-3 py-1.5 rounded-lg bg-rose-600 text-white" onClick={() => cancelBooking(item)}>H?y l?ch</button>
                        ) : null}
                        {canInputRefund ? (
                          <button className="px-3 py-1.5 rounded-lg bg-primary text-white" onClick={() => setActiveCode(code)}>Nh?p STK nh?n ho?n</button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                )
              })}
              {items.length === 0 ? (
                <tr><td colSpan={10} className="p-6 text-main/60">Ch?a c? l?ch h?n n?o.</td></tr>
              ) : null}
            </tbody>
          </table>
        </section>

        {detailCode ? (() => {
          const current = items.find((x) => String(x.bookingCode || '') === String(detailCode))
          if (!current) return null
          return (
            <section className="bg-white rounded-2xl border border-slate-200 p-5 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-primary">Chi ti?t l?ch h?n {current.bookingCode}</h3>
                <button className="px-3 py-1.5 rounded-lg border" onClick={() => setDetailCode('')}>??ng</button>
              </div>
              <p><strong>Shop:</strong> {current.shopName || '?'}</p>
              <p><strong>D?ch v?:</strong> {current.serviceName || '?'}</p>
              <p><strong>K? thu?t vi?n:</strong> {current.staffName || '?'}</p>
              <p><strong>Th?i gian h?n:</strong> {current.startTime ? new Date(current.startTime).toLocaleString('vi-VN') : '?'}</p>
              <p><strong>Ti?n c?c:</strong> {fmtVnd(current.depositAmount || 0)}</p>
              <p><strong>T?ng bill:</strong> {fmtVnd(current.totalAmount || 0)}</p>
              <p><strong>C?n l?i t?i shop:</strong> {fmtVnd(Math.max(0, Number(current.totalAmount || 0) - Number(current.depositAmount || 0)))}</p>
              <p><strong>Tr?ng th?i l?ch:</strong> {statusText(current.status)}</p>
              <p><strong>Tr?ng th?i thanh to?n:</strong> {current.paymentStatusInfo?.text || '?'}</p>
              <p><strong>Ghi ch?:</strong> {current.note || '?'}</p>
            </section>
          )
        })() : null}

        {activeCode ? (
          <section className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
            <h3 className="text-lg font-bold text-primary">Nh?p th?ng tin nh?n ho?n c?c cho {activeCode}</h3>
            <div className="grid md:grid-cols-3 gap-3">
              <input className="p-3 rounded-xl border" placeholder="T?n ng?n h?ng" value={form.bankName} onChange={(e) => setForm((p) => ({ ...p, bankName: e.target.value }))} />
              <input className="p-3 rounded-xl border" placeholder="S? t?i kho?n" value={form.accountNumber} onChange={(e) => setForm((p) => ({ ...p, accountNumber: e.target.value }))} />
              <input className="p-3 rounded-xl border" placeholder="T?n ch? t?i kho?n" value={form.accountName} onChange={(e) => setForm((p) => ({ ...p, accountName: e.target.value }))} />
            </div>
            <div className="flex gap-2">
              <button disabled={saving} onClick={() => submitRefund(activeCode)} className="px-4 py-2 rounded-xl bg-primary text-white disabled:opacity-60">{saving ? '?ang g?i...' : 'G?i th?ng tin'}</button>
              <button disabled={saving} onClick={() => setActiveCode('')} className="px-4 py-2 rounded-xl border">H?y</button>
            </div>
          </section>
        ) : null}
      </div>
    </div>
  )
}
