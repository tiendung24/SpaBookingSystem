import { Router } from 'express'
import { asyncHandler } from '../../utils/asyncHandler.js'
import { requireAuth, requireRole } from '../../middlewares/auth.js'
import * as ShopDashboardController from '../../controllers/shop/dashboard.controller.js'
import * as ShopProfileController from '../../controllers/shop/profile.controller.js'
import * as ShopServicesController from '../../controllers/shop/services.controller.js'
import * as ShopStaffsController from '../../controllers/shop/staffs.controller.js'
import * as ShopWorkingHoursController from '../../controllers/shop/workingHours.controller.js'
import * as ShopBookingsController from '../../controllers/shop/bookings.controller.js'
import * as ShopWalletController from '../../controllers/shop/wallet.controller.js'
import * as ShopNotificationsController from '../../controllers/shop/notifications.controller.js'
import * as ShopReviewsController from '../../controllers/shop/reviews.controller.js'

export const shopRouter = Router()

shopRouter.use(requireAuth, requireRole(['shop', 'owner', 'shop_owner']))

/**
 * @openapi
 * /api/shop/me:
 *   get:
 *     summary: Xem hồ sơ shop
 *     tags: [Shop]
 *     security: [{ bearerAuth: [] }]
 *   put:
 *     summary: Cập nhật hồ sơ shop
 *     tags: [Shop]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               phone: { type: string }
 *               email: { type: string }
 *               description: { type: string }
 *     responses:
 *       200: { description: "OK" }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
shopRouter.get('/profile', asyncHandler(ShopProfileController.getMe))
shopRouter.get('/me', asyncHandler(ShopProfileController.getMe))
shopRouter.put('/me', asyncHandler(ShopProfileController.updateMe))

/**
 * @openapi
 * /api/shop/dashboard/overview:
 *   get:
 *     summary: Tổng quan dashboard shop
 *     tags: [Shop]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: "OK" }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
shopRouter.get('/dashboard/overview', asyncHandler(ShopDashboardController.getOverview))
shopRouter.get('/dashboard/today-bookings', asyncHandler(ShopDashboardController.getTodayBookings))
shopRouter.get('/dashboard/revenue', asyncHandler(ShopDashboardController.getRevenue))
shopRouter.get('/dashboard/cancel-rate', asyncHandler(ShopDashboardController.getCancelRate))
shopRouter.get('/dashboard/top-services', asyncHandler(ShopDashboardController.getTopServices))
shopRouter.get('/dashboard/top-staffs', asyncHandler(ShopDashboardController.getTopStaffs))

/**
 * @openapi
 * /api/shop/service-categories:
 *   get:
 *     summary: Danh sách danh mục dịch vụ
 *     tags: [Shop]
 *     security: [{ bearerAuth: [] }]
 *   post:
 *     summary: Tạo danh mục dịch vụ
 *     tags: [Shop]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string }
 *               slug: { type: string }
 *     responses:
 *       200: { description: "OK" }
 *       201: { description: "Created" }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
shopRouter.get('/service-categories', asyncHandler(ShopServicesController.getCategories))
shopRouter.post('/service-categories', asyncHandler(ShopServicesController.createCategory))
shopRouter.put('/service-categories/:categoryId', asyncHandler(ShopServicesController.updateCategory))
shopRouter.delete('/service-categories/:categoryId', asyncHandler(ShopServicesController.deleteCategory))

/**
 * @openapi
 * /api/shop/services:
 *   get:
 *     summary: Danh sách dịch vụ
 *     tags: [Shop]
 *     security: [{ bearerAuth: [] }]
 *   post:
 *     summary: Thêm dịch vụ
 *     tags: [Shop]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, categoryId]
 *             properties:
 *               name: { type: string }
 *               categoryId: { type: string }
 *               price: { type: number }
 *               durationMinutes: { type: number }
 *     responses:
 *       200: { description: "OK" }
 *       201: { description: "Created" }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
shopRouter.get('/services', asyncHandler(ShopServicesController.getServices))
shopRouter.post('/services', asyncHandler(ShopServicesController.createService))
shopRouter.get('/services/:serviceId', asyncHandler(ShopServicesController.getServiceById))
shopRouter.put('/services/:serviceId', asyncHandler(ShopServicesController.updateService))
shopRouter.delete('/services/:serviceId', asyncHandler(ShopServicesController.deleteService))
shopRouter.put('/services/:serviceId/status', asyncHandler(ShopServicesController.updateServiceStatus))

/**
 * @openapi
 * /api/shop/staffs:
 *   get:
 *     summary: Danh sách nhân viên
 *     tags: [Shop]
 *     security: [{ bearerAuth: [] }]
 *   post:
 *     summary: Thêm nhân viên
 *     tags: [Shop]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [fullName]
 *             properties:
 *               fullName: { type: string }
 *               phone: { type: string }
 *               role: { type: string }
 *     responses:
 *       200: { description: "OK" }
 *       201: { description: "Created" }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
shopRouter.get('/staffs', asyncHandler(ShopStaffsController.getStaffs))
shopRouter.post('/staffs', asyncHandler(ShopStaffsController.createStaff))
shopRouter.get('/staffs/:staffId', asyncHandler(ShopStaffsController.getStaffById))
shopRouter.put('/staffs/:staffId', asyncHandler(ShopStaffsController.updateStaff))
shopRouter.delete('/staffs/:staffId', asyncHandler(ShopStaffsController.deleteStaff))
shopRouter.put('/staffs/:staffId/status', asyncHandler(ShopStaffsController.updateStaffStatus))

/**
 * @openapi
 * /api/shop/working-hours:
 *   get:
 *     summary: Xem giờ làm việc
 *     tags: [Shop]
 *     security: [{ bearerAuth: [] }]
 *   put:
 *     summary: Cập nhật giờ làm việc
 *     tags: [Shop]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               openTime: { type: string, example: "09:00" }
 *               closeTime: { type: string, example: "20:00" }
 *               weekDays:
 *                 type: array
 *                 items: { type: number }
 *     responses:
 *       200: { description: "OK" }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
shopRouter.get('/working-hours', asyncHandler(ShopWorkingHoursController.getWorkingHours))
shopRouter.put('/working-hours', asyncHandler(ShopWorkingHoursController.updateWorkingHours))
shopRouter.get('/holiday-settings', asyncHandler(ShopWorkingHoursController.getHolidaySettings))
shopRouter.post('/holiday-settings', asyncHandler(ShopWorkingHoursController.createHoliday))
shopRouter.delete('/holiday-settings/:holidayId', asyncHandler(ShopWorkingHoursController.deleteHoliday))
shopRouter.get('/slot-settings', asyncHandler(ShopWorkingHoursController.getSlotSettings))
shopRouter.put('/slot-settings', asyncHandler(ShopWorkingHoursController.updateSlotSettings))

/**
 * @openapi
 * /api/shop/bookings:
 *   get:
 *     summary: Danh sách booking của shop
 *     tags: [Shop]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: "OK" }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
shopRouter.get('/bookings', asyncHandler(ShopBookingsController.getBookings))

/**
 * @openapi
 * /api/shop/bookings:
 *   post:
 *     summary: Shop tạo booking thủ công
 *     tags: [Shop]
 *     security: [{ bearerAuth: [] }]
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
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *       409: { $ref: '#/components/responses/Conflict' }
 */
