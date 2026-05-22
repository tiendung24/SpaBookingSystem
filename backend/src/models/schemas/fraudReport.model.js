import { createModel } from '../base.js'

export const FraudReport = createModel('FraudReport', 'fraud_reports', {
  bookingId: { type: String, index: true },
  shopId: { type: String, index: true },
  customerPhone: String,
  reason: String,
  status: { type: String, index: true },
  createdAt: Date,
  updatedAt: Date
})

