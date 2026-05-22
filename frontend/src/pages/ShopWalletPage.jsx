import { useMemo, useState } from 'react';
import ShopSidebar from '../components/shop/ShopSidebar';
import { useShop } from '../context/ShopContext';

const escrowItems = [
  { bookingId: '#88219', eta: '26/10', amount: '200.000' },
  { bookingId: '#88224', eta: '27/10', amount: '500.000' },
  { bookingId: '#88229', eta: '27/10', amount: '500.000' }
];

export default function ShopWalletPage() {
  const { shop, walletTransactions, topupWallet } = useShop();
  const [cardTransform, setCardTransform] = useState('perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)');
  const [topupAmount, setTopupAmount] = useState(200000);
  const [qrVisible, setQrVisible] = useState(false);

  const transactions = useMemo(() => {
    return walletTransactions.map((t) => {
      const typeMeta =
        t.type === 'topup'
          ? { label: 'Nạp tiền', icon: 'add', cls: 'bg-emerald-100 text-emerald-800', amtCls: 'text-emerald-600 font-bold', sign: '+' }
          : t.type === 'fee'
            ? { label: 'Phí dịch vụ', icon: 'receipt_long', cls: 'bg-blue-100 text-blue-800', amtCls: 'text-main', sign: '' }
            : { label: 'Khác', icon: 'receipt_long', cls: 'bg-slate-100 text-slate-700', amtCls: 'text-main', sign: '' };
      const amountText = `${t.amount > 0 ? '+' : ''}${Math.abs(t.amount).toLocaleString('vi-VN')}`;
      return {
        time: t.time,
        type: typeMeta.label,
        icon: typeMeta.icon,
        typeClass: typeMeta.cls,
        description: t.description,
        amount: amountText,
        amountClass: typeMeta.amtCls
      };
    });
  }, [walletTransactions]);

  const handleCardMove = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = (y - centerY) / 20;
    const rotateY = (centerX - x) / 20;

    setCardTransform(`perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-5px)`);
  };

  const resetCard = () => {
    setCardTransform('perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)');
  };

  const createPayosQr = () => {
    setQrVisible(true);
  };

  const confirmTopup = () => {
    topupWallet(Number(topupAmount || 0));
    setQrVisible(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-body-md text-main">
      <ShopSidebar onNewBooking={() => console.log('Tạo lịch hẹn mới')} />

      <main className="ml-64 min-h-screen p-6 md:p-10">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h2 className="font-h2 text-h2 text-primary">Quản lý Ví LumiX</h2>
            <p className="font-body-md text-body-md text-main/70">Theo dõi dòng tiền và đối soát giao dịch của bạn.</p>
          </div>
          <div className="flex gap-3">
            <button className="glass-card px-4 py-2 rounded-xl flex items-center gap-2 font-label-bold text-label-bold hover:bg-white transition-all">
              <span className="material-symbols-outlined">download</span>
              Xuất báo cáo
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch mb-16">
          <div
            className="lg:col-span-5 rounded-3xl p-6 flex flex-col justify-between text-white shadow-2xl relative overflow-hidden transition-transform duration-300 bg-gradient-to-br from-primary to-secondary"
            onMouseMove={handleCardMove}
            onMouseLeave={resetCard}
            style={{ transform: cardTransform }}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>

            <div className="flex justify-between items-start z-10">
              <div>
                <p className="font-label-bold text-label-bold opacity-80 mb-1 uppercase tracking-widest">Số dư khả dụng</p>
                <h3 className="font-h1 text-h1 font-bold">{shop.wallet.balance.toLocaleString('vi-VN')} VNĐ</h3>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full backdrop-blur-md">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                <span className="font-label-bold text-label-bold">Link đang hoạt động</span>
              </div>
            </div>

            <div className="flex items-end justify-between z-10 mt-8">
              <div className="flex flex-col">
                <span className="font-body-sm text-body-sm opacity-80">Số hiệu ví</span>
                <span className="font-label-bold text-label-bold">LMX-8899-2422</span>
              </div>
              <button onClick={createPayosQr} className="bg-cyan-100 text-cyan-900 font-label-bold text-label-bold px-5 py-3 rounded-xl hover:bg-cyan-200 transition-all shadow-lg">
                Nạp tiền (PayOS)
              </button>
            </div>
          </div>

          <div className="lg:col-span-7 glass-card rounded-3xl p-6 flex flex-col justify-center bg-white/70">
            <div className="flex items-start gap-4 bg-red-100/60 p-4 rounded-xl border border-red-200 mb-6">
              <span className="material-symbols-outlined text-red-600" style={{ fontVariationSettings: "'FILL' 1" }}>
                warning
              </span>
              <div>
                <p className="font-h3 text-h3 text-red-700 mb-1">Cảnh báo duy trì số dư</p>
                <p className="font-body-md text-body-md text-red-900/80">
                  Bạn cần duy trì tối thiểu <strong>{shop.wallet.minBalance.toLocaleString('vi-VN')}đ</strong> để nhận lịch online. Nếu số dư thấp hơn, link sẽ tạm ngưng hoạt động.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-4 rounded-xl bg-slate-100">
                <p className="font-body-sm text-body-sm text-main/70 uppercase">Tổng nạp tháng</p>
                <p className="font-h3 text-h3 text-primary">+2.5M</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-100">
                <p className="font-body-sm text-body-sm text-main/70 uppercase">Tổng phí booking</p>
                <p className="font-h3 text-h3 text-main">-340K</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-100">
                <p className="font-body-sm text-body-sm text-main/70 uppercase">Khách hủy/Phạt</p>
                <p className="font-h3 text-h3 text-red-600">0 VNĐ</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 flex flex-col gap-4">
            <div className="flex justify-between items-end">
              <h4 className="font-h3 text-h3 text-primary">Lịch sử giao dịch</h4>
              <a className="font-label-bold text-label-bold text-primary hover:underline" href="#">Xem tất cả</a>
            </div>

            <div className="glass-card rounded-3xl overflow-hidden bg-white/70">
              <table className="w-full text-left">
                <thead className="bg-slate-100/90 border-b border-slate-200">
                  <tr>
                    <th className="p-4 font-label-bold text-label-bold text-main/70 uppercase">Ngày/Giờ</th>
                    <th className="p-4 font-label-bold text-label-bold text-main/70 uppercase">Loại giao dịch</th>
                    <th className="p-4 font-label-bold text-label-bold text-main/70 uppercase">Mô tả</th>
                    <th className="p-4 font-label-bold text-label-bold text-main/70 uppercase text-right">Số tiền</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {transactions.map((item) => (
                    <tr key={`${item.time}-${item.description}`} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 font-body-md text-body-md text-main/70">{item.time}</td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-label-bold text-label-bold ${item.typeClass}`}>
                          <span className="material-symbols-outlined text-[16px]">{item.icon}</span>
                          {item.type}
                        </span>
                      </td>
                      <td className="p-4 font-body-md text-body-md text-main">{item.description}</td>
                      <td className={`p-4 font-h3 text-h3 text-right ${item.amountClass}`}>{item.amount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="lg:col-span-4 flex flex-col gap-4">
            <h4 className="font-h3 text-h3 text-primary">Khu vực đối soát</h4>

            <div className="glass-card rounded-3xl p-4 flex flex-col gap-4 bg-white/70">
              <div className="flex items-center gap-3 mb-1">
                <span className="material-symbols-outlined text-amber-500 text-[32px]">pending_actions</span>
                <div>
                  <p className="font-label-bold text-label-bold text-main/70 uppercase">Tiền cọc Escrow</p>
                  <p className="font-h2 text-h2 text-amber-700">{shop.wallet.escrow.toLocaleString('vi-VN')} VNĐ</p>
                </div>
              </div>

              <p className="font-body-sm text-body-sm text-main/70 bg-white p-3 rounded-xl border border-slate-200">
                Các khoản tiền cọc khách đã trả mà LumiX đang giữ hộ. Tiền sẽ được cộng vào ví chính sau khi dịch vụ kết thúc.
              </p>

              <div className="space-y-3 mt-1">
                {escrowItems.map((escrow) => (
                  <div key={escrow.bookingId} className="flex justify-between items-center p-3 rounded-xl border border-primary/10 hover:border-primary/40 transition-colors">
                    <div>
                      <p className="font-label-bold text-label-bold">{`Booking ${escrow.bookingId}`}</p>
                      <p className="font-body-sm text-body-sm text-main/60 italic">{`Dự kiến về: ${escrow.eta}`}</p>
                    </div>
                    <p className="font-h3 text-h3 text-primary font-bold">{escrow.amount}</p>
                  </div>
                ))}
              </div>

              <button className="w-full mt-2 py-3 border-2 border-primary text-primary font-label-bold text-label-bold rounded-xl hover:bg-primary hover:text-white transition-all active:scale-95">
                Yêu cầu quyết toán sớm
              </button>
            </div>
          </div>
        </div>

        <footer className="w-full py-8 px-6 flex flex-col items-center gap-4 mt-16 border-t border-slate-200 bg-slate-100/80 rounded-t-3xl">
          <h5 className="font-h3 text-h3 text-primary">LumiX Partner</h5>
          <div className="flex gap-8">
            <a className="text-main/70 hover:text-primary transition-colors font-body-md text-body-md" href="#">Điều khoản</a>
            <a className="text-main/70 hover:text-primary transition-colors font-body-md text-body-md" href="#">Bảo mật</a>
            <a className="text-main/70 hover:text-primary transition-colors font-body-md text-body-md" href="#">Cookie</a>
            <a className="text-main/70 hover:text-primary transition-colors font-body-md text-body-md" href="#">Hỗ trợ</a>
          </div>
          <p className="font-body-sm text-body-sm text-main/60">© 2024 LumiX Partner. Nền tảng Spa & Salon cao cấp.</p>
        </footer>
      </main>

      {qrVisible && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-h3 text-h3 text-primary">Nạp ví qua PayOS (mock)</h3>
                <p className="text-sm text-main/70">Chọn số tiền, hệ thống sẽ “tạo QR” và cộng số dư khi bạn bấm xác nhận.</p>
              </div>
              <button type="button" className="text-main/60 hover:text-main" onClick={() => setQrVisible(false)}>✕</button>
            </div>

            <div className="mt-5 space-y-3">
              <label className="text-sm font-bold text-main/70">Số tiền nạp</label>
              <input
                className="w-full p-3 rounded-xl border border-slate-300"
                type="number"
                value={topupAmount}
                onChange={(e) => setTopupAmount(Number(e.target.value))}
              />
              <div className="flex gap-2">
                {[100000, 200000, 500000].map((v) => (
                  <button key={v} type="button" className="px-3 py-2 rounded-full border border-slate-300 hover:border-primary" onClick={() => setTopupAmount(v)}>
                    {v.toLocaleString('vi-VN')}đ
                  </button>
                ))}
              </div>

              <div className="mt-3 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                <div className="w-44 h-44 mx-auto rounded-2xl bg-white border border-slate-200 flex items-center justify-center">
                  <span className="text-main/60 text-sm font-bold">QR PayOS</span>
                </div>
                <p className="text-xs text-main/60 mt-2">Demo UI: thay QR thật khi tích hợp PayOS.</p>
              </div>

              <button type="button" className="w-full mt-2 py-3 rounded-xl bg-primary text-white font-bold" onClick={confirmTopup}>
                Tôi đã thanh toán (cộng số dư)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
