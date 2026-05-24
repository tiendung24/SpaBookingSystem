import { httpError } from './httpError.js'

export function normalizePhone(phone) {
  return String(phone || '')
    .trim()
    .replace(/[\s.-]/g, '')
}

export function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase()
}

export function normalizeSlug(slug) {
  return String(slug || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\u0111/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
}

export function isValidPhone(phone) {
  return /^(?:\+84|0)\d{9,10}$/.test(phone)
}

export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function isValidSlug(slug) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) && slug.length >= 3 && slug.length <= 80
}

export function toNumber(value, fallback = 0) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

export function requireString(value, field, { trim = true, minLen = 1 } = {}) {
  const text = trim ? String(value || '').trim() : String(value || '')
  if (!text || text.length < minLen) throw httpError(400, `Thiếu ${field}`)
  return text
}

export function requireNumber(value, field, { min = null, max = null } = {}) {
  const n = toNumber(value, NaN)
  if (!Number.isFinite(n)) throw httpError(400, `${field} không hợp lệ`)
  if (min !== null && n < min) throw httpError(400, `${field} không hợp lệ`)
  if (max !== null && n > max) throw httpError(400, `${field} không hợp lệ`)
  return n
}

export function requireObject(value, message = 'Body phải là object') {
  if (!value || typeof value !== 'object') throw httpError(400, message)
  return value
}

export function toMinutes(timeHHmm) {
  const [h, m] = String(timeHHmm || '').split(':')
  const hour = Number(h)
  const minute = Number(m)
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return NaN
  return hour * 60 + minute
}

export function requireTimeOrder(openTime, closeTime) {
  const open = toMinutes(openTime)
  const close = toMinutes(closeTime)
  if (!Number.isFinite(open) || !Number.isFinite(close) || close <= open) {
    throw httpError(400, 'Giờ mở/đóng cửa không hợp lệ')
  }
}