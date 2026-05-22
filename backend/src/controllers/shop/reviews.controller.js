import { Booking } from '../../models/index.js'

export async function getReviews(req, res) {
  const shopId = req.auth.shopId
  const items = await Booking.find({
    shopId,
    'review.rating': { $exists: true }
  })
    .select({ bookingCode: 1, customerName: 1, review: 1, startTime: 1 })
    .sort({ updatedAt: -1 })
    .lean()
  res.json({ items })
}

export async function getCancelReasonStats(req, res) {
  const shopId = req.auth.shopId
  const agg = await Booking.aggregate([
    { $match: { shopId, status: { $in: ['cancelled', 'canceled', 'no_show'] } } },
    { $group: { _id: '$cancelReason', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ])
  res.json({
    items: agg.map((item) => ({ reason: item._id || 'Không rõ', count: item.count }))
  })
}

