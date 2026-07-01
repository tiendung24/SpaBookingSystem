const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb://tdung:12345@ac-aewycvu-shard-00-00.brzmupq.mongodb.net:27017,ac-aewycvu-shard-00-01.brzmupq.mongodb.net:27017,ac-aewycvu-shard-00-02.brzmupq.mongodb.net:27017/SpaBooking?ssl=true&replicaSet=atlas-130vne-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Cluster0';

const rawData = `
1. Nail Minh Hải
16/06: 1 booking gội đầu
19/06: 1 booking nails tay
20/06: 2 booking gội đầu
22/06: 2 nails tay, 1 gội đầu
23/06: 1 combo tay chân, 2 gội đầu
24/06: 2 nối mi, 2 gội đầu
25/06: 1 nails tay, 2 gội đầu
26/06: 3 nails tay, 1 combo tay chân
27/06: 3 gội đầu, 2 nails tay
28/06: 1 booking nails tay
30/06: 1 nails tay, 1 combo tay chân
01/07: 2 nails tay, 1 nails chân
03/07: 1 nối mi, 2 gội đầu
2. Nail Thu Ốc (1 nhân viên)
18/06: 1 booking nails tay
21/06: 2 booking nails tay
24/06: 2 booking nails tay
25/06: 1 combo tay chân, 1 nails tay
26/06: 2 nails tay
28/06: 2 booking nails tay
29/06: 2 combo tay chân, 1 phá móng
30/06: 2 nails tay
01/07: 1 nails tay, 1 nails chân
03/07: 2 nails tay
3. Liên Facial Spa
17/06: 1 booking làm da mặt
21/06: 1 booking gội đầu
23/06: 2 booking nail tay
24/06: 1 Detox Carbon, 2 Gội đầu Massage đầu
25/06: 3 Gội đầu thư giãn, 1 Chemical Peel
27/06: 1 Plasma Cold, 1 Hycinic
28/06: 1 Pro Skin
29/06: 1 Pro Skin
01/07: 1 Gội đầu thư giãn, 1 Gội đầu Massage đầu
02/07: 2 Gội đầu thư giãn
03/07: 2 Gội đầu Massage đầu
4. Nơ Nail
18/06: 1 booking nails
21/06: 1 combo tay chân
25/06: 2 booking nail tay
26/06: 1 booking nhưng shop hủy
28/06: 2 booking nail tay
30/06: 2 booking nail tay
01/07: 1 nails tay
02/07: 2 nails tay
5. VanLavi
16/06: 1 booking nails tay
20/06: 1 booking nails tay
22/06: 2 booking nail tay
24/06: 1 booking nails tay, 1 nails chân
27/06: 2 booking nail tay
28/06: 1 nails tay, 1 nhặt da tạo cầu
29/06: 1 nails tay
30/06: 2 nails tay
01/07: 1 combo tay chân
03/07: 2 nails tay
6. Tiệm Nail Minh Huyền
19/06: 1 booking nails tay
26/06: 2 booking nail tay
29/06: 2 booking nail tay
01/07: 1 combo tay chân
02/07: 2 nails tay
7. Spa Thu Trang
17/06: 1 booking nails tay
20/06: 1 booking nails tay
21/06: 2 booking nail tay
24/06: 2 booking nail tay
25/06: 1 combo tay chân
26/06: 1 nails tay
28/06: 2 combo tay chân
29/06: 1 nails tay
02/07: 2 nails tay
03/07: 2 combo tay chân, 1 nails tay
8. Ngọc Thơ
17/06: 2 booking nail tay, 1 booking nail chân
18/06: 1 booking nối mi
20/06: 2 booking nối mi
23/06: 2 booking nails
24/06: 1 combo tay chân, 1 nối mi
26/06: 1 nails tay, 1 nối mi
27/06: 1 tháo mi, 1 combo tay chân
28/06: 2 booking nail tay
30/06: 1 nails tay
01/07: 1 nails tay, 1 mi
02/07: 1 combo tay chân, 1 nối mi
03/07: 2 nails tay
9. Peony Chill & Spa
24/06: 1 Gội Dưỡng Sinh Bông Bưởi, 2 Spa Foot 90', 1 Combo Aqua Silky
25/06: 1 Combo Darksort, 2 Gội Dưỡng Sinh Tiêu Chuẩn, 2 Spa Body + Đá Nóng 90'
26/06: 1 Spa Body + Đá Nóng 120', 1 Combo Aqua Silky, 1 Micro Vital, 1 Spa Foot 75'
27/06: 1 Organic, 3 Spa Body 75', 1 Gội Tiêu Chuẩn, 1 Gội Bông Bưởi
28/06: 2 Luxury 4, 1 Darksort, 1 Micro Vital, 2 Spa Body + Đá Nóng 90'
29/06: 1 Gội Bông Bưởi, 2 Gội Thảo Dược, 1 Spa Foot 60'
30/06: 1 Spa 4 Hands 120', 2 Gội Bông Bưởi, 1 Organic, 1 Micro Vital
01/07: 1 Darksort, 1 Gội Bông Bưởi, 2 Gội Thảo Dược
02/07: 1 Gội Thủ Đạo Thang, 2 Gội Tiêu Chuẩn, 2 Spa Foot 60'
03/07: 2 Spa Foot 45', 1 Spa Body 60', 2 Gội Thảo Dược
10. Warda Spa Organic
26/06: 2 Gội Tiêu Chuẩn, 1 Gội Thảo Dược
27/06: 2 Gội Bông Bưởi, 1 Spa Body + Đá Nóng 90', 1 Gội Thảo Dược, 2 Gội Tiêu Chuẩn
28/06: 1 Luxury 4, 1 Darksort, 1 Micro Vital
29/06: 1 Spa Body + Đá Nóng 120', 1 Micro Vital, 1 Spa Foot 75'
30/06: 1 Gội Bông Bưởi, 1 Spa Foot 90', 1 Combo Aqua Silky
01/07: 1 Gội Bông Bưởi, 2 Gội Thảo Dược, 1 Spa Foot 60'
02/07: 2 Spa Foot 45', 1 Spa Body + Đá Nóng 90', 1 Gội Thảo Dược
03/07: 1 Darksort, 1 Gội Bông Bưởi, 2 Gội Thảo Dược
11. Nhà Spa
23/06: 3 Spa 4 Hands 60', 2 Gội Bông Bưởi, 2 Spa Body 75'
24/06: 1 Darksort, 2 Gội Tiêu Chuẩn, 2 Spa Body + Đá Nóng 90'
25/06: 1 Gội Bông Bưởi, 2 Gội Thảo Dược, 1 Spa Foot 60'
26/06: 1 Gội Bông Bưởi, 2 Spa Foot 90', 1 Aqua Silky
27/06: Đóng cửa
30/06: 1 Gội Bông Bưởi, 2 Spa Foot 90', 1 Aqua Silky
01/07: 2 Spa Foot 60', 2 Gội Tiêu Chuẩn, 1 Gội Thảo Dược
02/07: 1 Gội Bông Bưởi, 2 Gội Thảo Dược, 1 Spa Foot 60'
03/07: 1 Darksort, 2 Gội Tiêu Chuẩn, 2 Gội Thảo Dược
12. DiDan Nail Art
24/06: 2 booking nails chân, 1 phá móng, 1 đắp gel móng nối
25/06: 2 booking nails tay, 1 booking nails chân, 1 combo tay chân
26/06: 2 booking nails tay, 2 phá móng, 1 combo tay chân
27/06: 2 booking nails tay, 2 combo tay chân, 1 đắp gel nối
28/06: 2 nhặt da sửa form, 3 nails tay, 2 combo tay chân
29/06: 2 nails tay, 2 nails chân
30/06: 2 nails tay, 2 combo tay chân
01/07: 2 booking nails tay, 2 nails chân, 1 combo tay chân
02/07: 2 booking nails tay, 1 booking nails chân
03/07: 4 booking nails tay, 1 combo tay chân
13. Gasy Beauty Home
24/06: 2 booking nails tay, 1 nails chân, 1 combo tay chân
25/06: 3 booking nails tay
26/06: 1 booking nails tay, 2 booking nails chân
27/06: 2 booking nails tay, 1 combo tay chân, 1 nails chân
28/06: 3 nails tay, 2 nails chân
29/06: 3 nails tay, 1 phá móng
30/06: 2 combo tay chân, 3 nails tay
01/07: 2 booking nails tay, 2 booking nails chân, 1 combo tay chân
02/07: 3 booking nails tay
03/07: 3 nails tay, 1 combo tay chân
14. Blue Academy (1 nhân viên)
24/06: 2 booking nails tay, 1 combo tay chân
25/06: 1 nails tay, 1 nails chân
26/06: 1 phá móng, 1 nails tay
27/06: 2 nails tay, 1 combo tay chân
28/06: 2 nails tay, 1 phá móng
29/06: 2 nails tay
30/06: 2 combo tay chân
01/07: 2 nails tay
02/07: 2 combo, 1 nails tay
15. Linh Hương - Mi Nails
24/06: 2 nối mi, 1 nails tay, 1 combo tay chân
25/06: 1 nối mi, 2 nails tay, 1 nails chân
26/06: 3 nối mi, 2 combo tay chân
27/06: Đóng cửa
29/06: 1 mi, 2 nails tay, 1 nails chân
30/06: 1 nối mi, 2 combo tay chân
01/07: 1 tháo mi, 1 nails tay
02/07: 2 nails tay, 1 nails chân
03/07: 2 mi, 2 nails chân
`;

