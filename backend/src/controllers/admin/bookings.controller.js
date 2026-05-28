import { Booking, Deposit, PayosPayment } from '../../models/index.js'
import { httpError } from '../../utils/httpError.js'
import { requireString } from '../../utils/validation.js'
import { Wallet, WalletTransaction, Notification } from '../../models/index.js'
import { writeAuditLog } from '../../utils/audit.js'
import { broadcastToShop } from '../../utils/realtime.js'
import { derivePaymentStatus } from '../../utils/paymentStatus.js'

async function decorateBooking(booking) {
  if (!booking) return booking
  const payment = await PayosPayment.findOne({ bookingId: String(booking._id) }).sort({ createdAt: -1 }).lean()
  const deposit = await Deposit.findOne({ bookingId: String(booking._id) }).sort({ createdAt: -1 }).lean()
  return { ...booking, paymentStatus: derivePaymentStatus({ booking, payment, deposit }) }
}

export async function getBookings(req, res) {
  const query = {}
  if (req.query.status) query.status = req.query.status
  if (req.query.shopId) query.shopId = req.query.shopId
  const raw = await Booking.find(query).sort({ createdAt: -1 }).lean()
  const items = await Promise.all(raw.map(decorateBooking))
  res.json({ items })
}

export async function getBookingById(req, res) {
  const booking = await Booking.findById(req.params.bookingId).lean()
  if (!booking) throw httpError(404, 'Không tìm thấy booking')
  res.json({ booking: await decorateBooking(booking) })
}

export async function updateStatus(req, res) {
  const booking = await Booking.findByIdAndUpdate(
    req.params.bookingId,
    { status: (() => { const s = requireString(req.body?.status, 'status'); if (!['pending','confirmed','checked_in','completed','cancelled','canceled','no_show'].includes(s)) throw httpError(400, 'status không hợp lệ'); return s })(), updatedAt: new Date() },
    { new: true }
  ).lean()
  if (!booking) throw httpError(404, 'Không tìm thấy booking')
  res.json({ booking })
}

export async function getPayments(req, res) {
  const booking = await Booking.findById(req.params.bookingId).lean()
  if (!booking) throw httpError(404, 'Không tìm thấy booking')

  const items = await PayosPayment.find({
    $or: [{ bookingId: String(booking._id) }, { orderCode: booking.bookingCode }]
  }).lean()
  res.json({ items })
}

export async function getEscrow(req, res) {
  const booking = await Booking.findById(req.params.bookingId).lean()
  if (!booking) throw httpError(404, 'Không tìm thấy booking')
  const deposit = await Deposit.findOne({ bookingId: String(booking._id) }).sort({ createdAt: -1 }).lean()
  res.json({
    bookingId: String(booking._id),
    amount: Number(deposit?.amount || booking.depositAmount || 0),
    status: deposit?.status || 'holding'
  })
}

export async function recordPayment(req, res) {
  const bookingId = req.params.bookingId
  const amount = Number(req.body?.amount || 0)
  const note = String(req.body?.note || '')

  const booking = await Booking.findById(bookingId)
  if (!booking) throw httpError(404, 'Không tìm thấy booking')

  // Create a payment record (admin-recorded/manual)
  const payment = await PayosPayment.create({
    bookingId: String(booking._id),
    shopId: String(booking.shopId),
    amount: amount || Number(booking.depositAmount || 0),
    orderCode: String(booking.bookingCode || ''),
    status: 'success',
    raw: { recordedBy: req.auth.userId, note },
    createdAt: new Date(),
    updatedAt: new Date()
  })

  await writeAuditLog({
    actorUserId: req.auth.userId,
    action: 'admin.record_payment',
    entity: 'payos_payment',
    entityId: String(payment._id),
    meta: { bookingId: String(booking._id), shopId: String(booking.shopId), amount }
  })

  // If booking is pending, mark confirmed
  if (booking.status === 'pending') {
    booking.status = 'confirmed'
    booking.updatedAt = new Date()
    await booking.save()
  }

  // Ensure Deposit row exists and mark holding
  let deposit = await Deposit.findOne({ bookingId: String(booking._id) })
  if (!deposit) {
    deposit = await Deposit.create({ bookingId: String(booking._id), shopId: String(booking.shopId), amount: Number(booking.depositAmount || amount || 0), status: 'holding', createdAt: new Date(), updatedAt: new Date() })
  } else {
    deposit.status = 'holding'
    deposit.updatedAt = new Date()
    await deposit.save()
  }

  // Update shop wallet escrow balance and create a wallet transaction if not exists
  const existingHoldTx = await WalletTransaction.findOne({ shopId: String(booking.shopId), type: 'escrow_hold', refId: String(payment._id) }).lean()
  if (!existingHoldTx) {
    const wallet = await Wallet.findOneAndUpdate(
      { shopId: String(booking.shopId) },
      { $setOnInsert: { balance: 0, minBalance: 0, escrowBalance: 0, status: 'active' }, $set: { updatedAt: new Date() } },
      { upsert: true, new: true }
    )

    const amountToHold = Number(payment.amount || 0)
    wallet.escrowBalance = Number(wallet.escrowBalance || 0) + amountToHold
    await wallet.save()
    await WalletTransaction.create({ shopId: String(booking.shopId), walletId: String(wallet._id), type: 'escrow_hold', amount: amountToHold, description: `Giữ cọc (admin) cho booking ${booking.bookingCode || booking._id}`, refId: String(payment._id), status: 'success', createdAt: new Date() })
  }

  // Create a notification for shop so they see payment received
  try {
    await Notification.create({ shopId: String(booking.shopId), type: 'payment_received', title: 'Thanh toán đã được ghi nhận', content: `Đã ghi nhận thanh toán cho mã ${booking.bookingCode || booking._id}`, createdAt: new Date() })
  } catch (e) {
    // ignore notification errors
  }

  broadcastToShop(String(booking.shopId), {
    type: 'notification.created',
    shopId: String(booking.shopId),
    bookingId: String(booking._id),
    bookingCode: String(booking.bookingCode || booking._id),
    unreadHint: true
  })
  broadcastToShop(String(booking.shopId), {
    type: 'booking.updated',
    shopId: String(booking.shopId),
    bookingId: String(booking._id),
    status: booking.status
  })

  res.json({ ok: true, paymentId: String(payment._id), booking: booking })
}

