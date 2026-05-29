import { Deposit, PayosPayment, PlatformFee, Shop, Wallet, WalletTransaction } from '../../models/index.js'
import { PayOSService } from '../../services/payos.service.js'
import { httpError } from '../../utils/httpError.js'
import { writeAuditLog } from '../../utils/audit.js'

export async function getWallet(req, res) {
  const shopId = req.auth.shopId
  const wallet = await Wallet.findOne({ shopId }).lean()
  res.json({
    wallet: wallet || {
      shopId,
      balance: 0,
      minBalance: 100000,
      escrowBalance: 0,
      status: 'active'
    }
  })
}

export async function getWalletTransactions(req, res) {
  const shopId = req.auth.shopId
  const items = await WalletTransaction.find({ shopId }).sort({ createdAt: -1 }).lean()
  res.json({ items })
}

export async function createTopup(req, res) {
  const shopId = req.auth.shopId
  const amount = Number(req.body?.amount || 0)
  if (!amount || amount <= 0) throw httpError(400, 'Số tiền nạp không hợp lệ')
  if (amount < 100000) throw httpError(400, 'Số tiền nạp tối thiểu là 100.000đ')

  const payos = new PayOSService()
  const topup = await payos.createTopupPayment({
    amount,
    description: `TOPUP_${shopId}_${Date.now()}`
  })

  const payment = await PayosPayment.create({
    bookingId: '',
    shopId,
    amount,
    orderCode: String(topup.topupId || ''),
    status: topup.status || 'pending',
    raw: topup,
    createdAt: new Date(),
    updatedAt: new Date()
  })

  await writeAuditLog({
    actorUserId: req.auth.userId,
    action: 'shop.wallet_topup_create',
    entity: 'payos_payment',
    entityId: String(payment._id),
    meta: { shopId, amount }
  })

  res.status(201).json({ topup, paymentId: String(payment._id) })
}

export async function getTopupStatus(req, res) {
  const shopId = req.auth.shopId
  const payment = await PayosPayment.findOne({ shopId, orderCode: req.params.topupId }).lean()
  if (!payment) {
    throw httpError(404, 'Không tìm thấy giao dịch nạp ví')
  }
  res.json({ topupId: req.params.topupId, status: payment.status || 'pending', payment })
}

export async function getDepositSettings(req, res) {
  const shopId = req.auth.shopId
  const shop = await Shop.findById(shopId).lean()
  res.json({ depositConfig: shop?.depositConfig || { enabled: false, type: 'fixed', value: 0 } })
}

export async function updateDepositSettings(req, res) {
  const shopId = req.auth.shopId
  const shop = await Shop.findByIdAndUpdate(
    shopId,
    { depositConfig: req.body || {}, updatedAt: new Date() },
    { new: true }
  ).lean()
  if (!shop) throw httpError(404, 'Không tìm thấy shop')
  await writeAuditLog({
    actorUserId: req.auth.userId,
    action: 'shop.deposit_settings_update',
    entity: 'shop',
    entityId: String(shop._id),
    meta: { shopId }
  })
  res.json({ depositConfig: shop.depositConfig || {} })
}

export async function getPlatformFees(req, res) {
  const shopId = req.auth.shopId
  const items = await PlatformFee.find({ shopId }).sort({ createdAt: -1 }).lean()
  res.json({ items })
}

export async function getTransactions(req, res) {
  const shopId = req.auth.shopId
  const [walletTransactions, deposits] = await Promise.all([
    WalletTransaction.find({ shopId }).sort({ createdAt: -1 }).lean(),
    Deposit.find({ shopId }).sort({ createdAt: -1 }).lean()
  ])

  res.json({
    items: [
      ...walletTransactions.map((item) => ({ ...item, transactionType: 'wallet' })),
      ...deposits.map((item) => ({ ...item, transactionType: 'deposit' }))
    ].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
  })
}

export async function getTransactionById(req, res) {
  const shopId = req.auth.shopId
  const transaction =
    (await WalletTransaction.findOne({ _id: req.params.transactionId, shopId }).lean()) ||
    (await Deposit.findOne({ _id: req.params.transactionId, shopId }).lean())

  if (!transaction) throw httpError(404, 'Không tìm thấy giao dịch')
  res.json({ transaction })
}
