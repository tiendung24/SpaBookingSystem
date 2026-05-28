import { Booking, BookingSlotLock, Deposit, FraudReport, RefundRequest } from '../../models/index.js'
import { httpError } from '../../utils/httpError.js'
import { getBookingWithRelations } from '../../utils/shop.js'
import { writeAuditLog } from '../../utils/audit.js'
import { buildBookingStatusEmailForCustomer, sendEmailBestEffort } from '../../utils/emailNotifications.js'

function getCancelCutoffMinutes() {
  return Number(process.env.CUSTOMER_CANCEL_CUTOFF_MINUTES || 120) // mặc định 2h
}

export async function getBookingByCode(req, res) {
  const detail = await getBookingWithRelations({ bookingCode: req.params.bookingCode })
  res.json(detail)
}

export async function cancelBooking(req, res) {
  const booking = await Booking.findOne({ bookingCode: req.params.bookingCode })
  if (!booking) throw httpError(404, 'Không tìm thấy booking')

  if (!['pending', 'confirmed'].includes(booking.status)) {
    throw httpError(409, `Không thể hủy booking ở trạng thái: ${booking.status}`)
  }

  const cutoffMin = getCancelCutoffMinutes()
  const now = new Date()
  const start = new Date(booking.startTime)
  const diffMinutes = (start.getTime() - now.getTime()) / (60 * 1000)
  const eligibleForRefund = diffMinutes >= cutoffMin

  booking.status = 'cancelled'
  booking.cancelReason = req.body?.reason || ''
  booking.updatedAt = new Date()
  await booking.save()

  const deposit = await Deposit.findOne({ bookingId: String(booking._id) })
  if (deposit) {
    deposit.status = eligibleForRefund ? 'refund_pending' : 'forfeited'
    deposit.updatedAt = new Date()
    await deposit.save()
  }

  await writeAuditLog({
    actorUserId: '',
    action: 'public.booking_cancel',
    entity: 'booking',
    entityId: String(booking._id),
    meta: { bookingCode: booking.bookingCode, eligibleForRefund }
  })

  if (booking.customerEmail) {
    const payload = buildBookingStatusEmailForCustomer({
      shopName: '',
      bookingCode: booking.bookingCode,
      startTime: booking.startTime,
      statusLabel: eligibleForRefund ? 'Đã hủy (chờ hoàn cọc)' : 'Đã hủy (không hoàn cọc)'
    })
    await sendEmailBestEffort({ to: booking.customerEmail, ...payload })
  }

  res.json({ bookingCode: booking.bookingCode, canceled: true, eligibleForRefund })
}

export async function submitRefundInfo(req, res) {
  const booking = await Booking.findOne({ bookingCode: req.params.bookingCode })
  if (!booking) throw httpError(404, 'Không tìm thấy booking')

  const refund = await RefundRequest.create({
    bookingId: String(booking._id),
    shopId: String(booking.shopId),
    amount: Number(booking.depositAmount || 0),
    bankInfo: req.body || {},
    status: 'pending',
    note: '',
    createdAt: new Date(),
    updatedAt: new Date()
  })

  await Deposit.updateMany(
    { bookingId: String(booking._id), status: { $in: ['refund_pending', 'pending', 'holding'] } },
    { status: 'refund_pending', updatedAt: new Date() }
  )

  await writeAuditLog({
    actorUserId: '',
    action: 'public.refund_submit',
    entity: 'refund_request',
    entityId: String(refund._id),
    meta: { bookingId: String(booking._id), bookingCode: booking.bookingCode }
  })

  res.json({ bookingCode: booking.bookingCode, refundId: String(refund._id), received: true })
}

export async function getRefundStatus(req, res) {
  const booking = await Booking.findOne({ bookingCode: req.params.bookingCode }).lean()
  if (!booking) throw httpError(404, 'Không tìm thấy booking')
  const refund = await RefundRequest.findOne({ bookingId: String(booking._id) }).sort({ createdAt: -1 }).lean()
  res.json({ bookingCode: booking.bookingCode, status: refund?.status || 'none', refund })
}

export async function reportShopFraud(req, res) {
  const booking = await Booking.findOne({ bookingCode: req.params.bookingCode }).lean()
  if (!booking) throw httpError(404, 'Không tìm thấy booking')

  const report = await FraudReport.create({
    bookingId: String(booking._id),
    shopId: String(booking.shopId),
    customerPhone: booking.customerPhone,
    reason: req.body?.reason || 'Khách tố giác shop',
    status: 'pending',
    createdAt: new Date(),
    updatedAt: new Date()
  })

  await writeAuditLog({
    actorUserId: '',
    action: 'public.fraud_report',
    entity: 'fraud_report',
    entityId: String(report._id),
    meta: { bookingId: String(booking._id), bookingCode: booking.bookingCode }
  })

  res.json({ bookingCode: booking.bookingCode, reportId: String(report._id), reported: true })
}

export async function createReview(req, res) {
  const booking = await Booking.findOne({ bookingCode: req.params.bookingCode })
  if (!booking) throw httpError(404, 'Không tìm thấy booking')
  booking.review = {
    rating: Number(req.body?.rating || 0),
    comment: req.body?.comment || '',
    createdAt: new Date()
  }
  booking.updatedAt = new Date()
  await booking.save()
  await writeAuditLog({
    actorUserId: '',
    action: 'public.review_create',
    entity: 'booking',
    entityId: String(booking._id),
    meta: { bookingCode: booking.bookingCode, rating: booking.review?.rating || 0 }
  })
  res.json({ bookingCode: booking.bookingCode, created: true })
}

export async function expireUnpaidBooking(req, res) {
  const booking = await Booking.findOne({ bookingCode: req.params.bookingCode })
  if (!booking) throw httpError(404, 'Không tìm thấy booking')

  if (booking.status !== 'pending' || Number(booking.depositAmount || 0) <= 0 || !booking.depositExpiresAt) {
    return res.json({ bookingCode: booking.bookingCode, expired: false, status: booking.status })
  }

  const now = new Date()
  const expiresAt = booking.depositExpiresAt ? new Date(booking.depositExpiresAt) : null
  const force = Boolean(req.body?.force)
  const isExpired = !expiresAt || Number.isNaN(expiresAt.getTime()) || expiresAt <= now

  if (!force && !isExpired) {
    return res.status(409).json({
      bookingCode: booking.bookingCode,
      expired: false,
      status: booking.status,
      reason: 'not_expired_yet'
    })
  }

  booking.status = 'cancelled'
  booking.updatedAt = now
  await booking.save()

  await BookingSlotLock.deleteMany({ bookingId: String(booking._id) })
  await Deposit.updateMany(
    { bookingId: String(booking._id), status: { $in: ['pending'] } },
    { status: 'expired_unpaid', updatedAt: now }
  )

  await writeAuditLog({
    actorUserId: '',
    action: 'public.booking_expire_unpaid',
    entity: 'booking',
    entityId: String(booking._id),
    meta: { bookingCode: booking.bookingCode, force, expiredAt: now }
  })

  res.json({ bookingCode: booking.bookingCode, expired: true, status: booking.status })
}