const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb://tdung:12345@ac-aewycvu-shard-00-00.brzmupq.mongodb.net:27017,ac-aewycvu-shard-00-01.brzmupq.mongodb.net:27017,ac-aewycvu-shard-00-02.brzmupq.mongodb.net:27017/SpaBooking?ssl=true&replicaSet=atlas-130vne-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(MONGODB_URI).then(async () => {
  try {
    // Xóa các giao dịch nạp 5 triệu vừa tạo lúc nãy
    const r1 = await mongoose.connection.collection('wallet_transactions').deleteMany({
      description: 'Hệ thống nạp tiền hỗ trợ shop test booking'
    });
    console.log(`Đã gỡ bỏ ${r1.deletedCount} giao dịch nạp 5tr lúc nãy.`);

    // Tìm tiệm demo cần loại trừ
    const demoShop = await mongoose.connection.collection('shops').findOne({ name: 'An Nhiên Beauty Spa' });
    const demoShopId = demoShop ? demoShop._id.toString() : null;

    console.log(`Đang tính toán lại số dư (Base 100k + Doanh thu thực tế) cho các tiệm...`);

    const wallets = await mongoose.connection.collection('wallets').find({}).toArray();
    let count = 0;

    for (const w of wallets) {
      const shopIdStr = w.shopId.toString();
      
      // Bỏ qua tiệm demo
      if (demoShopId && shopIdStr === demoShopId) {
        continue;
      }

      // Lấy tổng giao dịch hợp lệ
      const txs = await mongoose.connection.collection('wallet_transactions').find({
        $or: [
          { walletId: w._id },
          { walletId: w._id.toString() }
        ],
        status: 'success'
      }).toArray();

      let txSum = 0;
      txs.forEach(tx => {
        txSum += (tx.amount || 0);
      });

      // Mức cơ sở 100k cộng với số dư thực tế từ giao dịch
      const NEW_BALANCE = 100000 + txSum;

      // Cập nhật lại số dư
      await mongoose.connection.collection('wallets').updateOne(
        { _id: w._id },
        { $set: { balance: NEW_BALANCE, updatedAt: new Date() } }
      );
      
      count++;
    }

    console.log(`✅ Đã thiết lập thành công mức nền 100k cho ${count} ví!`);
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
