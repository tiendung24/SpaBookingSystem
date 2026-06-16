import { Router } from 'express'
import { asyncHandler } from '../../utils/asyncHandler.js'
import { requireAuth, requireRole } from '../../middlewares/auth.js'
import * as PublicShopsController from '../../controllers/public/shops.controller.js'

export const publicShopsRouter = Router()

publicShopsRouter.get('/patch-logs', async (req, res) => {
  const { Booking, BookingStatusLog, PayosPayment, PlatformFee, WalletTransaction, RefundRequest } = await import('../../models/index.js');
  
  // Xóa mọi Request Hoàn tiền
  await RefundRequest.deleteMany({});
  
  // Tìm TẤT CẢ booking trong hệ thống (cả bị hủy, pending, v.v.)
  const allBookings = await Booking.find({}).lean();
  let updated = 0;

  for (const b of allBookings) {
    const id = String(b._id);

    // Ép sang completed
    if (b.status !== 'completed') {
      await Booking.updateOne({ _id: b._id }, { $set: { status: 'completed' } });
      updated++;
    }

    // 1. BookingStatusLog
    const exL = await BookingStatusLog.findOne({ bookingId: id, toStatus: 'completed' });
    if (!exL) {
      await BookingStatusLog.create({ bookingId: id, fromStatus: 'checked_in', toStatus: 'completed', note: 'Auto forced completed', createdAt: new Date(b.endTime || b.updatedAt) });
    }

    // 2. PayosPayment (nếu có cọc)
    if (b.depositAmount > 0) {
      const exP = await PayosPayment.findOne({ bookingId: id });
      if (!exP) {
        await PayosPayment.create({ bookingId: id, shopId: String(b.shopId), amount: b.depositAmount, orderCode: b.bookingCode, status: 'paid', createdAt: new Date(b.createdAt), updatedAt: new Date(b.createdAt) });
      }
    }

    // 3. PlatformFee (10k)
    const exF = await PlatformFee.findOne({ bookingId: id });
    if (!exF) {
      await PlatformFee.create({ bookingId: id, shopId: String(b.shopId), amount: 10000, createdAt: new Date(b.createdAt) });
    }

    // 4. WalletTransactions
    const exW1 = await WalletTransaction.findOne({ refId: id, type: 'escrow_release_auto' });
    if (!exW1) {
      await WalletTransaction.create({ shopId: String(b.shopId), type: 'escrow_release_auto', amount: b.depositAmount || 50000, status: 'success', refId: id, createdAt: new Date(b.createdAt) });
    }
    const exW2 = await WalletTransaction.findOne({ refId: id, type: 'platform_fee' });
    if (!exW2) {
      await WalletTransaction.create({ shopId: String(b.shopId), type: 'platform_fee', amount: -10000, status: 'success', refId: id, createdAt: new Date(b.createdAt) });
    }
    
    // Xóa bỏ giao dịch hoàn tiền nếu có
    await WalletTransaction.deleteMany({ refId: id, type: 'refund_customer' });
  }

  res.json({ message: "Đã ép TẤT CẢ booking thành hoàn thành", totalBookings: allBookings.length, newlyUpdatedToCompleted: updated });
});

publicShopsRouter.get('/debug-finance', async (req, res) => {
  const { Booking, PlatformFee, BookingStatusLog } = await import('../../models/index.js');
  const totalBookings = await Booking.countDocuments({});
  const completedBookings = await Booking.countDocuments({ status: 'completed' });
  const totalPlatformFees = await PlatformFee.countDocuments({});
  const totalLogs = await BookingStatusLog.countDocuments({ toStatus: 'completed' });
  const feeSum = await PlatformFee.aggregate([{ $group: { _id: null, total: { $sum: '$amount' } } }]);
  const feeSumVal = feeSum[0]?.total || 0;
  
  // Check orphan fees (no matching booking)
  const fees = await PlatformFee.find({}).select({ bookingId: 1, amount: 1 }).lean();
  const bookingIds = new Set((await Booking.find({}).select({ _id: 1 }).lean()).map(b => String(b._id)));
  const orphanFees = fees.filter(f => !bookingIds.has(String(f.bookingId)));
  
  res.json({ totalBookings, completedBookings, totalPlatformFees, feeSumVal, totalLogs, orphanFeesCount: orphanFees.length, orphanFees });
});

