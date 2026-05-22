import { Booking, Service, ShopStaff, Wallet, WalletTransaction } from '../../models/index.js'

function dateRangeForToday() {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  const date = `${y}-${m}-${d}`
  const start = new Date(`${date}T00:00:00`)
  const end = new Date(`${date}T23:59:59.999`)
  return { date, start, end }
}

function startOfMonth(dateStr) {
  const d = new Date(dateStr)
  const start = new Date(d.getFullYear(), d.getMonth(), 1)
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999)
  return { start, end }
}

export async function getOverview(req, res) {
  const shopId = req.auth.shopId
  const { start, end } = dateRangeForToday()

  const [todayCount, pendingCount, confirmedCount, completedCount, wallet] = await Promise.all([
    Booking.countDocuments({ shopId, startTime: { $gte: start, $lte: end } }),
    Booking.countDocuments({ shopId, status: 'pending' }),
    Booking.countDocuments({ shopId, status: 'confirmed' }),
    Booking.countDocuments({ shopId, status: 'completed' }),
    Wallet.findOne({ shopId }).lean()
  ])

  res.json({
    metrics: {
      todayBookings: todayCount,
      pendingBookings: pendingCount,
      confirmedBookings: confirmedCount,
      completedBookings: completedCount,
      walletBalance: Number(wallet?.balance || 0),
      walletEscrow: Number(wallet?.escrowBalance || 0)
    }
  })
}

export async function getTodayBookings(req, res) {
  const shopId = req.auth.shopId
  const { start, end } = dateRangeForToday()
  const items = await Booking.find({ shopId, startTime: { $gte: start, $lte: end } })
    .sort({ startTime: 1 })
    .lean()
  res.json({ items })
}

export async function getRevenue(req, res) {
  const shopId = req.auth.shopId
  const month = req.query.month || new Date().toISOString().slice(0, 10)
  const { start, end } = startOfMonth(month)

  const items = await Booking.find({
    shopId,
    status: 'completed',
    startTime: { $gte: start, $lte: end }
  })
    .select({ totalAmount: 1, startTime: 1 })
    .lean()

  const byDay = new Map()
  for (const b of items) {
    const key = new Date(b.startTime).toISOString().slice(0, 10)
    byDay.set(key, (byDay.get(key) || 0) + Number(b.totalAmount || 0))
  }

  const series = Array.from(byDay.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, value]) => ({ date, value }))

  res.json({ series })
}

export async function getCancelRate(req, res) {
  const shopId = req.auth.shopId
  const total = await Booking.countDocuments({ shopId })
  const canceled = await Booking.countDocuments({ shopId, status: { $in: ['cancelled', 'canceled', 'no_show'] } })
  const rate = total ? canceled / total : 0
  res.json({ rate })
}

export async function getTopServices(req, res) {
  const shopId = req.auth.shopId
  const agg = await Booking.aggregate([
    { $match: { shopId } },
    { $group: { _id: '$serviceId', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 10 }
  ])

  const ids = agg.map((x) => x._id).filter(Boolean)
  const services = await Service.find({ _id: { $in: ids } }).lean()
  const byId = new Map(services.map((s) => [String(s._id), s]))

  res.json({
    items: agg.map((x) => ({
      serviceId: x._id,
      serviceName: byId.get(String(x._id))?.name || 'Unknown',
      count: x.count
    }))
  })
}

export async function getTopStaffs(req, res) {
  const shopId = req.auth.shopId
  const agg = await Booking.aggregate([
    { $match: { shopId, staffId: { $ne: null } } },
    { $group: { _id: '$staffId', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 10 }
  ])

  const ids = agg.map((x) => x._id).filter(Boolean)
  const staffs = await ShopStaff.find({ _id: { $in: ids } }).lean()
  const byId = new Map(staffs.map((s) => [String(s._id), s]))

  res.json({
    items: agg.map((x) => ({
      staffId: x._id,
      staffName: byId.get(String(x._id))?.fullName || 'Unknown',
      count: x.count
    }))
  })
}

