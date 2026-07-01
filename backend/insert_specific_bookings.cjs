const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb://tdung:12345@ac-aewycvu-shard-00-00.brzmupq.mongodb.net:27017,ac-aewycvu-shard-00-01.brzmupq.mongodb.net:27017,ac-aewycvu-shard-00-02.brzmupq.mongodb.net:27017/SpaBooking?ssl=true&replicaSet=atlas-130vne-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(MONGODB_URI).then(async () => {
  try {
    const db = mongoose.connection.db;
    console.log('Đã kết nối MongoDB. Bắt đầu xử lý 2 bookings...');

    // Lấy thông tin user
    const user1 = await db.collection('users').findOne({ email: 'lamoanhcvhl@gmail.com' });
    const user2 = await db.collection('users').findOne({ email: 'luvuongtranghg2019@gmail.com' });

    if (!user1) console.warn('Không tìm thấy user lamoanhcvhl@gmail.com. Sẽ sử dụng ID giả định.');
    if (!user2) console.warn('Không tìm thấy user luvuongtranghg2019@gmail.com. Sẽ sử dụng ID giả định.');

    const c1Id = user1 ? user1._id.toString() : new mongoose.Types.ObjectId().toString();
    const c1Name = user1 ? user1.fullName : 'Lâm Oanh';
    const c1Phone = user1 ? user1.phone : '0988123456';

    const c2Id = user2 ? user2._id.toString() : new mongoose.Types.ObjectId().toString();
    const c2Name = user2 ? user2.fullName : 'Lữ Vương Trang';
    const c2Phone = user2 ? user2.phone : '0988654321';

    // Lấy thông tin shops
    const shop1 = await db.collection('shops').findOne({ name: 'Peony Chill & Spa' });
    const shop2 = await db.collection('shops').findOne({ name: 'Nhà Spa' });

    if (!shop1 || !shop2) {
      console.error('Không tìm thấy shop.');
      process.exit(1);
    }

    // Lấy thông tin dịch vụ
    const s1Services = await db.collection('services').find({ shopId: { $in: [shop1._id, shop1._id.toString()] } }).toArray();
    const s2Services = await db.collection('services').find({ shopId: { $in: [shop2._id, shop2._id.toString()] } }).toArray();

    // Tìm spa body 60p cho shop1
    let service1 = s1Services.find(s => s.name.toLowerCase().includes('body') && s.durationMinutes === 60);
    if (!service1) service1 = s1Services.find(s => s.name.toLowerCase().includes('body'));
    if (!service1) service1 = s1Services[0]; // fallback

    // Tìm gội đầu cho shop2
    let service2 = s2Services.find(s => s.name.toLowerCase().includes('gội'));
    if (!service2) service2 = s2Services[0]; // fallback

    // Lấy staff ngẫu nhiên
    const s1Staffs = await db.collection('shop_staffs').find({ shopId: { $in: [shop1._id, shop1._id.toString()] } }).toArray();
    const s2Staffs = await db.collection('shop_staffs').find({ shopId: { $in: [shop2._id, shop2._id.toString()] } }).toArray();
    
    const staff1 = s1Staffs[Math.floor(Math.random() * s1Staffs.length)];
    const staff2 = s2Staffs[Math.floor(Math.random() * s2Staffs.length)];

    // Tạo thời gian
    // Booking 1: 18h tối 30/6
    const b1Start = new Date('2026-06-30T11:00:00.000Z'); // 18:00 UTC+7
    const b1End = new Date(b1Start.getTime() + (service1.durationMinutes || 60) * 60000);
    const b1Created = new Date(b1Start.getTime() - 2 * 3600000); // Đặt trước 2 tiếng

    // Booking 2: 12h 1/7
    const b2Start = new Date('2026-07-01T05:00:00.000Z'); // 12:00 UTC+7
    const b2End = new Date(b2Start.getTime() + (service2.durationMinutes || 60) * 60000);
    const b2Created = new Date(b2Start.getTime() - 3 * 3600000); // Đặt trước 3 tiếng

    function generateBookingCode(shopName) {
      const prefix = shopName.replace(/[^a-zA-Z]/g, '').substring(0, 6).toUpperCase();
      const suf = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
      return prefix + '-' + suf;
    }

    const b1Total = service1.price || 200000;
    const b2Total = service2.price || 150000;

    const booking1 = {
      _id: new mongoose.Types.ObjectId(),
      bookingCode: generateBookingCode(shop1.name),
      shopId: shop1._id.toString(),
      customerId: c1Id,
      customerName: c1Name,
      customerPhone: c1Phone,
      customerEmail: 'lamoanhcvhl@gmail.com',
      serviceId: service1._id.toString(),
      staffId: staff1._id.toString(),
      startTime: b1Start,
      endTime: b1End,
      status: 'completed',
      depositAmount: 50000,
      originalDepositAmount: 50000,
      totalAmount: b1Total,
      remainingAmount: b1Total - 50000,
      platformFee: 10000,
      shopReceiveAmount: b1Total - 10000,
      paymentStatus: 'PAID',
      createdAt: b1Created,
      updatedAt: b1End,
      completedAt: b1End
    };

    const booking2 = {
      _id: new mongoose.Types.ObjectId(),
      bookingCode: generateBookingCode(shop2.name),
      shopId: shop2._id.toString(),
      customerId: c2Id,
      customerName: c2Name,
      customerPhone: c2Phone,
      customerEmail: 'luvuongtranghg2019@gmail.com',
      serviceId: service2._id.toString(),
      staffId: staff2._id.toString(),
      startTime: b2Start,
      endTime: b2End,
      status: 'completed',
      depositAmount: 50000,
      originalDepositAmount: 50000,
      totalAmount: b2Total,
      remainingAmount: b2Total - 50000,
      platformFee: 10000,
      shopReceiveAmount: b2Total - 10000,
      paymentStatus: 'PAID',
      createdAt: b2Created,
      updatedAt: b2End,
      completedAt: b2End
    };

    const bookings = [booking1, booking2];
    await db.collection('bookings').insertMany(bookings);
    console.log('✅ Đã tạo 2 bookings.');

    // Xử lý tài chính
    const walletsMap = {};
    const wallets = await db.collection('wallets').find({ shopId: { $in: [shop1._id.toString(), shop2._id.toString()] } }).toArray();
    for (const w of wallets) walletsMap[w.shopId] = w._id.toString();

    for (const b of bookings) {
      const bIdStr = b._id.toString();
      const sIdStr = b.shopId.toString();
      const wIdStr = walletsMap[sIdStr];

      // BookingStatusLog
      await db.collection('booking_status_logs').insertOne({
        bookingId: bIdStr,
        fromStatus: 'pending',
        toStatus: 'completed',
        action: 'complete',
        createdAt: b.completedAt,
        updatedAt: b.completedAt
      });

      // PayosPayment
      await db.collection('payos_payments').insertOne({
        bookingId: bIdStr,
        shopId: sIdStr,
        amount: 50000,
        status: 'paid',
        paymentType: 'deposit',
        description: `Thanh toán cọc cho booking ${b.bookingCode}`,
        createdAt: b.createdAt,
        updatedAt: b.createdAt
      });

      // Deposit
      await db.collection('deposits').insertOne({
        bookingId: bIdStr,
        shopId: sIdStr,
        amount: 50000,
        status: 'released_to_shop',
        createdAt: b.createdAt,
        updatedAt: b.completedAt
      });

      // PlatformFee
      await db.collection('platform_fees').insertOne({
        bookingId: bIdStr,
        shopId: sIdStr,
        amount: 10000,
        createdAt: b.completedAt
      });

      if (wIdStr) {
        // Wallet Transactions
        await db.collection('wallet_transactions').insertMany([
          {
            shopId: sIdStr,
            walletId: wIdStr,
            type: 'escrow_release_auto',
            amount: 50000,
            description: `LumiX trả cọc booking ${b.bookingCode}`,
            refId: bIdStr,
            status: 'success',
            createdAt: b.completedAt
          },
          {
            shopId: sIdStr,
            walletId: wIdStr,
            type: 'platform_fee',
            amount: -10000,
            description: `Trừ phí nền tảng cho booking ${b.bookingCode}`,
            refId: bIdStr,
            status: 'success',
            createdAt: b.completedAt
          }
        ]);

        // Cập nhật Wallet
        await db.collection('wallets').updateOne(
          { shopId: sIdStr },
          { $inc: { balance: 40000, totalEarnings: 50000 } }
        );
      }
    }
    console.log('✅ Đã tạo các log tài chính, payment và cập nhật ví.');

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
