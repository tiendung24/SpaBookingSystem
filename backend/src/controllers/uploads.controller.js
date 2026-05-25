import crypto from 'crypto'
import { httpError } from '../utils/httpError.js'
import { getCloudinaryClient, cloudinaryUploadFolder } from '../config/cloudinary.js'
import { Upload } from '../models/index.js'

function parseBase64(input = '') {
  const match = String(input).match(/^data:(.+);base64,(.+)$/)
  if (match) {
    return { mime: match[1], data: match[2] }
  }
  return { mime: 'image/png', data: String(input) }
}

export async function uploadImage(req, res) {
  const cloudinary = getCloudinaryClient()
  const fileId = crypto.randomUUID()

  let dataUri = null
  let mimeType = 'image/png'

  if (req.file?.buffer?.length) {
    mimeType = req.file.mimetype || 'image/png'
    const base64 = req.file.buffer.toString('base64')
    dataUri = `data:${mimeType};base64,${base64}`
  } else {
    const imageBase64 = req.body?.imageBase64
    if (!imageBase64) throw httpError(400, 'Thiếu imageBase64 hoặc file image')

    const parsed = parseBase64(imageBase64)
    mimeType = parsed.mime || 'image/png'
    if (!parsed.data) throw httpError(400, 'Ảnh không hợp lệ')
    dataUri = `data:${mimeType};base64,${parsed.data}`
  }

  const result = await cloudinary.uploader.upload(dataUri, {
    folder: cloudinaryUploadFolder,
    public_id: fileId,
    overwrite: true,
    resource_type: 'image'
  })

  const payload = {
    fileId,
    fileName: `${fileId}.${result.format || 'jpg'}`,
    url: result.secure_url,
    size: result.bytes,
    publicId: result.public_id
  }

  await Upload.create({
    ...payload,
    mimeType,
    provider: 'cloudinary',
    ownerUserId: req.user?._id || req.user?.id || null,
    ownerShopId: req.user?.shopId || null,
    createdAt: new Date(),
    deletedAt: null
  })

  res.status(201).json(payload)
}

export async function deleteFile(req, res) {
  const fileId = req.params.fileId
  const uploadDoc = await Upload.findOne({ fileId, deletedAt: null }).lean()

  if (!uploadDoc) {
    throw httpError(404, 'Không tìm thấy file')
  }

  const cloudinary = getCloudinaryClient()
  const publicId = uploadDoc.publicId || `${cloudinaryUploadFolder}/${fileId}`
  const result = await cloudinary.uploader.destroy(publicId, {
    resource_type: 'image'
  })

  if (!result || result.result === 'not found') {
    throw httpError(404, 'Không tìm thấy file')
  }

  await Upload.updateOne(
    { _id: uploadDoc._id },
    {
      $set: {
        deletedAt: new Date()
      }
    }
  )

  res.json({ deleted: true })
}
