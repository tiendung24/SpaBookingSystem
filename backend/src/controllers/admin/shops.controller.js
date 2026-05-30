import bcrypt from 'bcryptjs'
import { Booking, Deposit, PayosPayment, PlatformFee, RefundRequest, Service, Shop, User, Wallet, WalletTransaction } from '../../models/index.js'
import { httpError } from '../../utils/httpError.js'
import { writeAuditLog } from '../../utils/audit.js'
import { buildShopStatusEmailForShop, sendEmailBestEffort } from '../../utils/emailNotifications.js'
import {
  isValidEmail,
  isValidPhone,
  isValidSlug,
  normalizeEmail,
  normalizePhone,
  normalizeSlug,
  requireString
} from '../../utils/validation.js'
import { derivePaymentStatus } from '../../utils/paymentStatus.js'

function generatePassword() {
  return Math.random().toString(36).slice(2, 10)
}

async function ensureUniqueSlug(baseSlug) {
  let slug = baseSlug
  for (let index = 0; index < 30; index += 1) {
    // eslint-disable-next-line no-await-in-loop
    const existed = await Shop.findOne({ slug }).select({ _id: 1 }).lean()
    if (!existed) return slug
    slug = `${baseSlug}-${index + 2}`
  }
  throw httpError(409, 'Không thể tạo slug duy nhất')
}

async function attachWalletStats(shops) {
  const list = Array.isArray(shops) ? shops : [shops]
  const shopIds = list.filter(Boolean).map((shop) => String(shop._id))
  if (!shopIds.length) return shops

  const [wallets, bookingAgg, depositAgg, feeAgg, refundAgg] = await Promise.all([
    Wallet.find({ shopId: { $in: shopIds } }).lean(),
    Booking.aggregate([
      { $match: { shopId: { $in: shopIds } } },
      {
        $group: {
          _id: '$shopId',
          totalBookings: { $sum: 1 },
          completedBookings: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          noDepositBookings: { $sum: { $cond: [{ $lte: [{ $ifNull: ['$depositAmount', 0] }, 0] }, 1, 0] } },
          depositBookings: { $sum: { $cond: [{ $gt: [{ $ifNull: ['$depositAmount', 0] }, 0] }, 1, 0] } },
          totalServiceAmount: { $sum: { $ifNull: ['$totalAmount', 0] } },
          customerRemainingAmount: { $sum: { $max: [{ $subtract: [{ $ifNull: ['$totalAmount', 0] }, { $ifNull: ['$depositAmount', 0] }] }, 0] } }
        }
      }
    ]),
    Deposit.aggregate([
      { $match: { shopId: { $in: shopIds } } },
      {
        $group: {
          _id: '$shopId',
          depositReceived: { $sum: '$amount' },
          depositWaitingForShop: {
            $sum: { $cond: [{ $in: ['$status', ['holding', 'pending']] }, '$amount', 0] }
          },
          depositPaidToShop: {
            $sum: { $cond: [{ $in: ['$status', ['released_to_shop', 'paid_to_shop', 'completed']] }, '$amount', 0] }
          }
        }
      }
    ]),
    PlatformFee.aggregate([
      { $match: { shopId: { $in: shopIds } } },
      { $group: { _id: '$shopId', platformFeeCollected: { $sum: '$amount' } } }
    ]),
    RefundRequest.aggregate([
      { $match: { shopId: { $in: shopIds }, status: { $in: ['success', 'paid'] } } },
      { $group: { _id: '$shopId', depositRefundedToCustomer: { $sum: '$amount' } } }
    ])
  ])
  const walletByShopId = new Map(wallets.map((wallet) => [String(wallet.shopId), wallet]))
  const bookingByShopId = new Map(bookingAgg.map((item) => [String(item._id), item]))
  const depositByShopId = new Map(depositAgg.map((item) => [String(item._id), item]))
  const feeByShopId = new Map(feeAgg.map((item) => [String(item._id), item]))
  const refundByShopId = new Map(refundAgg.map((item) => [String(item._id), item]))
  const defaultMin = Number(process.env.SHOP_WALLET_MIN_BALANCE || 100000)

  const mapped = list.map((shop) => {
    if (!shop) return shop
    const wallet = walletByShopId.get(String(shop._id)) || null
    const walletBalance = Number(wallet?.balance || 0)
    const walletMinBalance = Number(wallet?.minBalance || defaultMin)
    const walletHealthy = walletBalance >= walletMinBalance
    const bookingStats = bookingByShopId.get(String(shop._id)) || {}
    const depositStats = depositByShopId.get(String(shop._id)) || {}
    const feeStats = feeByShopId.get(String(shop._id)) || {}
    const refundStats = refundByShopId.get(String(shop._id)) || {}
    return {
      ...shop,
      wallet: wallet || { shopId: String(shop._id), balance: 0, minBalance: defaultMin, escrowBalance: 0, status: 'active' },
      stats: {
        ...(shop.stats || {}),
        walletBalance,
        walletMinBalance,
        walletHealthy,
        bookingLinkActive: shop.status === 'active' && shop.onlineBookingEnabled !== false && walletHealthy,
        totalBookings: Number(bookingStats.totalBookings || 0),
        completedBookings: Number(bookingStats.completedBookings || 0),
        noDepositBookings: Number(bookingStats.noDepositBookings || 0),
        depositBookings: Number(bookingStats.depositBookings || 0),
        depositReceived: Number(depositStats.depositReceived || 0),
        depositWaitingForShop: Number(depositStats.depositWaitingForShop || 0),
        depositPaidToShop: Number(depositStats.depositPaidToShop || 0),
        platformFeeCollected: Number(feeStats.platformFeeCollected || 0),
        depositRefundedToCustomer: Number(refundStats.depositRefundedToCustomer || 0),
        depositPendingReconcile: Math.max(0, Number(depositStats.depositReceived || 0) - Number(depositStats.depositPaidToShop || 0) - Number(refundStats.depositRefundedToCustomer || 0)),
        totalServiceAmount: Number(bookingStats.totalServiceAmount || 0),
        customerRemainingAmount: Number(bookingStats.customerRemainingAmount || 0)
      }
    }
  })

  return Array.isArray(shops) ? mapped : mapped[0]
}

