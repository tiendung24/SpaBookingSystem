import { createModel } from '../base.js'

export const Shop = createModel('Shop', 'shops', {
  ownerId: { type: String, index: true },
  name: { type: String, index: true },
  slug: { type: String, index: true, unique: true },
  publicUrl: String,
  phone: String,
  email: String,
  address: Object,
  businessTypes: [String],
  description: String,
  logoUrl: String,
  coverUrl: String,
  status: { type: String, index: true },
  onlineBookingEnabled: Boolean,
  bankInfo: Object,
  depositConfig: Object,
  slotConfig: Object,
  fraudConfig: Object,
  stats: Object,
  createdAt: Date,
  updatedAt: Date,
  notificationConfig: Object
})

