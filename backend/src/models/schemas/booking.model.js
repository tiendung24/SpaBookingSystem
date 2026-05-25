import { createModel } from '../base.js'

export const Booking = createModel('Booking', 'bookings', {
  bookingCode: { type: String, index: true, unique: true },
  shopId: { type: String, index: true },
  customerId: { type: String, index: true },
  customerName: String,
  customerPhone: { type: String, index: true },
  serviceId: { type: String, index: true },
  staffId: { type: String, index: true },
  startTime: { type: Date, index: true },
  endTime: Date,
  note: String,
  status: { type: String, index: true },
  depositExpiresAt: { type: Date, index: true },
  depositAmount: Number,
  totalAmount: Number,
  cancelReasonId: String,
  createdAt: Date,
  updatedAt: Date
})

