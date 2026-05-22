import { createModel } from '../base.js'

export const Service = createModel('Service', 'services', {
  shopId: { type: String, index: true },
  categoryId: { type: String, index: true },
  name: { type: String, index: true },
  slug: { type: String, index: true },
  description: String,
  price: Number,
  durationMinutes: Number,
  imageUrl: String,
  status: { type: String, index: true },
  availableStaffIds: [String],
  sortOrder: Number,
  createdAt: Date,
  updatedAt: Date
})

