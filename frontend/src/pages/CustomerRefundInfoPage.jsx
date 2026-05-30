import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { apiRequest } from '../lib/api'

function formatVnd(value) {
  return `${Number(value || 0).toLocaleString('vi-VN')}đ`
}

export default function CustomerRefundInfoPage() {
  const { token } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refund, setRefund] = useState(null)
  const [booking, setBooking] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  const amountText = useMemo(() => formatVnd(refund?.amount || 0), [refund])

  useEffect(() => {
    if (!token) return
    let mounted = true
    const run = async () => {
      setLoading(true)
      setError('')
      try {
        const res = await apiRequest(`/api/public/refunds/${encodeURIComponent(token)}`)
        if (!mounted) return
        setRefund(res?.refund || null)
        setBooking(res?.booking || null)
      } catch (err) {
        if (!mounted) return
        setError(err?.message || 'Không tải được thông tin hoàn tiền.')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    run()
    return () => {
      mounted = false
    }
  }, [token])

  const [form, setForm] = useState({ bankName: '', accountNumber: '', accountName: '' })

  useEffect(() => {
    if (!refund?.bankInfo) return
    setForm({
      bankName: refund.bankInfo.bankName || '',
      accountNumber: refund.bankInfo.accountNumber || '',
      accountName: refund.bankInfo.accountName || ''
    })
  }, [refund?.bankInfo])

  const canSubmit = Boolean(form.bankName.trim() && form.accountNumber.trim() && form.accountName.trim())

  const submit = async () => {
    if (!token || !canSubmit) return
    setSubmitting(true)
    setError('')
    try {
      await apiRequest(`/api/public/refunds/${encodeURIComponent(token)}/bank-info`, {
        method: 'POST',
        body: {
          bankName: form.bankName,
          accountNumber: form.accountNumber,
          accountName: form.accountName
        }
      })
      setSuccess(true)
    } catch (err) {
      setError(err?.message || 'Gửi thông tin thất bại, vui lòng thử lại.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 text-main flex items-center justify-center p-6">
        <p className="text-sm text-main/70">Đang tải thông tin hoàn tiền...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 text-main flex items-center justify-center p-6">
        <div className="max-w-xl w-full bg-white rounded-3xl border border-slate-200 p-6">
          <h1 className="text-xl font-bold text-primary">Hoàn tiền tiền cọc</h1>
          <p className="mt-2 text-sm text-red-600">{error}</p>
          <button type="button" className="mt-5 px-4 py-2 rounded-xl bg-slate-100 font-bold" onClick={() => window.location.reload()}>
            Thử lại
          </button>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 text-main flex items-center justify-center p-6">
        <div className="max-w-xl w-full bg-white rounded-3xl border border-slate-200 p-6">
          <h1 className="text-xl font-bold text-primary">Đã ghi nhận thông tin</h1>
          <p className="mt-2 text-sm text-main/70">LumiX đã nhận thông tin ngân hàng của bạn và sẽ tiến hành hoàn tiền trong thời gian sớm nhất.</p>
          <div className="mt-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-sm">
            <p><span className="text-main/60">Mã booking:</span> <b>{refund?.bookingCode || booking?.bookingCode || '—'}</b></p>
            <p className="mt-1"><span className="text-main/60">Số tiền hoàn:</span> <b>{amountText}</b></p>
          </div>
          <button type="button" className="mt-5 px-4 py-2 rounded-xl bg-primary text-white font-bold" onClick={() => navigate('/')}>Về trang chủ</button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 text-main p-6">
      <div className="max-w-2xl mx-auto bg-white rounded-3xl border border-slate-200 p-6">
        <h1 className="text-2xl font-bold text-primary">Nhập thông tin nhận hoàn tiền</h1>
        <p className="mt-2 text-sm text-main/70">Vui lòng nhập đúng thông tin để LumiX hoàn tiền cọc cho bạn.</p>

        <div className="mt-5 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-sm">
          <p><span className="text-main/60">Mã booking:</span> <b>{refund?.bookingCode || booking?.bookingCode || '—'}</b></p>
          <p className="mt-1"><span className="text-main/60">Số tiền hoàn:</span> <b>{amountText}</b></p>
          <p className="mt-1"><span className="text-main/60">Thời gian hẹn:</span> <b>{booking?.startTime ? new Date(booking.startTime).toLocaleString('vi-VN') : '—'}</b></p>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="text-sm font-bold text-main/70">Ngân hàng</label>
            <input className="w-full mt-1 p-3 rounded-xl border border-slate-300" value={form.bankName} onChange={(e) => setForm((p) => ({ ...p, bankName: e.target.value }))} placeholder="VD: Vietcombank" />
          </div>
          <div>
            <label className="text-sm font-bold text-main/70">Số tài khoản</label>
            <input className="w-full mt-1 p-3 rounded-xl border border-slate-300" value={form.accountNumber} onChange={(e) => setForm((p) => ({ ...p, accountNumber: e.target.value }))} placeholder="0123456789" />
          </div>
          <div>
            <label className="text-sm font-bold text-main/70">Chủ tài khoản</label>
            <input className="w-full mt-1 p-3 rounded-xl border border-slate-300" value={form.accountName} onChange={(e) => setForm((p) => ({ ...p, accountName: e.target.value }))} placeholder="NGUYEN VAN A" />
          </div>
        </div>

        <div className="mt-6 flex items-center gap-3">
          <button type="button" disabled={!canSubmit || submitting} className="px-5 py-3 rounded-xl bg-primary text-white font-bold disabled:opacity-60" onClick={submit}>
            {submitting ? 'Đang gửi...' : 'Gửi thông tin'}
          </button>
          {!canSubmit ? <p className="text-sm text-main/60">Vui lòng nhập đủ thông tin.</p> : null}
        </div>

        {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
      </div>
    </div>
  )
}
