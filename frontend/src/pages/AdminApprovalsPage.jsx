import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AdminHeaderNav from '../components/admin/AdminHeaderNav'
import AdminLayout from '../components/admin/AdminLayout'
import { useToast } from '../components/ui/ToastProvider'
import { useShop } from '../context/ShopContext'
import { apiRequest } from '../lib/api'

function kycBadge(status) {
  return status === 'verified' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
}

function mapPendingShop(item) {
  return {
    id: item?._id || item?.id || '',
    shopName: item?.name || '—',
    owner: item?.ownerName || 'Chưa cập nhật',
    phone: item?.phone || '',
    district: item?.address?.district || item?.address?.city || 'Chưa cập nhật',
    kycStatus: item?.kycStatus || 'pending',
    submittedAt: item?.createdAt || new Date().toISOString(),
    servicesCount: Number(item?.stats?.servicesCount || 0),
    staffCount: Number(item?.stats?.staffCount || 0)
  }
}

export default function AdminApprovalsPage() {
  const { token } = useShop()
  const { pushToast } = useToast()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!token) return
    let mounted = true
    const run = async () => {
      setLoading(true)
      try {
        const res = await apiRequest('/api/admin/shops?status=pending', { token })
        if (!mounted) return
        setItems((res?.items || []).map(mapPendingShop))
      } catch (error) {
        pushToast({ type: 'error', title: 'Không tải được danh sách chờ duyệt', message: error?.message || 'Lỗi không xác định' })
      } finally {
        if (mounted) setLoading(false)
      }
    }
    run()
    return () => { mounted = false }
  }, [token, pushToast])

  const requestMore = (item) => {
    pushToast({ type: 'warning', title: 'Đã ghi nhận', message: `Đã tạo yêu cầu bổ sung hồ sơ cho ${item.shopName}.` })
  }

  return (
    <AdminLayout>
      <header className="flex flex-col md:flex-row justify-between gap-4">
        <div>
          <h2 className="font-h2 text-h2 text-primary">Duyệt onboarding shop</h2>
          <p className="text-main/70">Kiểm tra hồ sơ, KYC và mức độ sẵn sàng trước khi kích hoạt đối tác.</p>
          <AdminHeaderNav />
        </div>
      </header>

      {loading ? <p className="text-sm text-main/60">Đang tải danh sách chờ duyệt...</p> : null}

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {items.map((item) => (
          <article key={item.id} className="glass-card bg-white rounded-3xl p-6 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h4 className="font-h3 text-h3 text-primary">{item.shopName}</h4>
                <p className="text-sm text-main/60">{item.owner} • {item.phone}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${kycBadge(item.kycStatus)}`}>
                {item.kycStatus === 'verified' ? 'KYC đạt' : 'KYC chờ'}
              </span>
            </div>
            <div className="space-y-2 text-sm text-main/70">
              <p>Khu vực: <b className="text-main">{item.district}</b></p>
              <p>Gửi hồ sơ lúc: <b className="text-main">{new Date(item.submittedAt).toLocaleString('vi-VN')}</b></p>
              <p>Dịch vụ đã khai báo: <b className="text-main">{item.servicesCount}</b></p>
              <p>Nhân sự đã khai báo: <b className="text-main">{item.staffCount}</b></p>
            </div>
            <div className="flex gap-2 pt-2">
              <Link to={`/admin/approvals/${item.id}`} className="flex-1 px-4 py-3 rounded-xl bg-primary text-white font-bold text-center">Xem hồ sơ</Link>
              <button type="button" className="flex-1 px-4 py-3 rounded-xl bg-slate-100 text-main/70 font-bold" onClick={() => requestMore(item)}>Yêu cầu bổ sung</button>
            </div>
          </article>
        ))}
        {!loading && items.length === 0 ? <p className="text-sm text-main/60">Không có shop nào đang chờ duyệt.</p> : null}
      </section>
    </AdminLayout>
  )
}
