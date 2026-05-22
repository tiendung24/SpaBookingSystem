import { Booking, Shop } from '../models/index.js'

function computeRate(total, canceled) {
  if (!total) return 0
  return canceled / total
}

export async function checkCancelRate(req, res) {
  const shopId = req.body?.shopId
  const query = shopId ? { _id: shopId } : {}
  const shops = await Shop.find(query).select({ _id: 1, name: 1, status: 1 }).lean()

  const items = []
  for (const shop of shops) {
    const sid = String(shop._id)
    const [total, canceled] = await Promise.all([
      Booking.countDocuments({ shopId: sid }),
      Booking.countDocuments({ shopId: sid, status: { $in: ['cancelled', 'canceled', 'no_show'] } })
    ])
    items.push({
      shopId: sid,
      shopName: shop.name,
      totalBookings: total,
      canceledBookings: canceled,
      cancelRate: computeRate(total, canceled)
    })
  }

  res.json({ checked: true, items })
}

export async function autoLockShops(req, res) {
  const threshold = Number(req.body?.threshold || 0.2)
  const shops = await Shop.find().select({ _id: 1, name: 1, status: 1 }).lean()
  const locked = []

  for (const shop of shops) {
    const sid = String(shop._id)
    const [total, canceled] = await Promise.all([
      Booking.countDocuments({ shopId: sid }),
      Booking.countDocuments({ shopId: sid, status: { $in: ['cancelled', 'canceled', 'no_show'] } })
    ])
    const rate = computeRate(total, canceled)
    if (total >= 10 && rate > threshold && shop.status !== 'locked') {
      await Shop.updateOne({ _id: shop._id }, { status: 'locked', updatedAt: new Date() })
      locked.push({
        shopId: sid,
        shopName: shop.name,
        totalBookings: total,
        canceledBookings: canceled,
        cancelRate: rate
      })
    }
  }

  res.json({ locked })
}

