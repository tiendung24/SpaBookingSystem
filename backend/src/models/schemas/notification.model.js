import { createModel } from '../base.js'

export const Notification = createModel('Notification', 'notifications', {
  userId: { type: String, index: true },
  shopId: { type: String, index: true },
  type: { type: String, index: true },
  title: String,
  content: String,
  readAt: Date,
  createdAt: Date
})

