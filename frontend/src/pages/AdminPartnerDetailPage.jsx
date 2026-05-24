import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import AdminHeaderNav from '../components/admin/AdminHeaderNav'
import AdminLayout from '../components/admin/AdminLayout'
import { useToast } from '../components/ui/ToastProvider'
import { useShop } from '../context/ShopContext'
import { apiRequest } from '../lib/api'

function formatVnd(value) {
  return `${Number(value || 0).toLocaleString('vi-VN')}đ`
}

function mapShopToPartner(shop) {
  return {
    id: shop?._id || shop?.id || '',
    shopName: shop?.name || '—',
    owner: shop?.ownerName || 'Chưa cập nhật',
    phone: shop?.phone || '',
    district: shop?.address?.district || shop?.address?.city || 'Chưa cập nhật',
    plan: shop?.plan || 'Cơ bản',
    joinedAt: shop?.createdAt || new Date().toISOString(),
    status: shop?.status || 'pending',
    rating: Number(shop?.stats?.rating || 0),
    monthlyBookings: Number(shop?.stats?.monthlyBookings || 0),
    wallet: Number(shop?.stats?.walletBalance || 0)
  }
}

export default function AdminPartnerDetailPage() {
  const { id } = useParams()
  const { token } = useShop()
  const { pushToast } = useToast()
  const [partner, setPartner] = useState(null)
  const [status, setStatus] = useState('pending')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!token || !id) return
    let mounted = true
    const run = async () => {
      setLoading(true)
      try {
        const res = await apiRequest(`/api/admin/shops/${id}`, { token })
        if (!mounted) return
        const mapped = mapShopToPartner(res?.shop || null)
        setPartner(mapped)
        setStatus(mapped.status)
      } catch (error) {
        pushToast({ type: 'error', title: 'Không tải được đối tác', message: error?.message || 'Lỗi không xác định' })
      } finally {
        if (mounted) setLoading(false)
      }
    }
    run()
    return () => { mounted = false }
  }, [id, token, pushToast])

  if (loading) {
    return <AdminLayout><p className="text-sm text-main/60">Đang tải đối tác...</p></AdminLayout>
  }

  if (!partner) {
    return (
      <AdminLayout>
        <h2 className="font-h2 text-h2 text-primary">Không tìm thấy đối tác</h2>
        <Link className="text-primary underline" to="/admin/partners">Quay lại danh sách đối tác</Link>
      </AdminLayout>
    )
  }

  const activate = async () => {
    setSaving(true)
    try {
      await apiRequest(`/api/admin/shops/${partner.id}/unlock`, { method: 'PUT', token })
      setStatus('active')
      pushToast({ type: 'success', title: 'Kích hoạt thành công', message: `${partner.shopName} đã được mở khóa.` })
    } catch (error) {
      pushToast({ type: 'error', title: 'Không thể kích hoạt', message: error?.message || 'Lỗi không xác định' })
    } finally {
      setSaving(false)
    }
  }

  const suspend = async () => {
    setSaving(true)
    try {
      await apiRequest(`/api/admin/shops/${partner.id}/lock`, { method: 'PUT', token })
      setStatus('inactive')
      pushToast({ type: 'warning', title: 'Đã khóa shop', message: `${partner.shopName} đã bị khóa.` })
    } catch (error) {
      pushToast({ type: 'error', title: 'Không thể tạm ngưng', message: error?.message || 'Lỗi không xác định' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <AdminLayout>
      <header className="flex items-center justify-between gap-4">
        <div>
          <h2 className="font-h2 text-h2 text-primary">Chi tiết đối tác</h2>
          <p className="text-main/70">Thông tin vận hành và trạng thái hợp tác của shop.</p>
          <AdminHeaderNav />
        </div>
        <Link to="/admin/partners" className="px-4 py-2 rounded-xl bg-slate-100 text-main/70 font-bold hover:bg-slate-200">Quay lại</Link>
      </header>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <article className="glass-card bg-white rounded-3xl p-6 xl:col-span-2 space-y-4">
          <h4 className="font-h3 text-h3 text-primary">{partner.shopName}</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <p><span className="text-main/60">Mã đối tác:</span> <b>{partner.id}</b></p>
            <p><span className="text-main/60">Chủ shop:</span> <b>{partner.owner}</b></p>
            <p><span className="text-main/60">Số điện thoại:</span> <b>{partner.phone}</b></p>
            <p><span className="text-main/60">Khu vực:</span> <b>{partner.district}</b></p>
            <p><span className="text-main/60">Gói:</span> <b>{partner.plan}</b></p>
            <p><span className="text-main/60">Ngày tham gia:</span> <b>{new Date(partner.joinedAt).toLocaleDateString('vi-VN')}</b></p>
          </div>
        </article>

        <article className="glass-card bg-white rounded-3xl p-6 space-y-3">
          <h4 className="font-h3 text-h3 text-primary">Chỉ số nhanh</h4>
          <p className="text-sm text-main/70">Đánh giá: <b className="text-primary">{partner.rating ? `${partner.rating}/5` : '—'}</b></p>
          <p className="text-sm text-main/70">Booking/tháng: <b className="text-primary">{partner.monthlyBookings}</b></p>
          <p className="text-sm text-main/70">Ví LumiX: <b className="text-primary">{formatVnd(partner.wallet)}</b></p>
          <p className="text-sm text-main/70">Trạng thái hiện tại: <b className="text-primary">{status}</b></p>
          <div className="pt-2 flex gap-2">
            <button type="button" disabled={saving} className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-white font-bold disabled:opacity-60" onClick={activate}>Kích hoạt</button>
            <button type="button" disabled={saving} className="flex-1 px-4 py-2.5 rounded-xl bg-slate-100 text-main/70 font-bold disabled:opacity-60" onClick={suspend}>Tạm ngưng</button>
          </div>
        </article>
      </section>
    </AdminLayout>
  )
}
