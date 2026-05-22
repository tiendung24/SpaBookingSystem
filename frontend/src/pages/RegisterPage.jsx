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
          <div className="absolute top-[-10%] right-[-10%] w-[420px] h-[420px] bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-[-5%] left-[-5%] w-[320px] h-[320px] bg-tertiary/10 rounded-full blur-3xl" />

          <div className="relative z-10 w-full max-w-[520px] px-10 text-center">
            <div className="floating-object">
              <div className="glass-card rounded-3xl p-6 mb-6">
                <div className="bg-white/60 rounded-2xl p-4 border border-white/70 shadow-sm mb-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-primary/20" />
                    <div className="space-y-2">
                      <div className="h-2.5 w-24 bg-primary/25 rounded" />
                      <div className="h-2 w-14 bg-primary/15 rounded" />
                    </div>
                  </div>
                  <div className="grid grid-cols-7 gap-2 mb-4">
                    {[...Array(7)].map((_, idx) => (
                      <div key={idx} className={`h-7 rounded-md ${idx === 3 ? 'bg-primary/30' : 'bg-primary/10'}`} />
                    ))}
                  </div>
                  <div className="space-y-2">
                    {[...Array(2)].map((_, idx) => (
                      <div key={idx} className="h-10 bg-white/70 rounded-lg flex items-center justify-between px-3 border border-primary/10">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${idx === 0 ? 'bg-primary' : 'bg-primary/50'}`} />
                          <div className="h-2 w-20 bg-slate-400/30 rounded" />
                        </div>
                        <div className="h-2 w-10 bg-slate-400/30 rounded" />
                      </div>
                    ))}
                  </div>
                </div>
                <h3 className="font-headline-md text-headline-md text-primary mb-2">Tăng 40% doanh thu</h3>
                <p className="font-body-md text-body-md text-main">
                  Hệ thống đặt lịch tự động giúp bạn tối ưu thời gian và giảm thiểu tình trạng bỏ lỡ khách hàng.
                </p>
              </div>
            </div>

            <div className="glass-card rounded-2xl p-5">
              <p className="font-body-sm text-body-sm text-main">
                Tham gia cùng hơn <span className="font-bold text-primary">5,000+</span> tiệm đã thành công cùng LumiX.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
