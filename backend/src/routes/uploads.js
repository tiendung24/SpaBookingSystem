import { Router } from 'express'
import { asyncHandler } from '../utils/asyncHandler.js'
import * as UploadsController from '../controllers/uploads.controller.js'

export const uploadsRouter = Router()

/**
 * @openapi
 * /api/uploads/image:
 *   post:
 *     summary: Upload ảnh base64
 *     tags: [Uploads]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [fileName, contentBase64]
 *             properties:
 *               fileName: { type: string }
 *               contentBase64: { type: string }
 *               folder: { type: string, nullable: true }
 *     responses:
 *       200:
 *         description: Uploaded
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/UploadImageResponse' }
 *       400: { $ref: '#/components/responses/BadRequest' }
 */
uploadsRouter.post('/image', asyncHandler(UploadsController.uploadImage))

/**
 * @openapi
 * /api/uploads/{fileId}:
 *   delete:
 *     summary: Xóa file đã upload
 *     tags: [Uploads]
 *     parameters:
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { $ref: '#/components/responses/Ok' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
uploadsRouter.delete('/:fileId', asyncHandler(UploadsController.deleteFile))
