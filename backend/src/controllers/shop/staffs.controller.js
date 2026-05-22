import { ShopStaff } from '../../models/index.js'
import { httpError } from '../../utils/httpError.js'
import { writeAuditLog } from '../../utils/audit.js'

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
  if (!fullName) throw httpError(400, 'Thiếu fullName')

  const staff = await ShopStaff.create({
    shopId,
    userId: req.body?.userId || '',
    fullName,
    phone: req.body?.phone || '',
    avatarUrl: req.body?.avatarUrl || '',
    role: req.body?.role || 'staff',
    status: req.body?.status || 'active',
    serviceIds: Array.isArray(req.body?.serviceIds) ? req.body.serviceIds : [],
    rating: Number(req.body?.rating || 0),
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
  const staff = await ShopStaff.findOneAndUpdate(
    { _id: req.params.staffId, shopId },
    { ...req.body, updatedAt: new Date() },
    { new: true }
  ).lean()
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
  const staff = await ShopStaff.findOneAndUpdate(
    { _id: req.params.staffId, shopId },
    { status: req.body?.status || 'inactive', updatedAt: new Date() },
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
