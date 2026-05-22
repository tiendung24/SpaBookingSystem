import cron from 'node-cron'
import { AuditLog, Booking, RefundRequest, Shop } from '../models/index.js'

async function runAutoLockFraud() {
  const shops = await Shop.find().select({ _id: 1, status: 1, name: 1 }).lean()
  for (const shop of shops) {
    const shopId = String(shop._id)
    const [total, bad] = await Promise.all([
      Booking.countDocuments({ shopId }),
      Booking.countDocuments({ shopId, status: { $in: ['cancelled', 'canceled', 'no_show'] } })
    ])
    const rate = total ? bad / total : 0
    if (total >= 10 && rate > 0.2 && shop.status !== 'locked') {
      await Shop.updateOne({ _id: shop._id }, { status: 'locked', updatedAt: new Date() })
      await AuditLog.create({
        actorUserId: '',
        action: 'fraud.auto_lock',
        entity: 'shop',
        entityId: shopId,
        meta: { totalBookings: total, badBookings: bad, cancelRate: rate },
        createdAt: new Date()
      })
    }
  }
}

async function runRefundQueueAudit() {
  const pending = await RefundRequest.countDocuments({ status: { $in: ['pending', 'processing'] } })
  await AuditLog.create({
    actorUserId: '',
    action: 'refund.queue_scan',
    entity: 'refund_request',
    entityId: '',
    meta: { pendingCount: pending },
    createdAt: new Date()
  })
}

async function runBookingReminderAudit() {
  const start = new Date()
  const end = new Date(Date.now() + 24 * 60 * 60 * 1000)
  const upcoming = await Booking.countDocuments({
    status: { $in: ['confirmed'] },
    startTime: { $gte: start, $lte: end }
  })
  await AuditLog.create({
    actorUserId: '',
    action: 'booking.reminder_scan',
    entity: 'booking',
    entityId: '',
    meta: { upcomingCount: upcoming },
    createdAt: new Date()
  })
}

export function startJobs() {
  cron.schedule('*/30 * * * *', () => {
    runRefundQueueAudit().catch(() => {})
    runBookingReminderAudit().catch(() => {})
  })

  cron.schedule('0 2 * * *', () => {
    runAutoLockFraud().catch(() => {})
  })
}

