import { useEffect, useMemo, useRef, useState } from 'react';
import ShopSidebar from '../components/shop/ShopSidebar';
import { useShop } from '../context/ShopContext';
import { apiRequest } from '../lib/api';
import { useSearchParams } from 'react-router-dom';
import { useToast } from '../components/ui/ToastProvider';

export default function ShopWalletPage() {
  const { shop, walletTransactions, topupWallet, bookings, loadMeAndShop, token } = useShop();
  const { pushToast } = useToast();
  const [searchParams] = useSearchParams();
  const [cardTransform, setCardTransform] = useState('perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)');
  const [topupAmount, setTopupAmount] = useState(200000);
  const [qrVisible, setQrVisible] = useState(false);

  const walletBalance = Number(shop.wallet?.balance || 0);
  const walletMinBalance = Number(shop.wallet?.minBalance || 100000);
  const isWalletHealthy = walletBalance >= walletMinBalance;
  const previousWalletHealthyRef = useRef(isWalletHealthy);

  const transactions = useMemo(() => {
    return walletTransactions.map((t) => {
      const txType = String(t.type || '')
      const isFee = txType === 'platform_fee' || txType === 'fee'
      const isEscrow = txType.startsWith('escrow_')
      const isPenalty = txType === 'penalty'
      const typeMeta =
        txType === 'topup'
          ? { label: 'Nạp tiền', icon: 'add', cls: 'bg-emerald-100 text-emerald-800', amtCls: 'text-emerald-600 font-bold', sign: '+' }
          : isFee
            ? { label: 'Phí dịch vụ', icon: 'receipt_long', cls: 'bg-blue-100 text-blue-800', amtCls: 'text-main', sign: '' }
            : isEscrow
              ? { label: 'Cọc ký quỹ', icon: 'shield', cls: 'bg-amber-100 text-amber-800', amtCls: 'text-main', sign: '' }
              : isPenalty
                ? { label: 'Phạt', icon: 'gpp_bad', cls: 'bg-rose-100 text-rose-700', amtCls: 'text-red-600 font-bold', sign: '' }
            : { label: 'Khác', icon: 'receipt_long', cls: 'bg-slate-100 text-slate-700', amtCls: 'text-main', sign: '' };
      const amountText = `${t.amount > 0 ? '+' : ''}${Math.abs(Number(t.amount || 0)).toLocaleString('vi-VN')}`;
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

  const escrowItems = useMemo(() => {
    return (bookings || [])
      .filter((b) => b.status === 'confirmed' || b.status === 'checked_in')
      .slice(0, 5)
      .map((b) => {
        const depositAmount = (b.total || 0) * 0.2; // Ước tính cọc 20%
        const etaDate = new Date(b.time);
        etaDate.setDate(etaDate.getDate() + 1); // Tiền về sau 1 ngày dự kiến
        const eta = `${etaDate.getDate()}/${etaDate.getMonth() + 1}`;
        return {
          bookingId: b.bookingCode || `#${b.id.substring(0, 5)}`,
          eta: eta,
          amount: `${Number(depositAmount).toLocaleString('vi-VN')}đ`
        }
      });
  }, [bookings]);

  const walletStats = useMemo(() => {
    let topup = 0;
    let fee = 0;
    let penalty = 0;
    walletTransactions.forEach(t => {
      const txType = String(t.type || '')
      if (txType === 'topup') {
        topup += Number(t.amount || 0)
      } else if (txType === 'platform_fee' || txType === 'fee') {
        fee += Math.abs(Number(t.amount || 0))
      } else if (txType === 'penalty') {
        penalty += Math.abs(Number(t.amount || 0))
      }
    });
    return { topup, fee, penalty };
  }, [walletTransactions]);

  const formatShortValue = (val) => {
    if (val === 0) return '0đ';
    if (val >= 1000000) return (val / 1000000).toFixed(1) + 'M';
    if (val >= 1000) return (val / 1000).toFixed(0) + 'K';
    return val + 'đ';
  };

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

  const [payosData, setPayosData] = useState(null);
  const [loadingQr, setLoadingQr] = useState(false);
  const [topupStatusText, setTopupStatusText] = useState('');
  const topupPollRef = useRef(null);
  const topupRefreshedRef = useRef(false);

  useEffect(() => {
    if (!previousWalletHealthyRef.current && isWalletHealthy) {
      pushToast({
        type: 'success',
        title: 'Link đặt lịch đã hoạt động lại',
        message: `Ví LumiX hiện có ${walletBalance.toLocaleString('vi-VN')}đ, đã đạt mức duy trì.`,
        durationMs: 7000
      });
    }
    previousWalletHealthyRef.current = isWalletHealthy;
  }, [isWalletHealthy, pushToast, walletBalance]);

  useEffect(() => {
    const incomingTopupId =
      searchParams.get('topupId') ||
      searchParams.get('orderCode') ||
      searchParams.get('order_code') ||
      searchParams.get('id') ||
      ''

    const incomingStatus = String(
      searchParams.get('status') ||
      searchParams.get('code') ||
      ''
    ).toLowerCase()

    if (!incomingTopupId) return

    let mounted = true
    ;(async () => {
      try {
        setQrVisible(true)
        setTopupStatusText('PayOS đã quay lại. Đang đồng bộ số dư...')
        const data = await apiRequest(`/api/shop/wallet/topup/${encodeURIComponent(incomingTopupId)}/refresh`, {
          method: 'POST',
          token
        }).catch(async (err) => {
          if (err?.status === 404) return { refreshed: false, status: incomingStatus || 'unknown' }
          throw err
        })

        if (!mounted) return
        const refreshedStatus = String(data?.status || incomingStatus || '').toLowerCase()
        if (refreshedStatus === 'success' || refreshedStatus === 'paid' || refreshedStatus === 'completed') {
          await loadMeAndShop(token).catch(() => null)
          setTopupStatusText('Thanh toán đã được ghi nhận. Ví đã cập nhật và link đặt lịch đã hoạt động lại.')
          pushToast({
            type: 'success',
            title: 'Nạp ví thành công',
            message: 'Ví LumiX đã đủ mức duy trì. Link đặt lịch đã hoạt động lại.',
            durationMs: 7000
          })
          setPayosData(null)
          window.history.replaceState({}, '', '/shop/wallet')
          setTimeout(() => {
            if (!mounted) return
            setQrVisible(false)
            setTopupStatusText('')
          }, 1500)
        } else {
          setTopupStatusText(`Trạng thái thanh toán: ${refreshedStatus || 'pending'}`)
        }
      } catch {
        if (mounted) setTopupStatusText('Không thể đồng bộ thanh toán từ PayOS.')
      }
    })()

    return () => {
      mounted = false
    }
  }, [searchParams, token, loadMeAndShop])

  const createPayosQr = async () => {
    setLoadingQr(true);
    setQrVisible(true);
    try {
      if (topupPollRef.current) {
        clearInterval(topupPollRef.current);
        topupPollRef.current = null;
      }
      setTopupStatusText('Đang tạo liên kết nạp tiền...');
      const res = await topupWallet(Number(topupAmount || 0));
      if (res && res.topup) {
        setPayosData(res.topup);
        topupRefreshedRef.current = false;
        setTopupStatusText('Đã tạo QR. Đang chờ PayOS xác nhận...');

        // Poll topup status until success, then refresh wallet
        const topupId = String(res.topup.topupId || res.topup.orderCode || '');
        if (topupId) {
          let attempts = 0;
          topupPollRef.current = setInterval(async () => {
            try {
              attempts += 1;
              if (attempts > 40) {
                clearInterval(topupPollRef.current);
                topupPollRef.current = null;
                setTopupStatusText('Quá thời gian chờ xác nhận thanh toán.');
                return;
              }
              if (attempts >= 5 && !topupRefreshedRef.current) {
                topupRefreshedRef.current = true;
                await apiRequest(`/api/shop/wallet/topup/${encodeURIComponent(topupId)}/refresh`, {
                  method: 'POST',
                  token
                }).catch(() => null);
              }
              const data = await apiRequest(`/api/shop/wallet/topup/${encodeURIComponent(topupId)}/status`, {
                method: 'GET',
                token
              }).catch((err) => {
                if (err?.status === 404) return { status: 'not_found' };
                throw err;
              });
              const st = String(data.status || '').toLowerCase();
              if (st === 'not_found') {
                clearInterval(topupPollRef.current);
                topupPollRef.current = null;
                setTopupStatusText('Không tìm thấy giao dịch nạp tiền.');
                return;
              }
              if (st && st !== 'pending') {
                setTopupStatusText(`Trạng thái thanh toán: ${st}`);
              }
              if (st === 'success' || st === 'paid' || st === 'completed') {
                clearInterval(topupPollRef.current);
                topupPollRef.current = null;
                try { await loadMeAndShop(token) } catch {}
                setTopupStatusText('Thanh toán đã được ghi nhận. Ví đã cập nhật và link đặt lịch đã hoạt động lại.');
                pushToast({
                  type: 'success',
                  title: 'Nạp ví thành công',
                  message: 'Ví LumiX đã đủ mức duy trì. Link đặt lịch đã hoạt động lại.',
                  durationMs: 7000
                });
                setTimeout(() => {
                  setQrVisible(false);
                  setPayosData(null);
                  setTopupStatusText('');
                }, 1500);
              }
            } catch (e) {
              // ignore polling errors
              setTopupStatusText('Không thể kiểm tra trạng thái thanh toán.');
            }
          }, 3000);
        }
      }
    } catch (err) {
      console.error("Lỗi tạo link nạp tiền:", err);
    } finally {
      setLoadingQr(false);
    }
  };

  const confirmTopup = () => {
    setQrVisible(false);
    setPayosData(null);
    setTopupStatusText('');
    topupRefreshedRef.current = false;
  };

  useEffect(() => {
    return () => {
      if (topupPollRef.current) {
        clearInterval(topupPollRef.current);
        topupPollRef.current = null;
      }
      topupRefreshedRef.current = false;
    };
  }, []);

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

        <div className={`mb-8 rounded-3xl border p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4 ${isWalletHealthy ? 'border-emerald-200 bg-emerald-50/80' : 'border-amber-200 bg-amber-50/90'}`}>
          <div className="flex items-start gap-3">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${isWalletHealthy ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                {isWalletHealthy ? 'check_circle' : 'warning'}
              </span>
            </div>
            <div>
              <p className={`font-h3 text-h3 ${isWalletHealthy ? 'text-emerald-800' : 'text-amber-800'}`}>
                {isWalletHealthy ? 'Ví LumiX đang hoạt động' : 'Ví LumiX dưới mức duy trì'}
              </p>
              <p className="font-body-md text-body-md text-main/80 mt-1">
                {isWalletHealthy
                  ? `Số dư hiện tại ${walletBalance.toLocaleString('vi-VN')}đ, ngưỡng tối thiểu ${walletMinBalance.toLocaleString('vi-VN')}đ.`
                  : `Ví hiện tại chỉ còn ${walletBalance.toLocaleString('vi-VN')}đ. Bạn cần nạp tối thiểu ${walletMinBalance.toLocaleString('vi-VN')}đ để link đặt lịch tiếp tục hoạt động.`}
              </p>
            </div>
          </div>
          {!isWalletHealthy ? (
            <button
              type="button"
              onClick={createPayosQr}
              className="px-5 py-3 rounded-xl bg-amber-600 text-white font-label-bold text-label-bold hover:bg-amber-700 transition-all active:scale-95"
            >
              Nạp ví ngay
            </button>
          ) : null}
        </div>

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
                <h3 className="font-h1 text-h1 font-bold">{walletBalance.toLocaleString('vi-VN')} VNĐ</h3>
              </div>
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full backdrop-blur-md ${isWalletHealthy ? 'bg-white/20' : 'bg-amber-500/20'}`}>
                <span className={`w-2 h-2 rounded-full animate-pulse ${isWalletHealthy ? 'bg-green-400' : 'bg-amber-300'}`}></span>
                <span className="font-label-bold text-label-bold">{isWalletHealthy ? 'Link đang hoạt động' : 'Link tạm ngưng'}</span>
              </div>
            </div>

            <div className="flex items-end justify-between z-10 mt-8">
              <div className="flex flex-col">
                <span className="font-body-sm text-body-sm opacity-80">Số hiệu ví</span>
                <span className="font-label-bold text-label-bold">LMX-{shop.id?.substring(0, 8).toUpperCase() || '8899-2422'}</span>
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
                  Bạn cần duy trì tối thiểu <strong>{walletMinBalance.toLocaleString('vi-VN')}đ</strong> để nhận lịch online. Nếu số dư thấp hơn, link sẽ tạm ngưng hoạt động.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-4 rounded-xl bg-slate-100">
                <p className="font-body-sm text-body-sm text-main/70 uppercase">Tổng nạp</p>
                <p className="font-h3 text-h3 text-primary">+{formatShortValue(walletStats.topup)}</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-100">
                <p className="font-body-sm text-body-sm text-main/70 uppercase">Tổng phí booking</p>
                <p className="font-h3 text-h3 text-main">-{formatShortValue(walletStats.fee)}</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-100">
                <p className="font-body-sm text-body-sm text-main/70 uppercase">Phạt/Khác</p>
                <p className="font-h3 text-h3 text-red-600">-{formatShortValue(walletStats.penalty)}</p>
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
                  <p className="font-h2 text-h2 text-amber-700">{Number(shop.wallet?.escrow || 0).toLocaleString('vi-VN')} VNĐ</p>
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
                <h3 className="font-h3 text-h3 text-primary">Nạp ví qua PayOS</h3>
                <p className="text-sm text-main/70">Chọn số tiền, hệ thống sẽ tạo mã QR và cộng số dư khi bạn bấm xác nhận.</p>
              </div>
              <button type="button" className="text-main/60 hover:text-main" onClick={() => setQrVisible(false)}>✕</button>
            </div>

            <div className="mt-5 space-y-3">
              {!payosData ? (
                <>
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
                  <button type="button" className="w-full mt-4 py-3 rounded-xl bg-primary text-white font-bold flex items-center justify-center gap-2" onClick={createPayosQr} disabled={loadingQr}>
                    {loadingQr ? <span className="material-symbols-outlined animate-spin">refresh</span> : null}
                    {loadingQr ? 'Đang tạo liên kết...' : 'Tạo liên kết nạp tiền'}
                  </button>
                </>
              ) : (
                <>
                  {topupStatusText ? (
                    <div className="mb-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
                      {topupStatusText}
                    </div>
                  ) : null}
                  <div className="mt-3 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                    <div className="w-48 h-48 mx-auto rounded-2xl bg-white border border-slate-200 flex items-center justify-center overflow-hidden p-2">
                       {payosData.qrCodeUrl ? (
                         <img src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(payosData.qrCodeUrl)}`} alt="PayOS QR" className="w-full h-full object-contain" />
                       ) : (
                         <span className="text-main/60 text-sm font-bold">QR PayOS</span>
                       )}
                    </div>
                    <p className="text-lg font-bold text-primary mt-3">{Number(payosData.amount || topupAmount).toLocaleString('vi-VN')}đ</p>
                    <p className="text-xs text-main/60 mt-1">Mã GD: {payosData.description || payosData.topupId}</p>
                  </div>

                  {payosData.checkoutUrl && (
                    <a href={payosData.checkoutUrl} target="_blank" rel="noreferrer" className="w-full block text-center mt-2 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors shadow-md">
                      Mở trang thanh toán (PayOS)
                    </a>
                  )}
                  <button type="button" className="w-full mt-2 py-3 rounded-xl border-2 border-primary text-primary font-bold hover:bg-primary hover:text-white transition-colors" onClick={confirmTopup}>
                    Đóng
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
