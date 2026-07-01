const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb://tdung:12345@ac-aewycvu-shard-00-00.brzmupq.mongodb.net:27017,ac-aewycvu-shard-00-01.brzmupq.mongodb.net:27017,ac-aewycvu-shard-00-02.brzmupq.mongodb.net:27017/SpaBooking?ssl=true&replicaSet=atlas-130vne-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(MONGODB_URI).then(async () => {
  try {
    console.log('Đang tạo các bản ghi BookingStatusLog và PayosPayment còn thiếu...');
    const db = mongoose.connection.db;

    const bookings = await db.collection('bookings').find({ clientAttemptId: { $regex: /^seed-v2-/ } }).toArray();
    console.log(`Tìm thấy ${bookings.length} bookings.`);

    const logsToInsert = [];
    const paymentsToInsert = [];

    for (const b of bookings) {
      const bIdStr = b._id.toString();
      const sIdStr = b.shopId.toString();

      // BookingStatusLog để Admin Dashboard đếm Booking hoàn thành
      logsToInsert.push({
        bookingId: bIdStr,
        fromStatus: 'pending',
        toStatus: 'completed',
        action: 'complete',
        note: 'Seed data',
        createdAt: b.completedAt,
        updatedAt: b.completedAt
      });

      // PayosPayment để Admin Dashboard tính Tổng cọc đã nhận
      paymentsToInsert.push({
        bookingId: bIdStr,
        shopId: sIdStr,
        amount: 50000,
        status: 'paid', // hoặc 'success' / 'completed' tùy SUCCESS_PAYMENT_STATUSES
        paymentType: 'deposit',
        description: `Thanh toán cọc cho booking ${b.bookingCode}`,
        createdAt: b.createdAt,
        updatedAt: b.createdAt
      });
    }

    if (logsToInsert.length > 0) {
      await db.collection('booking_status_logs').insertMany(logsToInsert);
      console.log(`✅ Đã insert ${logsToInsert.length} booking_status_logs.`);
    }

    if (paymentsToInsert.length > 0) {
      await db.collection('payos_payments').insertMany(paymentsToInsert);
      console.log(`✅ Đã insert ${paymentsToInsert.length} payos_payments.`);
    }

    console.log('Hoàn thành!');
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
