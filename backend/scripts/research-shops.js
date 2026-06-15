import mongoose from 'mongoose';

const MONGODB_URI = 'mongodb://tdung:12345@ac-w6bxyy1-shard-00-00.brzmupq.mongodb.net:27017,ac-w6bxyy1-shard-00-01.brzmupq.mongodb.net:27017,ac-w6bxyy1-shard-00-02.brzmupq.mongodb.net:27017/SpaBooking?ssl=true&replicaSet=atlas-2y4j0u-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(MONGODB_URI).then(async () => {
  try {
    const db = mongoose.connection.db;
    const shopNames = ['Ngọc Thơ', 'Tiệm Nail Minh Huyền', 'VanLavi', 'Nơ Nail', 'Nail Thu Ốc', 'Nail Minh Hải'];
    const shops = await db.collection('shops').find({ shopName: { $in: shopNames.map(name => new RegExp(name, 'i')) } }).toArray();
    
    console.log(`Found ${shops.length} shops:`);
    for (const shop of shops) {
      console.log(`\nShop: ${shop.shopName} (ID: ${shop._id})`);
      const services = await db.collection('services').find({ shopId: String(shop._id) }).toArray();
      console.log(` - Services count: ${services.length}`);
      const bookings = await db.collection('bookings').find({ shopId: String(shop._id) }).toArray();
      console.log(` - Bookings count: ${bookings.length}`);
      if (bookings.length > 0) {
        console.log(`   Sample booking services:`, bookings[0].services.map(s => s.name).join(', '));
      }
    }
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
});
