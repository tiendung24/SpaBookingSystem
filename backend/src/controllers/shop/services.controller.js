import { Service, ServiceCategory } from '../../models/index.js'
import { httpError } from '../../utils/httpError.js'
import { writeAuditLog } from '../../utils/audit.js'

export async function getCategories(req, res) {
  const shopId = req.auth.shopId
  const items = await ServiceCategory.find({ shopId }).sort({ sortOrder: 1, createdAt: 1 }).lean()
  res.json({ items })
}

export async function createCategory(req, res) {
  const shopId = req.auth.shopId
  const { name, slug, sortOrder, status } = req.body || {}
  if (!name) throw httpError(400, 'Thiếu name')

  const category = await ServiceCategory.create({
    shopId,
    name,
    slug: slug || undefined,
    sortOrder: Number(sortOrder || 0),
    status: status || 'active',
    createdAt: new Date(),
    updatedAt: new Date()
  })
  await writeAuditLog({
    actorUserId: req.auth.userId,
    action: 'shop.service_category_create',
    entity: 'service_category',
    entityId: String(category._id),
    meta: { shopId }
  })
  res.status(201).json({ category })
}

export async function updateCategory(req, res) {
  const shopId = req.auth.shopId
  const category = await ServiceCategory.findOneAndUpdate(
    { _id: req.params.categoryId, shopId },
    { ...req.body, updatedAt: new Date() },
    { new: true }
  ).lean()
  if (!category) throw httpError(404, 'Không tìm thấy danh mục')
  await writeAuditLog({
    actorUserId: req.auth.userId,
    action: 'shop.service_category_update',
    entity: 'service_category',
    entityId: String(category._id),
    meta: { shopId }
  })
  res.json({ category })
}

export async function deleteCategory(req, res) {
  const shopId = req.auth.shopId
  const deleted = await ServiceCategory.findOneAndDelete({ _id: req.params.categoryId, shopId }).lean()
  if (!deleted) throw httpError(404, 'Không tìm thấy danh mục')
  await writeAuditLog({
    actorUserId: req.auth.userId,
    action: 'shop.service_category_delete',
    entity: 'service_category',
    entityId: String(deleted._id),
    meta: { shopId }
  })
  res.json({ deleted: true })
}

export async function getServices(req, res) {
  const shopId = req.auth.shopId
  const query = { shopId }
  if (req.query.categoryId) query.categoryId = req.query.categoryId
  if (req.query.status) query.status = req.query.status
  const items = await Service.find(query).sort({ sortOrder: 1, createdAt: 1 }).lean()
  res.json({ items })
}

export async function createService(req, res) {
  const shopId = req.auth.shopId
  const { name, categoryId } = req.body || {}
  if (!name || !categoryId) throw httpError(400, 'Thiếu name hoặc categoryId')

  const service = await Service.create({
    shopId,
    categoryId,
    name,
    slug: req.body?.slug || undefined,
    description: req.body?.description || '',
    price: Number(req.body?.price || 0),
    durationMinutes: Number(req.body?.durationMinutes || 60),
    imageUrl: req.body?.imageUrl || '',
    status: req.body?.status || 'active',
    availableStaffIds: Array.isArray(req.body?.availableStaffIds) ? req.body.availableStaffIds : [],
    sortOrder: Number(req.body?.sortOrder || 0),
    createdAt: new Date(),
    updatedAt: new Date()
  })
  await writeAuditLog({
    actorUserId: req.auth.userId,
    action: 'shop.service_create',
    entity: 'service',
    entityId: String(service._id),
    meta: { shopId, categoryId }
  })
  res.status(201).json({ service })
}

export async function getServiceById(req, res) {
  const shopId = req.auth.shopId
  const service = await Service.findOne({ _id: req.params.serviceId, shopId }).lean()
  if (!service) throw httpError(404, 'Không tìm thấy dịch vụ')
  res.json({ service })
}

export async function updateService(req, res) {
  const shopId = req.auth.shopId
  const service = await Service.findOneAndUpdate(
    { _id: req.params.serviceId, shopId },
    { ...req.body, updatedAt: new Date() },
    { new: true }
  ).lean()
  if (!service) throw httpError(404, 'Không tìm thấy dịch vụ')
  await writeAuditLog({
    actorUserId: req.auth.userId,
    action: 'shop.service_update',
    entity: 'service',
    entityId: String(service._id),
    meta: { shopId }
  })
  res.json({ service })
}

export async function deleteService(req, res) {
  const shopId = req.auth.shopId
  const deleted = await Service.findOneAndDelete({ _id: req.params.serviceId, shopId }).lean()
  if (!deleted) throw httpError(404, 'Không tìm thấy dịch vụ')
  await writeAuditLog({
    actorUserId: req.auth.userId,
    action: 'shop.service_delete',
    entity: 'service',
    entityId: String(deleted._id),
    meta: { shopId }
  })
  res.json({ deleted: true })
}

export async function updateServiceStatus(req, res) {
  const shopId = req.auth.shopId
  const { status } = req.body || {}
  const service = await Service.findOneAndUpdate(
    { _id: req.params.serviceId, shopId },
    { status: status || 'inactive', updatedAt: new Date() },
    { new: true }
  ).lean()
  if (!service) throw httpError(404, 'Không tìm thấy dịch vụ')
  await writeAuditLog({
    actorUserId: req.auth.userId,
    action: 'shop.service_status_update',
    entity: 'service',
    entityId: String(service._id),
    meta: { shopId, status: service.status }
  })
  res.json({ service })
}
