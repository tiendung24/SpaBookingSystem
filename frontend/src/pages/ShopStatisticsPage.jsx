import { useMemo, useState } from 'react';
import ShopSidebar from '../components/shop/ShopSidebar';

const rangeOptions = [
  { key: '7d', label: '7 ngày' },
  { key: '30d', label: '30 ngày' },
  { key: '90d', label: '90 ngày' }
];

const revenueByRange = {
  '7d': [12, 18, 15, 20, 22, 24, 19],
  '30d': [8, 10, 12, 11, 14, 16, 13, 15, 17, 18, 20, 19],
  '90d': [6, 8, 9, 11, 13, 14, 15, 16, 18, 19, 21, 22]
};

const serviceRows = [
  { name: 'Gội đầu dưỡng sinh', bookings: 124, revenue: 18600000, rate: 34 },
  { name: 'Nail Gel Cao Cấp', bookings: 98, revenue: 31360000, rate: 27 },
  { name: 'Massage Đá Nóng', bookings: 65, revenue: 29250000, rate: 18 },
  { name: 'Chăm sóc da chuyên sâu', bookings: 51, revenue: 25500000, rate: 14 }
];

function fmtVnd(v) {
  return `${v.toLocaleString('vi-VN')}đ`;
}

export default function ShopStatisticsPage() {
  const [range, setRange] = useState('30d');
  const data = revenueByRange[range];
  const maxValue = Math.max(...data);

  const totalRevenue = useMemo(() => {
    const sum = data.reduce((a, b) => a + b, 0);
    return sum * 1000000;
  }, [data]);

  const bookingStats = { completed: 72, pending: 18, canceled: 10 };

  return (
    <div className="min-h-screen bg-slate-50 text-main">
      <ShopSidebar onNewBooking={() => console.log('Tạo lịch hẹn mới')} />

      <main className="ml-64 p-6 md:p-10 space-y-8">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="font-h2 text-h2 text-primary">Thống kê kinh doanh</h1>
            <p className="font-body-md text-body-md text-main/70">Theo dõi hiệu suất doanh thu, đặt lịch và dịch vụ theo thời gian.</p>
          </div>
          <div className="flex items-center gap-2 p-1 bg-white rounded-full border border-slate-200">
            {rangeOptions.map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => setRange(opt.key)}
                className={`px-4 py-2 rounded-full font-label-bold text-label-bold transition-all ${
                  range === opt.key ? 'bg-primary text-white' : 'text-main/70 hover:text-primary'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <article className="glass-card bg-white rounded-3xl p-6">
            <p className="text-main/60 text-xs uppercase font-bold">Tổng doanh thu</p>
            <h3 className="font-h3 text-h3 text-primary mt-2">{fmtVnd(totalRevenue)}</h3>
          </article>
          <article className="glass-card bg-white rounded-3xl p-6">
            <p className="text-main/60 text-xs uppercase font-bold">Lượt đặt lịch</p>
            <h3 className="font-h3 text-h3 text-main mt-2">338</h3>
          </article>
          <article className="glass-card bg-white rounded-3xl p-6">
            <p className="text-main/60 text-xs uppercase font-bold">Tỷ lệ lấp đầy</p>
            <h3 className="font-h3 text-h3 text-emerald-600 mt-2">81%</h3>
          </article>
          <article className="glass-card bg-white rounded-3xl p-6">
            <p className="text-main/60 text-xs uppercase font-bold">Tỷ lệ hủy</p>
            <h3 className="font-h3 text-h3 text-red-600 mt-2">10%</h3>
          </article>
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <article className="glass-card bg-white rounded-3xl p-6 xl:col-span-2">
            <h4 className="font-h3 text-h3 text-primary mb-4">Doanh thu theo kỳ</h4>
            <div className="h-64 flex items-end gap-2 border-b border-slate-200 pb-2">
              {data.map((v, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <div
                    className="w-full max-w-8 bg-primary/35 hover:bg-primary rounded-t-lg transition-all"
                    style={{ height: `${Math.max(20, (v / maxValue) * 220)}px` }}
                  />
                  <span className="text-[10px] text-main/60 font-label-bold">{i + 1}</span>
                </div>
              ))}
            </div>
          </article>

          <article className="glass-card bg-white rounded-3xl p-6">
            <h4 className="font-h3 text-h3 text-primary mb-4">Trạng thái booking</h4>
            <div className="w-44 h-44 mx-auto rounded-full"
              style={{
                background: `conic-gradient(#16a34a 0 ${bookingStats.completed}%, #f59e0b ${bookingStats.completed}% ${bookingStats.completed + bookingStats.pending}%, #dc2626 ${bookingStats.completed + bookingStats.pending}% 100%)`
              }}
            >
              <div className="w-28 h-28 bg-white rounded-full mx-auto relative top-8" />
            </div>
            <div className="mt-6 space-y-2 text-sm">
              <p className="flex justify-between"><span className="text-main/70">Hoàn thành</span><b className="text-emerald-600">{bookingStats.completed}%</b></p>
              <p className="flex justify-between"><span className="text-main/70">Chờ xử lý</span><b className="text-amber-600">{bookingStats.pending}%</b></p>
              <p className="flex justify-between"><span className="text-main/70">Đã hủy</span><b className="text-red-600">{bookingStats.canceled}%</b></p>
            </div>
          </article>
        </section>

        <section className="glass-card bg-white rounded-3xl overflow-hidden">
          <div className="p-6 border-b border-slate-200">
            <h4 className="font-h3 text-h3 text-primary">Top dịch vụ theo doanh thu</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs uppercase text-main/60">Dịch vụ</th>
                  <th className="px-6 py-4 text-left text-xs uppercase text-main/60">Lượt đặt</th>
                  <th className="px-6 py-4 text-left text-xs uppercase text-main/60">Doanh thu</th>
                  <th className="px-6 py-4 text-left text-xs uppercase text-main/60">Tỷ trọng</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {serviceRows.map((row) => (
                  <tr key={row.name} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-label-bold text-main">{row.name}</td>
                    <td className="px-6 py-4 text-main/80">{row.bookings}</td>
                    <td className="px-6 py-4 text-primary font-bold">{fmtVnd(row.revenue)}</td>
                    <td className="px-6 py-4">
                      <div className="w-44 h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${row.rate}%` }} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}

