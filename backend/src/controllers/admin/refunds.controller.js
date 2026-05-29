import { Booking, Deposit, RefundRequest, Wallet, WalletTransaction } from '../../models/index.js'
import { httpError } from '../../utils/httpError.js'
import { requireNumber } from '../../utils/validation.js'
import { getSettingNumber } from '../../utils/settings.js'
import { writeAuditLog } from '../../utils/audit.js'
import { buildRefundStatusEmailForCustomer, sendEmailBestEffort } from '../../utils/emailNotifications.js'

export async function getRefunds(req, res) {
  const query = {}
  if (req.query.status) query.status = req.query.status
  const items = await RefundRequest.find(query).sort({ createdAt: -1 }).lean()
  res.json({ items })
}

export async function getRefundById(req, res) {
  const refund = await RefundRequest.findById(req.params.refundId).lean()
  if (!refund) throw httpError(404, 'Không tìm thấy refund')
  res.json({ refund })
}

export async function markProcessing(req, res) {
  const refund = await RefundRequest.findByIdAndUpdate(
    req.params.refundId,
    { status: 'processing', updatedAt: new Date() },
    { new: true }
  ).lean()
  if (!refund) throw httpError(404, 'Không tìm thấy refund')
  await writeAuditLog({
    actorUserId: req.auth.userId,
    action: 'admin.refund_processing',
    entity: 'refund_request',
    entityId: String(refund._id),
    meta: {}
  })
  const booking = await Booking.findById(refund.bookingId).lean()
  if (booking?.customerEmail) {
    const payload = buildRefundStatusEmailForCustomer({
      bookingCode: booking.bookingCode || String(booking._id),
      statusLabel: 'Đang xử lý'
    })
    await sendEmailBestEffort({ to: booking.customerEmail, ...payload })
  }
  res.json({ refund })
}

export async function markSuccess(req, res) {
  const refund = await RefundRequest.findByIdAndUpdate(
    req.params.refundId,
    { status: 'success', updatedAt: new Date() },
    { new: true }
  ).lean()
  if (!refund) throw httpError(404, 'Không tìm thấy refund')
  await writeAuditLog({
    actorUserId: req.auth.userId,
    action: 'admin.refund_success',
    entity: 'refund_request',
    entityId: String(refund._id),
    meta: {}
  })
  const booking = await Booking.findById(refund.bookingId).lean()
  if (booking?.customerEmail) {
    const payload = buildRefundStatusEmailForCustomer({
      bookingCode: booking.bookingCode || String(booking._id),
      statusLabel: 'Hoàn tiền thành công'
    })
    await sendEmailBestEffort({ to: booking.customerEmail, ...payload })
  }
  res.json({ refund })
}

export async function markFailed(req, res) {
  const refund = await RefundRequest.findByIdAndUpdate(
    req.params.refundId,
    { status: 'failed', updatedAt: new Date(), note: req.body?.note || '' },
    { new: true }
  ).lean()
  if (!refund) throw httpError(404, 'Không tìm thấy refund')
  await writeAuditLog({
    actorUserId: req.auth.userId,
    action: 'admin.refund_failed',
    entity: 'refund_request',
    entityId: String(refund._id),
    meta: { note: req.body?.note || '' }
  })
  const booking = await Booking.findById(refund.bookingId).lean()
  if (booking?.customerEmail) {
    const payload = buildRefundStatusEmailForCustomer({
      bookingCode: booking.bookingCode || String(booking._id),
      statusLabel: 'Hoàn tiền thất bại'
    })
    await sendEmailBestEffort({ to: booking.customerEmail, ...payload })
  }
  res.json({ refund })
}

export async function getEscrows(req, res) {
  const items = await Deposit.find().sort({ createdAt: -1 }).lean()
  res.json({ items })
}

export async function getEscrowByBookingId(req, res) {
  const booking = await Booking.findById(req.params.bookingId).lean()
  if (!booking) throw httpError(404, 'Không tìm thấy booking')
  const deposit = await Deposit.findOne({ bookingId: String(booking._id) }).sort({ createdAt: -1 }).lean()
  res.json({ bookingId: String(booking._id), deposit })
}

