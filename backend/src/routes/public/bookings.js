import { Router } from 'express'
import { asyncHandler } from '../../utils/asyncHandler.js'
import * as PublicBookingsController from '../../controllers/public/bookings.controller.js'

export const publicBookingsRouter = Router()

/**
 * @openapi
 * /api/public/bookings/{bookingCode}:
 *   get:
 *     summary: Xem chi tiết booking theo mã
 *     tags: [Public]
 *     responses:
 *       200:
 *         description: Booking detail
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 booking: { $ref: '#/components/schemas/Booking' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
publicBookingsRouter.get('/:bookingCode', asyncHandler(PublicBookingsController.getBookingByCode))

/**
 * @openapi
 * /api/public/bookings/{bookingCode}/cancel:
 *   post:
 *     summary: Khách hủy lịch
 *     tags: [Public]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason: { type: string }
 *     responses:
 *       200: { description: "Canceled" }
 *       404: { $ref: '#/components/responses/NotFound' }
 *       409: { $ref: '#/components/responses/Conflict' }
 */
publicBookingsRouter.post('/:bookingCode/cancel', asyncHandler(PublicBookingsController.cancelBooking))

/**
 * @openapi
 * /api/public/bookings/{bookingCode}/refund-info:
 *   post:
 *     summary: Nhập thông tin hoàn tiền
 *     tags: [Public]
 *     responses:
 *       200:
 *         description: Refund request created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 refundId: { type: string }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
publicBookingsRouter.post('/:bookingCode/refund-info', asyncHandler(PublicBookingsController.submitRefundInfo))

/**
 * @openapi
 * /api/public/bookings/{bookingCode}/refund-status:
 *   get:
 *     summary: Xem trạng thái hoàn tiền
 *     tags: [Public]
 *     responses:
 *       200:
 *         description: Refund status
 *       404: { $ref: '#/components/responses/NotFound' }
 */
publicBookingsRouter.get('/:bookingCode/refund-status', asyncHandler(PublicBookingsController.getRefundStatus))

/**
 * @openapi
 * /api/public/bookings/{bookingCode}/report-shop-fraud:
 *   post:
 *     summary: Tố giác shop gian lận
 *     tags: [Public]
 *     responses:
 *       200:
 *         description: Report created
 *       404: { $ref: '#/components/responses/NotFound' }
 */
publicBookingsRouter.post('/:bookingCode/report-shop-fraud', asyncHandler(PublicBookingsController.reportShopFraud))

/**
 * @openapi
 * /api/public/bookings/{bookingCode}/reviews:
 *   post:
 *     summary: Đánh giá sau dịch vụ
 *     tags: [Public]
 *     responses:
 *       200: { description: "Review saved" }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
publicBookingsRouter.post('/:bookingCode/reviews', asyncHandler(PublicBookingsController.createReview))

publicBookingsRouter.post('/:bookingCode/expire-unpaid', asyncHandler(PublicBookingsController.expireUnpaidBooking))
