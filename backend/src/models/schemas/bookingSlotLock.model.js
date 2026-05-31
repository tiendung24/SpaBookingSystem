import mongoose from 'mongoose'

const bookingSlotLockSchema = new mongoose.Schema(
  {
    shopId: { type: String, index: true, required: true },
    staffId: { type: String, index: true, required: true },
    clientAttemptId: { type: String, index: true },
    serviceId: { type: String, index: true },
    startTime: { type: Date, index: true, required: true },
    endTime: { type: Date, required: true },
    bookingId: { type: String, index: true },
    holdToken: { type: String, index: true },
    lockType: { type: String, index: true, default: 'booking' },
    expiresAt: { type: Date },
    createdAt: { type: Date, default: Date.now }
  },
  { versionKey: false }
)

bookingSlotLockSchema.index({ shopId: 1, staffId: 1, startTime: 1 })
bookingSlotLockSchema.index({ shopId: 1, startTime: 1, endTime: 1 })
bookingSlotLockSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

export const BookingSlotLock = mongoose.model('BookingSlotLock', bookingSlotLockSchema, 'booking_slot_locks')
