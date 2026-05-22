import { createModel } from '../base.js'

export const ShopClosureDay = createModel('ShopClosureDay', 'shop_closure_days', {
  shopId: { type: String, index: true },
  date: Date,
  reason: String,
  createdAt: Date
})

