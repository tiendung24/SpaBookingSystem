import { Router } from 'express'
import { asyncHandler } from '../utils/asyncHandler.js'
import * as AuthController from '../controllers/auth.controller.js'
import { requireAuth } from '../middlewares/auth.js'

export const authRouter = Router()

/**
 * @openapi
 * /api/auth/shop/register:
 *   post:
 *     summary: Đăng ký shop
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [phone, password, shopName, slug]
 *             properties:
 *               fullName: { type: string }
 *               phone: { type: string }
 *               email: { type: string }
 *               password: { type: string }
 *               shopName: { type: string }
 *               slug: { type: string }
 *     responses:
 *       201:
 *         description: Registered
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/AuthLoginResponse' }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       409: { $ref: '#/components/responses/Conflict' }
 */
authRouter.post('/shop/register', asyncHandler(AuthController.shopRegister))

/**
 * @openapi
 * /api/auth/shop/login:
 *   post:
 *     summary: Đăng nhập shop
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [password]
 *             properties:
 *               phone: { type: string }
 *               email: { type: string }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: Logged in
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/AuthLoginResponse' }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
authRouter.post('/shop/login', asyncHandler(AuthController.shopLogin))

/**
 * @openapi
 * /api/auth/admin/login:
 *   post:
 *     summary: Đăng nhập admin
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [password]
 *             properties:
 *               phone: { type: string }
 *               email: { type: string }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: Logged in
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token: { type: string }
 *                 user: { $ref: '#/components/schemas/User' }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
authRouter.post('/admin/login', asyncHandler(AuthController.adminLogin))

/**
 * @openapi
 * /api/auth/me:
 *   get:
 *     summary: Lấy thông tin tài khoản đăng nhập
 *     tags: [Auth]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Me
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/MeResponse' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
authRouter.get('/me', requireAuth, asyncHandler(AuthController.me))

/**
 * @openapi
 * /api/auth/change-password:
 *   put:
 *     summary: Đổi mật khẩu
 *     tags: [Auth]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [oldPassword, newPassword]
 *             properties:
 *               oldPassword: { type: string }
 *               newPassword: { type: string }
 *     responses:
 *       200: { $ref: '#/components/responses/Ok' }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
authRouter.put('/change-password', requireAuth, asyncHandler(AuthController.changePassword))
authRouter.put('/change-email', requireAuth, asyncHandler(AuthController.changeEmail))

authRouter.post('/customer/register', asyncHandler(AuthController.customerRegister))
authRouter.post('/customer/login', asyncHandler(AuthController.customerLogin))

authRouter.post('/forgot-password', asyncHandler(AuthController.forgotPassword))
authRouter.post('/reset-password', asyncHandler(AuthController.resetPassword))
