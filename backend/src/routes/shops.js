import { Router } from 'express'
import { asyncHandler } from '../utils/asyncHandler.js'
import { requireAuth, requireRole } from '../middlewares/auth.js'
import * as ShopProfileController from '../controllers/shop/profile.controller.js'

export const shopsRouter = Router()

/**
 * @openapi
 * /api/shops/me:
 *   get:
 *     summary: Lấy hồ sơ shop (alias)
 *     tags: [Shop]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Shop profile
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ShopResponse' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *   put:
 *     summary: Cập nhật hồ sơ shop (alias)
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
 *               address: { type: string }
 *               description: { type: string }
 *               logo: { type: string }
 *     responses:
 *       200:
 *         description: Updated
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ShopResponse' }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *       409: { $ref: '#/components/responses/Conflict' }
 */
shopsRouter.get(
  '/me',
  requireAuth,
  requireRole(['shop', 'owner', 'shop_owner']),
  asyncHandler(ShopProfileController.getMe)
)

shopsRouter.put(
  '/me',
  requireAuth,
  requireRole(['shop', 'owner', 'shop_owner']),
  asyncHandler(ShopProfileController.updateMe)
)
