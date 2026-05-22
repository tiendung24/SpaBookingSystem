import { createModel } from '../base.js'
import mongoose from 'mongoose'

export const SystemSetting = createModel('SystemSetting', 'system_settings', {
  key: { type: String, index: true, unique: true },
  value: mongoose.Schema.Types.Mixed,
  updatedAt: Date
})
