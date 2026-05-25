import { Link } from 'react-router-dom'
import LumiXLogo from '../../assets/lumix-logo.png'
import { useShop } from '../../context/ShopContext'

export default function TopNavBar() {
  const { isAuthenticated, role, user, logout } = useShop()

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
          {!isAuthenticated || role !== 'shop' ? (
            <>
              <Link to="/login" className="hidden md:block text-main hover:bg-gray-100 transition-all duration-300 font-label-bold text-label-bold px-4 py-2 rounded-xl">
                Đăng nhập
              </Link>
              <Link to="/register" className="bg-[#5ea4b8] text-white font-label-bold text-label-bold px-6 py-2.5 rounded-xl cta-3d hover:brightness-110">
                Đăng ký ngay
              </Link>
            </>
          ) : (
            <>
              <Link to="/shop/dashboard" className="hidden md:block px-4 py-2 rounded-xl bg-white/80 border border-primary/10 hover:bg-white font-label-bold text-label-bold">
                Khu quản trị
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold">
                  {user?.fullName?.charAt(0)?.toUpperCase() || user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <button onClick={logout} className="text-main/70 hover:text-primary">Đăng xuất</button>
              </div>
            </>
          )}
        </div>
      </nav>
    </header>
  )
}
