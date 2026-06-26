import { useState } from 'react'
import { Link } from 'react-router-dom'
import LumiXLogo from '../../assets/lumix-logo.png'
import { useShop } from '../../context/ShopContext'

export default function TopNavBar() {
  const { isAuthenticated, role, user, logout } = useShop()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const currentPath = typeof window !== 'undefined' ? window.location.pathname || '' : ''
  const isPublicShopPath = /^\/[^/]+(\/book(\/time|\/pay)?)?$/.test(currentPath)

  const closeMenu = () => setMobileMenuOpen(false)

  return (
    <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-xl border-b border-[#14677a]/10 shadow-sm transition-all duration-300">
      <nav className="flex justify-between items-center px-4 md:px-10 py-3 md:py-4 max-w-[1440px] mx-auto">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <img src={LumiXLogo} alt="LumiX Logo" className="h-12 w-auto" />
            <span className="text-xl font-bold text-[#14677a] hidden sm:inline" style={{ fontFamily: 'Quicksand, sans-serif' }}>Partner</span>
          </Link>
          <div className="hidden md:flex gap-6">
            <a href="#features" className="text-[#14677a] font-bold border-b-2 border-[#14677a] pb-1">
              Tính năng
            </a>
            <a href="#pricing" className="text-gray-600 hover:text-[#14677a] font-semibold transition-colors">
              Bảng giá
            </a>
            <a href="#faq" className="text-gray-600 hover:text-[#14677a] font-semibold transition-colors">
              Hỗ trợ
            </a>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-4">
          {isPublicShopPath || !isAuthenticated || role !== 'shop' ? (
            <>
              <Link to="/login" className="text-[#14677a] border border-[#14677a] font-bold px-5 py-2 rounded-full hover:bg-[#14677a]/5 transition-all duration-300">
                Đăng nhập
              </Link>
              <Link to="/register" className="bg-[#14677a] text-white font-bold px-6 py-2 rounded-full hover:brightness-110 shadow-md transition-all active:scale-95">
                Đăng ký ngay
              </Link>
            </>
          ) : (
            <>
              <Link to="/shop/dashboard" className="px-4 py-2 rounded-xl bg-white/80 border border-primary/10 hover:bg-white font-label-bold text-label-bold">
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

        <div className="md:hidden relative">
          <button
            type="button"
            className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-primary/15 bg-white/80 text-primary active:scale-95 transition"
            onClick={() => setMobileMenuOpen((open) => !open)}
            aria-label="Mở menu"
          >
            <span className="material-symbols-outlined">{mobileMenuOpen ? 'close' : 'menu'}</span>
          </button>

          {mobileMenuOpen ? (
            <div className="absolute right-0 top-[52px] w-[260px] rounded-2xl bg-white border border-primary/10 shadow-2xl p-3 z-50">
              <a href="#features" onClick={closeMenu} className="block px-3 py-2 rounded-xl text-main hover:bg-primary/5 font-label-bold">
                Tính năng
              </a>
              <a href="#pricing" onClick={closeMenu} className="block px-3 py-2 rounded-xl text-main hover:bg-primary/5 font-label-bold">
                Bảng giá
              </a>
              <a href="#faq" onClick={closeMenu} className="block px-3 py-2 rounded-xl text-main hover:bg-primary/5 font-label-bold">
                Hỗ trợ
              </a>
              <div className="h-px bg-slate-100 my-2" />
              {isPublicShopPath || !isAuthenticated || role !== 'shop' ? (
                <>
                  <Link to="/login" onClick={closeMenu} className="block px-3 py-2 rounded-xl text-main hover:bg-primary/5 font-label-bold">
                    Đăng nhập
                  </Link>
                  <Link to="/register" onClick={closeMenu} className="block text-center mt-2 bg-[#5ea4b8] text-white font-label-bold px-4 py-3 rounded-xl hover:brightness-110">
                    Đăng ký ngay
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/shop/dashboard" onClick={closeMenu} className="block px-3 py-2 rounded-xl text-main hover:bg-primary/5 font-label-bold">
                    Khu quản trị
                  </Link>
                  <button type="button" onClick={() => { closeMenu(); logout() }} className="w-full text-left px-3 py-2 rounded-xl text-rose-600 hover:bg-primary/5 font-label-bold">
                    Đăng xuất
                  </button>
                </>
              )}
            </div>
          ) : null}
        </div>
      </nav>
    </header>
  )
}
