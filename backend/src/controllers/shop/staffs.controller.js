import { ShopStaff } from '../../models/index.js'
import { httpError } from '../../utils/httpError.js'
import { writeAuditLog } from '../../utils/audit.js'
import { isValidPhone, normalizePhone, requireString, toNumber } from '../../utils/validation.js'

export async function getStaffs(req, res) {
  const shopId = req.auth.shopId
  const query = { shopId }
  if (req.query.status) query.status = req.query.status
  const items = await ShopStaff.find(query).sort({ createdAt: 1 }).lean()
  res.json({ items })
}

export async function createStaff(req, res) {
  const shopId = req.auth.shopId
  const { fullName } = req.body || {}

  const staffName = requireString(fullName, 'fullName')
  const phone = req.body?.phone ? normalizePhone(req.body.phone) : ''
  if (phone && !isValidPhone(phone)) throw httpError(400, 'Số điện thoại không hợp lệ')

  const staff = await ShopStaff.create({
    shopId,
    userId: req.body?.userId || '',
    fullName: staffName,
    phone,
    avatarUrl: req.body?.avatarUrl || '',
    role: req.body?.role || 'staff',
    status: req.body?.status || 'active',
    serviceIds: Array.isArray(req.body?.serviceIds) ? req.body.serviceIds : [],
    rating: toNumber(req.body?.rating || 0),
    createdAt: new Date(),
    updatedAt: new Date()
  })
  await writeAuditLog({
    actorUserId: req.auth.userId,
    action: 'shop.staff_create',
    entity: 'shop_staff',
    entityId: String(staff._id),
    meta: { shopId }
  })
  res.status(201).json({ staff })
}

export async function getStaffById(req, res) {
  const shopId = req.auth.shopId
  const staff = await ShopStaff.findOne({ _id: req.params.staffId, shopId }).lean()
  if (!staff) throw httpError(404, 'Không tìm thấy nhân viên')
  res.json({ staff })
}

export async function updateStaff(req, res) {
  const shopId = req.auth.shopId
  const patch = { ...(req.body || {}) }

  if (patch.fullName !== undefined) patch.fullName = requireString(patch.fullName, 'fullName')
  if (patch.phone !== undefined) {
    const phone = patch.phone ? normalizePhone(patch.phone) : ''
    if (phone && !isValidPhone(phone)) throw httpError(400, 'Số điện thoại không hợp lệ')
    patch.phone = phone
  }
  if (patch.rating !== undefined) patch.rating = toNumber(patch.rating)
  patch.updatedAt = new Date()

  const staff = await ShopStaff.findOneAndUpdate({ _id: req.params.staffId, shopId }, patch, { new: true }).lean()
  if (!staff) throw httpError(404, 'Không tìm thấy nhân viên')
  await writeAuditLog({
    actorUserId: req.auth.userId,
    action: 'shop.staff_update',
    entity: 'shop_staff',
    entityId: String(staff._id),
    meta: { shopId }
  })
  res.json({ staff })
}

export async function deleteStaff(req, res) {
  const shopId = req.auth.shopId
  const deleted = await ShopStaff.findOneAndDelete({ _id: req.params.staffId, shopId }).lean()
  if (!deleted) throw httpError(404, 'Không tìm thấy nhân viên')
  await writeAuditLog({
    actorUserId: req.auth.userId,
    action: 'shop.staff_delete',
    entity: 'shop_staff',
    entityId: String(deleted._id),
    meta: { shopId }
  })
  res.json({ deleted: true })
}

export async function updateStaffStatus(req, res) {
  const shopId = req.auth.shopId
  const statusText = String(req.body?.status || 'inactive')
  if (!['active', 'inactive'].includes(statusText)) throw httpError(400, 'status không hợp lệ')

  const staff = await ShopStaff.findOneAndUpdate(
    { _id: req.params.staffId, shopId },
    { status: statusText, updatedAt: new Date() },
    { new: true }
  ).lean()
  if (!staff) throw httpError(404, 'Không tìm thấy nhân viên')
  await writeAuditLog({
    actorUserId: req.auth.userId,
    action: 'shop.staff_status_update',
    entity: 'shop_staff',
    entityId: String(staff._id),
    meta: { shopId, status: staff.status }
  })
  res.json({ staff })
}