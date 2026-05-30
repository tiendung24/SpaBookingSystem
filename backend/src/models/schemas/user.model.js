import { createModel } from '../base.js'

export const User = createModel('User', 'users', {
  fullName: { type: String, index: true },
  phone: { type: String, index: true },
  email: { type: String, index: true },
  passwordHash: String,
  role: { type: String, index: true },
  status: { type: String, index: true },
  shopId: { type: String, index: true },
  avatarUrl: String,
  lastLoginAt: Date,
  passwordResetTokenHash: String,
  passwordResetExpiresAt: Date,
  createdAt: Date,
  updatedAt: Date
})

