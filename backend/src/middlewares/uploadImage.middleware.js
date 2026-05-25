import multer from 'multer'
import { httpError } from '../utils/httpError.js'

const MAX_IMAGE_SIZE = 2 * 1024 * 1024
const allowedMimes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])

const storage = multer.memoryStorage()

function fileFilter(req, file, cb) {
  if (!file || !allowedMimes.has(file.mimetype)) {
    cb(httpError(400, 'Chỉ hỗ trợ ảnh JPG, PNG, WEBP, GIF'))
    return
  }
  cb(null, true)
}

export const uploadImageMulter = multer({
  storage,
  limits: { fileSize: MAX_IMAGE_SIZE },
  fileFilter
}).single('image')

export function uploadImageErrorHandler(err, req, res, next) {
  if (!err) return next()

  if (err.code === 'LIMIT_FILE_SIZE') {
    return next(httpError(400, 'Kích thước ảnh tối đa 2MB'))
  }

  return next(err)
}