shopRouter.post('/bookings', asyncHandler(ShopBookingsController.createBooking))
shopRouter.get('/bookings/:bookingId/loyalty-debug', asyncHandler(ShopBookingsController.debugBookingLoyalty))
shopRouter.get('/bookings/:bookingId', asyncHandler(ShopBookingsController.getBookingById))

/**
 * @openapi
 * /api/shop/bookings/{bookingId}/confirm:
 *   put:
 *     summary: Xác nhận booking
 *     tags: [Shop]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: "Confirmed" }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *       409: { $ref: '#/components/responses/Conflict' }
 */
shopRouter.put('/bookings/:bookingId/confirm', asyncHandler(ShopBookingsController.confirmBooking))

/**
 * @openapi
 * /api/shop/bookings/{bookingId}/cancel:
 *   put:
 *     summary: Hủy booking
 *     tags: [Shop]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason: { type: string }
 *     responses:
 *       200: { description: "Canceled" }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *       409: { $ref: '#/components/responses/Conflict' }
 */
shopRouter.put('/bookings/:bookingId/cancel', asyncHandler(ShopBookingsController.cancelBooking))

/**
 * @openapi
 * /api/shop/bookings/{bookingId}/check-in:
 *   put:
 *     summary: Check-in booking
 *     tags: [Shop]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: "Checked in" }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *       409: { $ref: '#/components/responses/Conflict' }
 */
shopRouter.put('/bookings/:bookingId/check-in', asyncHandler(ShopBookingsController.checkIn))

/**
 * @openapi
 * /api/shop/bookings/{bookingId}/check-out:
 *   put:
 *     summary: Check-out booking
 *     tags: [Shop]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: "Checked out" }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *       409: { $ref: '#/components/responses/Conflict' }
 */
shopRouter.put('/bookings/:bookingId/check-out', asyncHandler(ShopBookingsController.checkOut))

/**
 * @openapi
 * /api/shop/bookings/{bookingId}/no-show:
 *   put:
 *     summary: Đánh dấu no-show
 *     tags: [Shop]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: "No-show marked" }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *       409: { $ref: '#/components/responses/Conflict' }
 */
