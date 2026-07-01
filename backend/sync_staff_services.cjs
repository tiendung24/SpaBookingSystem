const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb://tdung:12345@ac-aewycvu-shard-00-00.brzmupq.mongodb.net:27017,ac-aewycvu-shard-00-01.brzmupq.mongodb.net:27017,ac-aewycvu-shard-00-02.brzmupq.mongodb.net:27017/SpaBooking?ssl=true&replicaSet=atlas-130vne-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(MONGODB_URI).then(async () => {
  try {
    // Tiệm cần loại trừ
    const demoShop = await mongoose.connection.collection('shops').findOne({ name: 'An Nhiên Beauty Spa' });
    const demoShopId = demoShop ? demoShop._id.toString() : null;

    const shops = await mongoose.connection.collection('shops').find({}).toArray();
    console.log(`Bắt đầu đồng bộ dịch vụ và nhân viên cho ${shops.length} tiệm...`);

    let updatedServices = 0;
    let updatedStaffs = 0;

    for (const shop of shops) {
      const shopIdStr = shop._id.toString();
      
      if (demoShopId && shopIdStr === demoShopId) {
        console.log(`- Bỏ qua tiệm demo: An Nhiên Beauty Spa`);
        continue;
      }

      // Lấy toàn bộ nhân viên và dịch vụ của shop
      const staffs = await mongoose.connection.collection('shop_staffs').find({
        $or: [ { shopId: shop._id }, { shopId: shopIdStr } ]
      }).toArray();

      const services = await mongoose.connection.collection('services').find({
        $or: [ { shopId: shop._id }, { shopId: shopIdStr } ]
      }).toArray();

      if (staffs.length === 0 || services.length === 0) continue;

      const staffIdsStr = staffs.map(s => s._id.toString());
      const serviceIdsStr = services.map(s => s._id.toString());

      // 1. Cập nhật availableStaffIds cho tất cả services của shop
      for (const svc of services) {
        await mongoose.connection.collection('services').updateOne(
          { _id: svc._id },
          { $set: { availableStaffIds: staffIdsStr } }
        );
        updatedServices++;
      }

      // 2. Cập nhật serviceIds cho tất cả nhân viên của shop
      for (const stf of staffs) {
        await mongoose.connection.collection('shop_staffs').updateOne(
          { _id: stf._id },
          { $set: { serviceIds: serviceIdsStr } }
        );
        updatedStaffs++;
      }
    }

    console.log(`✅ Hoàn tất! Đã cập nhật ${updatedServices} dịch vụ và ${updatedStaffs} nhân viên.`);
  } catch(e) {
    console.error('Lỗi khi đồng bộ:', e);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}).catch(err => {
  console.error('Lỗi kết nối database:', err.message);
  process.exit(1);
});