const fNames = ['Nguyễn Thị', 'Lê Ngọc', 'Trần Phương', 'Phạm Quỳnh', 'Đỗ Thanh', 'Hoàng', 'Vũ Thu', 'Đặng Thảo', 'Bùi Hà', 'Hồ Bích'];
const lNames = ['Mai', 'Anh', 'Trang', 'Hương', 'Linh', 'Nhung', 'Thu', 'Vy', 'Oanh', 'Châu', 'Ngân'];
function randomName() {
  return fNames[Math.floor(Math.random()*fNames.length)] + ' ' + lNames[Math.floor(Math.random()*lNames.length)];
}
function randomPhone() {
  const prefix = ['098', '097', '096', '093', '090', '089', '088'];
  const suf = Math.floor(Math.random() * 10000000).toString().padStart(7, '0');
  return prefix[Math.floor(Math.random()*prefix.length)] + suf;
}
function randomEmail(name) {
  const n = name.toLowerCase().replace(/ /g, '').normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return n + Math.floor(Math.random()*100) + "@gmail.com";
}
function randomNote() {
  const notes = ["Khách đặt trước qua Facebook.", "Khách quen.", "Khách đến đúng giờ.", "Khách sử dụng voucher."];
  if (Math.random() < 0.2) return notes[Math.floor(Math.random()*notes.length)];
  return "";
}
function generateBookingCode(shopName) {
  const prefix = shopName.replace(/[^a-zA-Z]/g, '').substring(0, 6).toUpperCase();
  const suf = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
  return prefix + '-' + suf;
}

