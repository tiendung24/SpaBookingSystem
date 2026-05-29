import { Booking, BookingStatusLog, Deposit, FraudReport, PayosPayment, PlatformFee, RefundRequest, Shop, Wallet } from '../../models/index.js'

const SUCCESS_PAYMENT_STATUSES = new Set(['success', 'paid', 'completed'])
const OPEN_DEPOSIT_STATUSES = new Set(['pending', 'holding', 'refund_pending'])
const RELEASED_DEPOSIT_STATUSES = new Set(['released_to_shop'])

function parseDateBound(value, isEnd = false) {
  if (!value) return null
  const text = String(value)
  const date = new Date(text)
  if (Number.isNaN(date.getTime())) return null
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    if (isEnd) date.setHours(23, 59, 59, 999)
    else date.setHours(0, 0, 0, 0)
  }
  return date
}

function buildCreatedAtQuery(from, to) {
  const query = {}
  const start = parseDateBound(from, false)
  const end = parseDateBound(to, true)
  if (start || end) {
    query.createdAt = {}
    if (start) query.createdAt.$gte = start
    if (end) query.createdAt.$lte = end
  }
  return query
}

function sumNumber(items, selector) {
  return items.reduce((total, item) => total + Number(selector(item) || 0), 0)
}

async function buildFinanceOverview(req) {
  const from = req.query?.from || ''
  const to = req.query?.to || ''

  const completedLogQuery = {
    toStatus: 'completed',
    ...buildCreatedAtQuery(from, to)
  }

  const completedLogs = await BookingStatusLog.find(completedLogQuery).select({ bookingId: 1, createdAt: 1 }).lean()
  const completedBookingIds = [...new Set(completedLogs.map((item) => String(item.bookingId || '')).filter(Boolean))]

  const completedBookings = completedBookingIds.length
    ? await Booking.find({ _id: { $in: completedBookingIds } }).select({ totalAmount: 1, depositAmount: 1, status: 1 }).lean()
    : []

  const completedBookingMap = new Map(completedBookings.map((item) => [String(item._id), item]))
  const depositByBookingId = new Map()

  if (completedBookingIds.length) {
    const deposits = await Deposit.find({ bookingId: { $in: completedBookingIds } }).select({ bookingId: 1, amount: 1, status: 1, createdAt: 1, updatedAt: 1 }).lean()

    for (const deposit of deposits) {
      depositByBookingId.set(String(deposit.bookingId || ''), deposit)
    }
  }

  const completedMetrics = completedBookings.map((booking) => {
    const bookingId = String(booking._id)
    const deposit = depositByBookingId.get(bookingId)
    const depositAmount = Number(deposit?.amount || booking.depositAmount || 0)
    const totalAmount = Number(booking.totalAmount || 0)
    return {
      bookingId,
      totalAmount,
      depositAmount,
      remainingAmount: Math.max(0, totalAmount - depositAmount),
      hasDeposit: depositAmount > 0,
      depositStatus: String(deposit?.status || '').toLowerCase()
    }
  })

  const depositPaymentsQuery = {
    bookingId: { $nin: ['', null] },
    status: { $in: [...SUCCESS_PAYMENT_STATUSES] },
    ...buildCreatedAtQuery(from, to)
  }
  const depositPayments = await PayosPayment.find(depositPaymentsQuery).select({ amount: 1, bookingId: 1, status: 1, createdAt: 1 }).lean()

  const deposits = completedBookingIds.length
    ? await Deposit.find({ bookingId: { $in: completedBookingIds } }).select({ bookingId: 1, amount: 1, status: 1, createdAt: 1, updatedAt: 1 }).lean()
    : []
  const depositMap = new Map(deposits.map((item) => [String(item.bookingId || ''), item]))

  const completedDeposits = completedMetrics.filter((item) => item.hasDeposit && RELEASED_DEPOSIT_STATUSES.has(String(depositMap.get(item.bookingId)?.status || '').toLowerCase()))
  const pendingShopPayoutDeposits = completedMetrics.filter((item) => item.hasDeposit && !RELEASED_DEPOSIT_STATUSES.has(String(depositMap.get(item.bookingId)?.status || '').toLowerCase()) && !['refunded_to_customer', 'split_no_show'].includes(String(depositMap.get(item.bookingId)?.status || '').toLowerCase()))

  const openDeposits = await Deposit.find({ status: { $in: [...OPEN_DEPOSIT_STATUSES] } }).select({ bookingId: 1, amount: 1, status: 1 }).lean()
  const awaitingReconciliationDeposits = openDeposits.filter((item) => {
    const booking = completedBookingMap.get(String(item.bookingId || ''))
    return !booking || String(booking.status || '').toLowerCase() !== 'completed'
  })

  const wallets = await Wallet.find().select({ balance: 1, escrowBalance: 1 }).lean()
  const platformFees = await PlatformFee.find(buildCreatedAtQuery(from, to)).select({ amount: 1, createdAt: 1 }).lean()

  return {
    from: from || '',
    to: to || '',
    depositReceivedTotal: sumNumber(depositPayments, (item) => item.amount),
    depositPendingShopPayoutTotal: sumNumber(pendingShopPayoutDeposits, (item) => item.depositAmount),
    depositPaidBackTotal: sumNumber(completedDeposits, (item) => item.depositAmount),
    depositAwaitingReconciliationTotal: sumNumber(awaitingReconciliationDeposits, (item) => item.amount),
    serviceTotalAmount: sumNumber(completedMetrics, (item) => item.totalAmount),
    remainingCustomerBalanceTotal: sumNumber(completedMetrics, (item) => item.remainingAmount),
    platformFeeTotal: sumNumber(platformFees, (item) => item.amount),
    totalVirtualWalletBalance: sumNumber(wallets, (item) => item.balance),
    totalCompletedBookings: completedMetrics.length,
    totalNoDepositBookings: completedMetrics.filter((item) => !item.hasDeposit).length,
    totalDepositBookings: completedMetrics.filter((item) => item.hasDeposit).length
  }
}

