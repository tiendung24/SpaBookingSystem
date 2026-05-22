import { createModel } from '../base.js'

export const Customer = createModel('Customer', 'customers', {
  fullName: { type: String, index: true },
  phone: { type: String, index: true },
  email: String,
  notes: String,
  createdAt: Date,
  updatedAt: Date
})

