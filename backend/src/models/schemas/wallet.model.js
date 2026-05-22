import { createModel } from '../base.js'

export const Wallet = createModel('Wallet', 'wallets', {
  shopId: { type: String, index: true, unique: true },
  balance: Number,
  minBalance: Number,
  escrowBalance: Number,
  status: { type: String, index: true },
  updatedAt: Date
})

