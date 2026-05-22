import { createModel } from '../base.js'

export const Penalty = createModel('Penalty', 'penalties', {
  shopId: { type: String, index: true },
  bookingId: { type: String, index: true },
  amount: Number,
  reason: String,
  createdAt: Date
})