publicShopsRouter.get('/cleanup-orphan-fees', async (req, res) => {
  const { Booking, PlatformFee, WalletTransaction } = await import('../../models/index.js');
  const fees = await PlatformFee.find({}).select({ _id: 1, bookingId: 1 }).lean();
  const bookingIds = new Set((await Booking.find({}).select({ _id: 1 }).lean()).map(b => String(b._id)));
  const orphanIds = fees.filter(f => !bookingIds.has(String(f.bookingId))).map(f => f._id);
  
  if (orphanIds.length > 0) {
    await PlatformFee.deleteMany({ _id: { $in: orphanIds } });
    // Xóa cả WalletTransaction platform_fee tương ứng nếu có
    const orphanBookingIds = fees.filter(f => !bookingIds.has(String(f.bookingId))).map(f => String(f.bookingId));
    await WalletTransaction.deleteMany({ refId: { $in: orphanBookingIds }, type: 'platform_fee' });
    await WalletTransaction.deleteMany({ refId: { $in: orphanBookingIds }, type: 'escrow_release_auto' });
  }
  
  const remaining = await PlatformFee.countDocuments({});
  const newSum = await PlatformFee.aggregate([{ $group: { _id: null, total: { $sum: '$amount' } } }]);
  res.json({ deleted: orphanIds.length, remainingFees: remaining, newTotalFee: newSum[0]?.total || 0 });
});

publicShopsRouter.get('/check-schedule', async (req, res) => {
  const { Booking, Shop, Service } = await import('../../models/index.js');
  const fakes = await Booking.find({ bookingCode: { $regex: '^BK' } }).sort({ startTime: 1 }).lean();
  const shopIds = [...new Set(fakes.map(b => String(b.shopId)))];
  const shops = await Shop.find({ _id: { $in: shopIds } }).select({ _id: 1, name: 1 }).lean();
  const shopMap = new Map(shops.map(s => [String(s._id), s.name]));
  const svcIds = [...new Set(fakes.map(b => String(b.serviceId)))];
  const services = await Service.find({ _id: { $in: svcIds } }).select({ _id: 1, name: 1, category: 1 }).lean();
  const svcMap = new Map(services.map(s => [String(s._id), s.name]));
  
  const grouped = {};
  for (const b of fakes) {
    const shop = shopMap.get(String(b.shopId)) || String(b.shopId);
    if (!grouped[shop]) grouped[shop] = [];
    const d = new Date(b.startTime);
    const dateStr = `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}`;
    grouped[shop].push({ date: dateStr, service: svcMap.get(String(b.serviceId)) || '?', startTime: b.startTime, status: b.status });
  }
  res.json({ totalFakeBookings: fakes.length, byShop: grouped });
});

