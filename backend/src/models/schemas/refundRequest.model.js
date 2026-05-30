import { createModel } from '../base.js'

export const RefundRequest = createModel('RefundRequest', 'refund_requests', {
  bookingId: { type: String, index: true },
  shopId: { type: String, index: true },
  bookingCode: { type: String, index: true },
  customerEmail: String,
  customerPhone: String,
  amount: Number,
  bankInfo: Object,
  status: { type: String, index: true },
  token: { type: String, index: true },
  tokenExpiresAt: Date,
  emailSent: Boolean,
  emailSentAt: Date,
  payoutTransactionRef: String,
  paidAt: Date,
  paidByAdminId: String,
  note: String,
  createdAt: Date,
  updatedAt: Date
})

