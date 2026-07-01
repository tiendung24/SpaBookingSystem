const fs = require('fs');
const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb://tdung:12345@ac-aewycvu-shard-00-00.brzmupq.mongodb.net:27017,ac-aewycvu-shard-00-01.brzmupq.mongodb.net:27017,ac-aewycvu-shard-00-02.brzmupq.mongodb.net:27017/SpaBooking?ssl=true&replicaSet=atlas-130vne-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(MONGODB_URI).then(async () => {
  try {
    // 16/06/2026 00:00 GMT+7 => 2026-06-15T17:00:00.000Z
    const end = new Date('2026-06-15T17:00:00.000Z');
    
    const bookings = await mongoose.connection.collection('bookings').find({ 
      startTime: { $lt: end } 
    }).sort({ startTime: 1 }).toArray();
    
    // Fetch shops
    const shopIds = [...new Set(bookings.map(b => b.shopId))];
    const shops = await mongoose.connection.collection('shops').find({ 
      _id: { $in: shopIds.map(id => { try { return new mongoose.Types.ObjectId(id); } catch(e) { return id; } })} 
    }).toArray();
    const shopMap = {};
    shops.forEach(s => shopMap[s._id.toString()] = s.name);

    // Fetch services
    const serviceIds = [...new Set(bookings.map(b => b.serviceId).filter(Boolean))];
    const services = await mongoose.connection.collection('services').find({
      _id: { $in: serviceIds.map(id => { try { return new mongoose.Types.ObjectId(id); } catch(e) { return id; } })}
    }).toArray();
    const serviceMap = {};
    const categoryIds = new Set();
    services.forEach(s => {
      serviceMap[s._id.toString()] = s;
      if(s.categoryId) categoryIds.add(s.categoryId.toString());
    });

    // Fetch categories
    const categories = await mongoose.connection.collection('service_categories').find({
      _id: { $in: [...categoryIds].map(id => { try { return new mongoose.Types.ObjectId(id); } catch(e) { return id; } })}
    }).toArray();
    const categoryMap = {};
    categories.forEach(c => {
      categoryMap[c._id.toString()] = c.name;
    });

    // Grouping structure: by Shop -> array of bookings
    const grouped = {};
    
    bookings.forEach(b => {
      const shopName = shopMap[b.shopId] || 'Không xác định';
      const timeStr = new Date(b.startTime).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
      const total = (b.totalAmount || 0).toLocaleString('vi-VN') + 'đ';
      
      const service = serviceMap[b.serviceId] || {};
      const serviceName = service.name || 'Dịch vụ rác/Đã xoá';
      const catId = service.categoryId ? service.categoryId.toString() : '';
      const categoryName = categoryMap[catId] || 'Khác';

      if (!grouped[shopName]) grouped[shopName] = [];
      grouped[shopName].push({
        code: b.bookingCode || '',
        customer: b.customerName || '',
        phone: b.customerPhone || '',
        category: categoryName,
        service: serviceName,
        time: timeStr,
        status: b.status || '',
        total: total,
        startTimeObj: b.startTime
      });
    });
    
    let md = '# Dữ liệu Booking TRƯỚC ngày 16/06/2026 (Phân theo Tiệm)\n\n';

    if (Object.keys(grouped).length === 0) {
      md += 'Không tìm thấy booking nào trước ngày 16/06/2026.\n';
    } else {
      Object.keys(grouped).sort().forEach(shopName => {
        md += `## 🏪 Cửa hàng: ${shopName}\n\n`;
        md += '| Mã Booking | Khách hàng | SĐT | Loại dịch vụ | Dịch vụ cụ thể | Thời gian | Trạng thái | Tổng tiền |\n';
        md += '|---|---|---|---|---|---|---|---|\n';

        // Sort bookings by time within the shop
        grouped[shopName].sort((a, b) => new Date(a.startTimeObj) - new Date(b.startTimeObj)).forEach(row => {
          md += `| ${row.code} | ${row.customer} | ${row.phone} | ${row.category} | ${row.service} | ${row.time} | ${row.status} | ${row.total} |\n`;
        });
        md += '\n';
      });
    }
    
    fs.writeFileSync('c:/Users/pc/.gemini/antigravity-ide/brain/d3f221d1-cb2b-4f93-9e84-a121ce35e7fc/booking_report_before_16_06.md', md, 'utf8');
    console.log('✅ Đã tạo file báo cáo booking_report_before_16_06.md thành công. Tìm thấy ' + bookings.length + ' bookings.');
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
