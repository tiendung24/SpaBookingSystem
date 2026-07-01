const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb://tdung:12345@ac-aewycvu-shard-00-00.brzmupq.mongodb.net:27017,ac-aewycvu-shard-00-01.brzmupq.mongodb.net:27017,ac-aewycvu-shard-00-02.brzmupq.mongodb.net:27017/SpaBooking?ssl=true&replicaSet=atlas-130vne-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(MONGODB_URI).then(async () => {
  try {
    // Tìm tiệm demo cần loại trừ
    const demoShop = await mongoose.connection.collection('shops').findOne({ name: 'An Nhiên Beauty Spa' });
    const demoShopId = demoShop ? demoShop._id.toString() : null;

    console.log(`Đang nạp tiền vào ví cho tất cả các tiệm (Ngoại trừ tiệm demo)...`);

    const wallets = await mongoose.connection.collection('wallets').find({}).toArray();
    let count = 0;

    for (const w of wallets) {
      const shopIdStr = w.shopId.toString();
      
      // Bỏ qua tiệm demo
      if (demoShopId && shopIdStr === demoShopId) {
        console.log(`- Bỏ qua ví của An Nhiên Beauty Spa (shopId: ${shopIdStr})`);
        continue;
      }

      const TARGET_BALANCE = 5000000; // 5 triệu
      const currentBalance = w.balance || 0;
      const diff = TARGET_BALANCE - currentBalance;

      if (diff > 0) {
        // Cập nhật số dư
        await mongoose.connection.collection('wallets').updateOne(
          { _id: w._id },
          { $set: { balance: TARGET_BALANCE, updatedAt: new Date() } }
        );

        // Thêm transaction log
        await mongoose.connection.collection('wallet_transactions').insertOne({
          shopId: w.shopId,
          walletId: w._id,
          type: 'deposit', // giả lập nạp tiền
          amount: diff,
          description: 'Hệ thống nạp tiền hỗ trợ shop test booking',
          status: 'success',
          createdAt: new Date(),
          updatedAt: new Date()
        });

        count++;
      } else if (diff < 0) {
          // Nếu đã lớn hơn 5tr thì thôi, không cần làm gì
      }
    }

    console.log(`✅ Đã nạp thành công mức 5.000.000đ cho ${count} ví!`);
  } catch(e) {
    console.error('Lỗi khi nạp ví:', e);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}).catch(err => {
  console.error('Lỗi kết nối database:', err.message);
  process.exit(1);
});
