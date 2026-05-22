import { Router } from 'express'
import { asyncHandler } from '../utils/asyncHandler.js'
import * as NotificationsController from '../controllers/notifications.controller.js'

export const notificationsRouter = Router()

/**
 * @openapi
 * /api/notifications/send-email:
 *   post:
 *     summary: Gửi Email
 *     tags: [Notifications]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [to, subject]
 *             properties:
 *               to: { type: string }
 *               subject: { type: string }
 *               text: { type: string }
 *               html: { type: string }
 *     responses:
 *       200: { $ref: '#/components/responses/Ok' }
 *       400: { $ref: '#/components/responses/BadRequest' }
 */
notificationsRouter.post('/send-email', asyncHandler(NotificationsController.sendEmail))
