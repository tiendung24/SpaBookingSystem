import { Booking, FraudReport, PayosPayment, RefundRequest, Shop } from '../../models/index.js'

export async function overview(req, res) {
  const [shops, bookings, refunds, fraudReports] = await Promise.all([
    Shop.countDocuments(),
    Booking.countDocuments(),
    RefundRequest.countDocuments(),
    FraudReport.countDocuments()
  ])

  res.json({
    metrics: {
      totalShops: shops,
      totalBookings: bookings,
      totalRefundRequests: refunds,
      totalFraudReports: fraudReports
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

