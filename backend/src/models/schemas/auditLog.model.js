import { createModel } from '../base.js'

export const AuditLog = createModel('AuditLog', 'audit_logs', {
  actorUserId: { type: String, index: true },
  action: { type: String, index: true },
  entity: { type: String, index: true },
  entityId: { type: String, index: true },
  meta: Object,
  createdAt: Date
})

