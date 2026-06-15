import bcrypt from 'bcryptjs'
import ExcelJS from 'exceljs'
import { Booking, Deposit, PayosPayment, PlatformFee, RefundRequest, Service, Shop, User, Wallet, WalletTransaction, ShopStaff } from '../../models/index.js'
import { httpError } from '../../utils/httpError.js'
import { writeAuditLog } from '../../utils/audit.js'
import { derivePaymentStatus } from '../../utils/paymentStatus.js'
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

export async function attachWalletStats(shops) {
  const list = Array.isArray(shops) ? shops : [shops]
  const shopIds = list.filter(Boolean).map((shop) => String(shop._id))
  if (!shopIds.length) return shops

  const ownerIds = list.map((shop) => String(shop.ownerId || '')).filter(Boolean)
  const [wallets, bookingAgg, depositAgg, feeAgg, refundAgg, users] = await Promise.all([
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
    ]),
    ownerIds.length ? User.find({ _id: { $in: ownerIds } }).select({ fullName: 1, phone: 1 }).lean() : []
  ])
  const walletByShopId = new Map(wallets.map((wallet) => [String(wallet.shopId), wallet]))
  const bookingByShopId = new Map(bookingAgg.map((item) => [String(item._id), item]))
  const depositByShopId = new Map(depositAgg.map((item) => [String(item._id), item]))
  const feeByShopId = new Map(feeAgg.map((item) => [String(item._id), item]))
  const refundByShopId = new Map(refundAgg.map((item) => [String(item._id), item]))
  const userMap = new Map(users.map((user) => [String(user._id), user.fullName || user.phone || 'Chưa cập nhật']))
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
      ownerName: userMap.get(String(shop.ownerId)) || 'Chưa cập nhật',
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
        depositPaidToShop: Math.max(0, Number(depositStats.depositPaidToShop || 0) - Number(feeStats.platformFeeCollected || 0)),
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
    await sendEmailBestEffort({ to: shop.email, ...payload, meta: { shopId: String(shop._id || '') } })
  }
  res.json({ shop })
}

export async function unlockShop(req, res) {
  const shop = await Shop.findByIdAndUpdate(req.params.shopId, { status: 'active', updatedAt: new Date() }, { new: true }).lean()
  if (!shop) throw httpError(404, 'Không tìm thấy shop')
  await writeAuditLog({ actorUserId: req.auth.userId, action: 'admin.shop_unlock', entity: 'shop', entityId: String(shop._id), meta: { previous: 'unknown', next: 'active' } })
  if (shop.email) {
    const payload = buildShopStatusEmailForShop({ shopName: shop.name, statusLabel: 'active' })
    await sendEmailBestEffort({ to: shop.email, ...payload, meta: { shopId: String(shop._id || '') } })
  }
  res.json({ shop })
}

