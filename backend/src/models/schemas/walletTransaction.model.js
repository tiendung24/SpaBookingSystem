import { createModel } from '../base.js'

export const WalletTransaction = createModel('WalletTransaction', 'wallet_transactions', {
  shopId: { type: String, index: true },
  walletId: { type: String, index: true },
  type: { type: String, index: true },
  amount: Number,
  description: String,
  refId: String,
  status: { type: String, index: true },
  createdAt: Date
})

