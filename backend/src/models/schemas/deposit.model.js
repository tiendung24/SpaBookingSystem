import { createModel } from '../base.js'

export const Deposit = createModel('Deposit', 'deposits', {
  bookingId: { type: String, index: true },
  shopId: { type: String, index: true },
  amount: Number,
  status: { type: String, index: true },
  createdAt: Date,
  updatedAt: Date
})

