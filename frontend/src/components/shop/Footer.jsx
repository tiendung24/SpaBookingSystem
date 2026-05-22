import React from 'react';

export default function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 w-full py-20">
      <div className="max-w-7xl mx-auto px-4 md:px-10 flex flex-col gap-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Column 1 */}
          <div className="col-span-1 md:col-span-1">
            <a href="#" className="text-2xl font-h3 gradient-text mb-8 block">
              LumiX Partner
            </a>
            <p className="font-body-sm text-body-sm text-main mb-8 leading-relaxed">
              NÃ¢ng táº§m giÃ¡ trá»‹ ngÃ nh lÃ m Ä‘áº¹p Viá»‡t Nam thÃ´ng qua cÃ´ng nghá»‡ hiá»‡n Ä‘áº¡i vÃ  giáº£i phÃ¡p váº­n hÃ nh thÃ´ng minh.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-12 h-12 rounded-xl glass-card flex items-center justify-center hover:text-primary transition-colors border-primary/10">
                <span className="material-symbols-outlined text-[24px]">public</span>
              </a>
              <a href="#" className="w-12 h-12 rounded-xl glass-card flex items-center justify-center hover:text-primary transition-colors border-primary/10">
                <span className="material-symbols-outlined text-[24px]">chat</span>
              </a>
              <a href="#" className="w-12 h-12 rounded-xl glass-card flex items-center justify-center hover:text-primary transition-colors border-primary/10">
                <span className="material-symbols-outlined text-[24px]">mail</span>
              </a>
            </div>
          </div>

          {/* Column 2 */}
          <div>
            <h4 className="font-label-bold text-label-bold text-main mb-8 uppercase tracking-widest">Giáº£i phÃ¡p</h4>
            <ul className="space-y-5 font-body-sm text-body-sm text-main">
              <li><a href="#" className="hover:text-primary transition-colors">Quáº£n lÃ½ Spa</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Quáº£n lÃ½ Salon Nail</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Skincare Clinic</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Quáº£ng cÃ¡o LumiX Ads</a></li>
            </ul>
          </div>

          {/* Column 3 */}
          <div>
            <h4 className="font-label-bold text-label-bold text-main mb-8 uppercase tracking-widest">CÃ´ng ty</h4>
            <ul className="space-y-5 font-body-sm text-body-sm text-main">
              <li><a href="#" className="hover:text-primary transition-colors">Vá» chÃºng tÃ´i</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Tuyá»ƒn dá»¥ng</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Tin tá»©c</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Äá»‘i tÃ¡c</a></li>
            </ul>
          </div>

          {/* Column 4 */}
          <div>
            <h4 className="font-label-bold text-label-bold text-main mb-8 uppercase tracking-widest">LiÃªn há»‡</h4>
            <ul className="space-y-5 font-body-sm text-body-sm text-main">
              <li className="flex gap-3">
                <span className="material-symbols-outlined text-primary text-[20px]">location_on</span>
                <span>ToÃ  nhÃ  LumiX, Quáº­n 1, TP. Há»“ ChÃ­ Minh</span>
              </li>
              <li className="flex gap-3">
                <span className="material-symbols-outlined text-primary text-[20px]">call</span>
                <span>1900 1234 (Miá»…n phÃ­)</span>
              </li>
              <li className="flex gap-3">
                <span className="material-symbols-outlined text-primary text-[20px]">mail</span>
                <span>contact@lumix.vn</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 pt-10 border-t border-gray-200">
          <p className="font-body-sm text-body-sm text-main">
            Â© 2024 LumiX Partner. Ná»n táº£ng quáº£n lÃ½ Spa &amp; Salon hÃ ng Ä‘áº§u Viá»‡t Nam.
          </p>
          <div className="flex gap-8">
            <a href="#" className="font-label-bold text-label-bold text-main hover:text-primary transition-colors">
              Äiá»u khoáº£n
            </a>
            <a href="#" className="font-label-bold text-label-bold text-main hover:text-primary transition-colors">
              Báº£o máº­t
            </a>
            <a href="#" className="font-label-bold text-label-bold text-main hover:text-primary transition-colors">
              HÆ°á»›ng dáº«n
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}



