const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb://tdung:12345@ac-aewycvu-shard-00-00.brzmupq.mongodb.net:27017,ac-aewycvu-shard-00-01.brzmupq.mongodb.net:27017,ac-aewycvu-shard-00-02.brzmupq.mongodb.net:27017/SpaBooking?ssl=true&replicaSet=atlas-130vne-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(MONGODB_URI).then(async () => {
  try {
    const validBookings = await mongoose.connection.collection('bookings').find({}, { projection: { _id: 1 } }).toArray();
    const validBookingIdsString = validBookings.map(b => b._id.toString());
    const validBookingIdsObject = validBookings.map(b => b._id);

    console.log(`Đang dọn dẹp dữ liệu tài chính rác (Phí admin và Ví shop)...`);

    // 1. Dọn dẹp platform_fees (Admin)
    const pfFilter = {
      $and: [
        { bookingId: { $exists: true } },
        { bookingId: { $ne: null } },
        { bookingId: { $nin: validBookingIdsString } },
        { bookingId: { $nin: validBookingIdsObject } }
      ]
    };
    const r1 = await mongoose.connection.collection('platform_fees').deleteMany(pfFilter);
    console.log(`- Xóa ${r1.deletedCount} bản ghi từ platform_fees (Admin)`);

    // 2. Dọn dẹp wallet_transactions (Shop)
    const wtFilter = {
      $and: [
        { refId: { $exists: true } },
        { refId: { $ne: null } },
        { refId: { $nin: validBookingIdsString } },
        { refId: { $nin: validBookingIdsObject } }
      ]
    };
    const r2 = await mongoose.connection.collection('wallet_transactions').deleteMany(wtFilter);
    console.log(`- Xóa ${r2.deletedCount} bản ghi từ wallet_transactions`);

    // 3. Tính toán lại số dư cho tất cả các ví
    const wallets = await mongoose.connection.collection('wallets').find({}).toArray();
    let resetCount = 0;
    
    for (const w of wallets) {
      const walletIdString = w._id.toString();
      
      const txs = await mongoose.connection.collection('wallet_transactions').find({
        $or: [
          { walletId: w._id },
          { walletId: walletIdString }
        ],
        status: 'success'
      }).toArray();
      
      let newBalance = 0;
      txs.forEach(tx => {
        newBalance += (tx.amount || 0);
      });
      
      if (w.balance !== newBalance) {
        await mongoose.connection.collection('wallets').updateOne(
          { _id: w._id },
          { $set: { balance: newBalance, updatedAt: new Date() } }
        );
        resetCount++;
      }
    }
    console.log(`- Đã cập nhật lại số dư cho ${resetCount} ví (do chênh lệch sau khi xóa)`);

    console.log('✅ Hoàn tất dọn dẹp tiền bạc (Ví & Phí)!');
  } catch(e) {
    console.error('Lỗi khi xóa:', e);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}).catch(err => {
  console.error('Lỗi kết nối database:', err.message);
  process.exit(1);
});
