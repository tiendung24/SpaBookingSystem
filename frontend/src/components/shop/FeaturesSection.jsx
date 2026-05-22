import React from 'react';

export default function FeaturesSection() {
  return (
    <section className="py-24 px-4 md:px-10 max-w-7xl mx-auto" id="features">
      <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
        <div className="max-w-2xl text-left">
          <h2 className="font-h2 text-[40px] leading-tight text-main mb-4">
            LumiX giÃºp shop váº­n hÃ nh gá»n gÃ ng hÆ¡n
          </h2>
          <p className="font-body-lg text-body-lg text-main">
            Há»‡ sinh thÃ¡i tÃ­nh nÄƒng toÃ n diá»‡n, thiáº¿t káº¿ riÃªng cho Ä‘áº·c thÃ¹ ngÃ nh lÃ m Ä‘áº¹p.
          </p>
        </div>
        <button className="glass-card text-primary font-label-bold text-label-bold px-8 py-4 rounded-2xl flex items-center gap-2 hover:bg-gray-50 transition-all border border-primary/20">
          KhÃ¡m phÃ¡ táº¥t cáº£ <span className="material-symbols-outlined">arrow_forward</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 h-auto md:h-[900px]">
        {/* Feature 1: Main Large Card */}
        <div className="md:col-span-8 glass-card rounded-[40px] p-12 flex flex-col justify-between overflow-hidden relative group float-3d">
          <div className="max-w-md relative z-10">
            <h3 className="font-h1 text-[42px] gradient-text mb-6">Quáº£n lÃ½ lá»‹ch háº¹n</h3>
            <p className="font-body-lg text-body-lg text-main">
              Äáº·t lá»‹ch nhanh chÃ³ng, tá»± Ä‘á»™ng sáº¯p xáº¿p thá»£ vÃ  phÃ²ng dá»‹ch vá»¥. Giáº£m 90% tÃ¬nh tráº¡ng trÃ¹ng lá»‹ch.
            </p>
          </div>
          <div className="mt-12 relative">
            <img
              alt="3D Booking Interface"
              className="rounded-3xl shadow-2xl transform translate-y-12 group-hover:translate-y-4 transition-transform duration-700"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAhZPuRS9lR929edIpT-QARJ2GD8rB9R7-t-9EW3mxukDZ2PcN95vmTw5tyZ5IzWFwU2iQWtv4NAkd0ZdkO0ByuoZAZfuU7NCoJwd8LSqdVK4CIDAZ34pxqpa0a6UZIU9KR8YlWGTAKUo92CCq1WolcdDmOs7HzR7PK5xDwWo_rU5-3c-h-aykMozPrRcmk4fRseWuYkGA8M9gKDlSfwQcySF-gcaVs2X3i6tw79jjxVv79WyyeJYdZT4kjDauSsSCPjbGtA7R3PtHr"
            />
          </div>
        </div>

        {/* Feature 2 */}
        <div className="md:col-span-4 bg-gradient-to-br from-[#cb8d56] to-[#865221] rounded-[40px] p-10 flex flex-col float-3d shadow-2xl border border-white/20">
          <div className="w-20 h-20 bg-white/10 rounded-3xl flex items-center justify-center mb-10 shadow-inner">
            <span className="material-symbols-outlined text-[48px] text-white" style={{ fontVariationSettings: "'FILL' 1" }}>
              payments
            </span>
          </div>
          <h3 className="font-h2 text-[32px] text-main mb-4">Thu ngÃ¢n siÃªu tá»‘c</h3>
          <p className="font-body-md text-body-md text-main">
            TÃ­ch há»£p thanh toÃ¡n QR, tháº» vÃ  tiá»n máº·t. Xuáº¥t hÃ³a Ä‘Æ¡n chuyÃªn nghiá»‡p chá»‰ trong 3 giÃ¢y.
          </p>
          <div className="mt-auto">
            <div className="p-6 glass-card border-white/20 rounded-3xl">
              <div className="flex justify-between items-center mb-4">
                <span className="font-label-bold text-white/80">Tá»•ng bill</span>
                <span className="text-2xl font-bold text-white">1,250,000Ä‘</span>
              </div>
              <div className="h-2 bg-white/20 rounded-full w-full overflow-hidden">
                <div className="h-full bg-white w-2/3"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature 3 */}
        <div className="md:col-span-4 glass-card rounded-[40px] p-10 flex flex-col float-3d">
          <div className="w-20 h-20 bg-primary/20 rounded-3xl flex items-center justify-center mb-10">
            <span className="material-symbols-outlined text-[48px] text-primary">campaign</span>
          </div>
          <h3 className="font-h2 text-[32px] text-main mb-4">Quáº£ng cÃ¡o thÃ´ng minh</h3>
          <p className="font-body-md text-body-md text-main">
            Tiáº¿p cáº­n hÃ ng nghÃ¬n khÃ¡ch hÃ ng má»›i xung quanh khu vá»±c shop vá»›i gÃ³i marketing LumiX Ads.
          </p>
        </div>

        {/* Feature 4 */}
        <div className="md:col-span-8 glass-card rounded-[40px] p-12 grid md:grid-cols-2 gap-10 overflow-hidden group float-3d">
          <div className="flex flex-col justify-center">
            <h3 className="font-h2 text-[36px] text-main mb-6">BÃ¡o cÃ¡o &amp; PhÃ¢n tÃ­ch</h3>
            <p className="font-body-md text-body-md text-main leading-relaxed">
              Theo dÃµi doanh thu, chi phÃ­, hiá»‡u suáº¥t nhÃ¢n viÃªn theo thá»i gian thá»±c vá»›i dá»¯ liá»‡u 3D trá»±c quan.
            </p>
            <ul className="mt-8 space-y-4">
              <li className="flex items-center gap-3 font-label-bold text-main">
                <span className="material-symbols-outlined text-primary text-2xl">check_circle</span> Doanh thu theo thá»£
              </li>
              <li className="flex items-center gap-3 font-label-bold text-main">
                <span className="material-symbols-outlined text-primary text-2xl">check_circle</span> Tá»· lá»‡ khÃ¡ch quay láº¡i
              </li>
            </ul>
          </div>
          <div className="flex items-center justify-center">
            <img
              alt="3D Growth Chart"
              className="scale-125 group-hover:scale-150 transition-transform duration-1000"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBc-GJFiW8hk5s5IGOTUcJ-IbrLZlAfG5okzkED5Q9z7iH9DjMBl983ZXP6Zz5uaonAv6ymB3XonAG4a0n7QWQu4Gt8DaD5z3_POGMIpeCtDBwPb5tod7ID0Vr8EAYNQKLUT75Kt5kfrYn8xkFeuWUnnwPVjTV-Qa78WU5zEANsnJcG3q9V7WMkiqyq54No63YgyPZpNS8tcd3l1bZAT_KJ3CR1lL64t2Bo3Y_wGMGZCymeOLOTxBn-G4u-c4WQerOctp7wAxkRo8Ux"
            />
          </div>
        </div>
      </div>
    </section>
  );
}


