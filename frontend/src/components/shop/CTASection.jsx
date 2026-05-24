import { Link } from 'react-router-dom'

export default function CTASection() {
  return (
    <section className="py-20 px-4 md:px-10 max-w-7xl mx-auto">
      <div className="rounded-3xl bg-[#0f3f4a] text-white p-10 text-center">
        <h3 className="font-h2 text-h2 mb-4">Bắt đầu nâng tầm shop của bạn ngay hôm nay</h3>
        <p className="text-white/80 mb-8">Tham gia cộng đồng chủ shop thông thái và vận hành gọn gàng hơn với LumiX.</p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link to="/register" className="bg-white text-[#14677a] font-bold text-lg px-8 py-4 rounded-2xl">Bắt đầu dùng thử miễn phí</Link>
          <Link to="/login" className="border border-white/40 text-white font-bold text-lg px-8 py-4 rounded-2xl">Liên hệ tư vấn</Link>
        </div>
      </div>
    </section>
  )
}
