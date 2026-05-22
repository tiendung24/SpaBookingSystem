import { SystemSetting } from '../models/index.js'

export async function getSettingNumber(key, defaultValue) {
  const doc = await SystemSetting.findOne({ key }).lean()
  const n = Number(doc?.value)
  return Number.isFinite(n) ? n : defaultValue
}

