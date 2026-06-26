import { ShopSlotLock } from '../../models/index.js'
import { httpError } from '../../utils/httpError.js'

export async function getLockedSlots(req, res) {
  const { date } = req.query
  const shopId = req.auth.shopId

  if (!date) {
    throw httpError(400, 'Thiếu tham số date')
  }

  const locks = await ShopSlotLock.find({ shopId, date }).lean()
  res.json(locks.map(l => l.time))
}

export async function lockSlot(req, res) {
  const { date, time } = req.body
  const shopId = req.auth.shopId

  if (!date || !time) {
    throw httpError(400, 'Thiếu date hoặc time')
  }

  try {
    await ShopSlotLock.create({ shopId, date, time })
  } catch (err) {
    // Ignore duplicate error if already locked
    if (err.code !== 11000) {
      throw err
    }
  }

  res.json({ success: true })
}

export async function unlockSlot(req, res) {
  const { date, time } = req.body
  const shopId = req.auth.shopId

  if (!date || !time) {
    throw httpError(400, 'Thiếu date hoặc time')
  }

  await ShopSlotLock.deleteOne({ shopId, date, time })
  res.json({ success: true })
}
