import mongoose from 'mongoose';

mongoose.connect('mongodb+srv://tiendungth2003:dung2003@cluster0.b77h7.mongodb.net/LumiX?retryWrites=true&w=majority').then(async () => {
  const Booking = mongoose.model('Booking', new mongoose.Schema({}, { strict: false, collection: 'bookings' }));
  const BookingStatusLog = mongoose.model('BookingStatusLog', new mongoose.Schema({}, { strict: false, collection: 'booking_status_logs' }));
  const PayosPayment = mongoose.model('PayosPayment', new mongoose.Schema({}, { strict: false, collection: 'payos_payments' }));
  const PlatformFee = mongoose.model('PlatformFee', new mongoose.Schema({}, { strict: false, collection: 'platform_fees' }));
  const WalletTransaction = mongoose.model('WalletTransaction', new mongoose.Schema({}, { strict: false, collection: 'wallet_transactions' }));
  const RefundRequest = mongoose.model('RefundRequest', new mongoose.Schema({}, { strict: false, collection: 'refund_requests' }));
  
  // Xóa mọi Request Hoàn tiền
  await RefundRequest.deleteMany({});
  
  const allBookings = await Booking.find({}).lean();
  let updated = 0;

  for (const b of allBookings) {
    const id = String(b._id);

    if (b.status !== 'completed') {
      await Booking.updateOne({ _id: b._id }, { $set: { status: 'completed' } });
      updated++;
    }

    const exL = await BookingStatusLog.findOne({ bookingId: id, toStatus: 'completed' });
    if (!exL) {
      await BookingStatusLog.create({
        bookingId: id,
        fromStatus: 'checked_in',
        toStatus: 'completed',
        note: 'Auto forced completed by script',
        createdAt: new Date(b.endTime || b.updatedAt || Date.now())
      });
    }

    if (b.depositAmount > 0) {
      const exP = await PayosPayment.findOne({ bookingId: id });
      if (!exP) {
        await PayosPayment.create({
          bookingId: id,
          shopId: String(b.shopId),
          amount: b.depositAmount,
          orderCode: b.bookingCode,
          status: 'paid',
          createdAt: new Date(b.createdAt || Date.now()),
          updatedAt: new Date(b.createdAt || Date.now())
        });
      }
    }

    const exF = await PlatformFee.findOne({ bookingId: id });
    if (!exF) {
      await PlatformFee.create({
        bookingId: id,
        shopId: String(b.shopId),
        amount: 10000,
        createdAt: new Date(b.createdAt || Date.now())
      });
    }

    const exW1 = await WalletTransaction.findOne({ refId: id, type: 'escrow_release_auto' });
    if (!exW1) {
      await WalletTransaction.create({
        shopId: String(b.shopId),
        type: 'escrow_release_auto',
        amount: b.depositAmount || 50000,
        status: 'success',
        refId: id,
        createdAt: new Date(b.createdAt || Date.now())
      });
    }
    
    const exW2 = await WalletTransaction.findOne({ refId: id, type: 'platform_fee' });
    if (!exW2) {
      await WalletTransaction.create({
        shopId: String(b.shopId),
        type: 'platform_fee',
        amount: -10000,
        status: 'success',
        refId: id,
        createdAt: new Date(b.createdAt || Date.now())
      });
    }
    
    // Xóa bỏ giao dịch hoàn tiền nếu có
    await WalletTransaction.deleteMany({ refId: id, type: 'refund_customer' });
  }

  console.log(`ĐÃ VÁ DỮ LIỆU THÀNH CÔNG!`);
  console.log(`- Có ${allBookings.length} bookings trong hệ thống.`);
  console.log(`- Đã ép ${updated} booking không hoàn thành thành hoàn thành.`);
  console.log(`- Xóa mọi dữ liệu hủy/hoàn tiền.`);
  process.exit(0);
}).catch(console.error);
