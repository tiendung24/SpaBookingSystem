import { createModel } from '../base.js'

export const ShopStaff = createModel('ShopStaff', 'shop_staffs', {
  shopId: { type: String, index: true },
  userId: { type: String, index: true },
  fullName: { type: String, index: true },
  phone: String,
  avatarUrl: String,
  shortBio: String,
  bio: String,
  specialties: [String],
  role: { type: String, index: true },
  status: { type: String, index: true },
  serviceIds: [String],
  rating: Number,
  createdAt: Date,
  updatedAt: Date
})