export async function releaseToShop(req, res) {
  const booking = await Booking.findById(req.params.bookingId).lean()
  if (!booking) throw httpError(404, 'Không tìm thấy booking')

  const deposit = await Deposit.findOneAndUpdate(
    { bookingId: String(booking._id) },
    { status: 'released_to_shop', updatedAt: new Date() },
    { new: true }
  ).lean()

  if (deposit) {
    const wallet = await Wallet.findOneAndUpdate(
      { shopId: booking.shopId },
      { $setOnInsert: { balance: 0, minBalance: 0, escrowBalance: 0, status: 'active' }, $set: { updatedAt: new Date() } },
      { upsert: true, new: true }
    )
    const amount = Number(deposit.amount || 0)
    wallet.escrowBalance = Math.max(0, Number(wallet.escrowBalance || 0) - amount)
    wallet.balance = Number(wallet.balance || 0) + amount
    await wallet.save()

    await WalletTransaction.create({
      shopId: booking.shopId,
      walletId: String(wallet._id),
      type: 'escrow_release',
      amount,
      description: `LumiX trả cọc booking ${booking.bookingCode || booking._id}`,
      refId: String(booking._id),
      status: 'success',
      createdAt: new Date()
    })
  }

  res.json({ released: true, deposit })
}

export async function refundToCustomer(req, res) {
  const booking = await Booking.findById(req.params.bookingId).lean()
  if (!booking) throw httpError(404, 'Không tìm thấy booking')

  const deposit = await Deposit.findOneAndUpdate(
    { bookingId: String(booking._id) },
    { status: 'refunded_to_customer', updatedAt: new Date() },
    { new: true }
  ).lean()

  if (deposit) {
    const wallet = await Wallet.findOneAndUpdate(
      { shopId: booking.shopId },
      { $setOnInsert: { balance: 0, minBalance: 0, escrowBalance: 0, status: 'active' }, $set: { updatedAt: new Date() } },
      { upsert: true, new: true }
    )
    const amount = Number(deposit.amount || 0)
    wallet.escrowBalance = Math.max(0, Number(wallet.escrowBalance || 0) - amount)
    await wallet.save()

    await WalletTransaction.create({
      shopId: booking.shopId,
      walletId: String(wallet._id),
      type: 'escrow_refund',
      amount: -amount,
      description: `Hoàn cọc cho khách booking ${booking.bookingCode || booking._id}`,
      refId: String(booking._id),
      status: 'success',
      createdAt: new Date()
    })
  }

  res.json({ refunded: true, deposit })
}

export async function splitNoShow(req, res) {
  const booking = await Booking.findById(req.params.bookingId).lean()
  if (!booking) throw httpError(404, 'Không tìm thấy booking')

  const deposit = await Deposit.findOneAndUpdate(
    { bookingId: String(booking._id) },
    { status: 'split_no_show', updatedAt: new Date() },
    { new: true }
  ).lean()

  if (deposit) {
    const wallet = await Wallet.findOneAndUpdate(
      { shopId: booking.shopId },
      { $setOnInsert: { balance: 0, minBalance: 0, escrowBalance: 0, status: 'active' }, $set: { updatedAt: new Date() } },
      { upsert: true, new: true }
    )
    const amount = Number(deposit.amount || 0)
    const ratio = await getSettingNumber('no_show_platform_cut_ratio', 0.2)
    const platformCut = requireNumber(req.body?.platformCut || Math.round(amount * ratio), 'platformCut', { min: 0, max: amount })
    const shopPart = Math.max(0, amount - platformCut)
    wallet.escrowBalance = Math.max(0, Number(wallet.escrowBalance || 0) - amount)
    wallet.balance = Number(wallet.balance || 0) + shopPart
    await wallet.save()

    await WalletTransaction.create({
      shopId: booking.shopId,
      walletId: String(wallet._id),
      type: 'escrow_split_no_show',
      amount: shopPart,
      description: `Chia cọc no-show booking ${booking.bookingCode || booking._id}`,
      refId: String(booking._id),
      status: 'success',
      createdAt: new Date()
    })
  }

  res.json({ split: true, deposit })
}
