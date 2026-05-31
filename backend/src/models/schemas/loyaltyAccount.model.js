import { createModel } from '../base.js'

export const LoyaltyAccount = createModel('LoyaltyAccount', 'loyalty_accounts', {
  customerId: { type: String, index: true, unique: true },
  pointsBalance: { type: Number, default: 0 },
  lifetimeEarned: { type: Number, default: 0 },
  lifetimeSpent: { type: Number, default: 0 },
  createdAt: Date,
  updatedAt: Date
})