export async function overview(req, res) {
  const [shops, bookings, refunds, fraudReports] = await Promise.all([
    Shop.countDocuments(),
    Booking.countDocuments(),
    RefundRequest.countDocuments(),
    FraudReport.countDocuments()
  ])

  const finance = await buildFinanceOverview(req)

  res.json({
    metrics: {
      totalShops: shops,
      totalBookings: bookings,
      totalRefundRequests: refunds,
      totalFraudReports: fraudReports,
      finance
    }
  })
}

export async function revenue(req, res) {
  const items = await Booking.find({ status: 'completed' }).select({ totalAmount: 1, startTime: 1 }).lean()
  const byDay = new Map()
  for (const item of items) {
    const key = new Date(item.startTime || item.createdAt || Date.now()).toISOString().slice(0, 10)
    byDay.set(key, (byDay.get(key) || 0) + Number(item.totalAmount || 0))
  }
  const series = Array.from(byDay.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, value]) => ({ date, value }))
  res.json({ series })
}

export async function bookings(req, res) {
  const items = await Booking.find().sort({ createdAt: -1 }).limit(100).lean()
  res.json({ items })
}

export async function walletTopups(req, res) {
  const items = await PayosPayment.find({ bookingId: '' }).sort({ createdAt: -1 }).lean()
  res.json({ items })
}

export async function pendingRefunds(req, res) {
  const items = await RefundRequest.find({ status: { $in: ['pending', 'processing'] } }).sort({ createdAt: -1 }).lean()
  res.json({ items })
}

export async function fraudReports(req, res) {
  const items = await FraudReport.find().sort({ createdAt: -1 }).lean()
  res.json({ items })
}

export async function lockedShops(req, res) {
  const items = await Shop.find({ status: { $in: ['locked', 'inactive'] } }).sort({ updatedAt: -1 }).lean()
  res.json({ items })
}

