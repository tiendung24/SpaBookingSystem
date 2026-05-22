import React from 'react';
import { Link } from 'react-router-dom';

export default function CTASection() {
  return (
    <section className="mb-32 px-4 md:px-10 max-w-7xl mx-auto">
      <div className="bg-gradient-to-br from-[#5ea4b8] via-[#14677a] to-[#003843] rounded-[60px] p-16 md:p-24 text-center relative overflow-hidden float-3d border border-white/20">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)',
            backgroundSize: '40px 40px'
          }}
        ></div>
        <div className="relative z-10 max-w-3xl mx-auto">
          <h2 className="font-h1 text-[48px] md:text-[64px] text-white mb-8 leading-tight">
            Báº¯t Ä‘áº§u nÃ¢ng táº§m shop cá»§a báº¡n ngay hÃ´m nay!
          </h2>
          <p className="font-body-lg text-[20px] text-white/90 mb-12 leading-relaxed">
            Tham gia cá»™ng Ä‘á»“ng 5,000+ chá»§ shop thÃ´ng thÃ¡i vÃ  táº­n hÆ°á»Ÿng sá»± tháº£nh thÆ¡i trong quáº£n lÃ½.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link to="/login" className="bg-white text-[#14677a] font-label-bold text-lg px-12 py-6 rounded-2xl cta-3d hover:scale-105 active:scale-95 transition-all text-center">
              Báº¯t Ä‘áº§u dÃ¹ng thá»­ miá»…n phÃ­
            </Link>
            <button className="glass-card border-white/40 text-white font-label-bold text-lg px-12 py-6 rounded-2xl hover:bg-white/10 transition-colors">
              LiÃªn há»‡ tÆ° váº¥n
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