shopRouter.put('/bookings/:bookingId/no-show', asyncHandler(ShopBookingsController.noShow))

/**
 * @openapi
 * /api/shop/bookings/{bookingId}/note:
 *   put:
 *     summary: Cập nhật ghi chú booking
 *     tags: [Shop]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               note: { type: string }
 *     responses:
 *       200: { description: "OK" }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
shopRouter.put('/bookings/:bookingId/note', asyncHandler(ShopBookingsController.updateNote))

/**
 * @openapi
 * /api/shop/wallet:
 *   get:
 *     summary: Xem ví shop
 *     tags: [Shop]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: "OK" }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
shopRouter.get('/wallet', asyncHandler(ShopWalletController.getWallet))
shopRouter.get('/wallet/transactions', asyncHandler(ShopWalletController.getWalletTransactions))
shopRouter.post('/wallet/withdraw', asyncHandler(ShopWalletController.requestWithdrawal))
shopRouter.get('/wallet/withdrawals', asyncHandler(ShopWalletController.getWithdrawals))

/**
 * @openapi
 * /api/shop/wallet/topup/create:
 *   post:
 *     summary: Tạo giao dịch nạp ví
 *     tags: [Shop]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount]
 *             properties:
 *               amount: { type: number }
 *     responses:
 *       201: { description: "Created" }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
shopRouter.post('/wallet/topup/create', asyncHandler(ShopWalletController.createTopup))

/**
 * @openapi
 * /api/shop/wallet/topup/{topupId}/status:
 *   get:
 *     summary: Kiểm tra trạng thái nạp ví
 *     tags: [Shop]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: "OK" }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
shopRouter.get('/wallet/topup/:topupId/status', asyncHandler(ShopWalletController.getTopupStatus))
shopRouter.post('/wallet/topup/:topupId/refresh', asyncHandler(ShopWalletController.refreshTopup))

/**
 * @openapi
 * /api/shop/deposit-settings:
 *   get:
 *     summary: Xem cấu hình cọc
 *     tags: [Shop]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: "OK" }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
shopRouter.get('/deposit-settings', asyncHandler(ShopWalletController.getDepositSettings))

/**
 * @openapi
 * /api/shop/deposit-settings:
 *   put:
 *     summary: Cập nhật cấu hình cọc
 *     tags: [Shop]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: "OK" }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
shopRouter.put('/deposit-settings', asyncHandler(ShopWalletController.updateDepositSettings))

/**
 * @openapi
 * /api/shop/platform-fees:
 *   get:
 *     summary: Xem lịch sử phí nền tảng
 *     tags: [Shop]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: "OK" }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
shopRouter.get('/platform-fees', asyncHandler(ShopWalletController.getPlatformFees))

/**
 * @openapi
 * /api/shop/transactions:
 *   get:
 *     summary: Danh sách giao dịch shop
 *     tags: [Shop]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: "OK" }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
shopRouter.get('/transactions', asyncHandler(ShopWalletController.getTransactions))

/**
 * @openapi
 * /api/shop/transactions/{transactionId}:
 *   get:
 *     summary: Chi tiết giao dịch shop
 *     tags: [Shop]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: "OK" }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
shopRouter.get('/transactions/:transactionId', asyncHandler(ShopWalletController.getTransactionById))

/**
 * @openapi
 * /api/shop/notifications:
 *   get:
 *     summary: Danh sách thông báo shop
 *     tags: [Shop]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: "OK" }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
shopRouter.get('/notifications', asyncHandler(ShopNotificationsController.getNotifications))

/**
 * @openapi
 * /api/shop/notifications/{notificationId}/read:
 *   put:
 *     summary: Đọc một thông báo
 *     tags: [Shop]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: "OK" }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
shopRouter.put('/notifications/:notificationId/read', asyncHandler(ShopNotificationsController.readNotification))

/**
 * @openapi
 * /api/shop/notifications/read-all:
 *   put:
 *     summary: Đánh dấu đã đọc tất cả thông báo
 *     tags: [Shop]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: "OK" }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
shopRouter.put('/notifications/read-all', asyncHandler(ShopNotificationsController.readAll))

/**
 * @openapi
 * /api/shop/reviews:
 *   get:
 *     summary: Danh sách đánh giá
 *     tags: [Shop]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: "OK" }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
shopRouter.get('/reviews', asyncHandler(ShopReviewsController.getReviews))

/**
 * @openapi
 * /api/shop/cancel-reasons/statistics:
 *   get:
 *     summary: Thống kê lý do hủy
 *     tags: [Shop]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: "OK" }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
shopRouter.get('/cancel-reasons/statistics', asyncHandler(ShopReviewsController.getCancelReasonStats))

