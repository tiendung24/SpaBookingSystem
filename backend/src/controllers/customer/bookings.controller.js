import { Booking, PayosPayment, Deposit, Service, Shop, ShopStaff, RefundRequest, Wallet, WalletTransaction, PlatformFee, SystemSetting, Customer, User } from '../../models/index.js'
import { httpError } from '../../utils/httpError.js'
import { derivePaymentStatus } from '../../utils/paymentStatus.js'
import { buildRefundInfoRequestEmailForCustomer, sendEmailBestEffort } from '../../utils/emailNotifications.js'

async function getPlatformFeeAmount() {
  const setting = await SystemSetting.findOne({ key: 'platform_fee_per_completed_booking' }).lean()
  return Number(setting?.value || 10000)
}

function getFrontendOrigin() {
  const candidates = [process.env.FRONTEND_URL, process.env.PUBLIC_FRONTEND_URL, process.env.SHOP_FRONTEND_URL, process.env.PAYOS_RETURN_URL]
  const value = candidates.find(Boolean) || (process.env.CORS_ORIGIN && process.env.CORS_ORIGIN !== '*' ? process.env.CORS_ORIGIN : '')
  return String(value || 'http://localhost:5173').replace(/\/$/, '')
}

function buildRefundLink(bookingCode) {
  return `${getFrontendOrigin()}/customer/bookings?bookingCode=${encodeURIComponent(bookingCode)}`
}

export async function me(req, res) {
  if (!req.auth?.userId || req.auth.role !== 'customer') throw httpError(403, 'Không có quyền truy cập')
  res.json({ me: { userId: req.auth.userId, role: req.auth.role, customerId: req.auth.customerId || null } })
}

export async function myBookings(req, res) {
  if (!req.auth?.userId || req.auth.role !== 'customer') throw httpError(403, 'Không có quyền truy cập')
  const customerId = String(req.auth.customerId || '')
  if (!customerId) return res.json({ items: [] })

  const items = await Booking.find({ customerId }).sort({ createdAt: -1, startTime: -1 }).lean()
  const serviceIds = [...new Set(items.map((item) => String(item.serviceId || '')).filter(Boolean))]
  const staffIds = [...new Set(items.map((item) => String(item.staffId || '')).filter(Boolean))]
  const bookingIds = items.map((item) => String(item._id))
  const shopIds = [...new Set(items.map((item) => String(item.shopId || '')).filter(Boolean))]

  const [services, staffs, deposits, payments, shops] = await Promise.all([
    serviceIds.length ? Service.find({ _id: { $in: serviceIds } }).lean() : [],
    staffIds.length ? ShopStaff.find({ _id: { $in: staffIds } }).lean() : [],
    bookingIds.length ? Deposit.find({ bookingId: { $in: bookingIds } }).sort({ createdAt: -1 }).lean() : [],
    bookingIds.length ? PayosPayment.find({ bookingId: { $in: bookingIds } }).sort({ createdAt: -1 }).lean() : [],
    shopIds.length ? Shop.find({ _id: { $in: shopIds } }).lean() : []
  ])

  const serviceById = new Map(services.map((item) => [String(item._id), item]))
  const staffById = new Map(staffs.map((item) => [String(item._id), item]))
  const shopById = new Map(shops.map((item) => [String(item._id), item]))
  const depositByBookingId = new Map()
  deposits.forEach((item) => { const id = String(item.bookingId || ''); if (id && !depositByBookingId.has(id)) depositByBookingId.set(id, item) })
  const paymentByBookingId = new Map()
  payments.forEach((item) => { const id = String(item.bookingId || ''); if (id && !paymentByBookingId.has(id)) paymentByBookingId.set(id, item) })

  const enriched = items.map((booking) => {
    const service = serviceById.get(String(booking.serviceId || '')) || null
    const staff = staffById.get(String(booking.staffId || '')) || null
    const shop = shopById.get(String(booking.shopId || '')) || null
    const deposit = depositByBookingId.get(String(booking._id)) || null
    const payment = paymentByBookingId.get(String(booking._id)) || null
    return {
      ...booking,
      serviceName: service?.name || '',
      staffName: staff?.fullName || '',
      shopName: shop?.name || '',
      depositStatus: deposit?.status || '',
      paymentStatusInfo: derivePaymentStatus({ booking, payment, deposit })
    }
  })

  res.json({ items: enriched })
}


