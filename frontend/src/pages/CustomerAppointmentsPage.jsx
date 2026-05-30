import { useEffect, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { useShop } from '../context/ShopContext'
import CustomerHeader from '../components/customer/CustomerHeader'
      <main className="px-4 md:px-10 pb-16">
        {!isCorrectSlug ? (
          <div className="max-w-3xl mx-auto glass-card bg-white/70 rounded-3xl p-6 border border-rose-200 text-rose-700">
            Bạn đang mở slug <b>{slug}</b> không khớp shop hiện tại. Demo đang hiển thị dữ liệu của <b>{shop.name}</b>.
          </div>
        ) : null}

        <div className="max-w-4xl mx-auto">
          <div className="glass-card bg-white/70 rounded-3xl p-8 mb-8 text-center">
            <h1 className="font-h2 text-h2 text-primary mb-3">Lịch hẹn</h1>
            <p className="text-main/70">Để xem lịch hẹn của bạn, bấm <strong>"Lịch hẹn của tôi"</strong> trên header (yêu cầu đăng nhập).</p>
            <p className="text-sm text-main/60 mt-3">Trang tra cứu theo số điện thoại đã được gỡ bỏ.</p>
          </div>
        </div>
      </main>
                ) : (
                  <span className="bg-rose-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-md">Đã hủy</span>
                )

              return (
                <div
                  key={b.id}
                  className="glass-card bg-white/70 rounded-3xl overflow-hidden flex flex-col md:flex-row border border-primary/10"
                >
                  <div className="w-full md:w-1/3 relative h-48 md:h-auto overflow-hidden bg-slate-100">
                    <div className="absolute top-4 left-4">{badge}</div>
                    <div className="w-full h-full flex items-center justify-center text-primary/40">
                      <span className="material-symbols-outlined text-[64px]">spa</span>
                    </div>
                  </div>

                  <div className="flex-1 p-6 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-2 gap-4">
                        <h3 className="font-h3 text-h3 text-primary">{svc?.name || 'Dịch vụ'}</h3>
                        <span className="font-bold text-primary">{formatVnd(b.total || svc?.priceVnd || 0)}</span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-sm text-main/70 mb-4">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[20px] text-primary">calendar_today</span>
                          <span>{formatDateVi(b.time)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[20px] text-primary">schedule</span>
                          <span>
                            {formatTimeHHmm(b.time)} - {formatTimeHHmm(b.endTime || b.time)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[20px] text-primary">person</span>
                          <span>{stf?.name ? `KTV. ${stf.name}` : 'KTV. (chưa phân công)'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[20px] text-primary">payments</span>
                          <span>
                            Cọc: <strong className="text-main">{formatVnd(b.deposit || 0)}</strong>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3 pt-4 border-t border-primary/10">
                      <button
                        type="button"
                        className="flex-1 min-w-[140px] py-2 px-4 rounded-xl bg-slate-100 text-primary font-bold flex items-center justify-center gap-2 hover:bg-primary/10 transition-all"
                        onClick={handleDirections}
                      >
                        <span className="material-symbols-outlined text-[18px]">directions</span>
                        <span>Chỉ đường</span>
                      </button>
                      {tab === 'upcoming' && (
                        <button
                          type="button"
                          className="flex-1 min-w-[140px] py-2 px-4 rounded-xl border border-rose-300 text-rose-700 font-bold flex items-center justify-center gap-2 hover:bg-rose-50 transition-all"
                          onClick={() => handleCancel(b)}
                        >
                          <span className="material-symbols-outlined text-[18px]">cancel</span>
                          <span>Hủy lịch</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </main>
    </div>
  )
}
