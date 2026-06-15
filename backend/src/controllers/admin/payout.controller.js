import { ShopPayout, Shop, WalletTransaction, Wallet } from '../../models/index.js'
import { httpError } from '../../utils/httpError.js'
import { writeAuditLog } from '../../utils/audit.js'

export async function getPayouts(req, res) {
  const { status, limit = 50, page = 1 } = req.query
  const query = {}
  if (status) query.status = status

  const skip = (Number(page) - 1) * Number(limit)
  const items = await ShopPayout.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit))
    .lean()

  const total = await ShopPayout.countDocuments(query)

  // Fetch shop details for these payouts
  const shopIds = [...new Set(items.map((i) => i.shopId))]
  const shops = await Shop.find({ _id: { $in: shopIds } }, 'name slug phone').lean()
  const shopMap = shops.reduce((acc, shop) => {
    acc[String(shop._id)] = shop
    return acc
  }, {})

  const enrichedItems = items.map((item) => ({
    ...item,
    shop: shopMap[item.shopId] || null
  }))

  res.json({
    items: enrichedItems,
    total,
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.ceil(total / Number(limit))
  })
}

export async function approvePayout(req, res) {
  const payoutId = req.params.payoutId
  const payout = await ShopPayout.findById(payoutId)
  if (!payout) throw httpError(404, 'Không tìm thấy yêu cầu rút tiền')
  if (payout.status !== 'pending') {
    throw httpError(400, `Không thể duyệt yêu cầu đang ở trạng thái: ${payout.status}`)
  }

  payout.status = 'completed'
  payout.updatedAt = new Date()
  await payout.save()

  // Cập nhật WalletTransaction tương ứng
  await WalletTransaction.updateOne(
    { refId: String(payout._id), type: 'payout_request' },
    { $set: { status: 'success' } }
  )

  await writeAuditLog({
    actorUserId: req.auth.userId,
    action: 'admin.payout_approve',
    entity: 'shop_payout',
    entityId: String(payout._id),
    meta: { shopId: payout.shopId, amount: payout.amount }
  })

  res.json({ message: 'Đã duyệt yêu cầu rút tiền', payout })
}

export async function rejectPayout(req, res) {
  const payoutId = req.params.payoutId
  const reason = req.body?.reason || 'Không hợp lệ'
  
  const payout = await ShopPayout.findById(payoutId)
  if (!payout) throw httpError(404, 'Không tìm thấy yêu cầu rút tiền')
  if (payout.status !== 'pending') {
    throw httpError(400, `Không thể từ chối yêu cầu đang ở trạng thái: ${payout.status}`)
  }

  payout.status = 'rejected'
  payout.rejectReason = reason
  payout.updatedAt = new Date()
  await payout.save()

  // Hủy giao dịch ví
  await WalletTransaction.updateOne(
    { refId: String(payout._id), type: 'payout_request' },
    { $set: { status: 'rejected' } }
  )

  // Hoàn tiền lại cho ví
  const wallet = await Wallet.findOne({ shopId: payout.shopId })
  if (wallet) {
    wallet.balance += payout.amount
    await wallet.save()
  }

  await writeAuditLog({
    actorUserId: req.auth.userId,
    action: 'admin.payout_reject',
    entity: 'shop_payout',
    entityId: String(payout._id),
    meta: { shopId: payout.shopId, amount: payout.amount, reason }
  })

  res.json({ message: 'Đã từ chối yêu cầu rút tiền', payout })
}
