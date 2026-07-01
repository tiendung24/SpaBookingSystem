const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb://tdung:12345@ac-aewycvu-shard-00-00.brzmupq.mongodb.net:27017,ac-aewycvu-shard-00-01.brzmupq.mongodb.net:27017,ac-aewycvu-shard-00-02.brzmupq.mongodb.net:27017/SpaBooking?ssl=true&replicaSet=atlas-130vne-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(MONGODB_URI).then(async () => {
  try {
    // Lấy tất cả _id của các booking HIỆN TẠI (những booking hợp lệ còn lại)
    const validBookings = await mongoose.connection.collection('bookings').find({}, { projection: { _id: 1, bookingCode: 1 } }).toArray();
    
    const validBookingIdsString = validBookings.map(b => b._id.toString());
    const validBookingIdsObject = validBookings.map(b => b._id);
    const validBookingCodes = validBookings.map(b => b.bookingCode).filter(Boolean);

    console.log(`Đang dọn dẹp dữ liệu rác không thuộc ${validBookings.length} booking hợp lệ...`);

    const filterId = {
      $and: [
        { bookingId: { $exists: true } },
        { bookingId: { $ne: null } },
        { bookingId: { $nin: validBookingIdsString } },
        { bookingId: { $nin: validBookingIdsObject } }
      ]
    };

    // Xóa từ booking_status_logs
    const r1 = await mongoose.connection.collection('booking_status_logs').deleteMany(filterId);
    console.log(`- Xóa ${r1.deletedCount} bản ghi từ booking_status_logs`);

    // Xóa từ loyalty_transactions
    const r2 = await mongoose.connection.collection('loyalty_transactions').deleteMany(filterId);
    console.log(`- Xóa ${r2.deletedCount} bản ghi từ loyalty_transactions`);

    // Xóa từ deposits
    const r3 = await mongoose.connection.collection('deposits').deleteMany(filterId);
    console.log(`- Xóa ${r3.deletedCount} bản ghi từ deposits`);

    // Xóa từ booking_slot_locks
    const r4 = await mongoose.connection.collection('booking_slot_locks').deleteMany(filterId);
    console.log(`- Xóa ${r4.deletedCount} bản ghi từ booking_slot_locks`);

    // Xóa từ payos_payments
    const r5 = await mongoose.connection.collection('payos_payments').deleteMany(filterId);
    console.log(`- Xóa ${r5.deletedCount} bản ghi từ payos_payments`);

    // Notifications không có bookingId trực tiếp, nhưng nội dung có bookingCode.
    // Xóa notification sau ngày 16/06 (vì booking sau 16/06 bị xóa, coi như noti đó là rác)
    const start = new Date('2026-06-15T17:00:00.000Z');
    const r6 = await mongoose.connection.collection('notifications').deleteMany({ createdAt: { $gte: start } });
    console.log(`- Xóa ${r6.deletedCount} bản ghi từ notifications (sau ngày 16/06)`);

    console.log('✅ Hoàn tất dọn dẹp logic rác!');
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
