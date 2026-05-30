import { Booking, Deposit, RefundRequest, Shop, Wallet, WalletTransaction } from '../../models/index.js'
import { httpError } from '../../utils/httpError.js'
import { requireNumber } from '../../utils/validation.js'
import { getSettingNumber } from '../../utils/settings.js'
import { writeAuditLog } from '../../utils/audit.js'
import { buildRefundStatusEmailForCustomer, sendEmailBestEffort } from '../../utils/emailNotifications.js'

export async function getRefunds(req, res) {
  const query = {}
  if (req.query.status && req.query.status !== 'all') query.status = req.query.status
  const items = await RefundRequest.find(query).sort({ createdAt: -1 }).lean()

  const bookingIds = [...new Set(items.map((item) => String(item.bookingId || '')).filter(Boolean))]
  const shopIds = [...new Set(items.map((item) => String(item.shopId || '')).filter(Boolean))]
  const [bookings, shops] = await Promise.all([
    bookingIds.length ? Booking.find({ _id: { $in: bookingIds } }).lean() : [],
    shopIds.length ? Shop.find({ _id: { $in: shopIds } }).lean() : []
  ])
  const bookingById = new Map(bookings.map((booking) => [String(booking._id), booking]))
  const shopById = new Map(shops.map((shop) => [String(shop._id), shop]))

  const enriched = items.map((item) => {
    const booking = bookingById.get(String(item.bookingId || '')) || null
    const shop = shopById.get(String(item.shopId || '')) || null
    return {
      ...item,
      bookingCode: item.bookingCode || booking?.bookingCode || '',
      customerName: booking?.customerName || '',
      customerPhone: booking?.customerPhone || item.customerPhone || '',
      customerEmail: booking?.customerEmail || item.customerEmail || '',
      bookingStatus: booking?.status || '',
      startTime: booking?.startTime || null,
      shopName: shop?.name || '',
      bankInfo: item.bankInfo || {}
    }
  })

  res.json({ items: enriched })
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
  const booking = await Booking.findByIdAndUpdate(refund.bookingId, { status: 'cancelled_refund_pending', updatedAt: new Date() }, { new: true }).lean()

  if (booking?.customerEmail) {
    const payload = buildRefundStatusEmailForCustomer({
      bookingCode: booking.bookingCode || String(booking._id),
      statusLabel: 'Đang xử lý'
    })
    await sendEmailBestEffort({ to: booking.customerEmail, ...payload, meta: { shopId: String(booking.shopId || ''), bookingCode: booking.bookingCode || String(booking._id), refundId: String(refund._id || '') } })
  }
  res.json({ refund })
}

export async function markSuccess(req, res) {
  const now = new Date()
  const refund = await RefundRequest.findByIdAndUpdate(
    req.params.refundId,
    {
      status: 'success',
      paidAt: now,
      paidByAdminId: String(req.auth.userId || ''),
      payoutTransactionRef: req.body?.transactionRef || '',
      updatedAt: now
    },
    { new: true }
  ).lean()
  if (!refund) throw httpError(404, 'Không tìm thấy refund')

  await writeAuditLog({
    actorUserId: req.auth.userId,
    action: 'admin.refund_success',
    entity: 'refund_request',
    entityId: String(refund._id),
    meta: { transactionRef: req.body?.transactionRef || '' }
  })

  const booking = await Booking.findByIdAndUpdate(
    refund.bookingId,
    { status: 'cancelled_refunded', updatedAt: new Date() },
    { new: true }
  ).lean()

  if (booking) {
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
      const existedTx = await WalletTransaction.findOne({ shopId: booking.shopId, type: 'escrow_refund', refId: String(booking._id) }).lean()
      if (!existedTx) {
        wallet.escrowBalance = Math.max(0, Number(wallet.escrowBalance || 0) - amount)
        await wallet.save()

        await WalletTransaction.create({
          shopId: booking.shopId,
          walletId: String(wallet._id),
          type: 'escrow_refund',
          amount: -amount,
          description: `LumiX hoàn cọc cho khách booking ${booking.bookingCode || booking._id}`,
          refId: String(booking._id),
          status: 'success',
          createdAt: new Date()
        })
      }
    }
  }

  if (booking?.customerEmail) {
    const payload = buildRefundStatusEmailForCustomer({
      bookingCode: booking.bookingCode || String(booking._id),
      statusLabel: 'Hoàn tiền thành công'
    })
    await sendEmailBestEffort({ to: booking.customerEmail, ...payload, meta: { shopId: String(booking.shopId || ''), bookingCode: booking.bookingCode || String(booking._id), refundId: String(refund._id || '') } })
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
    await sendEmailBestEffort({ to: booking.customerEmail, ...payload, meta: { shopId: String(booking.shopId || ''), bookingCode: booking.bookingCode || String(booking._id), refundId: String(refund._id || '') } })
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
