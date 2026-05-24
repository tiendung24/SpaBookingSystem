
import { Link } from 'react-router-dom'
import LoginForm from '../components/shop/LoginForm';
import LumiXLogo from '../assets/lumix-logo.png';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-white font-body-md text-main flex flex-col overflow-x-hidden bg-3d-elements">
      {/* Background 3D Decorations */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] bg-primary/10 rounded-full blur-[100px] floating-object" style={{ animationDelay: '0s' }}></div>
        <div className="absolute bottom-[-5%] left-[-5%] w-[300px] h-[300px] bg-tertiary/10 rounded-full blur-[80px] floating-object" style={{ animationDelay: '-2s' }}></div>
        {/* Abstract 3D shapes */}
        <div className="absolute top-1/4 left-10 w-24 h-24 glass-card rounded-3xl opacity-30 floating-object hidden md:block" style={{ animationDelay: '-1s' }}></div>
        <div className="absolute bottom-1/4 right-20 w-32 h-32 glass-card rounded-full opacity-20 floating-object" style={{ animationDelay: '-3.5s' }}></div>
      </div>

      {/* Header */}
      <header className="relative z-10 w-full px-10 h-20 flex items-center justify-between border-b border-gray-200">
        <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <img src={LumiXLogo} alt="LumiX Logo" className="h-16 w-auto" />
        </Link>
        <div className="hidden md:block">
          <a className="text-main font-medium hover:text-primary transition-colors font-body-md text-body-md" href="#">
            Hỗ trợ
          </a>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-grow flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-[480px] flex flex-col items-center">
          <LoginForm />
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full border-t border-gray-200 bg-gray-50 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center px-10 max-w-7xl mx-auto gap-4">
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <img src={LumiXLogo} alt="LumiX Logo" className="h-12 w-auto" />
          </Link>
          <div className="flex flex-wrap justify-center gap-6">
            <a className="font-body-md text-body-md text-main hover:text-primary transition-colors" href="#">
              Điều khoản dịch vụ
            </a>
            <a className="font-body-md text-body-md text-main hover:text-primary transition-colors" href="#">
              Chính sách bảo mật
            </a>
            <a className="font-body-md text-body-md text-main hover:text-primary transition-colors" href="#">
              Liên hệ
            </a>
          </div>
          <div className="font-body-md text-body-md text-main text-center md:text-right">
            © 2024 LumiX Partner. Elevating the beauty ecosystem.
          </div>
        </div>
      </footer>
    </div>
  );
}


