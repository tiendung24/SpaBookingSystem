import { getCustomerLoyaltyHistory, getLoyaltySummary } from '../../services/loyalty.service.js'
import { httpError } from '../../utils/httpError.js'

export async function me(req, res) {
  const customerId = String(req.auth?.customerId || '').trim()
  if (!customerId) throw httpError(401, 'Không tìm thấy customerId trong phiên đăng nhập')
  const loyalty = await getLoyaltySummary(customerId)
  res.json({ loyalty })
}

export async function history(req, res) {
  const customerId = String(req.auth?.customerId || '').trim()
  if (!customerId) throw httpError(401, 'Không tìm thấy customerId trong phiên đăng nhập')
  const limit = Number(req.query?.limit || 20)
  const items = await getCustomerLoyaltyHistory(customerId, limit)
  res.json({ items })
}
