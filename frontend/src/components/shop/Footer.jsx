import React from 'react';

export default function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 w-full py-20">
      <div className="max-w-7xl mx-auto px-4 md:px-10 flex flex-col gap-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="col-span-1 md:col-span-1">
            <a href="#" className="text-2xl font-h3 gradient-text mb-8 block">LumiX Partner</a>
            <p className="font-body-sm text-body-sm text-main mb-8 leading-relaxed">
              Nâng tầm giá trị ngành làm đẹp Việt Nam thông qua công nghệ hiện đại và giải pháp vận hành thông minh.
            </p>
          </div>

          <div>
            <h4 className="font-label-bold text-label-bold text-main mb-8 uppercase tracking-widest">Giải pháp</h4>
            <ul className="space-y-5 font-body-sm text-body-sm text-main">
              <li><a href="#" className="hover:text-primary transition-colors">Quản lý Spa</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Quản lý Salon Nail</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Skincare Clinic</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Quảng cáo LumiX Ads</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-label-bold text-label-bold text-main mb-8 uppercase tracking-widest">Công ty</h4>
            <ul className="space-y-5 font-body-sm text-body-sm text-main">
              <li><a href="#" className="hover:text-primary transition-colors">Về chúng tôi</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Tuyển dụng</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Tin tức</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Đối tác</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-label-bold text-label-bold text-main mb-8 uppercase tracking-widest">Liên hệ</h4>
            <ul className="space-y-5 font-body-sm text-body-sm text-main">
              <li className="flex gap-3"><span className="material-symbols-outlined text-primary text-[20px]">location_on</span><span>Tòa nhà LumiX, Quận 1, TP. Hồ Chí Minh</span></li>
              <li className="flex gap-3"><span className="material-symbols-outlined text-primary text-[20px]">call</span><span>1900 1234 (Miễn phí)</span></li>
              <li className="flex gap-3"><span className="material-symbols-outlined text-primary text-[20px]">mail</span><span>contact@lumix.vn</span></li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center gap-6 pt-10 border-t border-gray-200">
          <p className="font-body-sm text-body-sm text-main">© 2024 LumiX Partner. Nền tảng quản lý Spa & Salon hàng đầu Việt Nam.</p>
          <div className="flex gap-8">
            <a href="#" className="font-label-bold text-label-bold text-main hover:text-primary transition-colors">Điều khoản</a>
            <a href="#" className="font-label-bold text-label-bold text-main hover:text-primary transition-colors">Bảo mật</a>
            <a href="#" className="font-label-bold text-label-bold text-main hover:text-primary transition-colors">Hướng dẫn</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
