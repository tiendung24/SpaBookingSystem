import { Deposit, PayosPayment, PlatformFee, Shop, ShopPayout, Wallet, WalletTransaction } from '../../models/index.js'
import { PayOSService } from '../../services/payos.service.js'
import { httpError } from '../../utils/httpError.js'
import { writeAuditLog } from '../../utils/audit.js'

async function applyTopupPaymentToWallet(payment, payload = {}) {
  const defaultMin = Number(process.env.SHOP_WALLET_MIN_BALANCE || 100000)
  const wallet = await Wallet.findOneAndUpdate(
    { shopId: payment.shopId },
    { $setOnInsert: { balance: 0, minBalance: defaultMin, escrowBalance: 0, status: 'active' }, $set: { updatedAt: new Date() } },
    { upsert: true, new: true }
  )

  const existingTx = await WalletTransaction.findOne({
    shopId: payment.shopId,
    type: 'topup',
    refId: String(payment._id)
  }).lean()

  if (!existingTx) {
    const amount = Number(payment.amount || payload.amount || 0)
    wallet.balance = Number(wallet.balance || 0) + amount
    await wallet.save()
    await WalletTransaction.create({
      shopId: payment.shopId,
      walletId: String(wallet._id),
      type: 'topup',
      amount,
      description: 'Nạp ví qua PayOS',
      refId: String(payment._id),
      status: 'success',
      createdAt: new Date()
    })
  }

  const minBalance = Number(wallet.minBalance || defaultMin)
  if (Number(wallet.balance || 0) >= minBalance) {
    await Shop.updateOne(
      { _id: payment.shopId, status: 'inactive' },
      { $set: { status: 'active', updatedAt: new Date() } }
    )
  }

  return wallet
}

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

export async function refreshTopup(req, res) {
  const shopId = req.auth.shopId
  const payment = await PayosPayment.findOne({ shopId, orderCode: req.params.topupId })
  if (!payment) throw httpError(404, 'Không tìm thấy giao dịch nạp ví')

  const payos = new PayOSService()
  const remote = await payos.fetchPaymentStatus(payment.orderCode)
  if (!remote) {
    return res.json({ topupId: req.params.topupId, refreshed: false, reason: 'no_remote_info' })
  }

  const status = String(remote.status || '').toLowerCase()
  payment.status = status || payment.status
  payment.raw = remote.raw || payment.raw
  payment.updatedAt = new Date()
  await payment.save()

  const isSuccess = ['success', 'paid', 'completed'].includes(status)
  if (!isSuccess) {
    return res.json({ topupId: req.params.topupId, refreshed: false, status })
  }

  await applyTopupPaymentToWallet(payment, remote)
  await writeAuditLog({
    actorUserId: req.auth.userId,
    action: 'shop.wallet_topup_refresh',
    entity: 'payos_payment',
    entityId: String(payment._id),
    meta: { shopId, topupId: String(payment.orderCode), status }
  })

  return res.json({ topupId: req.params.topupId, refreshed: true, status })
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

export async function requestWithdrawal(req, res) {
  const shopId = req.auth.shopId
  const amount = Number(req.body?.amount || 0)
  const bankInfo = req.body?.bankInfo || {}

  if (!amount || amount <= 0) throw httpError(400, 'Số tiền rút không hợp lệ')
  if (!bankInfo.bankName || !bankInfo.accountNumber || !bankInfo.accountName) {
    throw httpError(400, 'Thiếu thông tin ngân hàng')
  }

  const wallet = await Wallet.findOne({ shopId })
  if (!wallet) throw httpError(404, 'Không tìm thấy ví')

  const minBalance = Number(wallet.minBalance || 100000)
  if (Number(wallet.balance || 0) - amount < minBalance) {
    throw httpError(400, `Số dư không đủ. Cần duy trì tối thiểu ${minBalance.toLocaleString('vi-VN')}đ trong ví.`)
  }

  // Đóng băng số tiền (trừ luôn khỏi balance)
  wallet.balance -= amount
  await wallet.save()

  // Tạo record ShopPayout
  const payout = await ShopPayout.create({
    shopId,
    amount,
    bankInfo,
    status: 'pending',
    createdAt: new Date(),
    updatedAt: new Date()
  })

  // Tạo WalletTransaction
  await WalletTransaction.create({
    shopId,
    walletId: String(wallet._id),
    type: 'payout_request',
    amount: -amount,
    description: `Yêu cầu rút tiền về ${bankInfo.bankName} - ${bankInfo.accountNumber}`,
    refId: String(payout._id),
    status: 'pending',
    createdAt: new Date()
  })

  await writeAuditLog({
    actorUserId: req.auth.userId,
    action: 'shop.wallet_withdraw_request',
    entity: 'shop_payout',
    entityId: String(payout._id),
    meta: { shopId, amount }
  })

  res.status(201).json({ payout })
}

export async function getWithdrawals(req, res) {
  const shopId = req.auth.shopId
  const items = await ShopPayout.find({ shopId }).sort({ createdAt: -1 }).lean()
  res.json({ items })
}

