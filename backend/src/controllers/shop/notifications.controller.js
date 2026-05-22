import { Notification } from '../../models/index.js'
import { httpError } from '../../utils/httpError.js'
import { writeAuditLog } from '../../utils/audit.js'

export async function getNotifications(req, res) {
  const shopId = req.auth.shopId
  const items = await Notification.find({ shopId }).sort({ createdAt: -1 }).lean()
  res.json({ items })
}

export async function readNotification(req, res) {
  const shopId = req.auth.shopId
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.notificationId, shopId },
    { readAt: new Date() },
    { new: true }
  ).lean()
  if (!notification) throw httpError(404, 'Không tìm thấy thông báo')
  await writeAuditLog({
    actorUserId: req.auth.userId,
    action: 'shop.notification_read',
    entity: 'notification',
    entityId: String(notification._id),
    meta: { shopId }
  })
  res.json({ notification })
}

export async function readAll(req, res) {
  const shopId = req.auth.shopId
  await Notification.updateMany(
    {
      shopId,
      $or: [{ readAt: null }, { readAt: { $exists: false } }]
    },
    { readAt: new Date() }
  )
  await writeAuditLog({
    actorUserId: req.auth.userId,
    action: 'shop.notification_read_all',
    entity: 'notification',
    entityId: '',
    meta: { shopId }
  })
  res.json({ readAll: true })
}
