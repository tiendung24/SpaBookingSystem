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

  const overviewSheet = workbook.addWorksheet('Tổng quan')
  overviewSheet.columns = [
    { header: 'Mã Shop', key: 'id', width: 25 },
    { header: 'Tên Shop', key: 'shopName', width: 30 },
    { header: 'Chủ Shop', key: 'owner', width: 25 },
    { header: 'Khu vực', key: 'district', width: 20 },
    { header: 'Trạng thái', key: 'status', width: 15 },
    { header: 'Booking thành công', key: 'monthlyBookings', width: 20 },
    { header: 'Số dư ví', key: 'wallet', width: 20 },
  ]
  overviewSheet.getRow(1).font = { bold: true }

  for (const shop of enrichedShops) {
    let district = 'Chưa cập nhật'
    if (typeof shop?.address === 'string') district = shop.address
    else if (shop?.address) district = shop.address.district || shop.address.city || shop.address.province || 'Chưa cập nhật'

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
      { header: 'Dịch vụ', key: 'service', width: 30 },
      { header: 'Thời gian hẹn', key: 'startTime', width: 20 },
      { header: 'Thời gian đặt', key: 'createdAt', width: 20 },
      { header: 'Tiền cọc', key: 'deposit', width: 15 },
      { header: 'Tiền dịch vụ', key: 'totalAmount', width: 15 },
      { header: 'Còn lại', key: 'remaining', width: 15 },
      { header: 'Trạng thái thanh toán', key: 'status', width: 25 },
    ]
    shopSheet.getRow(1).font = { bold: true }

    const bookings = await Booking.find({ shopId: String(shop._id) }).sort({ createdAt: -1 }).lean()
    for (const b of bookings) {
      shopSheet.addRow({
        bookingCode: b.bookingCode || String(b._id),
        customer: b.customerName || 'Khách',
        service: b.serviceName || '—',
        startTime: b.startTime ? new Date(b.startTime) : '',
        createdAt: b.createdAt ? new Date(b.createdAt) : '',
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

export async function syncLienSpaImages(req, res) {
  const shop = await Shop.findOne({ name: { $regex: /Liên Facial/i } });
  if (!shop) return res.json({ message: 'Không tìm thấy shop Liên Facial Spa' });

  const shopId = String(shop._id);
  const services = await Service.find({ shopId }).sort({ sortOrder: 1 });

  const urls = [
    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTTREuxqmL5k9RTr-H01p-c7n5WNYYE40rf5JNlfvQwBpScP2Q2iZLIl748&s=10',
    'https://media.phunutoday.vn/files/content/2025/12/23/goi-dau-bang-vo-buoi-2-0930.jpg',
    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTrE6Svd5qQMktSoQxp5BGBmp4BA00ViCMTuf88LKUvmw&s=10',
    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRBQ0tx1D7zl3OpyuSW6AZItgDBRVhcKb6Vdk5--cdlbyYzckPIckoeqxc&s=10',
    'https://haspamassage.vn/wp-content/uploads/2024/08/thao-nguyen-spa.jpg',
    'https://skinlab.vn/wp-content/uploads/2024/05/tri-lieu-detox3.jpg',
    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTghkVtM46pUaPSQCrFIJDWt4MIn_5aByAZnA3T6Vle_Ylpp04BNwdqCRg&s=10',
    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSP0rud53EQOkMouXNNnF-goUvWB_fvFTmmwiCZMv8lq6Nbd2R1VIQC8TWE&s=10',
    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTjXQLLYCRe9n5SaYSh_08GLT0K0bdNAUlk-sMyr_kXqQku7ivrW8_siycY&s=10',
    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTjXQLLYCRe9n5SaYSh_08GLT0K0bdNAUlk-sMyr_kXqQku7ivrW8_siycY&s=10',
    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTjXQLLYCRe9n5SaYSh_08GLT0K0bdNAUlk-sMyr_kXqQku7ivrW8_siycY&s=10',
    'https://hurghada-massage.com/images/spa/beauty-pedicure-1.webp',
    'https://hurghada-massage.com/images/spa/beauty-pedicure-1.webp',
    'https://hurghada-massage.com/images/spa/beauty-pedicure-1.webp',
    'https://hurghada-massage.com/images/spa/beauty-pedicure-1.webp',
    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQrcBxA_8NxqUznk190esPHr8PNgC3kyD280DLI670qFW7iPNETZtc1RuY&s=10',
    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQrcBxA_8NxqUznk190esPHr8PNgC3kyD280DLI670qFW7iPNETZtc1RuY&s=10',
    'https://tigonmassa.com/uploads/photos/1756911427_3331_93f77edec74e239aae15184162dcc0f6.jpg',
    'https://tigonmassa.com/uploads/photos/1756911427_3331_93f77edec74e239aae15184162dcc0f6.jpg',
    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTkigO-I6WcLjybt5bnjL_1o9eyveFyXPm58L32SoZvSLSLJ42ReBRDaXkM&s=10',
    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTkigO-I6WcLjybt5bnjL_1o9eyveFyXPm58L32SoZvSLSLJ42ReBRDaXkM&s=10',
    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTkigO-I6WcLjybt5bnjL_1o9eyveFyXPm58L32SoZvSLSLJ42ReBRDaXkM&s=10'
  ];

  let updated = 0;
  for (let i = 0; i < services.length; i++) {
    if (urls[i]) {
      services[i].imageUrl = urls[i];
      await services[i].save();
      updated++;
    }
  }

  res.json({ message: 'Hoàn tất cập nhật ảnh cho Liên Facial Spa', total: updated });
}
