import { createModel } from '../base.js'

export const ShopWorkingHour = createModel('ShopWorkingHour', 'shop_working_hours', {
  shopId: { type: String, index: true },
  openTime: String,
  closeTime: String,
  weekDays: [Number],
  lunchBreakStart: String,
  lunchBreakEnd: String,
  slotDurationMinutes: Number,
  maxCustomersPerSlot: Number,
  createdAt: Date,
  updatedAt: Date
})

