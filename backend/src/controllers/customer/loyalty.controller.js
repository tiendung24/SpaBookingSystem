import { getCustomerLoyaltyHistory, getLoyaltySummary } from '../../services/loyalty.service.js'
import { Customer, LoyaltyAccount, User } from '../../models/index.js'
import { httpError } from '../../utils/httpError.js'

export async function me(req, res) {
  const customerId = String(req.auth?.customerId || '').trim()
  if (!customerId) throw httpError(401, 'Không tìm thấy customerId trong phiên đăng nhập')

  const base = await getLoyaltySummary(customerId)

  // Legacy-safe aggregation: same user/email/phone may map to multiple customerIds in old data.
  const user = await User.findById(String(req.auth?.userId || '')).lean()
  const email = String(user?.email || '').trim().toLowerCase()
  const phone = String(user?.phone || '').trim()

  const relatedCustomers = await Customer.find({
    $or: [
      ...(email ? [{ email }] : []),
      ...(phone ? [{ phone }] : [])
    ]
  }).select({ _id: 1 }).lean()

  const relatedIds = Array.from(new Set([customerId, ...relatedCustomers.map((item) => String(item._id || '')).filter(Boolean)]))

  if (relatedIds.length <= 1) {
    return res.json({ loyalty: base })
  }

  const relatedAccounts = await LoyaltyAccount.find({ customerId: { $in: relatedIds } }).lean()
  if (!relatedAccounts.length) {
    return res.json({ loyalty: base })
  }

  const pointsBalance = relatedAccounts.reduce((sum, item) => sum + Number(item.pointsBalance || 0), 0)
  const lifetimeEarned = relatedAccounts.reduce((sum, item) => sum + Number(item.lifetimeEarned || 0), 0)
  const lifetimeSpent = relatedAccounts.reduce((sum, item) => sum + Number(item.lifetimeSpent || 0), 0)

  return res.json({
    loyalty: {
      ...base,
      pointsBalance: Math.max(0, Math.floor(pointsBalance)),
      redeemValueVnd: Math.max(0, Math.floor(pointsBalance)) * 100,
      lifetimeEarned: Math.max(0, Math.floor(lifetimeEarned)),
      lifetimeSpent: Math.max(0, Math.floor(lifetimeSpent)),
      relatedCustomerIds: relatedIds
    }
  })
}

export async function history(req, res) {
  const customerId = String(req.auth?.customerId || '').trim()
  if (!customerId) throw httpError(401, 'Không tìm thấy customerId trong phiên đăng nhập')
  const limit = Number(req.query?.limit || 20)
  const items = await getCustomerLoyaltyHistory(customerId, limit)
  res.json({ items })
}
