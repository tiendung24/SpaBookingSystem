const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb://tdung:12345@ac-aewycvu-shard-00-00.brzmupq.mongodb.net:27017,ac-aewycvu-shard-00-01.brzmupq.mongodb.net:27017,ac-aewycvu-shard-00-02.brzmupq.mongodb.net:27017/SpaBooking?ssl=true&replicaSet=atlas-130vne-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(MONGODB_URI).then(async () => {
  try {
    // 16/06/2026 00:00 GMT+7 => 2026-06-15T17:00:00.000Z
    const start = new Date('2026-06-15T17:00:00.000Z');
    
    // Xóa các booking từ 16/06/2026 trở đi
    const result = await mongoose.connection.collection('bookings').deleteMany({ 
      startTime: { $gte: start } 
    });
    
    console.log(`✅ Đã xóa thành công ${result.deletedCount} bookings từ ngày 16/06/2026 trở đi.`);
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
