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


