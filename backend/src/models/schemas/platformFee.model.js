import { createModel } from '../base.js'

export const PlatformFee = createModel('PlatformFee', 'platform_fees', {
  shopId: { type: String, index: true },
  bookingId: { type: String, index: true },
  amount: Number,
  createdAt: Date
})

