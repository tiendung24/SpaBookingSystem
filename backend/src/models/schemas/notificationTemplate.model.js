import { createModel } from '../base.js'

export const NotificationTemplate = createModel('NotificationTemplate', 'notification_templates', {
  code: { type: String, index: true, unique: true },
  title: String,
  content: String,
  channels: [String],
  createdAt: Date,
  updatedAt: Date
})

