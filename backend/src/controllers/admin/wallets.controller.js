import { Deposit, PayosPayment, PlatformFee, Wallet, WalletTransaction } from '../../models/index.js'
import { httpError } from '../../utils/httpError.js'
import { writeAuditLog } from '../../utils/audit.js'

export async function getWallets(req, res) {
  const items = await Wallet.find().sort({ updatedAt: -1 }).lean()
  res.json({ items })
}

export async function getWalletByShopId(req, res) {
  const wallet = await Wallet.findOne({ shopId: req.params.shopId }).lean()
  res.json({ wallet: wallet || null })
}

export async function adjustBalance(req, res) {
  const shopId = req.params.shopId
  const amount = Number(req.body?.amount || 0)
  if (!amount) throw httpError(400, 'Thiếu amount')

  const wallet = await Wallet.findOneAndUpdate(
    { shopId },
    { $setOnInsert: { escrowBalance: 0, minBalance: 0, status: 'active' }, $set: { updatedAt: new Date() } },
    { upsert: true, new: true }
  )

  wallet.balance = Number(wallet.balance || 0) + amount
  await wallet.save()

  const tx = await WalletTransaction.create({
    shopId,
    walletId: String(wallet._id),
    type: 'admin_adjust',
    amount,
    description: req.body?.description || 'Admin điều chỉnh số dư',
    refId: req.auth.userId,
    status: 'success',
    createdAt: new Date()
  })

  await writeAuditLog({
    actorUserId: req.auth.userId,
    action: 'admin.wallet_adjust',
    entity: 'wallet',
    entityId: String(wallet._id),
    meta: { shopId, amount, transactionId: String(tx._id) }
  })

  res.status(201).json({ wallet, transaction: tx })
}

export async function getWalletTransactions(req, res) {
  const query = {}
  if (req.query.shopId) query.shopId = req.query.shopId
  const items = await WalletTransaction.find(query).sort({ createdAt: -1 }).lean()
  res.json({ items })
}

export async function getTransactions(req, res) {
  const shopId = req.query.shopId
  const walletQuery = shopId ? { shopId } : {}
  const [walletTxs, platformFees, payosPayments, deposits] = await Promise.all([
    WalletTransaction.find(walletQuery).lean(),
    PlatformFee.find(walletQuery).lean(),
    PayosPayment.find(walletQuery).lean(),
    Deposit.find(walletQuery).lean()
  ])

  const items = [
    ...walletTxs.map((item) => ({ ...item, transactionType: 'wallet' })),
    ...platformFees.map((item) => ({ ...item, transactionType: 'platform_fee' })),
    ...payosPayments.map((item) => ({ ...item, transactionType: 'payos_payment' })),
    ...deposits.map((item) => ({ ...item, transactionType: 'deposit' }))
  ].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))

  res.json({ items })
}

export async function getTransactionById(req, res) {
  const transaction =
    (await WalletTransaction.findById(req.params.transactionId).lean()) ||
    (await PlatformFee.findById(req.params.transactionId).lean()) ||
    (await PayosPayment.findById(req.params.transactionId).lean()) ||
    (await Deposit.findById(req.params.transactionId).lean())
  if (!transaction) throw httpError(404, 'Không tìm thấy giao dịch')
  res.json({ transaction })
}

export async function getPlatformFees(req, res) {
  const query = {}
  if (req.query.shopId) query.shopId = req.query.shopId
  const items = await PlatformFee.find(query).sort({ createdAt: -1 }).lean()
  res.json({ items })
}

export async function getPlatformFeesStats(req, res) {
  const agg = await PlatformFee.aggregate([
    { $group: { _id: '$shopId', total: { $sum: '$amount' }, count: { $sum: 1 } } },
    { $sort: { total: -1 } }
  ])
  const overall = await PlatformFee.aggregate([{ $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }])

  res.json({
    stats: {
      overall: overall?.[0] || { total: 0, count: 0 },
      byShop: agg
    }
  })
}
