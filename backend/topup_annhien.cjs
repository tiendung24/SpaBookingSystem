const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb://tdung:12345@ac-aewycvu-shard-00-00.brzmupq.mongodb.net:27017,ac-aewycvu-shard-00-01.brzmupq.mongodb.net:27017,ac-aewycvu-shard-00-02.brzmupq.mongodb.net:27017/SpaBooking?ssl=true&replicaSet=atlas-130vne-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(MONGODB_URI).then(async () => {
  try {
    const db = mongoose.connection.db;
    const shop = await db.collection('shops').findOne({ name: 'An Nhiên Beauty Spa' });
    if (!shop) {
      console.log('Không tìm thấy tiệm An Nhiên Beauty Spa');
      return;
    }
    
    console.log(`Tìm thấy tiệm: ${shop.name} (${shop._id})`);

    let wallet = await db.collection('wallets').findOne({ shopId: shop._id.toString() });
    
    if (!wallet) {
      console.log('Tiệm chưa có ví. Đang tạo ví mới...');
      const res = await db.collection('wallets').insertOne({
        shopId: shop._id.toString(),
        balance: 0,
        escrowBalance: 0,
        totalEarnings: 0,
        totalWithdrawals: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      wallet = { _id: res.insertedId, shopId: shop._id.toString(), balance: 0 };
    }

    console.log(`Số dư cũ: ${wallet.balance}`);

    // Cộng 100k
    await db.collection('wallets').updateOne(
      { _id: wallet._id },
      { $inc: { balance: 100000 } }
    );

    console.log('✅ Đã cộng thêm 100.000 VNĐ vào ví An Nhiên Beauty Spa.');
    
    // Thêm lịch sử giao dịch để minh bạch
    await db.collection('wallet_transactions').insertOne({
      shopId: shop._id.toString(),
      walletId: wallet._id.toString(),
      type: 'deposit', // Giao dịch nạp
      amount: 100000,
      description: 'Admin nạp 100.000đ',
      status: 'success',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    console.log('✅ Đã thêm giao dịch nạp tiền vào lịch sử.');

    const newWallet = await db.collection('wallets').findOne({ _id: wallet._id });
    console.log(`Số dư mới: ${newWallet.balance}`);

  } catch(e) {
    console.error('Lỗi:', e);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}).catch(err => {
  console.error('Lỗi kết nối database:', err.message);
  process.exit(1);
});
