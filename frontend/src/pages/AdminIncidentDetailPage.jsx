import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import AdminHeaderNav from '../components/admin/AdminHeaderNav'
import AdminLayout from '../components/admin/AdminLayout'
import { useToast } from '../components/ui/ToastProvider'
import { useShop } from '../context/ShopContext'
import { apiRequest } from '../lib/api'

function mapFraudReport(item) {
  return {
    id: item?._id || item?.id || '',
    shopName: item?.shopName || item?.shopId || 'Chưa rõ shop',
    type: item?.reason || item?.type || 'Báo cáo gian lận',
    metric: item?.metric || item?.evidence || '-',
    level: item?.severity || 'medium',
    createdAt: item?.createdAt || new Date().toISOString()
  }
}

export default function AdminIncidentDetailPage() {
  const { id } = useParams()
  const { token } = useShop()
  const { pushToast } = useToast()
  const [incident, setIncident] = useState(null)
  const [status, setStatus] = useState('open')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!token || !id) return
    let mounted = true
    const run = async () => {
      setLoading(true)
      try {
        const res = await apiRequest(`/api/admin/fraud-reports/${id}`, { token })
        if (!mounted) return
        const mapped = mapFraudReport(res?.report || null)
        setIncident(mapped)
      } catch (error) {
        pushToast({ type: 'error', title: 'Không tải được incident', message: error?.message || 'Lỗi không xác định' })
      } finally {
        if (mounted) setLoading(false)
      }
    }
    run()
    return () => { mounted = false }
  }, [id, token, pushToast])

  if (loading) {
    return <AdminLayout><p className="text-sm text-main/60">Đang tải incident...</p></AdminLayout>
  }

  if (!incident) {
    return (
      <AdminLayout>
        <h2 className="font-h2 text-h2 text-primary">Không tìm thấy incident rủi ro</h2>
        <Link className="text-primary underline" to="/admin/risk">Quay lại danh sách rủi ro</Link>
      </AdminLayout>
    )
  }

  const freezeRisk = async () => {
    setSaving(true)
    try {
      await apiRequest(`/api/admin/fraud-reports/${incident.id}/approve`, {
        method: 'PUT',
        token,
        body: { penaltyAmount: 50000, reason: 'Fraud incident approved by admin' }
      })
      setStatus('frozen')
      pushToast({ type: 'success', title: 'Đã duyệt vi phạm', message: 'Đã áp dụng xử lý vi phạm thành công.' })
    } catch (error) {
      pushToast({ type: 'error', title: 'Không thể xử lý', message: error?.message || 'Lỗi không xác định' })
    } finally {
      setSaving(false)
    }
  }

  const markSafe = async () => {
    setSaving(true)
    try {
      await apiRequest(`/api/admin/fraud-reports/${incident.id}/reject`, { method: 'PUT', token })
      setStatus('safe')
      pushToast({ type: 'success', title: 'Đã loại báo cáo', message: 'Đã đánh dấu incident là an toàn.' })
    } catch (error) {
      pushToast({ type: 'error', title: 'Không thể cập nhật', message: error?.message || 'Lỗi không xác định' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <AdminLayout>
      <header className="flex items-center justify-between gap-4">
        <div>
          <h2 className="font-h2 text-h2 text-primary">Chi tiết incident rủi ro</h2>
          <p className="text-main/70">Xem dữ liệu sự cố và thao tác khóa/đánh dấu theo dõi.</p>
          <AdminHeaderNav />
        </div>
        <Link to="/admin/risk" className="px-4 py-2 rounded-xl bg-slate-100 text-main/70 font-bold hover:bg-slate-200">Quay lại</Link>
      </header>

      <section className="glass-card bg-white rounded-3xl p-6 space-y-4">
        <h4 className="font-h3 text-h3 text-primary">{incident.shopName}</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <p><span className="text-main/60">Mã incident:</span> <b>{incident.id}</b></p>
          <p><span className="text-main/60">Loại:</span> <b>{incident.type}</b></p>
          <p><span className="text-main/60">Metric:</span> <b>{incident.metric}</b></p>
          <p><span className="text-main/60">Mức độ:</span> <b>{incident.level}</b></p>
          <p><span className="text-main/60">Phát hiện lúc:</span> <b>{new Date(incident.createdAt).toLocaleString('vi-VN')}</b></p>
          <p><span className="text-main/60">Trạng thái thao tác:</span> <b>{status === 'frozen' ? 'Đã khóa tạm' : status === 'safe' ? 'Đã đánh dấu an toàn' : 'Chưa xử lý'}</b></p>
        </div>

        <div className="flex gap-2">
          <button type="button" disabled={saving} className="px-4 py-2.5 rounded-xl bg-primary text-white font-bold disabled:opacity-60" onClick={freezeRisk}>Khóa tạm giao dịch rủi ro</button>
          <button type="button" disabled={saving} className="px-4 py-2.5 rounded-xl bg-slate-100 text-main/70 font-bold disabled:opacity-60" onClick={markSafe}>Đánh dấu an toàn</button>
        </div>
      </section>
    </AdminLayout>
  )
}
