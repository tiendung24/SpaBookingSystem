import mongoose from 'mongoose'

const shopSlotLockSchema = new mongoose.Schema(
  {
    shopId: { type: String, index: true, required: true },
    date: { type: String, index: true, required: true }, // Format YYYY-MM-DD
    time: { type: String, required: true }, // Format HH:mm
    createdAt: { type: Date, default: Date.now }
  },
  { versionKey: false }
)

shopSlotLockSchema.index({ shopId: 1, date: 1, time: 1 }, { unique: true })

export const ShopSlotLock = mongoose.model('ShopSlotLock', shopSlotLockSchema, 'shop_slot_locks')
