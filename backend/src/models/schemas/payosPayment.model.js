import { createModel } from '../base.js'

export const PayosPayment = createModel('PayosPayment', 'payos_payments', {
  bookingId: { type: String, index: true },
  shopId: { type: String, index: true },
  amount: Number,
  orderCode: { type: String, index: true },
  status: { type: String, index: true },
  raw: Object,
  createdAt: Date,
  updatedAt: Date
})