export async function updateStatus(req, res) {
  const shop = await Shop.findByIdAndUpdate(req.params.shopId, { status: req.body?.status || 'inactive', updatedAt: new Date() }, { new: true }).lean()
  if (!shop) throw httpError(404, 'Không tìm thấy shop')
  await writeAuditLog({ actorUserId: req.auth.userId, action: 'admin.shop_status_update', entity: 'shop', entityId: String(shop._id), meta: { next: req.body?.status || 'inactive' } })
  if (shop.email) {
    const payload = buildShopStatusEmailForShop({ shopName: shop.name, statusLabel: req.body?.status || 'inactive' })
    await sendEmailBestEffort({ to: shop.email, ...payload, meta: { shopId: String(shop._id || '') } })
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

export async function exportExcel(req, res) {
  const query = {}
  if (req.query.status && req.query.status !== 'all') query.status = req.query.status
  const shops = await Shop.find(query).sort({ createdAt: -1 }).lean()
  const enrichedShops = await attachWalletStats(shops)

  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'LumiX Admin'
  workbook.created = new Date()

  const formatExcelDate = (d) => {
    if (!d) return '';
    return new Date(d).toLocaleString('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh',
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      hour12: false
    });
  };

  const overviewSheet = workbook.addWorksheet('Tổng quan')
  overviewSheet.columns = [
    { header: 'Mã Shop', key: 'id', width: 25 },
    { header: 'Tên Shop', key: 'shopName', width: 30 },
    { header: 'Chủ Shop', key: 'owner', width: 25 },
    { header: 'Khu vực', key: 'district', width: 30 },
    { header: 'Trạng thái', key: 'status', width: 15 },
    { header: 'Booking thành công', key: 'monthlyBookings', width: 20 },
    { header: 'Số dư ví', key: 'wallet', width: 20 },
  ]
  overviewSheet.getRow(1).font = { bold: true }

  for (const shop of enrichedShops) {
    let district = 'Chưa cập nhật'
    if (typeof shop?.address === 'string') district = shop.address
    else if (shop?.address) {
      district = shop.address.district || shop.address.fullAddress || shop.address.street || shop.address.city || shop.address.province || JSON.stringify(shop.address)
      if (district === '{}') district = 'Chưa cập nhật'
    }

    let statusText = 'Đang hoạt động'
    if (shop.status === 'pending') statusText = 'Chờ duyệt'
    if (shop.status === 'locked') statusText = 'Đã khóa'
    if (shop.status === 'inactive') statusText = 'Tạm ngưng'

    overviewSheet.addRow({
      id: String(shop._id),
      shopName: shop.name || '—',
      owner: shop.ownerName || 'Chưa cập nhật',
      district,
      status: statusText,
      monthlyBookings: shop.stats?.completedBookings || 0,
      wallet: shop.wallet?.balance || 0
    })
  }

  for (const shop of enrichedShops) {
    let sheetName = String(shop.name || 'Shop').substring(0, 25).replace(/[*?:\/\[\]]/g, '')
    if (!sheetName) sheetName = String(shop._id).substring(0, 10)
    let counter = 1
    let finalSheetName = sheetName
    while (workbook.getWorksheet(finalSheetName)) {
      finalSheetName = `${sheetName.substring(0, 22)}(${counter})`
      counter++
    }

    const shopSheet = workbook.addWorksheet(finalSheetName)
    shopSheet.columns = [
      { header: 'Mã booking', key: 'bookingCode', width: 25 },
      { header: 'Khách hàng', key: 'customer', width: 25 },
      { header: 'SĐT Khách', key: 'customerPhone', width: 15 },
      { header: 'Dịch vụ', key: 'service', width: 30 },
      { header: 'Thời gian hẹn', key: 'startTime', width: 25 },
      { header: 'Thời gian đặt', key: 'createdAt', width: 25 },
      { header: 'Tiền cọc', key: 'deposit', width: 15 },
      { header: 'Tiền dịch vụ', key: 'totalAmount', width: 15 },
      { header: 'Còn lại', key: 'remaining', width: 15 },
      { header: 'Trạng thái thanh toán', key: 'status', width: 25 },
    ]
    shopSheet.getRow(1).font = { bold: true }

    const bookings = await Booking.find({ shopId: String(shop._id) }).sort({ createdAt: -1 }).lean()
    const serviceIds = [...new Set(bookings.map((b) => String(b.serviceId || '')).filter(Boolean))]
    const services = serviceIds.length ? await Service.find({ _id: { $in: serviceIds } }).lean() : []
    const serviceById = new Map(services.map((s) => [String(s._id), s]))

    for (const b of bookings) {
      const srv = serviceById.get(String(b.serviceId || ''))
      shopSheet.addRow({
        bookingCode: b.bookingCode || String(b._id),
        customer: b.customerName || 'Khách',
        customerPhone: b.customerPhone || '—',
        service: srv ? srv.name : '—',
        startTime: formatExcelDate(b.startTime),
        createdAt: formatExcelDate(b.createdAt),
        deposit: b.depositAmount || 0,
        totalAmount: b.totalAmount || 0,
        remaining: (b.totalAmount || 0) - (b.depositAmount || 0),
        status: derivePaymentStatus(b).label
      })
    }
  }

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  res.setHeader('Content-Disposition', 'attachment; filename="LumiX-Partners.xlsx"')
  await workbook.xlsx.write(res)
  res.end()
}

export async function rebuildFakeBookings(req, res) {
  // ============================================================
  // CONFIG: Hard-coded service pools per shop (bảng của bạn)
  // ============================================================
  const SHOP_CONFIG = {
    'Li\u00ean Facial Spa': {
      pattern: /Li\u00ean Facial/i,
      groups: {
        g\u1ed9i: [
          'G\u1ed9i Th\u1ea3o D\u01b0\u1ee3c (C\u01a1 B\u1ea3n)',
          'G\u1ed9i \u0110\u1ea7u B\u00f4ng B\u01b0\u1edfi',
          'G\u1ed9i D\u01b0\u1ee1ng Sinh B\u00f4ng B\u01b0\u1edfi / H\u1ea1 Tr\u1eafng',
          'G\u1ed9i D\u01b0\u1ee1ng Sinh Th\u1ee7 \u0110\u1ea1o Thang',
          'G\u1ed9i D\u01b0\u1ee1ng Sinh Ti\u00eau Chu\u1ea9n Nh\u00e0 H\u00e0',
        ],
        da: [
          'Thanh L\u1ecdc L\u00e0n Da Organic / Organic Sensitive',
          'Thanh L\u1ecdc D\u01b0\u1ee1ng S\u00e1ng Chuy\u00ean S\u00e2u Micro Vital / Collagen Sensitive',
          'Combo S\u00e1ng Da Ch\u1ed1ng L\u00e3o H\u00f3a Elite Peptide / Stem Cell Extract',
          'Combo Gi\u1ea3m N\u00e1m + C\u1ea5p \u1ea8m Plant Cell Darksort',
          'Combo C\u1ea5p \u1ea8m Ch\u1ed1ng L\u00e3o H\u00f3a Aqua Silky',
          'Combo Detox - C\u1ea5p \u1ea8m - S\u00e1ng Da Luxury 4',
        ],
      }
    },
    'Nail Minh H\u1ea3i': {
      pattern: /Nail Minh H\u1ea3i/i,
      skipTypes: ['g\u1ed9i', 'mi'],
      groups: {
        nail: ['S\u01a1n Biab', 'Combo S\u01a1n Gel + Th\u1ea1ch', 'French / Ombre'],
      }
    },
    'Nail Thu \u1ed0c': {
      pattern: /Nail Thu \u1ed0c/i,
      groups: {
        nail: ['S\u01a1n Biab', 'Combo S\u01a1n Gel + Th\u1ea1ch', 'Combo S\u01a1n M\u1eaft M\u00e8o + Tr\u00e1ng G\u01b0\u01a1ng', 'French / Ombre'],
      }
    },
    'N\u01a1 Nail': {
      pattern: /N\u01a1 Nail/i,
      groups: {
        nail: ['S\u01a1n Biab', 'Combo S\u01a1n Gel + Th\u1ea1ch', 'French / Ombre', 'Fill Gel'],
      }
    },
    'VanLavi': {
      pattern: /VanLavi/i,
      groups: {
        nail: ['S\u01a1n Biab', 'Combo S\u01a1n Gel + Th\u1ea1ch'],
      }
    },
    'Ti\u1ec7m Nail Minh Huy\u1ec1n': {
      pattern: /Minh Huy\u1ec1n/i,
      groups: {
        nail: ['S\u01a1n Biab', 'Fill Gel', 'Combo S\u01a1n Gel + Th\u1ea1ch'],
      }
    },
    'Spa Thu Trang': {
      pattern: /Spa Thu Trang/i,
      groups: {
        nail: ['S\u01a1n Biab', 'Combo S\u01a1n Gel + Th\u1ea1ch', 'French / Ombre'],
      }
    },
    'Ng\u1ecdc Th\u01a1': {
      pattern: /Ng\u1ecdc Th\u01a1/i,
      skipTypes: ['g\u1ed9i', 'mi'],
      groups: {
        nail: ['S\u01a1n Biab', 'Combo S\u01a1n Gel + Th\u1ea1ch', 'French / Ombre', 'Charm (\u0111\u00ednh \u0111\u00e1)'],
      }
    },
  };

  // Mapping: từ khóa trong bảng lịch -> group key
  const classifyBooking = (svcHint, shopCfg) => {
    const h = svcHint.toLowerCase();
    if (h.includes('g\u1ed9i')) return 'g\u1ed9i';
    if (h.includes('mi') || h.includes('n\u1ed1i')) return 'mi';
    if (h.includes('da') || h.includes('m\u1eb7t') || h.includes('m\u1ee5n')) return 'da';
    return 'nail'; // mặc định
  };

  // ============================================================
  // SCHEDULE (y chang bảng của bạn, bỏ booking dịch vụ thiếu)
  // ============================================================
  const schedule = [
    { shopKey: 'Nail Minh H\u1ea3i', bookings: [
      { date: '2026-06-19', hints: ['nail'] },
      { date: '2026-06-20', hints: ['nail'] },
      { date: '2026-06-25', hints: ['nail'] },
    ]},
    { shopKey: 'Nail Thu \u1ed0c', bookings: [
      { date: '2026-06-18', hints: ['nail'] },
      { date: '2026-06-20', hints: ['nail', 'nail'] },
      { date: '2026-06-22', hints: ['nail', 'nail'] },
      { date: '2026-06-24', hints: ['nail'] },
      { date: '2026-06-26', hints: ['nail', 'nail'] },
    ]},
    { shopKey: 'Li\u00ean Facial Spa', bookings: [
      { date: '2026-06-17', hints: ['da'] },
      { date: '2026-06-18', hints: ['g\u1ed9i', 'g\u1ed9i'] },
      { date: '2026-06-21', hints: ['g\u1ed9i'] },
      { date: '2026-06-22', hints: ['g\u1ed9i', 'g\u1ed9i'] },
      { date: '2026-06-25', hints: ['g\u1ed9i', 'g\u1ed9i'] },
      { date: '2026-06-27', hints: ['da', 'da'] },
      { date: '2026-06-29', hints: ['da'] },
    ]},
    { shopKey: 'N\u01a1 Nail', bookings: [
      { date: '2026-06-18', hints: ['nail'] },
      { date: '2026-06-21', hints: ['nail'] },
      { date: '2026-06-22', hints: ['nail'] },
      { date: '2026-06-25', hints: ['nail'] },
      { date: '2026-06-28', hints: ['nail', 'nail'] },
    ]},
    { shopKey: 'VanLavi', bookings: [
      { date: '2026-06-16', hints: ['nail'] },
      { date: '2026-06-20', hints: ['nail'] },
    ]},
    { shopKey: 'Ti\u1ec7m Nail Minh Huy\u1ec1n', bookings: [
      { date: '2026-06-19', hints: ['nail'] },
      { date: '2026-06-23', hints: ['nail'] },
      { date: '2026-06-27', hints: ['nail'] },
      { date: '2026-06-29', hints: ['nail'] },
    ]},
    { shopKey: 'Spa Thu Trang', bookings: [
      { date: '2026-06-17', hints: ['nail'] },
      { date: '2026-06-20', hints: ['nail'] },
      { date: '2026-06-24', hints: ['nail'] },
      { date: '2026-06-28', hints: ['nail'] },
    ]},
    { shopKey: 'Ng\u1ecdc Th\u01a1', bookings: [
      { date: '2026-06-17', hints: ['nail', 'nail', 'nail'] },
      { date: '2026-06-20', hints: ['nail'] },
      { date: '2026-06-25', hints: ['nail'] },
    ]},
  ];

  // ============================================================
  // GET FEE SETTING
  // ============================================================
  const mongooseModule = await import('mongoose');
  const mongoose = mongooseModule.default || mongooseModule;
  let setting = null;
  try {
    const SystemSetting = mongoose.model('SystemSetting');
    setting = await SystemSetting.findOne({ key: 'platform_fee_per_completed_booking' }).lean();
  } catch (e) {}
  const feeAmount = Number(setting?.value || 10000);

  // ============================================================
  // CLEANUP OLD FAKE BOOKINGS
  // ============================================================
  const oldFake = await Booking.find({ bookingCode: /^BK/, status: 'completed' }).lean();
  const oldIds = oldFake.map(b => String(b._id));
  if (oldIds.length > 0) {
    await Booking.deleteMany({ _id: { $in: oldIds } });
    await PlatformFee.deleteMany({ bookingId: { $in: oldIds } });
    await WalletTransaction.deleteMany({ refId: { $in: oldIds }, type: 'platform_fee' });
  }

  const fakeNames = ['Nguy\u1ec5n Th\u1ecb Lan','Tr\u1ea7n Thu H\u00e0','L\u00ea Th\u1ecb Mai','Ph\u1ea1m B\u00edch Ng\u1ecdc','Ho\u00e0ng Kim Chi','V\u0169 Thanh H\u1eb1ng','\u0110\u1eb7ng Th\u00f9y Dung','B\u00f9i Thu Th\u1ee7y','\u0110\u1ed7 Mai Anh','Ng\u00f4 Ph\u01b0\u01a1ng Th\u1ea3o','D\u01b0\u01a1ng Thu Hi\u1ec1n','L\u00fd B\u00edch Loan','Tr\u1ecbnh \u00c1nh Nguy\u1ec7t','\u0110o\u00e0n Thanh H\u01b0\u01a1ng','\u0110inh Tuy\u1ebft Mai','L\u00e2m M\u1ef9 Linh','V\u01b0\u01a1ng T\u1ed1 Uy\u00ean','H\u1ed3 B\u00edch Ng\u1ecdc','Ch\u00e2u Kh\u1ea3i Phong','Tr\u1ea7n Ng\u1ecdc \u00c1nh'];
  const randName = () => fakeNames[Math.floor(Math.random() * fakeNames.length)];
  const randPhone = () => '09' + Math.floor(10000000 + Math.random() * 90000000);

  let totalAdded = 0;
  let totalSkipped = 0;

  for (const shopDef of schedule) {
    const cfg = SHOP_CONFIG[shopDef.shopKey];
    if (!cfg) continue;

    const shop = await Shop.findOne({ name: cfg.pattern });
    if (!shop) continue;

    // Build name->service map from Atlas
    const allServices = await Service.find({ shopId: String(shop._id) }).lean();
    const svcByName = {};
    for (const s of allServices) svcByName[s.name] = s;

    const staffs = await ShopStaff.find({ shopId: String(shop._id), role: 'staff' }).lean();
    const staffId = staffs.length ? String(staffs[0]._id) : undefined;

    // Pointer per group for anti-duplicate rotation
    const groupPointers = {};
    const shuffled = {};
    for (const [grp, pool] of Object.entries(cfg.groups || {})) {
      shuffled[grp] = [...pool].sort(() => Math.random() - 0.5);
      groupPointers[grp] = 0;
    }

    const pickFromGroup = (grp) => {
      const pool = shuffled[grp];
      if (!pool || pool.length === 0) return null;
      const svcName = pool[groupPointers[grp] % pool.length];
      groupPointers[grp]++;
      return svcByName[svcName] || null;
    };

    for (const b of shopDef.bookings) {
      for (const hint of b.hints) {
        // Check if this group type should be skipped
        if (cfg.skipTypes && cfg.skipTypes.includes(hint)) {
          totalSkipped++;
          continue;
        }

        const group = hint; // hint is already the group key (g\u1ed9i / da / nail / mi)
        const svc = pickFromGroup(group);
        if (!svc) { totalSkipped++; continue; }

        // Random createdAt within the given date
        const baseCreatedAt = new Date(`${b.date}T00:00:00+07:00`);
        const createdHour = 8 + Math.floor(Math.random() * 14);
        baseCreatedAt.setUTCHours(createdHour - 7, Math.floor(Math.random() * 60), 0, 0);

        const addDays = 1 + Math.floor(Math.random() * 3);
        const startTime = new Date(baseCreatedAt.getTime());
        startTime.setDate(startTime.getDate() + addDays);
        startTime.setUTCHours(9 + Math.floor(Math.random() * 11) - 7, Math.floor(Math.random() * 60), 0, 0);

        const duration = svc.durationMinutes || svc.duration || 60;
        const endTime = new Date(startTime.getTime() + duration * 60000);
        const bookingCode = 'BK' + Math.floor(100000 + Math.random() * 900000);

        const newBooking = await Booking.create({
          bookingCode,
          shopId: String(shop._id),
          serviceId: String(svc._id),
          staffId,
          customerName: randName(),
          customerPhone: randPhone(),
          startTime,
          endTime,
          status: 'completed',
          totalAmount: svc.price || 100000,
          depositAmount: 0,
          createdAt: baseCreatedAt,
          updatedAt: startTime,
        });

        // Wallet: deduct fee, auto-topup if < 100k
        const wallet = await Wallet.findOneAndUpdate(
          { shopId: String(shop._id) },
          { $setOnInsert: { minBalance: 0, escrowBalance: 0, status: 'active' }, $set: { updatedAt: new Date() } },
          { upsert: true, new: true }
        );
        let bal = Number(wallet.balance || 0) - feeAmount;
        if (bal < 100000) {
          bal += 200000;
          await WalletTransaction.create({
            shopId: String(shop._id), walletId: String(wallet._id),
            type: 'admin_adjustment', amount: 200000,
            description: 'T\u1ef1 \u0111\u1ed9ng n\u1ea1p qu\u1ef9 duy tr\u00ec s\u1ed1 d\u01b0 > 100k',
            refId: 'auto_topup_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
            status: 'success', createdAt: new Date(startTime.getTime() - 1000),
          });
        }
        wallet.balance = bal;
        await wallet.save();

        await PlatformFee.create({
          shopId: String(shop._id), bookingId: String(newBooking._id),
          amount: feeAmount, createdAt: startTime,
        });
        await WalletTransaction.create({
          shopId: String(shop._id), walletId: String(wallet._id),
          type: 'platform_fee', amount: -feeAmount,
          description: `Tr\u1eeb ph\u00ed n\u1ec1n t\u1ea3ng cho booking ${newBooking.bookingCode}`,
          refId: String(newBooking._id), status: 'success', createdAt: startTime,
        });

        totalAdded++;
      }
    }
  }

  res.json({
    message: 'Ho\u00e0n t\u1ea5t t\u00e1i t\u1ea1o booking v\u1edbi d\u1ecbch v\u1ee5 chu\u1ea9n x\u00e1c',
    deleted: oldIds.length,
    totalAdded,
    totalSkipped,
  });
}
