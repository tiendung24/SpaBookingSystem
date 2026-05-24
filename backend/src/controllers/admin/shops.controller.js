import bcrypt from 'bcryptjs'
import { Booking, Shop, User, Wallet, WalletTransaction } from '../../models/index.js'
import { httpError } from '../../utils/httpError.js'
import { writeAuditLog } from '../../utils/audit.js'
import { buildShopStatusEmailForShop, sendEmailBestEffort } from '../../utils/emailNotifications.js'
import {
  isValidEmail,
  isValidPhone,
  isValidSlug,
  normalizeEmail,
  normalizePhone,
  normalizeSlug,
  requireString
} from '../../utils/validation.js'

function generatePassword() {
  return Math.random().toString(36).slice(2, 10)
}

async function ensureUniqueSlug(baseSlug) {
  let slug = baseSlug
  for (let index = 0; index < 30; index += 1) {
    // eslint-disable-next-line no-await-in-loop
    const existed = await Shop.findOne({ slug }).select({ _id: 1 }).lean()
    if (!existed) return slug
    slug = `${baseSlug}-${index + 2}`
  }
  throw httpError(409, 'Không thể tạo slug duy nhất')
}

export async function createShop(req, res) {
  const body = req.body || {}
  const shopName = requireString(body.shopName || body.name, 'shopName')
  const ownerName = String(body.owner || body.ownerName || '').trim()
  const district = String(body.district || '').trim()
  const phone = normalizePhone(body.phone)
  const email = body.email ? normalizeEmail(body.email) : ''
  const status = String(body.status || 'pending')

  if (!phone) throw httpError(400, 'Thiếu phone')
  if (!isValidPhone(phone)) throw httpError(400, 'Số điện thoại không hợp lệ')
  if (email && !isValidEmail(email)) throw httpError(400, 'Email không hợp lệ')
  if (!['pending', 'active', 'inactive', 'locked'].includes(status)) throw httpError(400, 'status không hợp lệ')

  const existedUser = await User.findOne({ $or: [{ phone }, ...(email ? [{ email }] : [])] }).lean()
  if (existedUser) throw httpError(409, 'Số điện thoại hoặc email đã tồn tại')

  const requestedSlug = body.slug ? normalizeSlug(body.slug) : normalizeSlug(shopName)
  if (!requestedSlug || !isValidSlug(requestedSlug)) {
    throw httpError(400, 'Slug không hợp lệ (3-80 ký tự, chỉ gồm a-z, 0-9 và dấu -)')
  }
  const slug = await ensureUniqueSlug(requestedSlug)

  const tempPassword = String(body.password || '').trim() || generatePassword()
  if (tempPassword.length < 6) throw httpError(400, 'Mật khẩu phải từ 6 ký tự trở lên')
  const passwordHash = await bcrypt.hash(tempPassword, 10)

  const user = await User.create({
    fullName: ownerName || shopName,
    phone,
    email: email || undefined,
    passwordHash,
    role: 'shop',
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date()
  })

  const shop = await Shop.create({
    ownerId: String(user._id),
    name: shopName,
    slug,
    phone,
    email: email || undefined,
    status,
    onlineBookingEnabled: true,
    address: district ? { district } : undefined,
    createdAt: new Date(),
    updatedAt: new Date()
  })

  user.shopId = String(shop._id)
  await user.save()

  await writeAuditLog({
    actorUserId: req.auth.userId,
    action: 'admin.shop_create',
    entity: 'shop',
    entityId: String(shop._id),
    meta: { slug: shop.slug, phone: user.phone }
  })

  res.status(201).json({
    shop,
    user: { _id: String(user._id), phone: user.phone, email: user.email || '', role: user.role },
    tempPassword
  })
}

export async function getShops(req, res) {
  const query = {}
  if (req.query.status) query.status = req.query.status
  if (req.query.keyword) {
    query.$or = [{ name: new RegExp(req.query.keyword, 'i') }, { slug: new RegExp(req.query.keyword, 'i') }]
  }
  const items = await Shop.find(query).sort({ createdAt: -1 }).lean()
  res.json({ items })
}

export async function getShopById(req, res) {
  const shop = await Shop.findById(req.params.shopId).lean()
  if (!shop) throw httpError(404, 'Không tìm thấy shop')
  res.json({ shop })
}

export async function lockShop(req, res) {
  const shop = await Shop.findByIdAndUpdate(req.params.shopId, { status: 'locked', updatedAt: new Date() }, { new: true }).lean()
  if (!shop) throw httpError(404, 'Không tìm thấy shop')
  await writeAuditLog({ actorUserId: req.auth.userId, action: 'admin.shop_lock', entity: 'shop', entityId: String(shop._id), meta: { previous: 'unknown', next: 'locked' } })
  if (shop.email) {
    const payload = buildShopStatusEmailForShop({ shopName: shop.name, statusLabel: 'locked' })
    await sendEmailBestEffort({ to: shop.email, ...payload })
  }
  res.json({ shop })
}

export async function unlockShop(req, res) {
  const shop = await Shop.findByIdAndUpdate(req.params.shopId, { status: 'active', updatedAt: new Date() }, { new: true }).lean()
  if (!shop) throw httpError(404, 'Không tìm thấy shop')
  await writeAuditLog({ actorUserId: req.auth.userId, action: 'admin.shop_unlock', entity: 'shop', entityId: String(shop._id), meta: { previous: 'unknown', next: 'active' } })
  if (shop.email) {
    const payload = buildShopStatusEmailForShop({ shopName: shop.name, statusLabel: 'active' })
    await sendEmailBestEffort({ to: shop.email, ...payload })
  }
  res.json({ shop })
}

export async function updateStatus(req, res) {
  const shop = await Shop.findByIdAndUpdate(req.params.shopId, { status: req.body?.status || 'inactive', updatedAt: new Date() }, { new: true }).lean()
  if (!shop) throw httpError(404, 'Không tìm thấy shop')
  await writeAuditLog({ actorUserId: req.auth.userId, action: 'admin.shop_status_update', entity: 'shop', entityId: String(shop._id), meta: { next: req.body?.status || 'inactive' } })
  if (shop.email) {
    const payload = buildShopStatusEmailForShop({ shopName: shop.name, statusLabel: req.body?.status || 'inactive' })
    await sendEmailBestEffort({ to: shop.email, ...payload })
  }
  res.json({ shop })
}

export async function getShopBookings(req, res) {
  const items = await Booking.find({ shopId: req.params.shopId }).sort({ createdAt: -1 }).lean()
  res.json({ items })
}

export async function getShopWallet(req, res) {
  const wallet = await Wallet.findOne({ shopId: req.params.shopId }).lean()
  res.json({ wallet: wallet || null })
}

export async function getShopTransactions(req, res) {
  const items = await WalletTransaction.find({ shopId: req.params.shopId }).sort({ createdAt: -1 }).lean()
  res.json({ items })
}

export async function getShopStatistics(req, res) {
  const shopId = req.params.shopId
  const [total, canceled, noShow, completed] = await Promise.all([
    Booking.countDocuments({ shopId }),
    Booking.countDocuments({ shopId, status: { $in: ['cancelled', 'canceled'] } }),
    Booking.countDocuments({ shopId, status: 'no_show' }),
    Booking.countDocuments({ shopId, status: 'completed' })
  ])

  res.json({
    stats: {
      totalBookings: total,
      cancelRate: total ? canceled / total : 0,
      noShowRate: total ? noShow / total : 0,
      completedRate: total ? completed / total : 0
    }
  })
}
