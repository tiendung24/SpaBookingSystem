import fs from 'fs/promises'
import path from 'path'
import crypto from 'crypto'
import { httpError } from '../utils/httpError.js'

const uploadDir = path.resolve(process.cwd(), 'uploads')

function parseBase64(input = '') {
  const match = String(input).match(/^data:(.+);base64,(.+)$/)
  if (match) {
    return { mime: match[1], data: match[2] }
  }
  return { mime: 'image/png', data: String(input) }
}

function extFromMime(mime = '') {
  if (mime.includes('jpeg') || mime.includes('jpg')) return '.jpg'
  if (mime.includes('webp')) return '.webp'
  if (mime.includes('gif')) return '.gif'
  return '.png'
}

export async function uploadImage(req, res) {
  const imageBase64 = req.body?.imageBase64
  if (!imageBase64) throw httpError(400, 'Thiếu imageBase64')

  const { mime, data } = parseBase64(imageBase64)
  const buffer = Buffer.from(data, 'base64')
  if (!buffer.length) throw httpError(400, 'Ảnh không hợp lệ')

  await fs.mkdir(uploadDir, { recursive: true })
  const fileId = crypto.randomUUID()
  const ext = extFromMime(mime)
  const fileName = `${fileId}${ext}`
  const fullPath = path.join(uploadDir, fileName)
  await fs.writeFile(fullPath, buffer)

  const appBaseUrl = process.env.APP_BASE_URL || 'http://localhost:4000'
  const url = `${appBaseUrl}/uploads/${fileName}`
  res.status(201).json({ fileId, fileName, url, size: buffer.length })
}

export async function deleteFile(req, res) {
  const fileId = req.params.fileId
  await fs.mkdir(uploadDir, { recursive: true })
  const files = await fs.readdir(uploadDir)
  const target = files.find((f) => f.startsWith(fileId))
  if (!target) throw httpError(404, 'Không tìm thấy file')
  await fs.unlink(path.join(uploadDir, target))
  res.json({ deleted: true })
}
