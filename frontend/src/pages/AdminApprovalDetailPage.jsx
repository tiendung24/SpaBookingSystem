import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import AdminHeaderNav from '../components/admin/AdminHeaderNav'
import AdminLayout from '../components/admin/AdminLayout'
import { useToast } from '../components/ui/ToastProvider'
import { useShop } from '../context/ShopContext'
import { apiRequest } from '../lib/api'

function mapShop(item) {
  return {
    id: item?._id || item?.id || '',
    shopName: item?.name || '—',
    owner: item?.ownerName || 'Chưa cập nhật',
    phone: item?.phone || '',
    district: item?.address?.district || item?.address?.city || 'Chưa cập nhật',
    kycStatus: item?.kycStatus || 'pending',
    submittedAt: item?.createdAt || new Date().toISOString(),
    servicesCount: Number(item?.stats?.servicesCount || 0),
    staffCount: Number(item?.stats?.staffCount || 0),
    status: item?.status || 'pending'
  }
}

export default function AdminApprovalDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { token } = useShop()
  const { pushToast } = useToast()
  const [request, setRequest] = useState(null)
  const [decision, setDecision] = useState('pending')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!token || !id) return
    let mounted = true
    const run = async () => {
      setLoading(true)
      try {
        const res = await apiRequest(`/api/admin/shops/${id}`, { token })
        if (!mounted) return
        const mapped = mapShop(res?.shop || null)
        setRequest(mapped)
        setDecision(mapped.status)
      } catch (error) {
        pushToast({ type: 'error', title: 'Không tải được hồ sơ', message: error?.message || 'Lỗi không xác định' })
      } finally {
        if (mounted) setLoading(false)
      }
    }
    run()
    return () => { mounted = false }
  }, [id, token, pushToast])

  const updateShopStatus = async (nextStatus, title, successMessage, type = 'info') => {
    if (!request) return
    setSaving(true)
    try {
      await apiRequest(`/api/admin/shops/${request.id}/status`, { method: 'PUT', token, body: { status: nextStatus } })
      setDecision(nextStatus)
      setRequest((prev) => (prev ? { ...prev, status: nextStatus } : prev))
      pushToast({ title, message: successMessage, type })
    } catch (error) {
      pushToast({ type: 'error', title: 'Không thể cập nhật trạng thái', message: error?.message || 'Lỗi không xác định' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <AdminLayout><p className="text-sm text-main/60">Đang tải hồ sơ...</p></AdminLayout>
  }

  if (!request) {
    return (
      <AdminLayout>
        <h2 className="font-h2 text-h2 text-primary">Không tìm thấy hồ sơ onboarding</h2>
        <Link className="text-primary underline" to="/admin/approvals">Quay lại danh sách duyệt</Link>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <header className="flex items-center justify-between gap-4">
        <div>
          <h2 className="font-h2 text-h2 text-primary">Chi tiết onboarding</h2>
          <p className="text-main/70">Rà soát hồ sơ pháp lý và mức độ sẵn sàng vận hành.</p>
          <AdminHeaderNav />
        </div>
        <Link to="/admin/approvals" className="px-4 py-2 rounded-xl bg-slate-100 text-main/70 font-bold hover:bg-slate-200">Quay lại</Link>
      </header>

      <section className="glass-card bg-white rounded-3xl p-6 space-y-4">
        <h4 className="font-h3 text-h3 text-primary">{request.shopName}</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <p><span className="text-main/60">Mã request:</span> <b>{request.id}</b></p>
          <p><span className="text-main/60">Chủ shop:</span> <b>{request.owner}</b></p>
          <p><span className="text-main/60">Số điện thoại:</span> <b>{request.phone}</b></p>
          <p><span className="text-main/60">Khu vực:</span> <b>{request.district}</b></p>
          <p><span className="text-main/60">KYC:</span> <b>{request.kycStatus === 'verified' ? 'Đạt' : 'Chờ'}</b></p>
          <p><span className="text-main/60">Gửi lúc:</span> <b>{new Date(request.submittedAt).toLocaleString('vi-VN')}</b></p>
          <p><span className="text-main/60">Dịch vụ khai báo:</span> <b>{request.servicesCount}</b></p>
          <p><span className="text-main/60">Nhân sự khai báo:</span> <b>{request.staffCount}</b></p>
          <p><span className="text-main/60">Trạng thái thao tác:</span> <b>{decision}</b></p>
        </div>
        <div className="pt-2 flex flex-wrap gap-2">
          <button type="button" disabled={saving} className="px-5 py-3 rounded-xl bg-primary text-white font-bold disabled:opacity-60" onClick={() => updateShopStatus('active', 'Đã duyệt shop', `Hồ sơ ${request.shopName} đã được duyệt.`, 'success')}>Duyệt shop</button>
          <button type="button" disabled={saving} className="px-5 py-3 rounded-xl bg-slate-100 text-main/70 font-bold disabled:opacity-60" onClick={() => pushToast({ type: 'warning', title: 'Đã ghi nhận', message: `Đã yêu cầu ${request.shopName} bổ sung hồ sơ.` })}>Yêu cầu bổ sung</button>
          <button type="button" disabled={saving} className="px-5 py-3 rounded-xl bg-rose-100 text-rose-700 font-bold disabled:opacity-60" onClick={() => updateShopStatus('inactive', 'Đã từ chối', `Đã từ chối hồ sơ của ${request.shopName}.`, 'error')}>Từ chối</button>
          <button type="button" className="px-5 py-3 rounded-xl border border-slate-200 text-main/70 font-bold" onClick={() => navigate('/admin/approvals')}>Về danh sách duyệt</button>
        </div>
      </section>
    </AdminLayout>
  )
}