export async function createShop(req, res) {
  const body = req.body || {}
  const shopName = requireString(body.shopName || body.name, 'shopName')
  const ownerName = String(body.owner || body.ownerName || '').trim()
  const district = String(body.district || '').trim()
  const phone = normalizePhone(body.phone)
  const email = body.email ? normalizeEmail(body.email) : ''
  const status = String(body.status || 'pending')

  if (!phone) throw httpError(400, 'Thiếu phone')
  if (!isValidPhone(phone)) throw httpError(400, 'Số điện thoại không hợp lệ')
  if (email && !isValidEmail(email)) throw httpError(400, 'Email không hợp lệ')
  if (!['pending', 'active', 'inactive', 'locked'].includes(status)) throw httpError(400, 'status không hợp lệ')

  const existedUser = await User.findOne({ $or: [{ phone }, ...(email ? [{ email }] : [])] }).lean()
  if (existedUser) throw httpError(409, 'Số điện thoại hoặc email đã tồn tại')

  const requestedSlug = body.slug ? normalizeSlug(body.slug) : normalizeSlug(shopName)
  if (!requestedSlug || !isValidSlug(requestedSlug)) {
    throw httpError(400, 'Slug không hợp lệ (3-80 ký tự, chỉ gồm a-z, 0-9 và dấu -)')
  }
  const slug = await ensureUniqueSlug(requestedSlug)

  const tempPassword = String(body.password || '').trim() || generatePassword()
  if (tempPassword.length < 6) throw httpError(400, 'Mật khẩu phải từ 6 ký tự trở lên')
  const passwordHash = await bcrypt.hash(tempPassword, 10)

  const user = await User.create({
    fullName: ownerName || shopName,
    phone,
    email: email || undefined,
    passwordHash,
    role: 'shop',
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date()
  })

  const shop = await Shop.create({
    ownerId: String(user._id),
    name: shopName,
    slug,
    phone,
    email: email || undefined,
    status,
    onlineBookingEnabled: true,
    address: district ? { district } : undefined,
    createdAt: new Date(),
    updatedAt: new Date()
  })

  user.shopId = String(shop._id)
  await user.save()

  await writeAuditLog({
    actorUserId: req.auth.userId,
    action: 'admin.shop_create',
    entity: 'shop',
    entityId: String(shop._id),
    meta: { slug: shop.slug, phone: user.phone }
  })

  res.status(201).json({
    shop,
    user: { _id: String(user._id), phone: user.phone, email: user.email || '', role: user.role },
    tempPassword
  })
}

export async function getShops(req, res) {
  const query = {}
  if (req.query.status) query.status = req.query.status
  if (req.query.keyword) {
    query.$or = [{ name: new RegExp(req.query.keyword, 'i') }, { slug: new RegExp(req.query.keyword, 'i') }]
  }
  const items = await Shop.find(query).sort({ createdAt: -1 }).lean()
  const enrichedItems = await attachWalletStats(items)
  res.json({ items: enrichedItems })
}

