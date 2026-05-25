import { Router } from 'express'
import { asyncHandler } from '../../utils/asyncHandler.js'
import * as PublicShopsController from '../../controllers/public/shops.controller.js'

export const publicShopsRouter = Router()

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
 *     summary: Xem tráº¡ng thÃ¡i shop
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
 *     summary: Xem danh má»¥c dá»‹ch vá»¥
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
 *     summary: Xem danh sÃ¡ch dá»‹ch vá»¥
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
 *     summary: Xem chi tiáº¿t dá»‹ch vá»¥
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
 *     summary: Xem nhÃ¢n viÃªn
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
 *     summary: Xem slot trá»‘ng
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
 *     summary: Tra cá»©u booking theo sá»‘ Ä‘iá»‡n thoáº¡i
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
 *     summary: Táº¡o booking (khÃ¡ch Ä‘áº·t lá»‹ch)
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
publicShopsRouter.post('/:slug/bookings', asyncHandler(PublicShopsController.createBooking))
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


