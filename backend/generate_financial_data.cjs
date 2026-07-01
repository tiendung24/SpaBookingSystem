const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb://tdung:12345@ac-aewycvu-shard-00-00.brzmupq.mongodb.net:27017,ac-aewycvu-shard-00-01.brzmupq.mongodb.net:27017,ac-aewycvu-shard-00-02.brzmupq.mongodb.net:27017/SpaBooking?ssl=true&replicaSet=atlas-130vne-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(MONGODB_URI).then(async () => {
  try {
    console.log('Bắt đầu đồng bộ dữ liệu tài chính cho các bookings seed-v2...');

    const db = mongoose.connection.db;

    // Lấy các booking v2 đã tạo
    const bookings = await db.collection('bookings').find({ clientAttemptId: { $regex: /^seed-v2-/ } }).toArray();
    console.log(`Tìm thấy ${bookings.length} bookings để xử lý tài chính.`);

    if (bookings.length === 0) {
      console.log('Không có gì để xử lý.');
      process.exit(0);
    }

    // Lấy danh sách ví hiện tại
    const wallets = await db.collection('wallets').find({}).toArray();
    const walletsMap = {};
    for (const w of wallets) {
      walletsMap[w.shopId.toString()] = w;
    }

    const depositsToInsert = [];
    const platformFeesToInsert = [];
    const walletTxToInsert = [];
    const walletUpdates = {};

    for (const b of bookings) {
      const bId = b._id;
      const bIdStr = bId.toString();
      const sIdStr = b.shopId.toString();
      const wIdStr = walletsMap[sIdStr] ? walletsMap[sIdStr]._id.toString() : null;

      if (!wIdStr) continue;

      const completedTime = b.completedAt || b.endTime || new Date();

      // 1. Deposit
      depositsToInsert.push({
        bookingId: bIdStr,
        shopId: sIdStr,
        amount: 50000,
        status: 'released_to_shop',
        createdAt: b.createdAt,
        updatedAt: completedTime
      });

      // 2. Platform Fee
      platformFeesToInsert.push({
        bookingId: bIdStr,
        shopId: sIdStr,
        amount: 10000,
        createdAt: completedTime
      });

      // 3. Wallet Transactions (Escrow + Fee)
      walletTxToInsert.push({
        shopId: sIdStr,
        walletId: wIdStr,
        type: 'escrow_release_auto',
        amount: 50000,
        description: `LumiX trả cọc booking ${b.bookingCode}`,
        refId: bIdStr,
        status: 'success',
        createdAt: completedTime
      });

      walletTxToInsert.push({
        shopId: sIdStr,
        walletId: wIdStr,
        type: 'platform_fee',
        amount: -10000,
        description: `Trừ phí nền tảng cho booking ${b.bookingCode}`,
        refId: bIdStr,
        status: 'success',
        createdAt: completedTime
      });

      // Calculate aggregated wallet update
      if (!walletUpdates[sIdStr]) {
        walletUpdates[sIdStr] = { balanceInc: 0, earningsInc: 0 };
      }
      walletUpdates[sIdStr].balanceInc += 40000; // 50000 - 10000
      walletUpdates[sIdStr].earningsInc += 50000; // Doanh thu trên ví chỉ tính phần cọc được trả
    }

    console.log(`Chuẩn bị insert: ${depositsToInsert.length} deposits, ${platformFeesToInsert.length} platform fees, ${walletTxToInsert.length} wallet txs.`);

    if (depositsToInsert.length > 0) {
      await db.collection('deposits').insertMany(depositsToInsert);
      console.log('✅ Đã insert deposits.');
    }
    if (platformFeesToInsert.length > 0) {
      await db.collection('platform_fees').insertMany(platformFeesToInsert);
      console.log('✅ Đã insert platform_fees.');
    }
    if (walletTxToInsert.length > 0) {
      await db.collection('wallet_transactions').insertMany(walletTxToInsert);
      console.log('✅ Đã insert wallet_transactions.');
    }

    console.log('Đang cập nhật số dư ví các shop...');
    let updatedShops = 0;
    for (const [shopId, incs] of Object.entries(walletUpdates)) {
      await db.collection('wallets').updateOne(
        { shopId: shopId },
        { 
          $inc: { 
            balance: incs.balanceInc, 
            totalEarnings: incs.earningsInc 
          } 
        }
      );
      updatedShops++;
    }
    console.log(`✅ Đã cập nhật ví cho ${updatedShops} shops.`);

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