export async function getShopById(req, res) {
  const shop = await Shop.findById(req.params.shopId).lean()
  if (!shop) throw httpError(404, 'Không tìm thấy shop')
  const enrichedShop = await attachWalletStats(shop)
  const bookings = await Booking.find({ shopId: String(shop._id) }).sort({ createdAt: -1, startTime: -1 }).lean()
  const serviceIds = [...new Set(bookings.map((booking) => String(booking.serviceId || '')).filter(Boolean))]
  const bookingIds = bookings.map((booking) => String(booking._id))
  const [services, deposits, payments] = await Promise.all([
    serviceIds.length ? Service.find({ _id: { $in: serviceIds } }).lean() : [],
    bookingIds.length ? Deposit.find({ bookingId: { $in: bookingIds } }).sort({ createdAt: -1 }).lean() : [],
    bookingIds.length ? PayosPayment.find({ bookingId: { $in: bookingIds } }).sort({ createdAt: -1 }).lean() : []
  ])
  const serviceById = new Map(services.map((service) => [String(service._id), service]))
  const depositByBookingId = new Map()
  deposits.forEach((deposit) => {
    const bookingId = String(deposit.bookingId || '')
    if (!depositByBookingId.has(bookingId)) depositByBookingId.set(bookingId, deposit)
  })

  const paymentByBookingId = new Map()
  payments.forEach((payment) => {
    const bookingId = String(payment.bookingId || '')
    if (!bookingId) return
    if (!paymentByBookingId.has(bookingId)) paymentByBookingId.set(bookingId, payment)
  })

  const bookingItems = bookings.map((booking) => {
    const service = serviceById.get(String(booking.serviceId || '')) || null
    const deposit = depositByBookingId.get(String(booking._id)) || null
    const payment = paymentByBookingId.get(String(booking._id)) || null
    const totalAmount = Number(booking.totalAmount || service?.price || 0)
    const depositAmount = Number(deposit?.amount || booking.depositAmount || 0)
    return {
      ...booking,
      serviceName: service?.name || 'Dịch vụ',
      paymentOrderCode: String(payment?.orderCode || ''),
      paymentStatus: String(payment?.status || ''),
      paymentStatusInfo: derivePaymentStatus({ booking, payment, deposit }),
      depositStatus: deposit?.status || '',
      depositAmount,
      totalAmount,
      remainingAmount: Math.max(0, totalAmount - depositAmount)
    }
  })

  res.json({ shop: enrichedShop, bookings: bookingItems })
}

export async function lockShop(req, res) {
  const shop = await Shop.findByIdAndUpdate(req.params.shopId, { status: 'locked', updatedAt: new Date() }, { new: true }).lean()
  if (!shop) throw httpError(404, 'Không tìm thấy shop')
  await writeAuditLog({ actorUserId: req.auth.userId, action: 'admin.shop_lock', entity: 'shop', entityId: String(shop._id), meta: { previous: 'unknown', next: 'locked' } })
  if (shop.email) {
    const payload = buildShopStatusEmailForShop({ shopName: shop.name, statusLabel: 'locked' })
    await sendEmailBestEffort({ to: shop.email, ...payload })
  }
  res.json({ shop })
}

export async function unlockShop(req, res) {
  const shop = await Shop.findByIdAndUpdate(req.params.shopId, { status: 'active', updatedAt: new Date() }, { new: true }).lean()
  if (!shop) throw httpError(404, 'Không tìm thấy shop')
  await writeAuditLog({ actorUserId: req.auth.userId, action: 'admin.shop_unlock', entity: 'shop', entityId: String(shop._id), meta: { previous: 'unknown', next: 'active' } })
  if (shop.email) {
    const payload = buildShopStatusEmailForShop({ shopName: shop.name, statusLabel: 'active' })
    await sendEmailBestEffort({ to: shop.email, ...payload })
  }
  res.json({ shop })
}

export async function updateStatus(req, res) {
  const shop = await Shop.findByIdAndUpdate(req.params.shopId, { status: req.body?.status || 'inactive', updatedAt: new Date() }, { new: true }).lean()
  if (!shop) throw httpError(404, 'Không tìm thấy shop')
  await writeAuditLog({ actorUserId: req.auth.userId, action: 'admin.shop_status_update', entity: 'shop', entityId: String(shop._id), meta: { next: req.body?.status || 'inactive' } })
  if (shop.email) {
    const payload = buildShopStatusEmailForShop({ shopName: shop.name, statusLabel: req.body?.status || 'inactive' })
    await sendEmailBestEffort({ to: shop.email, ...payload })
  }
  res.json({ shop })
}

export async function getShopBookings(req, res) {
  const items = await Booking.find({ shopId: req.params.shopId }).sort({ createdAt: -1 }).lean()
  res.json({ items })
}

export async function getShopWallet(req, res) {
  const wallet = await Wallet.findOne({ shopId: req.params.shopId }).lean()
  res.json({ wallet: wallet || null })
}

export async function getShopTransactions(req, res) {
  const items = await WalletTransaction.find({ shopId: req.params.shopId }).sort({ createdAt: -1 }).lean()
  res.json({ items })
}

export async function getShopStatistics(req, res) {
  const shopId = req.params.shopId
  const [total, canceled, noShow, completed] = await Promise.all([
    Booking.countDocuments({ shopId }),
    Booking.countDocuments({ shopId, status: { $in: ['cancelled', 'canceled'] } }),
    Booking.countDocuments({ shopId, status: 'no_show' }),
    Booking.countDocuments({ shopId, status: 'completed' })
  ])

  res.json({
    stats: {
      totalBookings: total,
      cancelRate: total ? canceled / total : 0,
      noShowRate: total ? noShow / total : 0,
      completedRate: total ? completed / total : 0
    }
  })
}
