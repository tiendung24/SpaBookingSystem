import RegisterForm from '../components/shop/RegisterForm';
import LumiXLogo from '../assets/lumix-logo.png';

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-white font-body-md text-main overflow-x-hidden bg-3d-elements">
      <main className="min-h-screen flex flex-col md:flex-row">
        <section className="w-full md:w-7/12 lg:w-1/2 flex flex-col justify-center px-6 md:px-10 py-12 md:py-16 relative z-10">
          <div className="max-w-[620px] mx-auto w-full">
            <div className="flex items-center gap-3 mb-8">
              <img src={LumiXLogo} alt="LumiX Logo" className="h-14 w-auto" />
              <span className="font-headline-lg text-headline-lg text-primary tracking-tight">LumiX Partner</span>
            </div>

            <RegisterForm />

            <footer className="mt-8 pt-6 border-t border-gray-200/80 flex flex-wrap justify-center gap-6">
              <a className="font-body-sm text-body-sm text-main hover:text-primary transition-colors" href="#">Điều khoản</a>
              <a className="font-body-sm text-body-sm text-main hover:text-primary transition-colors" href="#">Chính sách bảo mật</a>
              <a className="font-body-sm text-body-sm text-main hover:text-primary transition-colors" href="#">Hỗ trợ 24/7</a>
            </footer>
          </div>
        </section>

        <section className="hidden md:flex md:w-5/12 lg:w-1/2 bg-[#f5f9fb] relative items-center justify-center overflow-hidden">
          <div className="absolute inset-0">
            <img src="https://file.hstatic.net/200000827051/article/hinh-anh-goi-dau-duong-sinh_12_65344a182040435dae6ec3ba33e80b86.jpg" alt="LumiX Partner" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-slate-900/40" />
          </div>
          <div className="absolute top-[-10%] right-[-10%] w-[420px] h-[420px] bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-[-5%] left-[-5%] w-[320px] h-[320px] bg-tertiary/10 rounded-full blur-3xl" />

          <div className="relative z-10 w-full max-w-[520px] px-10 text-white">
            <div className="glass-card rounded-3xl p-6 bg-white/10 border border-white/20 backdrop-blur-xl">
              <p className="text-xs uppercase tracking-[0.3em] text-white/70">LumiX Partner</p>
              <h2 className="mt-3 text-3xl font-black leading-tight">Nâng tầm quản lý Spa & Salon</h2>
              <div className="mt-6 space-y-3 text-sm text-white/90">
                <p>• Hệ thống đặt lịch tự động tối ưu thời gian trống.</p>
                <p>• Quản lý nhân viên, lịch làm việc và hoa hồng dễ dàng.</p>
                <p>• Tham gia cùng hơn 5,000+ tiệm đã thành công.</p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
