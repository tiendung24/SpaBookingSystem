
export default function PricingSection() {
  return (
    <section className="py-24 px-4 md:px-10" id="pricing">
      <div className="max-w-7xl mx-auto text-center mb-20">
        <h2 className="font-h2 text-[40px] text-main mb-4">MÃ´ hÃ¬nh thanh toÃ¡n Ä‘Æ¡n giáº£n & minh báº¡ch</h2>
        <p className="font-body-lg text-body-lg text-main">
          Báº¡n chá»‰ tráº£ phÃ­ khi cÃ³ khÃ¡ch Ä‘áº·t lá»‹ch thÃ nh cÃ´ng. KhÃ´ng phÃ­ áº©n, khÃ´ng cam káº¿t dÃ i háº¡n.
        </p>
      </div>

      <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-10 mb-16">
        <div className="glass-card p-12 rounded-[40px] flex flex-col float-3d">
          <span className="text-primary font-label-bold text-label-bold mb-6 tracking-widest">CÆ  Báº¢N</span>
          <h3 className="font-h1 text-[48px] text-main mb-6">
            Miá»…n phÃ­ <span className="text-xl font-h3 text-main">cÃ i Ä‘áº·t</span>
          </h3>
          <p className="font-body-md text-body-md text-main mb-10">
            HoÃ n toÃ n miá»…n phÃ­. Chá»‰ tráº£ phÃ­ khi cÃ³ khÃ¡ch Ä‘áº·t lá»‹ch thÃ nh cÃ´ng.
          </p>
          <div className="space-y-5 mb-12 flex-grow">
            <div className="flex items-center gap-4">
              <span className="material-symbols-outlined text-primary">done</span>
              <span className="font-body-md text-main">
                <strong>PhÃ­ 10.000Ä‘/booking</strong> hoÃ n thÃ nh
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="material-symbols-outlined text-primary">done</span>
              <span className="font-body-md text-main">KhÃ´ng giá»›i háº¡n dá»‹ch vá»¥</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="material-symbols-outlined text-primary">done</span>
              <span className="font-body-md text-main">KhÃ´ng giá»›i háº¡n nhÃ¢n viÃªn</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="material-symbols-outlined text-primary">done</span>
              <span className="font-body-md text-main">Quáº£n lÃ½ lá»‹ch háº¹n thá»i gian thá»±c</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="material-symbols-outlined text-primary">done</span>
                      <span className="font-body-md text-main">Há»— trá»£ Email thÃ´ng bÃ¡o</span>
            </div>
          </div>
          <button className="w-full glass-card border border-primary/50 text-primary font-label-bold text-label-bold py-5 rounded-2xl hover:bg-primary/5 transition-all text-lg">
            Báº¯t Ä‘áº§u miá»…n phÃ­
          </button>
        </div>

        <div className="bg-gradient-to-b from-[#2e7f91] to-[#1a4d5a] p-12 rounded-[40px] relative overflow-hidden flex flex-col float-3d shadow-[0_30px_60px_-15px_rgba(20,103,122,0.5)]">
          <div className="absolute top-8 right-8 bg-white/20 text-white px-4 py-1.5 rounded-full font-label-bold text-[12px] backdrop-blur-md border border-white/30">
            ÄÆ¯á»¢C KHUYáº¾N NGHá»Š
          </div>
          <span className="text-white/70 font-label-bold text-label-bold mb-6 uppercase tracking-widest">NÃ‚NG CAO</span>
          <h3 className="font-h1 text-[40px] text-white mb-2">10.000Ä‘/booking</h3>
          <p className="text-white/60 text-sm mb-6">tá»©c 100.000Ä‘ - 200.000Ä‘/thÃ¡ng cho shop trung bÃ¬nh</p>
          <p className="font-body-md text-body-md text-white/90 mb-10">
            GÃ³i cÆ¡ báº£n vá»›i phÃ­ tháº¥p nháº¥t. 100% minh báº¡ch, khÃ´ng cÃ³ chi phÃ­ áº©n.
          </p>
          <div className="space-y-5 mb-12 flex-grow">
            <div className="flex items-center gap-4">
              <span className="material-symbols-outlined text-white">check_circle</span>
              <span className="font-body-md text-white">
                <strong>Escrow System</strong> báº£o vá»‡ cá»c khÃ¡ch
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="material-symbols-outlined text-white">check_circle</span>
              <span className="font-body-md text-white">Báº­t/táº¯t yÃªu cáº§u cá»c thÃ´ng minh</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="material-symbols-outlined text-white">check_circle</span>
              <span className="font-body-md text-white">Quáº£n lÃ½ vÃ­ áº£o (náº¡p tiá»n qua QR)</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="material-symbols-outlined text-white">check_circle</span>
              <span className="font-body-md text-white">Chá»‘ng no-show & gian láº­n</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="material-symbols-outlined text-white">check_circle</span>
                    <span className="font-body-md text-white">Há»— trá»£ 24/7 qua Email</span>
            </div>
          </div>
          <button className="w-full bg-white text-[#1a4d5a] font-label-bold text-label-bold py-5 rounded-2xl shadow-2xl hover:scale-[1.02] transition-transform text-lg cta-3d font-bold">
            ÄÄƒng kÃ½ ngay
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto bg-gradient-to-r from-[#f0f8fa] to-[#e6f4f8] text-[#1a3a42] p-12 rounded-[32px] flex flex-col md:flex-row justify-between items-start gap-8 float-3d border border-[#5ea4b8]/20">
        <div className="flex-1">
          <h4 className="font-h3 text-[28px] mb-6 text-[#0d3f4a]">ðŸ’³ Thanh toÃ¡n dá»… dÃ ng & an toÃ n</h4>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-primary mt-1">done</span>
              <div>
                <p className="font-bold text-[#1a3a42]">Náº¡p tiá»n qua QR PayOS</p>
                <p className="text-sm text-main">QuÃ©t mÃ£ â†’ tiá»n vÃ o tÃ i khoáº£n Admin LumiX â†’ tá»± Ä‘á»™ng cá»™ng vÃ o vÃ­ áº£o</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-primary mt-1">done</span>
              <div>
                <p className="font-bold text-[#1a3a42]">Auto-lock an toÃ n</p>
              <p className="text-sm text-main">Khi vÃ­ = 0, link shop táº¡m ngÆ°ng nháº­n lá»‹ch. Báº¡n nháº­n thÃ´ng bÃ¡o email nháº¯c náº¡p tiá»n</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-primary mt-1">done</span>
              <div>
                <p className="font-bold text-[#1a3a42]">HoÃ n tiá»n tá»± Ä‘á»™ng</p>
                <p className="text-sm text-main">Há»§y há»£p lá»‡: hoÃ n cá»c cho khÃ¡ch. Há»§y muá»™n: trá»« phÃ­, pháº§n cÃ²n láº¡i cho shop</p>
              </div>
            </div>
          </div>
        </div>
        <div className="flex-shrink-0">
          <div className="bg-white rounded-2xl p-6 shadow-md">
            <p className="text-sm text-main mb-2">Æ¯á»›c tÃ­nh chi phÃ­ hÃ ng thÃ¡ng:</p>
            <p className="text-3xl font-bold text-primary mb-1">100k - 500k</p>
            <p className="text-xs text-main">tÃ¹y theo sá»‘ booking/thÃ¡ng</p>
            <p className="text-xs text-green-600 mt-4 font-semibold">âœ“ KhÃ´ng phÃ­ áº©n, khÃ´ng cam káº¿t dÃ i háº¡n</p>
          </div>
        </div>
      </div>
    </section>
  )
}
