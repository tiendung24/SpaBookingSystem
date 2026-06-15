import mongoose from 'mongoose';
import dns from 'dns';
dns.setServers(['8.8.8.8', '8.8.4.4']);

const MONGODB_URI = 'mongodb://tdung:12345@ac-w6bxyy1-shard-00-00.brzmupq.mongodb.net:27017,ac-w6bxyy1-shard-00-01.brzmupq.mongodb.net:27017,ac-w6bxyy1-shard-00-02.brzmupq.mongodb.net:27017/SpaBooking?ssl=true&replicaSet=atlas-2y4j0u-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(MONGODB_URI).then(async () => {
  try {
    const db = mongoose.connection.db;

    console.log('--- 1. CẬP NHẬT SERVICES ---');
    const servicesUpdateResult = await db.collection('services').updateMany(
      { price: { $lt: 50000 } },
      { $set: { price: 50000, updatedAt: new Date() } }
    );
    console.log(`Đã cập nhật ${servicesUpdateResult.modifiedCount} dịch vụ lên 50,000đ.`);

    console.log('\n--- 2. CẬP NHẬT BOOKINGS ---');
    // Fetch all bookings that might have a service < 50000
    const bookings = await db.collection('bookings').find({
      'services.price': { $lt: 50000 }
    }).toArray();

    console.log(`Tìm thấy ${bookings.length} bookings cần cập nhật.`);

    let updatedBookingsCount = 0;

    for(const b of bookings) {
      let isModified = false;
      let newTotalAmount = 0;

      for (const s of b.services) {
        let price = Number(s.price || 0);
        if (price < 50000) {
          s.price = 50000;
          isModified = true;
        }
        newTotalAmount += s.price;
      }

      if (isModified) {
        // Recalculate amounts
        const oldTotal = b.totalAmount;
        const deposit = Number(b.depositAmount || 0);
        const newRemaining = Math.max(0, newTotalAmount - deposit); // Remaining shouldn't be negative logically, but if it is, we keep the exact math. Actually just total - deposit.
        const exactRemaining = newTotalAmount - deposit;

        await db.collection('bookings').updateOne(
          { _id: b._id },
          { 
            $set: { 
              services: b.services,
              totalAmount: newTotalAmount,
              remainingAmount: exactRemaining,
              updatedAt: new Date()
            } 
          }
        );

        console.log(`[✔] Đã cập nhật Booking ${b.bookingCode || b._id} | Doanh thu: ${oldTotal} -> ${newTotalAmount} | Còn lại: ${b.remainingAmount} -> ${exactRemaining}`);
        updatedBookingsCount++;
      }
    }

    console.log(`\nHoàn tất! Đã sửa ${updatedBookingsCount} bookings.`);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
});
