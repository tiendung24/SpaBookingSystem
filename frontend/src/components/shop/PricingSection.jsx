export default function PricingSection() {
  return (
    <section id="pricing" className="py-20 px-4 md:px-10 max-w-7xl mx-auto">
      <div className="text-center mb-12">
        <h2 className="font-h2 text-[40px] text-main mb-4">Mô hình thanh toán đơn giản và minh bạch</h2>
        <p className="text-main/70">Chỉ trả phí khi có booking thành công. Không phí ẩn, không cam kết dài hạn.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="glass-card p-8 rounded-3xl">
          <span className="text-primary font-label-bold text-label-bold mb-6 tracking-widest block">CƠ BẢN</span>
          <h3 className="font-h1 text-[40px] text-main mb-2">Miễn phí cài đặt</h3>
          <p className="text-main/70 mb-6">Chỉ trả theo booking hoàn thành.</p>
          <ul className="space-y-3 text-main">
            <li>Phí 10.000đ / booking hoàn thành</li>
            <li>Không giới hạn dịch vụ</li>
            <li>Không giới hạn nhân viên</li>
            <li>Quản lý lịch hẹn thời gian thực</li>
          </ul>
        </div>

        <div className="bg-[#0f3f4a] text-white p-8 rounded-3xl shadow-xl">
          <span className="text-white/70 font-label-bold text-label-bold mb-6 uppercase tracking-widest block">NÂNG CAO</span>
          <h3 className="font-h1 text-[40px] mb-2">10.000đ/booking</h3>
          <p className="text-white/70 mb-6">Bao gồm các tính năng quan trọng để vận hành an toàn.</p>
          <ul className="space-y-3">
            <li>Escrow system bảo vệ tiền cọc</li>
            <li>Bật/tắt cọc thông minh</li>
            <li>Quản lý ví ảo và nạp tiền QR</li>
            <li>Tự động khóa khi ví = 0</li>
          </ul>
        </div>
      </div>
    </section>
  )
}
