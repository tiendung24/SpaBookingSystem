
import heroFallback from '../../assets/lumix-logo.png';

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden pt-16 pb-24 md:pt-24 md:pb-32 px-4 md:px-10 max-w-7xl mx-auto">
      <div className="grid md:grid-cols-2 items-center gap-16 mt-20">
        <div className="flex flex-col gap-8">
          <div className="inline-flex items-center gap-2 glass-card px-4 py-1.5 rounded-full w-fit">
            <span className="material-symbols-outlined text-[18px] text-primary">verified</span>
            <span className="font-label-bold text-label-bold text-gray-800">Giải pháp hàng đầu cho Spa & Salon</span>
          </div>
          <h1 className="font-h1 text-h1 md:text-[56px] md:leading-tight text-main">
            Quản lý tiệm làm đẹp dễ dàng hơn với <span className="gradient-text">LumiX</span>
          </h1>
          <p className="font-body-lg text-body-lg text-main max-w-lg leading-relaxed">
            Nền tảng chuyên biệt cho chủ tiệm Nail, Spa và Skincare. Tối ưu vận hành, quản lý lịch hẹn thông minh và bứt phá doanh thu.
          </p>
          <div className="flex flex-wrap gap-4">
            <button className="bg-[#5ea4b8] text-white font-label-bold text-label-bold px-8 py-4 rounded-2xl cta-3d text-lg hover:brightness-110">
              Trở thành đối tác
            </button>
            <button className="glass-card text-primary font-label-bold text-label-bold px-8 py-4 rounded-2xl hover:bg-gray-50 transition-all text-lg border border-primary/20">
              Xem tính năng
            </button>
          </div>
          <div className="flex items-center gap-4 pt-4">
            <div className="flex -space-x-3">
              <img alt="Partner 1" className="w-10 h-10 rounded-full border-2 border-primary/50 shadow-lg" src="https://lh3.googleusercontent.com/aida-public/AB6AXuA72Tua8cHhUwHq636lH4qeDBHJmABmtdo1gTiqL7_gWvhTV1_fXIQAzwO4xtlT-yOyIThnTcA-99ET_oq2K0x_icm1CFzhhVxhRX6DwfjzMChdy5bmcLEe3Mzordcm46NJQ09-qUsdGo2_mB_iS1jzi1_fEXFcTS19927yydGfsOW7l1sE5OAD-0wDYkYRYWv92h5kT1WIYNChlqNJy2AvpBkeru77yy1yNQySfdMXZc6EUTClrJ_Sm8452BA86Hb48vhA5iV5Hl1x" />
              <img alt="Partner 2" className="w-10 h-10 rounded-full border-2 border-primary/50 shadow-lg" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAGtNRtfl71nnCQQuFKcZpjF5DNvtrP68C-z8rbsLZb6eKgIMdK2DJ0rvUrKhueeXaRcVtQJn2uRx7Ul4pwSOv_cfzlwZark-SmV8fmM7falxa4NXm8pkptAvyc-gZpbNvoUDzzkLGOSrY-Pzy16MdbBUBMtCM3gBDHDP329sMEcSPlHK5bRpB0auEjeeKGPMA13VKgFXJm69ZbK4hiK3sMfOlfoazqBL_iTbD8sBgqoX0plVrN5016-DQfDDF2bEeBIApuoADRTjZM" />
            </div>
            <p className="text-sm text-main/70">Hơn 5.000+ chủ tiệm đã tin dùng</p>
          </div>
        </div>
        <div className="relative">
          {/* Use external image but fallback to local asset if it fails to load */}
          <img
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuB19Yy0W4Tjl-wkR5NuQpA0y2oY4fv3c9_3mYlc4O0zgpzwSY0q_3gBqzUKHcjqfWHqIf4p0l8n0BW4wRcf4ea1q8Lw9uPrZxW2i6iMV0Qn8fPS4l0Y3yqNh3PkO9jVx66b4xJfWhV9WJqk2Dts7ubQ4B5g1S2jI_6xMOnWm8W7UZ5Xh66Z7nMRT3EfM8Yg_d5rX3skM9T8K2JXIQ"
            alt="Hero"
            className="w-full rounded-3xl shadow-2xl"
            onError={(e) => {
              // replace with local fallback image when external fails
              e.currentTarget.onerror = null
              e.currentTarget.src = heroFallback
            }}
          />
        </div>
      </div>
    </section>
  );
}
