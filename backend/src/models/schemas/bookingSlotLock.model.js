import mongoose from 'mongoose'

const bookingSlotLockSchema = new mongoose.Schema(
  {
    shopId: { type: String, index: true, required: true },
    staffId: { type: String, index: true, required: true },
    startTime: { type: Date, index: true, required: true },
    endTime: { type: Date, required: true },
    bookingId: { type: String, index: true },
    createdAt: { type: Date, default: Date.now }
  },
  { versionKey: false }
)

bookingSlotLockSchema.index({ shopId: 1, staffId: 1, startTime: 1 }, { unique: true })

export const BookingSlotLock = mongoose.model('BookingSlotLock', bookingSlotLockSchema, 'booking_slot_locks')

