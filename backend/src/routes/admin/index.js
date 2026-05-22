import { Router } from 'express'
import { asyncHandler } from '../../utils/asyncHandler.js'
import { requireAuth, requireRole } from '../../middlewares/auth.js'
import * as AdminDashboardController from '../../controllers/admin/dashboard.controller.js'
import * as AdminShopsController from '../../controllers/admin/shops.controller.js'
import * as AdminBookingsController from '../../controllers/admin/bookings.controller.js'
import * as AdminWalletsController from '../../controllers/admin/wallets.controller.js'
import * as AdminRefundsController from '../../controllers/admin/refunds.controller.js'
import * as AdminFraudController from '../../controllers/admin/fraud.controller.js'
import * as AdminNotificationsController from '../../controllers/admin/notifications.controller.js'
import * as AdminSettingsController from '../../controllers/admin/settings.controller.js'

export const adminRouter = Router()

adminRouter.use(requireAuth, requireRole(['admin', 'super_admin']))

/**
 * @openapi
 * /api/admin/dashboard/overview:
 *   get:
 *     summary: Dashboard tổng quan (admin)
 *     tags: [Admin]
 *     security: [{ bearerAuth: [] }]
 */
adminRouter.get('/dashboard/overview', asyncHandler(AdminDashboardController.overview))
adminRouter.get('/dashboard/revenue', asyncHandler(AdminDashboardController.revenue))
adminRouter.get('/dashboard/bookings', asyncHandler(AdminDashboardController.bookings))
adminRouter.get('/dashboard/wallet-topups', asyncHandler(AdminDashboardController.walletTopups))
adminRouter.get('/dashboard/pending-refunds', asyncHandler(AdminDashboardController.pendingRefunds))
adminRouter.get('/dashboard/fraud-reports', asyncHandler(AdminDashboardController.fraudReports))
adminRouter.get('/dashboard/locked-shops', asyncHandler(AdminDashboardController.lockedShops))

/**
 * @openapi
 * /api/admin/shops:
 *   get:
 *     summary: Danh sách shop (admin)
 *     tags: [Admin]
 *     security: [{ bearerAuth: [] }]
 */
adminRouter.get('/shops', asyncHandler(AdminShopsController.getShops))
adminRouter.get('/shops/:shopId', asyncHandler(AdminShopsController.getShopById))

/**
 * @openapi
 * /api/admin/shops/{shopId}/lock:
 *   put:
 *     summary: Khóa shop
 *     tags: [Admin]
 *     security: [{ bearerAuth: [] }]
 */
adminRouter.put('/shops/:shopId/lock', asyncHandler(AdminShopsController.lockShop))

/**
 * @openapi
 * /api/admin/shops/{shopId}/unlock:
 *   put:
 *     summary: Mở khóa shop
 *     tags: [Admin]
 *     security: [{ bearerAuth: [] }]
 */
adminRouter.put('/shops/:shopId/unlock', asyncHandler(AdminShopsController.unlockShop))

/**
 * @openapi
 * /api/admin/shops/{shopId}/status:
 *   put:
 *     summary: Đổi trạng thái shop
 *     tags: [Admin]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status: { type: string, example: "active" }
 */
adminRouter.put('/shops/:shopId/status', asyncHandler(AdminShopsController.updateStatus))
adminRouter.get('/shops/:shopId/bookings', asyncHandler(AdminShopsController.getShopBookings))
adminRouter.get('/shops/:shopId/wallet', asyncHandler(AdminShopsController.getShopWallet))
adminRouter.get('/shops/:shopId/transactions', asyncHandler(AdminShopsController.getShopTransactions))
adminRouter.get('/shops/:shopId/statistics', asyncHandler(AdminShopsController.getShopStatistics))

/**
 * @openapi
 * /api/admin/bookings:
 *   get:
 *     summary: Booking toàn hệ thống (admin)
 *     tags: [Admin]
 *     security: [{ bearerAuth: [] }]
 */
adminRouter.get('/bookings', asyncHandler(AdminBookingsController.getBookings))
adminRouter.get('/bookings/:bookingId', asyncHandler(AdminBookingsController.getBookingById))

/**
 * @openapi
 * /api/admin/bookings/{bookingId}/status:
 *   put:
 *     summary: Cập nhật trạng thái booking
 *     tags: [Admin]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status: { type: string, example: "confirmed" }
 */
adminRouter.put('/bookings/:bookingId/status', asyncHandler(AdminBookingsController.updateStatus))
adminRouter.get('/bookings/:bookingId/payments', asyncHandler(AdminBookingsController.getPayments))
adminRouter.get('/bookings/:bookingId/escrow', asyncHandler(AdminBookingsController.getEscrow))

/**
 * @openapi
 * /api/admin/wallets:
 *   get:
 *     summary: Danh sách ví shop
 *     tags: [Admin]
 *     security: [{ bearerAuth: [] }]
 */
adminRouter.get('/wallets', asyncHandler(AdminWalletsController.getWallets))
adminRouter.get('/wallets/:shopId', asyncHandler(AdminWalletsController.getWalletByShopId))

/**
 * @openapi
 * /api/admin/wallets/{shopId}/adjust:
 *   post:
 *     summary: Điều chỉnh số dư ví
 *     tags: [Admin]
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
 *               description: { type: string }
 */
