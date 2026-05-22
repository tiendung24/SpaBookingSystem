import { createModel } from '../base.js'

export const ShopPayout = createModel('ShopPayout', 'shop_payouts', {
  shopId: { type: String, index: true },
  amount: Number,
  bankInfo: Object,
  status: { type: String, index: true },
  createdAt: Date,
  updatedAt: Date
})