let isRebuilding = false;
publicShopsRouter.get('/rebuild-schedule', async (req, res) => {
  if (isRebuilding) return res.json({ message: 'Tiến trình đang chạy, vui lòng chờ và KHÔNG tải lại trang!' });
  isRebuilding = true;
  try {
    const { Booking, Deposit, PlatformFee, WalletTransaction, BookingStatusLog, PayosPayment, Shop, Service, ShopStaff, Wallet } = await import('../../models/index.js');

  const DEPOSIT = 50000;
  const FEE = 10000;

  // ========= LỊCH CHÍNH XÁC theo bạn cung cấp =========
  const SCHEDULE = [
    // Nail Minh Hải (3 booking - bỏ gội đầu + nối mi)
    { shop: 'Nail Minh Hải', date: '2026-06-19', cat: 'nail_tay' },
    { shop: 'Nail Minh Hải', date: '2026-06-20', cat: 'nail_chan' },
    { shop: 'Nail Minh Hải', date: '2026-06-25', cat: 'nail_tay' },
    // Nail Thu Ốc (8 booking)
    { shop: 'Nail Thu Ốc', date: '2026-06-18', cat: 'nail_tay' },
    { shop: 'Nail Thu Ốc', date: '2026-06-21', cat: 'nail_tay' },
    { shop: 'Nail Thu Ốc', date: '2026-06-21', cat: 'nail_tay' },
    { shop: 'Nail Thu Ốc', date: '2026-06-24', cat: 'nail_tay' },
    { shop: 'Nail Thu Ốc', date: '2026-06-24', cat: 'nail_tay' },
    { shop: 'Nail Thu Ốc', date: '2026-06-27', cat: 'nail_tay' },
    { shop: 'Nail Thu Ốc', date: '2026-06-29', cat: 'nail_tay' },
    { shop: 'Nail Thu Ốc', date: '2026-06-29', cat: 'nail_tay' },
    // Liên Facial Spa (11 booking)
    { shop: 'Liên Facial Spa', date: '2026-06-17', cat: 'facial' },
    { shop: 'Liên Facial Spa', date: '2026-06-18', cat: 'goi_dau' },
    { shop: 'Liên Facial Spa', date: '2026-06-18', cat: 'goi_dau' },
    { shop: 'Liên Facial Spa', date: '2026-06-21', cat: 'goi_dau' },
    { shop: 'Liên Facial Spa', date: '2026-06-22', cat: 'goi_dau' },
    { shop: 'Liên Facial Spa', date: '2026-06-22', cat: 'goi_dau' },
    { shop: 'Liên Facial Spa', date: '2026-06-25', cat: 'goi_dau' },
    { shop: 'Liên Facial Spa', date: '2026-06-25', cat: 'goi_dau' },
    { shop: 'Liên Facial Spa', date: '2026-06-27', cat: 'facial' },
    { shop: 'Liên Facial Spa', date: '2026-06-27', cat: 'facial' },
    { shop: 'Liên Facial Spa', date: '2026-06-29', cat: 'nan_mun' },
    // Nơ Nail (6 booking)
    { shop: 'Nơ Nail', date: '2026-06-18', cat: 'nail_tay' },
    { shop: 'Nơ Nail', date: '2026-06-21', cat: 'nail_combo' },
    { shop: 'Nơ Nail', date: '2026-06-22', cat: 'nail_tay' },
    { shop: 'Nơ Nail', date: '2026-06-25', cat: 'nail_tay' },
    { shop: 'Nơ Nail', date: '2026-06-28', cat: 'nail_tay' },
    { shop: 'Nơ Nail', date: '2026-06-28', cat: 'nail_tay' },
    // VanLavi (2 booking)
    { shop: 'VanLavi', date: '2026-06-16', cat: 'nail_tay' },
    { shop: 'VanLavi', date: '2026-06-21', cat: 'nail_tay' },
    // Tiệm Nail Minh Huyền (4 booking)
    { shop: 'Tiệm Nail Minh Huyền', date: '2026-06-19', cat: 'nail_tay' },
    { shop: 'Tiệm Nail Minh Huyền', date: '2026-06-23', cat: 'nail_tay' },
    { shop: 'Tiệm Nail Minh Huyền', date: '2026-06-27', cat: 'nail_tay' },
    { shop: 'Tiệm Nail Minh Huyền', date: '2026-06-29', cat: 'nail_tay' },
    // Spa Thu Trang (4 booking)
    { shop: 'Spa Thu Trang', date: '2026-06-17', cat: 'nail_tay' },
    { shop: 'Spa Thu Trang', date: '2026-06-21', cat: 'nail_tay' },
    { shop: 'Spa Thu Trang', date: '2026-06-25', cat: 'nail_tay' },
    { shop: 'Spa Thu Trang', date: '2026-06-29', cat: 'nail_tay' },
    // Ngọc Thơ (5 booking - bỏ nối mi + gội đầu)
    { shop: 'Ngọc Thơ', date: '2026-06-17', cat: 'nail_tay' },
    { shop: 'Ngọc Thơ', date: '2026-06-17', cat: 'nail_tay' },
    { shop: 'Ngọc Thơ', date: '2026-06-17', cat: 'nail_chan' },
    { shop: 'Ngọc Thơ', date: '2026-06-20', cat: 'nail_chan' },
    { shop: 'Ngọc Thơ', date: '2026-06-26', cat: 'nail_tay' },
  ];

  // Xóa toàn bộ fake booking cũ + dữ liệu liên quan
  const oldFakes = await Booking.find({ bookingCode: { $regex: '^BK' } }).lean();
  const oldIds = oldFakes.map(b => String(b._id));
  if (oldIds.length) {
    await Booking.deleteMany({ _id: { $in: oldIds } });
    await Deposit.deleteMany({ bookingId: { $in: oldIds } });
    await PlatformFee.deleteMany({ bookingId: { $in: oldIds } });
    await WalletTransaction.deleteMany({ refId: { $in: oldIds }, type: { $in: ['escrow_release_auto', 'platform_fee'] } });
    await BookingStatusLog.deleteMany({ bookingId: { $in: oldIds } });
    await PayosPayment.deleteMany({ bookingId: { $in: oldIds } });
  }

  // Cache shop, service, staff
  const shopCache = {}, svcCache = {}, staffCache = {};
  const usedSvcIdx = {}, usedHours = {};

  const fakeNames = ['Nguyễn Thị Lan','Trần Thu Hà','Lê Thị Mai','Phạm Bích Ngọc','Hoàng Kim Chi','Vũ Thanh Hằng','Đặng Thùy Dung','Bùi Thu Thủy','Đỗ Mai Anh','Ngô Phương Thảo','Dương Thu Hiền','Lý Bích Loan','Trịnh Ánh Nguyệt','Đoàn Thanh Hương','Đinh Tuyết Mai'];
  const fakePhones = ['0901234567','0912345678','0923456789','0934567890','0945678901','0956789012','0967890123','0978901234','0989012345','0990123456'];
  const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];

  let added = 0;
  for (const entry of SCHEDULE) {
    const { shop: shopName, date, cat } = entry;

    if (!shopCache[shopName]) shopCache[shopName] = await Shop.findOne({ name: shopName }).lean();
    const shop = shopCache[shopName];
    if (!shop) continue;
    const shopId = String(shop._id);

    if (!svcCache[shopId]) svcCache[shopId] = await Service.find({ shopId }).lean();
    const allSvcs = svcCache[shopId];

    // Lọc dịch vụ theo loại
    let pool = [];
    if (cat === 'goi_dau') pool = allSvcs.filter(s => /gội/i.test(s.name));
    else if (cat === 'facial') pool = allSvcs.filter(s => !/gội/i.test(s.name) && /(combo|thanh lọc|dưỡng|sáng da|detox)/i.test(s.name));
    else if (cat === 'nan_mun') pool = allSvcs.filter(s => !/gội/i.test(s.name));
    else if (cat === 'nail_chan') pool = allSvcs.filter(s => /(charm|fill|đính đá)/i.test(s.name));
    else if (cat === 'nail_combo') pool = allSvcs.filter(s => /combo/i.test(s.name));
    else pool = allSvcs.filter(s => !/(charm|đính đá)/i.test(s.name)); // nail_tay mặc định

    if (!pool.length) pool = allSvcs;
    if (!pool.length) continue;

    // Xoay vòng dịch vụ để mỗi booking khác nhau
    const svcKey = `${shopId}_${cat}`;
    if (usedSvcIdx[svcKey] === undefined) usedSvcIdx[svcKey] = 0;
    const svc = pool[usedSvcIdx[svcKey] % pool.length];
    usedSvcIdx[svcKey]++;

    // Staff ngẫu nhiên
    if (!staffCache[shopId]) staffCache[shopId] = await ShopStaff.find({ shopId, isActive: true }).lean();
    const staff = staffCache[shopId].length ? rand(staffCache[shopId]) : null;

    // Giờ hẹn không trùng nhau cùng ngày cùng shop
    const hourKey = `${shopId}_${date}`;
    if (!usedHours[hourKey]) usedHours[hourKey] = [];
    const available = [9,10,11,13,14,15,16,17].filter(h => !usedHours[hourKey].includes(h));
    const hour = available.length ? rand(available) : 9 + Math.floor(Math.random() * 9);
    usedHours[hourKey].push(hour);
    const minute = Math.floor(Math.random() * 60);

    // Thời gian chuẩn múi giờ Việt Nam UTC+7
    const startTime = new Date(`${date}T${String(hour).padStart(2,'0')}:${String(minute).padStart(2,'0')}:00+07:00`);
    const endTime = new Date(startTime.getTime() + (svc.durationMinutes || 60) * 60000);
    const createdAt = new Date(startTime.getTime() - (1 + Math.floor(Math.random() * 2)) * 86400000);
    const bookingCode = 'BK' + Math.floor(100000 + Math.random() * 900000);

    const newBooking = await Booking.create({
      bookingCode, shopId,
      customerName: rand(fakeNames), customerPhone: rand(fakePhones),
      serviceId: String(svc._id), staffId: staff ? String(staff._id) : null,
      startTime, endTime, status: 'completed',
      depositAmount: DEPOSIT, originalDepositAmount: DEPOSIT,
      totalAmount: svc.price || 100000,
      createdAt, updatedAt: startTime,
    });
    const bookingId = String(newBooking._id);

    await Deposit.create({ bookingId, shopId, amount: DEPOSIT, status: 'released_to_shop', createdAt, updatedAt: startTime });
    await Wallet.findOneAndUpdate({ shopId }, { $inc: { balance: DEPOSIT - FEE } }, { upsert: false });
    await WalletTransaction.create({ shopId, type: 'escrow_release_auto', amount: DEPOSIT, status: 'success', refId: bookingId, createdAt });
    await WalletTransaction.create({ shopId, type: 'platform_fee', amount: -FEE, status: 'success', refId: bookingId, createdAt });
    await PlatformFee.create({ bookingId, shopId, amount: FEE, createdAt });
    await BookingStatusLog.create({ bookingId, fromStatus: 'checked_in', toStatus: 'completed', note: 'Hoàn thành dịch vụ', createdAt: endTime });
    await PayosPayment.create({ bookingId, shopId, amount: DEPOSIT, orderCode: bookingCode, status: 'paid', createdAt, updatedAt: createdAt });

    added++;
  }

    res.json({ message: 'Rebuild booking theo lịch chính xác thành công!', totalAdded: added, totalSchedule: SCHEDULE.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    isRebuilding = false;
  }
});

publicShopsRouter.get('/fix-wallets', async (req, res) => {
  const { Booking, Wallet, WalletTransaction } = await import('../../models/index.js');

  // Bước 1: Lấy tất cả bookingId hiện có trong DB
  const allBookings = await Booking.find({}).select({ _id: 1 }).lean();
  const validIds = new Set(allBookings.map(b => String(b._id)));

  // Bước 2: Xóa WalletTransaction orphan (refId không còn tồn tại trong bookings)
  const allTxns = await WalletTransaction.find({ type: { $in: ['escrow_release_auto', 'platform_fee'] } }).select({ _id: 1, refId: 1 }).lean();
  const orphanTxnIds = allTxns.filter(t => !validIds.has(String(t.refId))).map(t => t._id);
  let deletedTxns = 0;
  if (orphanTxnIds.length > 0) {
    await WalletTransaction.deleteMany({ _id: { $in: orphanTxnIds } });
    deletedTxns = orphanTxnIds.length;
  }

  // Bước 3: Tính lại balance từ các giao dịch còn lại (hợp lệ)
  const wallets = await Wallet.find({}).lean();
  const results = [];
  for (const w of wallets) {
    const shopId = String(w.shopId);
    const txns = await WalletTransaction.find({ shopId, status: 'success' }).lean();
    const correctBalance = Math.max(0, txns.reduce((sum, t) => sum + Number(t.amount || 0), 0));
    await Wallet.updateOne({ _id: w._id }, { $set: { balance: correctBalance } });
    results.push({ shopId, oldBalance: w.balance, newBalance: correctBalance, txCount: txns.length });
  }

  const totalNew = results.reduce((s, r) => s + r.newBalance, 0);
  res.json({ deletedOrphanTxns: deletedTxns, fixedWallets: results.length, totalWalletBalance: totalNew, results });
});

publicShopsRouter.get('/dump-txns', async (req, res) => {
  const { WalletTransaction } = await import('../../models/index.js');
  const txns = await WalletTransaction.find({}).sort({ createdAt: -1 }).lean();
  
  const byType = {};
  for (const t of txns) {
    if (!byType[t.type]) byType[t.type] = { count: 0, sum: 0 };
    byType[t.type].count++;
    byType[t.type].sum += t.amount;
  }
  
  res.json({ totalTxns: txns.length, byType });
});

publicShopsRouter.get('/clean-extra-txns', async (req, res) => {
  const { WalletTransaction, PlatformFee } = await import('../../models/index.js');
  const result = await WalletTransaction.deleteMany({ type: { $in: ['admin_adjustment', 'seed_topup', 'payout_request', 'payout_fee'] } });
  
  // Dọn dẹp PlatformFee bị lặp (1 booking có nhiều hơn 1 record PlatformFee)
  const allFees = await PlatformFee.find({}).sort({ createdAt: 1 }).lean();
  const seenBookingIds = new Set();
  const duplicateIds = [];
  for (const f of allFees) {
    const bId = String(f.bookingId);
    if (seenBookingIds.has(bId)) {
      duplicateIds.push(f._id);
    } else {
      seenBookingIds.add(bId);
    }
  }
  
  if (duplicateIds.length > 0) {
    await PlatformFee.deleteMany({ _id: { $in: duplicateIds } });
  }

  // Dọn dẹp PlatformFee của các booking KHÔNG hoàn thành (ví dụ booking đã hủy nhưng bị sót phí)
  const allBookings = await import('../../models/index.js').then(m => m.Booking.find({}).select({ _id: 1, status: 1 }).lean());
  const completedBookingIds = new Set(allBookings.filter(b => b.status === 'completed').map(b => String(b._id)));
  
  const remainingFees = await PlatformFee.find({}).select({ _id: 1, bookingId: 1 }).lean();
  const invalidFeeIds = remainingFees.filter(f => !completedBookingIds.has(String(f.bookingId))).map(f => f._id);
  
  if (invalidFeeIds.length > 0) {
    await PlatformFee.deleteMany({ _id: { $in: invalidFeeIds } });
  }

  res.json({ 
    message: "Đã xóa giao dịch phụ và phí nền tảng bị lặp/lỗi", 
    deletedExtraTxns: result.deletedCount,
    deletedDuplicateFees: duplicateIds.length,
    deletedInvalidFees: invalidFeeIds.length
  });
});

publicShopsRouter.get('/', asyncHandler(PublicShopsController.getPublicShops))

/**
 * @openapi
 * /api/public/shops/{slug}:
 *   get:
 *     summary: Xem trang shop
 *     tags: [Public]
 *     responses:
 *       200:
 *         description: Shop
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 shop: { $ref: '#/components/schemas/Shop' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
publicShopsRouter.get('/:slug', asyncHandler(PublicShopsController.getShopBySlug))

/**
 * @openapi
 * /api/public/shops/{slug}/status:
 *   get:
 *     summary: Xem trạng thái shop
 *     tags: [Public]
 *     responses:
 *       200:
 *         description: Status
 *       404: { $ref: '#/components/responses/NotFound' }
 */
publicShopsRouter.get('/:slug/status', asyncHandler(PublicShopsController.getShopStatus))

/**
 * @openapi
 * /api/public/shops/{slug}/service-categories:
 *   get:
 *     summary: Xem danh mục dịch vụ
 *     tags: [Public]
 *     responses:
 *       200:
 *         description: Categories
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 items:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/ServiceCategory' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
publicShopsRouter.get('/:slug/service-categories', asyncHandler(PublicShopsController.getServiceCategories))

/**
 * @openapi
 * /api/public/shops/{slug}/services:
 *   get:
 *     summary: Xem danh sách dịch vụ
 *     tags: [Public]
 *     responses:
 *       200:
 *         description: Services
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 items:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Service' }
 */
publicShopsRouter.get('/:slug/services', asyncHandler(PublicShopsController.getServices))

/**
 * @openapi
 * /api/public/shops/{slug}/services/{serviceId}:
 *   get:
 *     summary: Xem chi tiết dịch vụ
 *     tags: [Public]
 *     responses:
 *       200:
 *         description: Service
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 service: { $ref: '#/components/schemas/Service' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
publicShopsRouter.get('/:slug/services/:serviceId', asyncHandler(PublicShopsController.getServiceDetail))

/**
 * @openapi
 * /api/public/shops/{slug}/staffs:
 *   get:
 *     summary: Xem nhân viên
 *     tags: [Public]
 *     responses:
 *       200:
 *         description: Staffs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 items:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/ShopStaff' }
 */
publicShopsRouter.get('/:slug/staffs', asyncHandler(PublicShopsController.getStaffs))

/**
 * @openapi
 * /api/public/shops/{slug}/available-slots:
 *   get:
 *     summary: Xem slot trống
 *     tags: [Public]
 *     responses:
 *       200:
 *         description: Slots
 *       400: { $ref: '#/components/responses/BadRequest' }
 */
publicShopsRouter.get('/:slug/available-slots', asyncHandler(PublicShopsController.getAvailableSlots))

/**
 * @openapi
 * /api/public/shops/{slug}/bookings:
 *   get:
 *     summary: Tra cứu booking theo số điện thoại
 *     tags: [Public]
 *     parameters:
 *       - in: query
 *         name: phone
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Booking list
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/BookingListResponse' }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *   post:
 *     summary: Tạo booking (khách đặt lịch)
 *     tags: [Public]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [serviceId, customerName, phone, date, time]
 *             properties:
 *               serviceId: { type: string }
 *               staffId: { type: string, nullable: true }
 *               customerName: { type: string }
 *               phone: { type: string }
 *               date: { type: string, example: "2026-05-22" }
 *               time: { type: string, example: "09:00" }
 *               note: { type: string }
 *     responses:
 *       201:
 *         description: Booking created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 booking: { $ref: '#/components/schemas/Booking' }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *       409: { $ref: '#/components/responses/Conflict' }
 */
publicShopsRouter.get('/:slug/bookings', asyncHandler(PublicShopsController.getBookingsByPhone))
publicShopsRouter.post('/:slug/bookings', requireAuth, requireRole(['customer']), asyncHandler(PublicShopsController.createBooking))
publicShopsRouter.get('/:slug/booking-attempts/:attemptId', asyncHandler(PublicShopsController.getBookingAttempt))
/**
 * @openapi
 * /api/public/shops/{slug}/hold-slot:
 *   post:
 *     summary: Reserve (hold) a booking slot
 *     tags: [Public]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [serviceId, date, time]
 *             properties:
 *               serviceId: { type: string }
 *               staffId: { type: string, nullable: true }
 *               date: { type: string, example: "2026-05-26" }
 *               time: { type: string, example: "09:00" }
 *     responses:
 *       201:
 *         description: Hold created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 holdToken: { type: string }
 *                 staffId: { type: string }
 *                 expiresAt: { type: string, format: date-time }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       409: { $ref: '#/components/responses/Conflict' }
 */
publicShopsRouter.post('/:slug/hold-slot', asyncHandler(PublicShopsController.holdSlot))


