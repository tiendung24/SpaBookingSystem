import { Shop } from '../../models/index.js'
import { httpError } from '../../utils/httpError.js'
import { writeAuditLog } from '../../utils/audit.js'
import { normalizeSlug } from '../../utils/validation.js'

async function buildUniqueShopSlug(name, shopId) {
  const baseSlug = normalizeSlug(name)
  if (!baseSlug) return ''

  let candidate = baseSlug
  let suffix = 2
  while (await Shop.exists({ slug: candidate, _id: { $ne: shopId } })) {
    candidate = `${baseSlug}-${suffix}`
    suffix += 1
  }
  return candidate
}

export async function getMe(req, res) {
  const shopId = req.auth.shopId
  if (!shopId) throw httpError(400, 'Tài khoản chưa gắn shopId')
  const shop = await Shop.findById(shopId).lean()
  if (!shop) throw httpError(404, 'Không tìm thấy shop')
  res.json({ shop })
}

export async function updateMe(req, res) {
  const shopId = req.auth.shopId
  if (!shopId) throw httpError(400, 'Tài khoản chưa gắn shopId')

  const allowed = [
    'name',
    'phone',
    'email',
    'address',
    'description',
    'logoUrl',
    'coverUrl',
    'onlineBookingEnabled',
    'businessTypes',
    'bankInfo',
    'notificationConfig'
  ]
  const patch = {}
  for (const key of allowed) {
    if (req.body?.[key] !== undefined) patch[key] = req.body[key]
  }

  if (patch.name !== undefined) {
    const nextSlug = await buildUniqueShopSlug(patch.name, shopId)
    if (!nextSlug) throw httpError(400, 'Tên shop không hợp lệ để tạo slug')
    patch.slug = nextSlug
    patch.publicUrl = `/${nextSlug}`
  }

  patch.updatedAt = new Date()

  const shop = await Shop.findByIdAndUpdate(shopId, { $set: patch }, { new: true }).lean()
  if (!shop) throw httpError(404, 'Không tìm thấy shop')
  await writeAuditLog({
    actorUserId: req.auth.userId,
    action: 'shop.profile_update',
    entity: 'shop',
    entityId: String(shop._id),
    meta: { updatedKeys: Object.keys(patch).filter((k) => k !== 'updatedAt') }
  })
  res.json({ shop })
}