export async function submitRefundBankInfo(req, res) {
  if (!req.auth?.userId || req.auth.role !== 'customer') throw httpError(403, 'Kh?ng c? quy?n truy c?p')
  const customerId = String(req.auth.customerId || '')
  if (!customerId) throw httpError(403, 'Kh?ng c? quy?n truy c?p')

  const bookingCode = String(req.params.bookingCode || '').trim().toUpperCase()
  const { bankName, accountNumber, accountName } = req.body || {}
  const bankInfo = {
    bankName: String(bankName || '').trim(),
    accountNumber: String(accountNumber || '').trim(),
    accountName: String(accountName || '').trim()
  }
  if (!bookingCode || !bankInfo.bankName || !bankInfo.accountNumber || !bankInfo.accountName) {
    throw httpError(400, 'Thi?u th?ng tin t?i kho?n nh?n ho?n ti?n')
  }

  const booking = await Booking.findOne({ bookingCode, customerId }).lean()
  if (!booking) throw httpError(404, 'Kh?ng t?m th?y booking')
  if (booking.status !== 'cancelled_waiting_refund_info') throw httpError(409, `Kh?ng th? chuy?n tr?ng th?i t? ${booking.status || 'unknown'} sang cancelled`)

  const now = new Date()
  const refund = await RefundRequest.findOneAndUpdate(
    { bookingId: String(booking._id) },
    {
      $set: {
        bookingId: String(booking._id),
        bookingCode: booking.bookingCode,
        shopId: String(booking.shopId || ''),
        customerEmail: booking.customerEmail || '',
        customerPhone: booking.customerPhone || '',
        amount: Number(booking.depositAmount || 0),
        bankInfo,
        status: 'pending_payout',
        updatedAt: now
      },
      $setOnInsert: { createdAt: now }
    },
    { upsert: true, new: true }
  ).lean()

  await Booking.updateOne({ _id: booking._id }, { $set: { status: 'cancelled_refund_pending', updatedAt: now } })
  await Deposit.updateOne({ bookingId: String(booking._id) }, { $set: { status: 'refund_pending', updatedAt: now } })

  res.json({ ok: true, refund })
}


