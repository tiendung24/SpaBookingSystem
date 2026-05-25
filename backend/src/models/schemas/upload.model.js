import { createModel } from '../base.js'

export const Upload = createModel('Upload', 'uploads', {
  fileId: { type: String, index: true },
  fileName: String,
  url: String,
  publicId: { type: String, index: true },
  mimeType: String,
  size: Number,
  provider: { type: String, index: true },
  ownerUserId: { type: String, index: true },
  ownerShopId: { type: String, index: true },
  createdAt: Date,
  deletedAt: Date
})
