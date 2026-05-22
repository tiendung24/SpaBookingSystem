import React from 'react';

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden pt-16 pb-24 md:pt-24 md:pb-32 px-4 md:px-10 max-w-7xl mx-auto">
      <div className="grid md:grid-cols-2 items-center gap-16 mt-20">
        <div className="flex flex-col gap-8">
          <div className="inline-flex items-center gap-2 glass-card px-4 py-1.5 rounded-full w-fit">
            <span className="material-symbols-outlined text-[18px] text-primary">verified</span>
            <span className="font-label-bold text-label-bold text-gray-800">Giáº£i phÃ¡p hÃ ng Ä‘áº§u cho Spa &amp; Salon</span>
          </div>
          <h1 className="font-h1 text-h1 md:text-[56px] md:leading-tight text-main">
            Quáº£n lÃ½ tiá»‡m lÃ m Ä‘áº¹p dá»… dÃ ng hÆ¡n vá»›i <span className="gradient-text">LumiX</span>
          </h1>
          <p className="font-body-lg text-body-lg text-main max-w-lg leading-relaxed">
            Ná»n táº£ng chuyÃªn biá»‡t cho chá»§ tiá»‡m Nail, Spa vÃ  Skincare. Tá»‘i Æ°u hÃ³a váº­n hÃ nh, quáº£n lÃ½ lá»‹ch háº¹n thÃ´ng minh vÃ  bá»©t phÃ¡ doanh thu vá»›i cÃ´ng nghá»‡ tá»« LumiX.
          </p>
          <div className="flex flex-wrap gap-4">
            <button className="bg-[#5ea4b8] text-white font-label-bold text-label-bold px-8 py-4 rounded-2xl cta-3d text-lg hover:brightness-110">
              Trá»Ÿ thÃ nh Ä‘á»‘i tÃ¡c
            </button>
            <button className="glass-card text-primary font-label-bold text-label-bold px-8 py-4 rounded-2xl hover:bg-gray-50 transition-all text-lg border border-primary/20">
              Xem tÃ­nh nÄƒng
            </button>
          </div>
          <div className="flex items-center gap-4 pt-4">
            <div className="flex -space-x-3">
              <img
                alt="Partner 1"
                className="w-10 h-10 rounded-full border-2 border-primary/50 shadow-lg"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuA72Tua8cHhUwHq636lH4qeDBHJmABmtdo1gTiqL7_gWvhTV1_fXIQAzwO4xtlT-yOyIThnTcA-99ET_oq2K0x_icm1CFzhhVxhRX6DwfjzMChdy5bmcLEe3Mzordcm46NJQ09-qUsdGo2_mB_iS1jzi1_fEXFcTS19927yydGfsOW7l1sE5OAD-0wDYkYRYWv92h5kT1WIYNChlqNJy2AvpBkeru77yy1yNQySfdMXZc6EUTClrJ_Sm8452BA86Hb48vhA5iV5Hl1x"
              />
              <img
                alt="Partner 2"
                className="w-10 h-10 rounded-full border-2 border-primary/50 shadow-lg"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAGtNRtfl71nnCQQuFKcZpjF5DNvtrP68C-z8rbsLZb6eKgIMdK2DJ0rvUrKhueeXaRcVtQJn2uRx7Ul4pwSOv_cfzlwZark-SmV8fmM7falxa4NXm8pkptAvyc-gZpbNvoUDzzkLGOSrY-Pzy16MdbBUBMtCM3gBDHDP329sMEcSPlHK5bRpB0auEjeeKGPMA13VKgFXJm69ZbK4hiK3sMfOlfoazqBL_iTbD8sBgqoX0plVrN5016-DQfDDF2bEeBIApuoADRTjZM"
              />
              <img
                alt="Partner 3"
                className="w-10 h-10 rounded-full border-2 border-primary/50 shadow-lg"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBygpUH5EReHOSHzFnYqtd13feqbQn6SQ832eKztAmEWy7Nw5Iz4GKDkpoSn-QVCNebr8RThvqL02v1j2zMwGLx07Nox2r5mX_1o6pzUOUr2YMCdAwnPuHQBJymXHaE5alt4Ae4uXdP5qOAcOrIDxzg-6Mm_WTM2nMu18G9SQImxA3Oow65oes-M1Y6d6QLy-bRlqosZIswa9zW480-lMR97eRSrhkjc4TtiHmpm3CUTgDWeJMIvl2uL1QO2UoouMHhSEPYWyrioivw"
              />
            </div>
            <p className="font-body-sm text-body-sm text-main">
              HÆ¡n <span className="font-bold text-primary">5,000+</span> chá»§ tiá»‡m Ä‘Ã£ tin dÃ¹ng
            </p>
          </div>
        </div>
        <div className="relative group">
          <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%] bg-primary/20 rounded-full blur-[100px]"></div>
          <div className="glass-card p-4 rounded-[40px] float-3d border-primary/10">
            <img
              alt="3D Dashboard Mockup"
              className="rounded-[32px] w-full shadow-inner"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCxNB6MFPAWp_loNDNyDM5yJvSAPG_QVmU8_rNjtwRzGkJxFdODE-TtlFF4evc1TrYyAKt5G9Srp8hM83Drpc8VIsaVb3lJjC9HyR4i3Nqfky_W5M4Um5CZ2JhCwg-vQMztMBAz2wdcvHtiMUtL0xSmbqXUiAP7fMZPsWOT6vn31vMyOJkwaxYAhNwmRq88eNVVbteDOPnTkS5tbwYOtXBAv4U0W5EDAHQfk9HLYun-LviS8-e0epj2_SujiSznMvDrDY8fMtaPS4jw"
            />
          </div>
          <div className="absolute -bottom-10 -left-10 glass-card-light p-5 rounded-3xl shadow-2xl flex items-center gap-4 animate-bounce">
            <div className="w-12 h-12 bg-[#5ea4b8] rounded-2xl flex items-center justify-center text-white shadow-lg">
              <span className="material-symbols-outlined">calendar_month</span>
            </div>
            <div>
              <p className="font-label-bold text-label-bold text-[#003843]">+12 Lá»‹ch háº¹n má»›i</p>
              <p className="text-[12px] text-[#003843]/60">HÃ´m nay, 14:00</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}


