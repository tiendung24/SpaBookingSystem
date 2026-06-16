import mongoose from 'mongoose';

mongoose.connect('mongodb+srv://tiendungth2003:dung2003@cluster0.b77h7.mongodb.net/LumiX?retryWrites=true&w=majority').then(async () => {
  const Booking = mongoose.model('Booking', new mongoose.Schema({}, { strict: false, collection: 'bookings' }));
  const BookingStatusLog = mongoose.model('BookingStatusLog', new mongoose.Schema({}, { strict: false, collection: 'booking_status_logs' }));
  const PayosPayment = mongoose.model('PayosPayment', new mongoose.Schema({}, { strict: false, collection: 'payos_payments' }));
  const PlatformFee = mongoose.model('PlatformFee', new mongoose.Schema({}, { strict: false, collection: 'platform_fees' }));
  const WalletTransaction = mongoose.model('WalletTransaction', new mongoose.Schema({}, { strict: false, collection: 'wallet_transactions' }));
  
  const fakes = await Booking.find({ bookingCode: { $regex: '^BK' }, status: 'completed' }).lean();
  let l = 0, p = 0, f = 0, w = 0;

  for (const b of fakes) {
    const id = String(b._id);

    // 1. Add BookingStatusLog if missing
    const exL = await BookingStatusLog.findOne({ bookingId: id, toStatus: 'completed' });
    if (!exL) {
      await BookingStatusLog.create({
        bookingId: id,
        fromStatus: 'checked_in',
        toStatus: 'completed',
        note: 'Auto completed by rebuild',
        createdAt: new Date(b.endTime || b.updatedAt || Date.now())
      });
      l++;
    }

    // 2. Add PayosPayment if missing
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
        p++;
      }
    }

    // 3. Add PlatformFee if missing (10k)
    const exF = await PlatformFee.findOne({ bookingId: id });
    if (!exF) {
      await PlatformFee.create({
        bookingId: id,
        shopId: String(b.shopId),
        amount: 10000,
        createdAt: new Date(b.createdAt || Date.now())
      });
      f++;
    }

    // 4. Add WalletTransactions if missing
    // a. escrow_release_auto for 50k
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
      w++;
    }
    // b. platform_fee for -10k
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
      w++;
    }
  }

  console.log(`ĐÃ VÁ DỮ LIỆU THÀNH CÔNG!`);
  console.log(`- Thêm ${l} lịch sử hoàn thành (BookingStatusLog)`);
  console.log(`- Thêm ${p} biên lai PayOS (PayosPayment)`);
  console.log(`- Thêm ${f} phí nền tảng (PlatformFee)`);
  console.log(`- Thêm ${w} giao dịch ví (WalletTransaction)`);
  process.exit(0);
}).catch(console.error);
