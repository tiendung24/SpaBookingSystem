import { Booking, Deposit, Notification, PayosPayment, Shop, Wallet, WalletTransaction } from '../models/index.js'
import { PayOSService } from '../services/payos.service.js'
import { writeAuditLog } from '../utils/audit.js'
import { broadcastToAdmins, broadcastToShop } from '../utils/realtime.js'

function extractWebhookData(body = {}) {
  const data = body.data || body.payload || body
  // PayOS webhook can signal success via `code: '00'` or `success: true`.
  // Some payloads may omit `status`, so we normalize it here.
  const rawStatus = String(data.status || body.status || '').toLowerCase()
  const payosCode = String(body.code || data.code || '').toLowerCase()
  const successByFlag = body.success === true || data.success === true
  const successByCode = payosCode === '00' || payosCode === 'success' || payosCode === 'paid'
  const normalizedStatus = rawStatus || (successByFlag || successByCode ? 'paid' : '')
  return {
    orderCode: String(data.orderCode || data.order_code || data.id || ''),
    status: normalizedStatus,
    amount: Number(data.amount || body.amount || 0),
    raw: body,
    success: successByFlag || successByCode || ['success', 'paid', 'completed'].includes(normalizedStatus)
  }
}

export async function payosWebhook(req, res) {
  const payos = new PayOSService()
  const verified = await payos.verifyWebhook(req.body)
  if (!verified) return res.status(400).json({ ok: false, message: 'Chữ ký không hợp lệ' })

  const payload = extractWebhookData(req.body)
  const payment = await PayosPayment.findOne({ orderCode: payload.orderCode })
  if (!payment) {
    await writeAuditLog({
      actorUserId: '',
      action: 'payos.webhook_ignored',
      entity: 'payos_payment',
      entityId: '',
      meta: { orderCode: payload.orderCode }
    })
    return res.json({ ok: true, ignored: true, message: 'Không tìm thấy giao dịch' })
  }

  const previousStatus = String(payment.status || '').toLowerCase()
  payment.status = payload.status || payment.status
  payment.raw = payload.raw
  payment.updatedAt = new Date()
  await payment.save()
  await writeAuditLog({
    actorUserId: '',
    action: 'payos.webhook_received',
    entity: 'payos_payment',
    entityId: String(payment._id),
    meta: { status: payment.status, orderCode: payment.orderCode }
  })

  const isSuccess =
    payload.success || ['success', 'paid', 'completed'].includes(String(payment.status || '').toLowerCase())
  if (!isSuccess) return res.json({ ok: true, paymentId: String(payment._id), status: payment.status })

  if (!payment.bookingId) {
    const defaultMin = Number(process.env.SHOP_WALLET_MIN_BALANCE || 100000)
    const wallet = await Wallet.findOneAndUpdate(
      { shopId: payment.shopId },
      { $setOnInsert: { balance: 0, minBalance: defaultMin, escrowBalance: 0, status: 'active' }, $set: { updatedAt: new Date() } },
      { upsert: true, new: true }
    )

    const existingTx = await WalletTransaction.findOne({
      shopId: payment.shopId,
      type: 'topup',
      refId: String(payment._id)
    }).lean()

    if (!existingTx) {
      wallet.balance = Number(wallet.balance || 0) + Number(payment.amount || payload.amount || 0)
      await wallet.save()
      await WalletTransaction.create({
        shopId: payment.shopId,
        walletId: String(wallet._id),
        type: 'topup',
        amount: Number(payment.amount || payload.amount || 0),
        description: 'Nạp ví qua PayOS',
        refId: String(payment._id),
        status: 'success',
        createdAt: new Date()
      })
    }

    const minBalance = Number(wallet.minBalance || defaultMin)
    if (Number(wallet.balance || 0) >= minBalance) {
      await Shop.updateOne(
        { _id: payment.shopId, status: 'inactive' },
        { $set: { status: 'active', updatedAt: new Date() } }
      )
    }
  } else {
    const booking = await Booking.findById(payment.bookingId)
    if (booking) {
      const wasPending = booking.status === 'pending'
      if (booking.status === 'pending') {
        booking.status = 'confirmed'
        booking.updatedAt = new Date()
        await booking.save()
      }

      const deposit = await Deposit.findOne({ bookingId: String(booking._id) })
      if (deposit) {
        deposit.status = 'holding'
        deposit.updatedAt = new Date()
        await deposit.save()
      }

      const defaultMin = Number(process.env.SHOP_WALLET_MIN_BALANCE || 100000)
      const wallet = await Wallet.findOneAndUpdate(
        { shopId: payment.shopId },
        { $setOnInsert: { balance: 0, minBalance: defaultMin, escrowBalance: 0, status: 'active' }, $set: { updatedAt: new Date() } },
        { upsert: true, new: true }
      )

      // Idempotency: chỉ cộng escrow 1 lần cho mỗi payment
      const existingHoldTx = await WalletTransaction.findOne({
        shopId: payment.shopId,
        type: 'escrow_hold',
        refId: String(payment._id)
      }).lean()

      if (!existingHoldTx) {
        const amount = Number(payment.amount || payload.amount || 0)
        wallet.escrowBalance = Number(wallet.escrowBalance || 0) + amount
        await wallet.save()
        await WalletTransaction.create({
          shopId: payment.shopId,
          walletId: String(wallet._id),
          type: 'escrow_hold',
          amount,
          description: `LumiX giữ cọc (escrow) cho booking ${booking.bookingCode || booking._id}`,
          refId: String(payment._id),
          status: 'success',
          createdAt: new Date()
        })
      }

      const shouldNotifyShop = wasPending || previousStatus !== payment.status
      if (shouldNotifyShop) {
        try {
          await Notification.create({
            shopId: String(payment.shopId),
            type: 'payment_received',
            title: 'Thanh toán đã được ghi nhận',
            content: `Đã xác nhận thanh toán cho booking ${booking.bookingCode || booking._id}`,
            createdAt: new Date()
          })
        } catch {
          // ignore notification create failures
        }

        broadcastToShop(String(payment.shopId), {
          type: 'notification.created',
          shopId: String(payment.shopId),
          bookingId: String(booking._id),
          bookingCode: String(booking.bookingCode || booking._id),
          unreadHint: true
        })

        broadcastToShop(String(payment.shopId), {
          type: 'booking.updated',
          shopId: String(payment.shopId),
          bookingId: String(booking._id),
          status: booking.status
        })

        broadcastToAdmins({
          type: 'booking.updated',
          shopId: String(payment.shopId),
          bookingId: String(booking._id),
          status: booking.status,
          bookingCode: String(booking.bookingCode || booking._id)
        })
      }
    }
  }

  res.json({ ok: true, paymentId: String(payment._id), status: payment.status })
}
