import { Router } from 'express'
import { asyncHandler } from '../utils/asyncHandler.js'
import * as WebhooksController from '../controllers/webhooks.controller.js'

export const webhooksRouter = Router()

/**
 * @openapi
 * /api/webhooks/payos:
 *   post:
 *     summary: Webhook PayOS
 *     tags: [Webhooks]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             additionalProperties: true
 *     responses:
 *       200:
 *         description: Webhook accepted
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/WebhookAckResponse' }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       409: { $ref: '#/components/responses/Conflict' }
 */
webhooksRouter.post('/payos', asyncHandler(WebhooksController.payosWebhook))
