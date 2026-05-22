import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import ShopSidebar from '../components/shop/ShopSidebar';
import { useShop } from '../context/ShopContext';

const statuses = ['Tất cả', 'Chờ xác nhận', 'Đã xác nhận', 'Đang phục vụ', 'Hoàn thành', 'Đã hủy'];

const mapStatus = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  checked_in: 'Đang phục vụ',
  completed: 'Hoàn thành',
  canceled: 'Đã hủy',
  no_show: 'Đã hủy'
};

function statusClass(label) {
  if (label === 'Hoàn thành') return 'text-emerald-600';
  if (label === 'Chờ xác nhận') return 'text-amber-700';
  if (label === 'Đã xác nhận' || label === 'Đang phục vụ') return 'text-primary';
  return 'text-red-600';
}

export default function ShopBookingsPage() {
  const { bookings, services, staff } = useShop();
  const [selectedStatus, setSelectedStatus] = useState('Tất cả');

  const rows = useMemo(() => {
    return bookings.map((booking) => {
      const service = services.find((s) => s.id === booking.serviceId);
      const employee = staff.find((s) => s.id === booking.staffId);
      const status = mapStatus[booking.status] ?? 'Chờ xác nhận';
      return {
        ...booking,
        statusLabel: status,
        serviceName: service?.name ?? 'Dịch vụ',
        staffName: employee?.name ?? 'Chưa phân công',
        timeLabel: `${new Date(booking.time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - ${new Date(booking.endTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`
      };
    });
  }, [bookings, services, staff]);

  const filtered = rows.filter((row) => selectedStatus === 'Tất cả' || row.statusLabel === selectedStatus);

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,#f9f9ff_0%,#e7eeff_100%)] text-main">
      <ShopSidebar onNewBooking={() => console.log('Tạo lịch hẹn mới')} />
      <main className="ml-64 p-6 md:p-10 min-h-screen">
        <header className="mb-8">
          <h1 className="font-h2 text-h2 text-primary">Quản lý lịch hẹn</h1>
          <p className="text-main/70">Theo dõi và cập nhật lịch trình dịch vụ hôm nay.</p>
        </header>

        <div className="mb-6 flex flex-wrap gap-2">
          {statuses.map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setSelectedStatus(status)}
              className={`px-4 py-2 rounded-full border text-sm ${
                selectedStatus === status ? 'border-primary bg-primary/10 text-primary font-bold' : 'border-slate-300 text-main/70'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        <section className="glass-card rounded-2xl overflow-hidden bg-white/70">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px]">
              <thead className="bg-primary/5 border-b border-primary/10">
                <tr>
                  {['Mã', 'Khách hàng', 'Dịch vụ', 'Nhân viên', 'Thời gian', 'Tiền cọc', 'Trạng thái', 'Chi tiết'].map((h) => (
                    <th key={h} className="p-4 text-left font-label-bold text-label-bold text-primary">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filtered.map((booking) => (
                  <tr key={booking.id} className="hover:bg-white/60">
                    <td className="p-4 font-bold text-primary">{`#${booking.id}`}</td>
                    <td className="p-4">
                      <p className="font-semibold">{booking.customer}</p>
                      <p className="text-xs text-main/60">{booking.phone}</p>
                    </td>
                    <td className="p-4">{booking.serviceName}</td>
                    <td className="p-4">{booking.staffName}</td>
                    <td className="p-4 text-sm">{booking.timeLabel}</td>
                    <td className="p-4">{booking.deposit.toLocaleString('vi-VN')}đ</td>
                    <td className={`p-4 font-bold ${statusClass(booking.statusLabel)}`}>{booking.statusLabel}</td>
                    <td className="p-4">
                      <Link className="px-3 py-1.5 rounded-lg border border-primary text-primary hover:bg-primary/10 text-sm" to={`/shop/bookings/${booking.id}`}>
                        Xem
                      </Link>
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
