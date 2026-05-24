import { Link } from 'react-router-dom';
import LumiXLogo from '../../assets/lumix-logo.png';

export default function TopNavBar() {
  return (
    <header className="fixed top-0 w-full z-50 glass-card !border-x-0 !border-t-0 rounded-none">
      <nav className="flex justify-between items-center px-4 md:px-10 py-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <img src={LumiXLogo} alt="LumiX Logo" className="h-12 w-auto" />
            <span className="text-lg font-bold text-main hidden sm:inline">Partner</span>
          </Link>
          <div className="hidden md:flex gap-6">
            <a href="#features" className="text-primary font-bold border-b-2 border-primary pb-1 font-label-bold text-label-bold">
              Tính năng
            </a>
            <a href="#pricing" className="text-main hover:text-primary transition-colors font-label-bold text-label-bold">
              Bảng giá
            </a>
            <a href="#faq" className="text-main hover:text-primary transition-colors font-label-bold text-label-bold">
              Hỗ trợ
            </a>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/login" className="hidden md:block text-main hover:bg-gray-100 transition-all duration-300 font-label-bold text-label-bold px-4 py-2 rounded-xl">
            Đăng nhập
          </Link>
          <Link to="/register" className="bg-[#5ea4b8] text-white font-label-bold text-label-bold px-6 py-2.5 rounded-xl cta-3d hover:brightness-110">
            Đăng ký ngay
          </Link>
        </div>
      </nav>
    </header>
  );
}
