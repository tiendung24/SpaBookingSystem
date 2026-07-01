const fs = require('fs');
const mongoose = require('mongoose');
mongoose.connect('mongodb+srv://[EMAIL_ADDRESS]/ngocspa?retryWrites=true&w=majority&appName=Cluster0').then(async () => {
  try {
    const start = new Date('2026-06-15T17:00:00.000Z'); /* 16/06 00:00 GMT+7 */
    const end = new Date('2026-06-21T16:59:59.999Z'); /* 21/06 23:59 GMT+7 */

    const bookings = await mongoose.connection.collection('bookings').find({
      startTime: { $gte: start, $lte: end }
    }).sort({ startTime: 1 }).toArray();

    const shopIds = [...new Set(bookings.map(b => b.shopId))];
    const shops = await mongoose.connection.collection('shops').find({
      _id: {
        $in: shopIds.map(id => {
          try { return new mongoose.Types.ObjectId(id); } catch (e) { return id; }
        })
      }
    }).toArray();

    const shopMap = {};
    shops.forEach(s => shopMap[s._id.toString()] = s.name);

    let md = '# Dữ liệu Booking từ 16/06/2026 đến 21/06/2026\n\n';
    md += '| Mã Booking | Cửa hàng | Khách hàng | SĐT | Dịch vụ | Thời gian | Trạng thái | Tổng tiền |\n';
    md += '|---|---|---|---|---|---|---|---|\n';

    bookings.forEach(b => {
      const shopName = shopMap[b.shopId] || 'Không xác định';
      const timeStr = new Date(b.startTime).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
      const total = (b.totalAmount || 0).toLocaleString('vi-VN') + 'đ';
      md += `| ${b.bookingCode || ''} | ${shopName} | ${b.customerName || ''} | ${b.customerPhone || ''} | ${b.serviceName || ''} | ${timeStr} | ${b.status || ''} | ${total} |\n`;
    });

    fs.writeFileSync('c:/Users/pc/.gemini/antigravity-ide/brain/d3f221d1-cb2b-4f93-9e84-a121ce35e7fc/scratch/booking_report_16_to_21.md', md, 'utf8');
    console.log('Report generated. Found ' + bookings.length + ' bookings.');
  } catch (e) {
    console.error(e);
  }
  process.exit(0);
});
