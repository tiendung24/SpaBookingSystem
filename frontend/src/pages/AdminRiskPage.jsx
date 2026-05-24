import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AdminHeaderNav from '../components/admin/AdminHeaderNav'
import AdminLayout from '../components/admin/AdminLayout'
import { useToast } from '../components/ui/ToastProvider'
import { useShop } from '../context/ShopContext'
import { apiRequest } from '../lib/api'

function levelClass(level) {
  if (level === 'high') return 'bg-rose-100 text-rose-700'
  if (level === 'medium') return 'bg-amber-100 text-amber-700'
  return 'bg-slate-100 text-slate-700'
}

function levelLabel(level) {
  if (level === 'high') return 'Cao'
  if (level === 'medium') return 'Trung bình'
  return 'Thấp'
}

function mapFraud(item) {
  return {
    id: item?._id || item?.id || '',
    shopName: item?.shopName || item?.shopId || 'Chưa rõ shop',
    type: item?.reason || item?.type || 'Báo cáo gian lận',
    metric: item?.metric || item?.evidence || '-',
    level: item?.severity || 'medium',
    createdAt: item?.createdAt || new Date().toISOString()
  }
}

export default function AdminRiskPage() {
  const { token } = useShop()
  const { pushToast } = useToast()
  const [incidents, setIncidents] = useState([])
  const [followedIds, setFollowedIds] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!token) return
    let mounted = true
    const run = async () => {
      setLoading(true)
      try {
        const res = await apiRequest('/api/admin/fraud-reports', { token })
        if (!mounted) return
        setIncidents((res?.items || []).map(mapFraud))
      } catch (error) {
        pushToast({ type: 'error', title: 'Không tải được rủi ro', message: error?.message || 'Lỗi không xác định' })
      } finally {
        if (mounted) setLoading(false)
      }
    }
    run()
    return () => { mounted = false }
  }, [token, pushToast])

  const toggleFollow = (incident) => {
    const isFollowed = followedIds.includes(incident.id)
    setFollowedIds((prev) => (isFollowed ? prev.filter((item) => item !== incident.id) : [...prev, incident.id]))
    pushToast({ type: isFollowed ? 'info' : 'warning', title: isFollowed ? 'Đã bỏ theo dõi' : 'Đã đánh dấu theo dõi', message: `${incident.shopName} - ${incident.type}` })
  }

  return (
    <AdminLayout>
      <header className="flex flex-col md:flex-row justify-between gap-4">
        <div>
          <h2 className="font-h2 text-h2 text-primary">Giám sát rủi ro</h2>
          <p className="text-main/70">Theo dõi các incident bất thường và xử lý gian lận theo chính sách hệ thống.</p>
          <AdminHeaderNav />
        </div>
      </header>

      {loading ? <p className="text-sm text-main/60">Đang tải danh sách rủi ro...</p> : null}

      <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {incidents.map((incident) => {
          const followed = followedIds.includes(incident.id)
          return (
            <article key={incident.id} className="glass-card bg-white rounded-3xl p-6 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="font-h3 text-h3 text-primary">{incident.shopName}</h4>
                  <p className="text-sm text-main/60">{incident.type}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${levelClass(incident.level)}`}>{levelLabel(incident.level)}</span>
              </div>
              <div className="space-y-2 text-sm text-main/70">
                <p>Metric: <b className="text-main">{incident.metric}</b></p>
                <p>Thời điểm: <b className="text-main">{new Date(incident.createdAt).toLocaleString('vi-VN')}</b></p>
              </div>
              <div className="flex gap-2 pt-2">
                <Link to={`/admin/risk/${incident.id}`} className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-white font-bold text-center">Điều tra</Link>
                <button type="button" className={`flex-1 px-4 py-2.5 rounded-xl font-bold ${followed ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-main/70'}`} onClick={() => toggleFollow(incident)}>
                  {followed ? 'Đang theo dõi' : 'Đánh dấu theo dõi'}
                </button>
              </div>
            </article>
          )
        })}
        {!loading && incidents.length === 0 ? <p className="text-sm text-main/60">Chưa có báo cáo rủi ro.</p> : null}
      </section>
    </AdminLayout>
  )
}
