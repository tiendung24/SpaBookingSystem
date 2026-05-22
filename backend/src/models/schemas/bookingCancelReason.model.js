import { createModel } from '../base.js'

export const BookingCancelReason = createModel('BookingCancelReason', 'booking_cancel_reasons', {
  code: { type: String, index: true },
  label: String,
  createdAt: Date
})

