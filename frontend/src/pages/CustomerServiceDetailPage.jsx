import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useShop } from '../context/ShopContext'
import CustomerHeader from '../components/customer/CustomerHeader'

export default function CustomerServiceDetailPage() {
  const { slug, serviceId } = useParams()
  const { shop, services, loadPublicShop } = useShop()

  useEffect(() => {
    if (!slug) return
    loadPublicShop(slug).catch(() => {})
  }, [slug, loadPublicShop])

  const service = (services || []).find((s) => String(s.id || s._id) === String(serviceId))
  const bookUrl = `/${slug || shop.slug}/book`

  if (!service) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="text-center">
          <h2 className="text-xl font-bold">Dịch vụ không tìm thấy</h2>
          <p className="mt-2 text-main/70">Vui lòng quay lại trang trước hoặc chọn dịch vụ khác.</p>
          <div className="mt-4">
            <Link to={`/${slug || shop.slug}`} className="px-4 py-2 rounded-xl border">Quay lại</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10">
      <CustomerHeader />
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow p-6">
        <div className="grid md:grid-cols-2 gap-6">
          <img src={service.imageUrl} alt={service.name} className="w-full h-64 object-cover rounded-xl" />
          <div>
            <h1 className="text-2xl font-black text-primary">{service.name}</h1>
            <p className="text-amber-700 font-bold mt-2">{Number(service.priceVnd || 0).toLocaleString('vi-VN')}₫</p>
            <p className="text-sm text-main/70 mt-4">{service.shortDescription || service.description}</p>
            <p className="text-sm text-main/70 mt-2">Thời gian: {service.durationMinutes || '?'} phút</p>

            <div className="mt-6 flex gap-3">
              <Link to={bookUrl} className="px-6 py-3 rounded-xl bg-primary text-white font-bold">Đặt lịch</Link>
              <Link to={`/${slug || shop.slug}`} className="px-6 py-3 rounded-xl border">Quay lại</Link>
            </div>
          </div>
        </div>

        <section className="mt-6">
          <h3 className="font-bold text-lg">Mô tả chi tiết</h3>
          <p className="text-main/70 mt-2 whitespace-pre-line">{service.detailedDescription || 'Shop chưa cập nhật mô tả chi tiết cho dịch vụ này.'}</p>
        </section>
      </div>
    </div>
  )
}
