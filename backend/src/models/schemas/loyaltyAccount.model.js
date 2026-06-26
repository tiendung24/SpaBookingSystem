import { createModel } from '../base.js'

export const LoyaltyAccount = createModel('LoyaltyAccount', 'loyalty_accounts', {
  customerId: { type: String, index: true },
  shopId: { type: String, index: true },
  pointsBalance: { type: Number, default: 0 },
  lifetimeEarned: { type: Number, default: 0 },
  lifetimeSpent: { type: Number, default: 0 },
  createdAt: Date,
  updatedAt: Date
})

LoyaltyAccount.schema.index({ customerId: 1, shopId: 1 }, { unique: true })
