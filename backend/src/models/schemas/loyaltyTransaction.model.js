import { createModel } from '../base.js'

export const LoyaltyTransaction = createModel('LoyaltyTransaction', 'loyalty_transactions', {
  customerId: { type: String, index: true },
  shopId: { type: String, index: true },
  bookingId: { type: String, index: true },
  bookingCode: { type: String, index: true },
  type: { type: String, index: true },
  status: { type: String, index: true },
  points: Number,
  amountVnd: Number,
  note: String,
  metadata: Object,
  createdAt: Date,
  updatedAt: Date
})

LoyaltyTransaction.schema.index({ bookingId: 1, type: 1 }, { unique: true, partialFilterExpression: { bookingId: { $type: 'string' }, type: { $in: ['earn', 'redeem_reserve'] } } })
