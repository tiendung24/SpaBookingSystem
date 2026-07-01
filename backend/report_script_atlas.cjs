const fs = require('fs');
const mongoose = require('mongoose');

// Kết nối đến Mongo Atlas của bạn (Sử dụng chuỗi kết nối DNS thẳng để bypass lỗi SRV)
const MONGODB_URI = 'mongodb://tdung:12345@ac-aewycvu-shard-00-00.brzmupq.mongodb.net:27017,ac-aewycvu-shard-00-01.brzmupq.mongodb.net:27017,ac-aewycvu-shard-00-02.brzmupq.mongodb.net:27017/SpaBooking?ssl=true&replicaSet=atlas-130vne-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(MONGODB_URI).then(async () => {
  try {
    const start = new Date('2026-06-15T17:00:00.000Z'); /* 16/06 00:00 GMT+7 */
    const end = new Date('2026-06-21T16:59:59.999Z'); /* 21/06 23:59 GMT+7 */
    
    const bookings = await mongoose.connection.collection('bookings').find({ 
      startTime: { $gte: start, $lte: end } 
    }).sort({ startTime: 1 }).toArray();
    
    const shopIds = [...new Set(bookings.map(b => b.shopId))];
    const shops = await mongoose.connection.collection('shops').find({ 
      _id: { $in: shopIds.map(id => {
        try { return new mongoose.Types.ObjectId(id); } catch(e) { return id; }
      })} 
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
    
    fs.writeFileSync('booking_report.md', md, 'utf8');
    console.log('✅ Đã tạo file báo cáo booking_report.md thành công. Tìm thấy ' + bookings.length + ' bookings.');
  } catch(e) {
    console.error('Lỗi khi truy vấn:', e);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}).catch(err => {
  console.error('Lỗi kết nối database:', err.message);
  process.exit(1);
});
