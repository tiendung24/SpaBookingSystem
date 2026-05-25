import { v2 as cloudinary } from 'cloudinary'

const cloudName = process.env.CLOUDINARY_CLOUD_NAME
const apiKey = process.env.CLOUDINARY_API_KEY
const apiSecret = process.env.CLOUDINARY_API_SECRET

export const cloudinaryUploadFolder = process.env.CLOUDINARY_UPLOAD_FOLDER || 'lumix'

export function assertCloudinaryConfigured() {
  if (!cloudName || !apiKey || !apiSecret) {
    const err = new Error('Cloudinary chưa được cấu hình')
    err.statusCode = 500
    throw err
  }
}

export function getCloudinaryClient() {
  assertCloudinaryConfigured()
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret
  })
  return cloudinary
}
