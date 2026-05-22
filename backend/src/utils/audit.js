import { AuditLog } from '../models/index.js'

export async function writeAuditLog({ actorUserId = '', action, entity, entityId = '', meta = {} }) {
  try {
    await AuditLog.create({
      actorUserId,
      action,
      entity,
      entityId,
      meta,
      createdAt: new Date()
    })
  } catch {
    // best-effort audit; never block request
  }
}

