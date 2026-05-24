import { SystemSetting } from '../../models/index.js'
import { httpError } from '../../utils/httpError.js'
import { writeAuditLog } from '../../utils/audit.js'
import { requireObject, requireString } from '../../utils/validation.js'

export async function getSettings(req, res) {
  const items = await SystemSetting.find().sort({ key: 1 }).lean()
  res.json({ items })
}

export async function updateSettings(req, res) {
  const patch = requireObject(req.body, 'Body phải là object key-value')

  const keys = Object.keys(patch)
  if (!keys.length) throw httpError(400, 'Không có setting nào để cập nhật')

  const updated = []
  for (const key of keys) {
    const safeKey = requireString(key, 'key')
    const doc = await SystemSetting.findOneAndUpdate(
      { key: safeKey },
      { key: safeKey, value: patch[key], updatedAt: new Date() },
      { upsert: true, new: true }
    ).lean()
    updated.push(doc)
  }

  await writeAuditLog({
    actorUserId: req.auth.userId,
    action: 'admin.settings_update',
    entity: 'system_setting',
    entityId: '',
    meta: { keys }
  })

  res.json({ updated })
}