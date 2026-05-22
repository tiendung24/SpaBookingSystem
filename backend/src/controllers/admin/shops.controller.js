import { Booking, Shop, Wallet, WalletTransaction } from '../../models/index.js'
import { httpError } from '../../utils/httpError.js'
import { writeAuditLog } from '../../utils/audit.js'
import { buildShopStatusEmailForShop, sendEmailBestEffort } from '../../utils/emailNotifications.js'

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
  await writeAuditLog({
    actorUserId: req.auth.userId,
    action: 'admin.shop_lock',
    entity: 'shop',
    entityId: String(shop._id),
    meta: { previous: 'unknown', next: 'locked' }
  })
  if (shop.email) {
    const payload = buildShopStatusEmailForShop({ shopName: shop.name, statusLabel: 'locked' })
    await sendEmailBestEffort({ to: shop.email, ...payload })
  }
  res.json({ shop })
}

export async function unlockShop(req, res) {
  const shop = await Shop.findByIdAndUpdate(req.params.shopId, { status: 'active', updatedAt: new Date() }, { new: true }).lean()
  if (!shop) throw httpError(404, 'Không tìm thấy shop')
  await writeAuditLog({
    actorUserId: req.auth.userId,
    action: 'admin.shop_unlock',
    entity: 'shop',
    entityId: String(shop._id),
    meta: { previous: 'unknown', next: 'active' }
  })
  if (shop.email) {
    const payload = buildShopStatusEmailForShop({ shopName: shop.name, statusLabel: 'active' })
    await sendEmailBestEffort({ to: shop.email, ...payload })
  }
  res.json({ shop })
}

export async function updateStatus(req, res) {
  const shop = await Shop.findByIdAndUpdate(
    req.params.shopId,
    { status: req.body?.status || 'inactive', updatedAt: new Date() },
    { new: true }
  ).lean()
  if (!shop) throw httpError(404, 'Không tìm thấy shop')
  await writeAuditLog({
    actorUserId: req.auth.userId,
    action: 'admin.shop_status_update',
    entity: 'shop',
    entityId: String(shop._id),
    meta: { next: req.body?.status || 'inactive' }
  })
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
