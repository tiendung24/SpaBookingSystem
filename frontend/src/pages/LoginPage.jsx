import { Link } from 'react-router-dom'
import LoginForm from '../components/shop/LoginForm';
import LumiXLogo from '../assets/lumix-logo.png';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row font-body-md text-main">
      {/* Left Column: Branding / Image (Hidden on small screens) */}
      <div className="hidden md:flex md:w-1/2 relative bg-primary items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center" 
          style={{ backgroundImage: "url('https://file.hstatic.net/200000827051/article/hinh-anh-goi-dau-duong-sinh_12_65344a182040435dae6ec3ba33e80b86.jpg')" }}
        ></div>
        <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
        
        <div className="relative z-20 p-12 text-white max-w-lg text-center floating-object" style={{ animationDuration: '8s' }}>
          <div className="bg-black/30 backdrop-blur-md p-8 rounded-3xl border border-white/20 shadow-[0_30px_60px_rgba(0,0,0,0.3)]">
            <h1 className="text-4xl lg:text-5xl font-bold mb-4">LumiX</h1>
            <p className="text-xl font-medium opacity-90 mb-6">Hệ sinh thái làm đẹp thông minh</p>
            <p className="opacity-80">Trải nghiệm đặt lịch, quản lý chuyên nghiệp và nâng tầm dịch vụ của bạn chỉ với một chạm.</p>
          </div>
        </div>
      </div>

      {/* Right Column: Form */}
      <div className="w-full md:w-1/2 flex flex-col justify-between bg-white relative">
        {/* Abstract 3D shape decorations */}
        <div className="absolute top-[-5%] right-[-10%] w-[300px] h-[300px] bg-primary/5 rounded-full blur-[80px] pointer-events-none"></div>
        <div className="absolute bottom-[10%] left-[-10%] w-[250px] h-[250px] bg-tertiary/10 rounded-full blur-[60px] pointer-events-none"></div>

        {/* Header (Mobile Logo) */}
        <header className="p-6 md:p-10 flex items-center justify-between z-10">
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <img src={LumiXLogo} alt="LumiX Logo" className="h-12 w-auto" />
          </Link>
          <a className="text-sm font-semibold text-main hover:text-primary transition-colors" href="#">
            Trợ giúp
          </a>
        </header>

        {/* Form Container */}
        <main className="flex-grow flex items-center justify-center p-6 md:p-12 z-10">
          <div className="w-full max-w-md">
            <LoginForm />
          </div>
        </main>

        {/* Footer */}
        <footer className="p-6 md:p-10 text-center text-xs text-gray-500 z-10">
          © 2026 LumiX. Mọi bản quyền được bảo lưu.
        </footer>
      </div>
    </div>
  );
}