export async function cancelMyBooking(req, res) {
  if (!req.auth?.userId || req.auth.role !== 'customer') throw httpError(403, 'Kh?ng c? quy?n truy c?p')
  const customerId = String(req.auth.customerId || '')
  if (!customerId) throw httpError(403, 'Kh?ng c? quy?n truy c?p')

  const bookingCode = String(req.params.bookingCode || '').trim().toUpperCase()
  if (!bookingCode) throw httpError(400, 'Thi?u m? booking')

  const booking = await Booking.findOne({ bookingCode, customerId })
  if (!booking) throw httpError(404, 'Kh?ng t?m th?y booking')
  if (!['pending', 'confirmed'].includes(String(booking.status || ''))) {
    throw httpError(409, `Kh?ng th? h?y booking ? tr?ng th?i: ${booking.status}`)
  }

  const shop = await Shop.findById(String(booking.shopId || '')).lean()
  const thresholdHours = Number(shop?.depositConfig?.cancelHours ?? 4)
  const now = new Date()
  const start = new Date(booking.startTime)
  const diffHours = (start.getTime() - now.getTime()) / (60 * 60 * 1000)
  const eligibleForRefund = diffHours >= (Number.isFinite(thresholdHours) && thresholdHours > 0 ? thresholdHours : 4)

  const depositAmount = Number(booking.depositAmount || 0)
  const hasDeposit = depositAmount > 0

  const nextStatus = eligibleForRefund && hasDeposit ? 'cancelled_waiting_refund_info' : 'cancelled'
  booking.status = nextStatus
  booking.cancelReason = String(req.body?.reason || '')
  booking.cancellationType = eligibleForRefund ? 'customer_cancel_valid' : 'customer_cancel_late'
  booking.updatedAt = new Date()
  await booking.save()

  const deposit = await Deposit.findOne({ bookingId: String(booking._id) })

  let feeAmount = 0
  let shopReceive = 0

  if (hasDeposit && !eligibleForRefund) {
    feeAmount = await getPlatformFeeAmount()
    feeAmount = Math.max(0, Math.min(feeAmount, depositAmount))
    shopReceive = Math.max(0, depositAmount - feeAmount)

    const wallet = await Wallet.findOneAndUpdate(
      { shopId: String(booking.shopId) },
      { $setOnInsert: { minBalance: 0, escrowBalance: 0, status: 'active' }, $set: { updatedAt: new Date() } },
      { upsert: true, new: true }
    )
    wallet.escrowBalance = Math.max(0, Number(wallet.escrowBalance || 0) - depositAmount)
    wallet.balance = Number(wallet.balance || 0) + shopReceive
    await wallet.save()

    if (deposit) {
      deposit.status = 'split_no_show'
      deposit.updatedAt = new Date()
      await deposit.save()
    }

    await PlatformFee.create({
      shopId: String(booking.shopId),
      bookingId: String(booking._id),
      amount: feeAmount,
      createdAt: new Date()
    })

    await WalletTransaction.create({
      shopId: String(booking.shopId),
      walletId: String(wallet._id),
      type: 'escrow_split_late_cancel_auto',
      amount: shopReceive,
      description: `Kh?ch h?y mu?n booking ${booking.bookingCode || booking._id} - tr? c?c cho shop`,
      refId: String(booking._id),
      status: 'success',
      createdAt: new Date()
    })

    await WalletTransaction.create({
      shopId: String(booking.shopId),
      walletId: String(wallet._id),
      type: 'platform_fee_from_deposit',
      amount: -feeAmount,
      description: `Thu ph? n?n t?ng t? c?c booking ${booking.bookingCode || booking._id}`,
      refId: String(booking._id),
      status: 'success',
      createdAt: new Date()
    })
  } else if (deposit) {
    deposit.status = hasDeposit ? 'refund_waiting_customer_info' : 'cancelled_no_deposit'
    deposit.updatedAt = new Date()
    await deposit.save()
  }

  let emailSent = false
  if (eligibleForRefund && hasDeposit && booking.customerEmail) {
    const payload = buildRefundInfoRequestEmailForCustomer({
      shopName: shop?.name || '',
      bookingCode: booking.bookingCode,
      startTime: booking.startTime,
      amount: depositAmount,
      refundUrl: buildRefundLink(booking.bookingCode),
      expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000)
    })
    const emailResult = await sendEmailBestEffort({ to: booking.customerEmail, ...payload, meta: { shopId: String(booking.shopId), bookingCode: booking.bookingCode } })
    emailSent = Boolean(emailResult?.sent)
  }

  res.json({
    bookingCode: booking.bookingCode,
    cancelled: true,
    eligibleForRefund,
    nextStatus,
    feeAmount,
    shopReceive,
    emailSent
  })
}


export async function updateMe(req, res) {
  if (!req.auth?.userId || req.auth.role !== 'customer') throw httpError(403, 'Kh?ng c? quy?n truy c?p')
  const fullName = String(req.body?.fullName || '').trim()
  const phone = String(req.body?.phone || '').trim()
  if (!fullName) throw httpError(400, 'Vui l?ng nh?p h? v? t?n')

  await User.updateOne({ _id: String(req.auth.userId) }, { $set: { fullName, phone, updatedAt: new Date() } })
  if (req.auth.customerId) {
    await Customer.updateOne({ _id: String(req.auth.customerId) }, { $set: { fullName, phone, updatedAt: new Date() } })
  }

  const user = await User.findById(String(req.auth.userId)).lean()
  res.json({ me: { userId: req.auth.userId, role: req.auth.role, customerId: req.auth.customerId || null, fullName: user?.fullName || '', phone: user?.phone || '', email: user?.email || '' } })
}
