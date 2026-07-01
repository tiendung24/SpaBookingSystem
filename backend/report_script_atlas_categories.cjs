const fs = require('fs');
const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb://tdung:12345@ac-aewycvu-shard-00-00.brzmupq.mongodb.net:27017,ac-aewycvu-shard-00-01.brzmupq.mongodb.net:27017,ac-aewycvu-shard-00-02.brzmupq.mongodb.net:27017/SpaBooking?ssl=true&replicaSet=atlas-130vne-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(MONGODB_URI).then(async () => {
  try {
    const start = new Date('2026-06-15T17:00:00.000Z');
    const end = new Date('2026-06-21T16:59:59.999Z');
    
    // Fetch bookings
    const bookings = await mongoose.connection.collection('bookings').find({ 
      startTime: { $gte: start, $lte: end } 
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

    // Transform data
    const data = bookings.map(b => {
      const shopName = shopMap[b.shopId] || 'Không xác định';
      const timeStr = new Date(b.startTime).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
      const parts = timeStr.split(' ');
      const time = parts[0];
      const date = parts[1];
      
      const service = serviceMap[b.serviceId] || {};
      const serviceName = service.name || 'Dịch vụ rác/Đã xoá';
      const catId = service.categoryId ? service.categoryId.toString() : '';
      const categoryName = categoryMap[catId] || 'Khác';
      
      return { 
        code: b.bookingCode || '', 
        shop: shopName, 
        customer: b.customerName || '', 
        date, 
        timeStr: time,
        serviceName,
        categoryName
      };
    });

    // Grouping: Date -> Category -> Shop
    const grouped = {};
    data.forEach(row => {
      if (!grouped[row.date]) grouped[row.date] = {};
      if (!grouped[row.date][row.categoryName]) grouped[row.date][row.categoryName] = {};
      if (!grouped[row.date][row.categoryName][row.shop]) grouped[row.date][row.categoryName][row.shop] = [];
      grouped[row.date][row.categoryName][row.shop].push(row);
    });

    const dates = Object.keys(grouped).sort((a, b) => {
      const partsA = a.split('/');
      const partsB = b.split('/');
      return new Date(partsA[2], partsA[1] - 1, partsA[0]) - new Date(partsB[2], partsB[1] - 1, partsB[0]);
    });

    let out = '# Thống kê Booking theo Ngày, Loại Dịch Vụ và Tiệm\n\n';

    dates.forEach(date => {
      out += '## Ngày ' + date + '\n\n';
      
      Object.keys(grouped[date]).sort().forEach(category => {
        out += '### 💅 Loại dịch vụ: ' + category + '\n\n';
        
        Object.keys(grouped[date][category]).sort().forEach(shop => {
          out += '#### 🏪 Tiệm: ' + shop + '\n';
          out += '| Thời gian | Mã Booking | Khách hàng | Dịch vụ cụ thể |\n';
          out += '|---|---|---|---|\n';
          grouped[date][category][shop].sort((a,b) => a.timeStr.localeCompare(b.timeStr)).forEach(b => {
            out += `| ${b.timeStr} | ${b.code} | ${b.customer} | ${b.serviceName} |\n`;
          });
          out += '\n';
        });
      });
    });

    fs.writeFileSync('c:/Users/pc/.gemini/antigravity-ide/brain/d3f221d1-cb2b-4f93-9e84-a121ce35e7fc/booking_grouped_categories.md', out, 'utf8');
    console.log('✅ Generated report with categories successfully!');
  } catch(e) {
    console.error('Lỗi:', e);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}).catch(err => {
  console.error('Lỗi kết nối:', err);
  process.exit(1);
});
