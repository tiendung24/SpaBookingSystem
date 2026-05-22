import { createModel } from '../base.js'

export const BookingStatusLog = createModel('BookingStatusLog', 'booking_status_logs', {
  bookingId: { type: String, index: true },
  fromStatus: String,
  toStatus: String,
  actorUserId: String,
  note: String,
  createdAt: Date
})

