import { createModel } from '../base.js'

export const RefundRequest = createModel('RefundRequest', 'refund_requests', {
  bookingId: { type: String, index: true },
  shopId: { type: String, index: true },
  amount: Number,
  bankInfo: Object,
  status: { type: String, index: true },
  note: String,
  createdAt: Date,
  updatedAt: Date
})