adminRouter.post('/wallets/:shopId/adjust', asyncHandler(AdminWalletsController.adjustBalance))
adminRouter.get('/wallet-transactions', asyncHandler(AdminWalletsController.getWalletTransactions))
adminRouter.get('/transactions', asyncHandler(AdminWalletsController.getTransactions))
adminRouter.get('/transactions/:transactionId', asyncHandler(AdminWalletsController.getTransactionById))
adminRouter.get('/platform-fees', asyncHandler(AdminWalletsController.getPlatformFees))
adminRouter.get('/platform-fees/statistics', asyncHandler(AdminWalletsController.getPlatformFeesStats))

/**
 * @openapi
 * /api/admin/refunds:
 *   get:
 *     summary: Danh sách refund
 *     tags: [Admin]
 *     security: [{ bearerAuth: [] }]
 */
adminRouter.get('/refunds', asyncHandler(AdminRefundsController.getRefunds))
adminRouter.get('/refunds/:refundId', asyncHandler(AdminRefundsController.getRefundById))

/**
 * @openapi
 * /api/admin/refunds/{refundId}/processing:
 *   put:
 *     summary: Chuyển refund sang processing
 *     tags: [Admin]
 *     security: [{ bearerAuth: [] }]
 */
adminRouter.put('/refunds/:refundId/processing', asyncHandler(AdminRefundsController.markProcessing))

/**
 * @openapi
 * /api/admin/refunds/{refundId}/success:
 *   put:
 *     summary: Đánh dấu refund thành công
 *     tags: [Admin]
 *     security: [{ bearerAuth: [] }]
 */
adminRouter.put('/refunds/:refundId/success', asyncHandler(AdminRefundsController.markSuccess))

/**
 * @openapi
 * /api/admin/refunds/{refundId}/failed:
 *   put:
 *     summary: Đánh dấu refund thất bại
 *     tags: [Admin]
 *     security: [{ bearerAuth: [] }]
 */
adminRouter.put('/refunds/:refundId/failed', asyncHandler(AdminRefundsController.markFailed))
adminRouter.get('/escrows', asyncHandler(AdminRefundsController.getEscrows))
adminRouter.get('/escrows/:bookingId', asyncHandler(AdminRefundsController.getEscrowByBookingId))

/**
 * @openapi
 * /api/admin/escrows/{bookingId}/release-to-shop:
 *   put:
 *     summary: Chuyển cọc cho shop
 *     tags: [Admin]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: "Released to shop" }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *       409: { $ref: '#/components/responses/Conflict' }
 */
adminRouter.put('/escrows/:bookingId/release-to-shop', asyncHandler(AdminRefundsController.releaseToShop))

/**
 * @openapi
 * /api/admin/escrows/{bookingId}/refund-to-customer:
 *   put:
 *     summary: Hoàn cọc cho khách
 *     tags: [Admin]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: "Refunded to customer" }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *       409: { $ref: '#/components/responses/Conflict' }
 */
adminRouter.put('/escrows/:bookingId/refund-to-customer', asyncHandler(AdminRefundsController.refundToCustomer))

/**
 * @openapi
 * /api/admin/escrows/{bookingId}/split-no-show:
 *   put:
 *     summary: Chia tiền cọc cho no-show
 *     tags: [Admin]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: "No-show split applied" }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *       409: { $ref: '#/components/responses/Conflict' }
 */
adminRouter.put('/escrows/:bookingId/split-no-show', asyncHandler(AdminRefundsController.splitNoShow))

/**
 * @openapi
 * /api/admin/fraud-reports:
 *   get:
 *     summary: Danh sách tố giác gian lận
 *     tags: [Admin]
 *     security: [{ bearerAuth: [] }]
 */
adminRouter.get('/fraud-reports', asyncHandler(AdminFraudController.getReports))
adminRouter.get('/fraud-reports/:reportId', asyncHandler(AdminFraudController.getReportById))

/**
 * @openapi
 * /api/admin/fraud-reports/{reportId}/approve:
 *   put:
 *     summary: Duyệt tố giác gian lận
 *     tags: [Admin]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: "Approved" }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *       409: { $ref: '#/components/responses/Conflict' }
 */
adminRouter.put('/fraud-reports/:reportId/approve', asyncHandler(AdminFraudController.approve))

/**
 * @openapi
 * /api/admin/fraud-reports/{reportId}/reject:
 *   put:
 *     summary: Từ chối tố giác gian lận
 *     tags: [Admin]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: "Rejected" }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *       409: { $ref: '#/components/responses/Conflict' }
 */
adminRouter.put('/fraud-reports/:reportId/reject', asyncHandler(AdminFraudController.reject))

/**
 * @openapi
 * /api/admin/notifications:
 *   get:
 *     summary: Thông báo admin
 *     tags: [Admin]
 *     security: [{ bearerAuth: [] }]
 */
adminRouter.get('/notifications', asyncHandler(AdminNotificationsController.getNotifications))

/**
 * @openapi
 * /api/admin/notifications/send:
 *   post:
 *     summary: Gửi thông báo hệ thống
 *     tags: [Admin]
 *     security: [{ bearerAuth: [] }]
 */
adminRouter.post('/notifications/send', asyncHandler(AdminNotificationsController.sendNotification))

/**
 * @openapi
 * /api/admin/settings:
 *   get:
 *     summary: Xem settings hệ thống
 *     tags: [Admin]
 *     security: [{ bearerAuth: [] }]
 *   put:
 *     summary: Cập nhật settings hệ thống
 *     tags: [Admin]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 */
adminRouter.get('/settings', asyncHandler(AdminSettingsController.getSettings))
adminRouter.put('/settings', asyncHandler(AdminSettingsController.updateSettings))
