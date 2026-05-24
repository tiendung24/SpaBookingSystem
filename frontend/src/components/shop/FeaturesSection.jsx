import React from 'react';

export default function FeaturesSection() {
  return (
    <section className="py-24 px-4 md:px-10 max-w-7xl mx-auto" id="features">
      <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
        <div className="max-w-2xl text-left">
          <h2 className="font-h2 text-[40px] leading-tight text-main mb-4">
            LumiX giúp shop vận hành gọn gàng hơn
          </h2>
          <p className="font-body-lg text-body-lg text-main">
            Hệ sinh thái tính năng toàn diện, thiết kế riêng cho đặc thù ngành làm đẹp.
          </p>
        </div>
        <button className="glass-card text-primary font-label-bold text-label-bold px-8 py-4 rounded-2xl flex items-center gap-2 hover:bg-gray-50 transition-all border border-primary/20">
          Khám phá tất cả <span className="material-symbols-outlined">arrow_forward</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 h-auto md:h-[900px]">
        <div className="md:col-span-8 glass-card rounded-[40px] p-12 flex flex-col justify-between overflow-hidden relative group float-3d">
          <div className="max-w-md relative z-10">
            <h3 className="font-h1 text-[42px] gradient-text mb-6">Quản lý lịch hẹn</h3>
            <p className="font-body-lg text-body-lg text-main">
              Đặt lịch nhanh chóng, tự động sắp xếp thợ và phòng dịch vụ. Giảm đáng kể tình trạng trùng lịch.
            </p>
          </div>
          <div className="mt-12 relative">
            <img
              alt="3D Booking Interface"
              className="rounded-3xl shadow-2xl transform translate-y-12 group-hover:translate-y-4 transition-transform duration-700"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAhZPuRS9lR929edIpT-QARJ2GD8rB9R7-t-9EW3mxukDZ2PcN95vmTw5tyZ5IzWFwU2iQWtv4NAkd0ZdkO0ByuoZAZfuU7NCoJwd8LSqdVK4CIDAZ34pxqpa0a6UZIU9KR8YlWGTAKUo92CCq1WolcdDmOs7HzR7PK5xDwWo_rU5-3c-h-aykMozPrRcmk4fRseWuYkGA8M9gKDlSfwQcySF-gcaVs2X3i6tw79jjxVv79WyyeJYdZT4kjDauSsSCPjbGtA7R3PtHr"
            />
          </div>
        </div>

        <div className="md:col-span-4 bg-gradient-to-br from-[#cb8d56] to-[#865221] rounded-[40px] p-10 flex flex-col float-3d shadow-2xl border border-white/20">
          <div className="w-20 h-20 bg-white/10 rounded-3xl flex items-center justify-center mb-10 shadow-inner">
            <span className="material-symbols-outlined text-[48px] text-white" style={{ fontVariationSettings: "'FILL' 1" }}>
              payments
            </span>
          </div>
          <h3 className="font-h2 text-[32px] text-main mb-4">Thu ngân siêu tốc</h3>
          <p className="font-body-md text-body-md text-main">
            Tích hợp thanh toán QR, thẻ và tiền mặt. Xuất hóa đơn chuyên nghiệp chỉ trong vài giây.
          </p>
          <div className="mt-auto">
            <div className="p-6 glass-card border-white/20 rounded-3xl">
              <div className="flex justify-between items-center mb-4">
                <span className="font-label-bold text-white/80">Tổng bill</span>
                <span className="text-2xl font-bold text-white">1.250.000đ</span>
              </div>
              <div className="h-2 bg-white/20 rounded-full w-full overflow-hidden">
                <div className="h-full bg-white w-2/3"></div>
              </div>
            </div>
          </div>
        </div>

        <div className="md:col-span-4 glass-card rounded-[40px] p-10 flex flex-col float-3d">
          <div className="w-20 h-20 bg-primary/20 rounded-3xl flex items-center justify-center mb-10">
            <span className="material-symbols-outlined text-[48px] text-primary">campaign</span>
          </div>
          <h3 className="font-h2 text-[32px] text-main mb-4">Quảng cáo thông minh</h3>
          <p className="font-body-md text-body-md text-main">
            Tiếp cận khách hàng mới xung quanh khu vực shop với các gói marketing phù hợp từ LumiX.
          </p>
        </div>

        <div className="md:col-span-8 glass-card rounded-[40px] p-12 grid md:grid-cols-2 gap-10 overflow-hidden group float-3d">
          <div className="flex flex-col justify-center">
            <h3 className="font-h2 text-[36px] text-main mb-6">Báo cáo &amp; Phân tích</h3>
            <p className="font-body-md text-body-md text-main leading-relaxed">
              Theo dõi doanh thu, chi phí và hiệu suất nhân viên theo thời gian thực với dữ liệu trực quan, dễ đọc.
            </p>
            <ul className="mt-6 space-y-3 text-main">
              <li><span className="material-symbols-outlined text-primary text-2xl align-middle">check_circle</span> Doanh thu theo thợ</li>
              <li><span className="material-symbols-outlined text-primary text-2xl align-middle">check_circle</span> Tỷ lệ khách quay lại</li>
              <li><span className="material-symbols-outlined text-primary text-2xl align-middle">check_circle</span> Hiệu quả từng dịch vụ</li>
            </ul>
          </div>
          <div className="flex items-center justify-center">
            <div className="w-full h-full min-h-[260px] rounded-3xl bg-gradient-to-br from-primary/10 to-secondary/10 border border-primary/10 flex items-center justify-center text-primary/60">
              <span className="material-symbols-outlined text-[88px]">monitoring</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