// Parsing logic
const scheduleData = {};
let currentShop = null;
const lines = rawData.split('\n').map(l => l.trim()).filter(l => l);

for (const line of lines) {
  const shopMatch = line.match(/^\d+\.\s+([^(]+)/);
  if (shopMatch) {
    currentShop = shopMatch[1].trim();
    if (!scheduleData[currentShop]) scheduleData[currentShop] = [];
  } else if (line.match(/^\d{2}\/\d{2}:/)) {
    const [datePart, taskPart] = line.split(':');
    const parts = datePart.trim().split('/');
    const currentDay = `2026-${parts[1]}-${parts[0]}`;
    
    let tasksStr = taskPart.trim();
    if (tasksStr.toLowerCase() === 'không có' || tasksStr.toLowerCase().includes('đóng cửa') || tasksStr.toLowerCase().includes('hủy')) continue;
    
    const parsedTasks = [];
    tasksStr.split(',').forEach(task => {
      let t = task.trim();
      const match = t.match(/^(\d+)\s+(.+)$/);
      if (match) {
        const count = parseInt(match[1]);
        let sName = match[2].trim().replace(/^booking\s+/i, '').replace(/\s+booking$/i, '');
        for(let i = 0; i < count; i++) parsedTasks.push(sName);
      } else {
        parsedTasks.push(t.replace(/^booking\s+/i, ''));
      }
    });
    scheduleData[currentShop].push({ dateStr: currentDay, tasks: parsedTasks });
  }
}

mongoose.connect(MONGODB_URI).then(async () => {
  try {
    console.log('Đang xóa các booking rác cũ (>= 16/06/2026)...');
    const start = new Date('2026-06-15T17:00:00.000Z');
    const rDel = await mongoose.connection.collection('bookings').deleteMany({ startTime: { $gte: start } });
    console.log(`Đã dọn dẹp ${rDel.deletedCount} bookings cũ.`);

    console.log('Đang tải dữ liệu gốc từ MongoDB...');
    const dbShops = await mongoose.connection.collection('shops').find({}).toArray();
    const shopsMap = {};
    for (const s of dbShops) {
      const normalized = s.name.toLowerCase().trim();
      shopsMap[normalized] = s;
    }

    const allServices = await mongoose.connection.collection('services').find({}).toArray();
    const allStaffs = await mongoose.connection.collection('shop_staffs').find({}).toArray();
    
    const servicesByShop = {};
    const staffsByShop = {};
    
    for (const svc of allServices) {
      const sid = svc.shopId.toString();
      if (!servicesByShop[sid]) servicesByShop[sid] = [];
      servicesByShop[sid].push(svc);
    }
    
    for (const stf of allStaffs) {
      const sid = stf.shopId.toString();
      if (!staffsByShop[sid]) staffsByShop[sid] = [];
      staffsByShop[sid].push(stf);
    }

    const allBookings = [];
    let bookingGlobalCounter = 0;
    
    console.log('Đang ghép nối dữ liệu v2...');

    for (const [sName, days] of Object.entries(scheduleData)) {
      const normalizedName = sName.toLowerCase().trim();
      let matchedShop = shopsMap[normalizedName];
      if (!matchedShop) {
        for (const key in shopsMap) {
          if (key.includes(normalizedName) || normalizedName.includes(key)) {
            matchedShop = shopsMap[key];
            break;
          }
        }
      }
      
      if (!matchedShop || matchedShop.name === 'An Nhiên Beauty Spa') continue;

      const shopIdStr = matchedShop._id.toString();
      const services = servicesByShop[shopIdStr] || [];
      const staffs = staffsByShop[shopIdStr] || [];
      
      if (services.length === 0 || staffs.length === 0) continue;

      for (const day of days) {
        let currentSlotTime = new Date(`${day.dateStr}T09:00:00.000Z`);

        for (const taskName of day.tasks) {
          const lowerTask = taskName.toLowerCase();
          let matchedService = services.find(s => s.name.toLowerCase() === lowerTask);
          if (!matchedService) matchedService = services.find(s => s.name.toLowerCase().includes(lowerTask) || lowerTask.includes(s.name.toLowerCase()));
          if (!matchedService) matchedService = services[Math.floor(Math.random() * services.length)]; // Fallback
          
          const staff = staffs[Math.floor(Math.random() * staffs.length)];
          const dur = matchedService.durationMinutes || 60;

          const totalAmt = matchedService.price || 100000;
          const depositAmt = 50000;
          const pfFee = 10000;

          const bookingStartTime = new Date(currentSlotTime);
          const bookingEndTime = new Date(currentSlotTime.getTime() + dur * 60000);
          
          currentSlotTime = new Date(bookingEndTime.getTime() + 15 * 60000);

          const bCode = generateBookingCode(matchedShop.name);
          const cName = randomName();
          
          const bookingDoc = {
            bookingCode: bCode,
            clientAttemptId: 'seed-v2-' + bookingGlobalCounter++,
            shopId: shopIdStr,
            customerName: cName,
            customerPhone: randomPhone(),
            customerEmail: randomEmail(cName),
            serviceId: matchedService._id.toString(),
            staffId: staff._id.toString(),
            startTime: bookingStartTime,
            endTime: bookingEndTime,
            note: randomNote(),
            status: 'completed',
            depositAmount: depositAmt,
            originalDepositAmount: depositAmt,
            totalAmount: totalAmt,
            remainingAmount: totalAmt - depositAmt,
            platformFee: pfFee,
            shopReceiveAmount: totalAmt - pfFee,
            paymentStatus: 'PAID',
            createdAt: new Date(`${day.dateStr}T07:00:00.000Z`),
            updatedAt: bookingEndTime,
            completedAt: bookingEndTime
          };
          allBookings.push(bookingDoc);
        }
      }
    }

    if (allBookings.length > 0) {
      console.log(`Đang insert ${allBookings.length} bookings vào MongoDB...`);
      const res = await mongoose.connection.collection('bookings').insertMany(allBookings);
      console.log(`✅ Đã insert thành công ${res.insertedCount} bookings theo format v2!`);
    } else {
      console.log('Không có booking nào được tạo.');
    }

  } catch(e) {
    console.error('Lỗi khi chạy script:', e);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}).catch(err => {
  console.error('Lỗi kết nối database:', err.message);
  process.exit(1);
});
