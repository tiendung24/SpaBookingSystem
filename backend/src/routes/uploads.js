import { Router } from 'express'
import { asyncHandler } from '../utils/asyncHandler.js'
import * as UploadsController from '../controllers/uploads.controller.js'
import { uploadImageMulter, uploadImageErrorHandler } from '../middlewares/uploadImage.middleware.js'

export const uploadsRouter = Router()

/**
 * @openapi
 * /api/uploads/image:
 *   post:
 *     summary: Upload ảnh (multipart/form-data hoặc base64)
 *     tags: [Uploads]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [image]
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *         application/json:
 *           schema:
 *             type: object
 *             required: [imageBase64]
 *             properties:
 *               imageBase64:
 *                 type: string
 *     responses:
 *       201:
 *         description: Uploaded
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/UploadImageResponse' }
 *       400: { $ref: '#/components/responses/BadRequest' }
 */
uploadsRouter.post('/image', uploadImageMulter, uploadImageErrorHandler, asyncHandler(UploadsController.uploadImage))

/**
 * @openapi
 * /api/uploads/{fileId}:
 *   delete:
 *     summary: Xóa file đã upload
 *     tags: [Uploads]
 */
uploadsRouter.delete('/:fileId', asyncHandler(UploadsController.deleteFile))

