import React from 'react';

const problems = [
  {
    icon: 'event_busy',
    title: 'KhÃ³ kiá»ƒm soÃ¡t lá»‹ch',
    description: 'Lá»‹ch háº¹n chá»“ng chÃ©o, khÃ¡ch pháº£i chá» lÃ¢u gÃ¢y áº£nh hÆ°á»Ÿng Ä‘áº¿n uy tÃ­n cá»§a shop.'
  },
  {
    icon: 'notifications_off',
    title: 'QuÃªn lá»‹ch khÃ¡ch',
    description: 'KhÃ´ng cÃ³ há»‡ thá»‘ng nháº¯c lá»‹ch tá»± Ä‘á»™ng, dáº«n Ä‘áº¿n viá»‡c bá» lá»¡ nhá»¯ng khÃ¡ch hÃ ng quan trá»ng.'
  },
  {
    icon: 'group_remove',
    title: 'CRM rá»i ráº¡c',
    description: 'ThÃ´ng tin khÃ¡ch hÃ ng lÆ°u trÃªn sá»• sÃ¡ch dá»… tháº¥t láº¡c, khÃ³ tra cá»©u lá»‹ch sá»­ dá»‹ch vá»¥.'
  },
  {
    icon: 'money_off',
    title: 'Tháº¥t thoÃ¡t doanh thu',
    description: 'Sai sÃ³t trong quÃ¡ trÃ¬nh tÃ­nh tiá»n vÃ  khÃ´ng theo dÃµi Ä‘Æ°á»£c bÃ¡o cÃ¡o lÃ£i lá»— chÃ­nh xÃ¡c.'
  }
];

export default function ProblemSection() {
  return (
    <section className="py-24 px-4 md:px-10">
      <div className="max-w-7xl mx-auto text-center mb-20">
        <h2 className="font-h2 text-[32px] text-main mb-4">Shop cá»§a báº¡n cÃ³ Ä‘ang gáº·p nhá»¯ng váº¥n Ä‘á» nÃ y?</h2>
        <div className="w-24 h-1.5 bg-gradient-to-r from-primary to-transparent mx-auto rounded-full"></div>
      </div>
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {problems.map((problem, idx) => (
          <div key={idx} className="glass-card p-8 rounded-[32px] float-3d group">
            <div className="w-16 h-16 bg-error/20 text-error rounded-2xl flex items-center justify-center mb-6 group-hover:rotate-12 transition-transform">
              <span className="material-symbols-outlined text-[36px]">{problem.icon}</span>
            </div>
            <h3 className="font-h3 text-h3 mb-4 text-main">{problem.title}</h3>
            <p className="font-body-md text-body-md text-main">{problem.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}


