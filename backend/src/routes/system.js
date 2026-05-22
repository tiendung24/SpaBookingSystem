import { Router } from 'express'
import { asyncHandler } from '../utils/asyncHandler.js'
import * as SystemFraudController from '../controllers/systemFraud.controller.js'

export const systemRouter = Router()

/**
 * @openapi
 * /api/system/fraud/check-cancel-rate:
 *   post:
 *     summary: Kiểm tra tỷ lệ hủy
 *     tags: [System]
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               shopId: { type: string, nullable: true }
 *               fromDate: { type: string, nullable: true, example: "2026-05-01" }
 *               toDate: { type: string, nullable: true, example: "2026-05-22" }
 *     responses:
 *       200: { description: "OK" }
 *       400: { $ref: '#/components/responses/BadRequest' }
 */
systemRouter.post('/fraud/check-cancel-rate', asyncHandler(SystemFraudController.checkCancelRate))

/**
 * @openapi
 * /api/system/fraud/auto-lock-shops:
 *   post:
 *     summary: Tự động khóa shop theo rule gian lận
 *     tags: [System]
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               maxCancelRate: { type: number, nullable: true, example: 0.2 }
 *     responses:
 *       200: { description: "OK" }
 *       400: { $ref: '#/components/responses/BadRequest' }
 */
systemRouter.post('/fraud/auto-lock-shops', asyncHandler(SystemFraudController.autoLockShops))
