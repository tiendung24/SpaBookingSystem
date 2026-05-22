import { createModel } from '../base.js'

export const ServiceCategory = createModel('ServiceCategory', 'service_categories', {
  shopId: { type: String, index: true },
  name: { type: String, index: true },
  slug: { type: String, index: true },
  sortOrder: Number,
  status: { type: String, index: true },
  createdAt: Date,
  updatedAt: Date
})

