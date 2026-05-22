import { FraudReport, Penalty } from '../../models/index.js'
import { httpError } from '../../utils/httpError.js'
import { writeAuditLog } from '../../utils/audit.js'

export async function getReports(req, res) {
  const query = {}
  if (req.query.status) query.status = req.query.status
  const items = await FraudReport.find(query).sort({ createdAt: -1 }).lean()
  res.json({ items })
}

export async function getReportById(req, res) {
  const report = await FraudReport.findById(req.params.reportId).lean()
  if (!report) throw httpError(404, 'Không tìm thấy tố giác')
  res.json({ report })
}

export async function approve(req, res) {
  const report = await FraudReport.findByIdAndUpdate(
    req.params.reportId,
    { status: 'approved', updatedAt: new Date() },
    { new: true }
  ).lean()
  if (!report) throw httpError(404, 'Không tìm thấy tố giác')

  const penalty = await Penalty.create({
    shopId: report.shopId,
    bookingId: report.bookingId,
    amount: Number(req.body?.penaltyAmount || 50000),
    reason: req.body?.reason || 'Fraud report approved',
    createdAt: new Date()
  })

  await writeAuditLog({
    actorUserId: req.auth.userId,
    action: 'admin.fraud_approve',
    entity: 'fraud_report',
    entityId: String(report._id),
    meta: { penaltyId: String(penalty._id) }
  })

  res.json({ approved: true, report, penalty })
}

export async function reject(req, res) {
  const report = await FraudReport.findByIdAndUpdate(
    req.params.reportId,
    { status: 'rejected', updatedAt: new Date() },
    { new: true }
  ).lean()
  if (!report) throw httpError(404, 'Không tìm thấy tố giác')
  await writeAuditLog({
    actorUserId: req.auth.userId,
    action: 'admin.fraud_reject',
    entity: 'fraud_report',
    entityId: String(report._id),
    meta: {}
  })
  res.json({ rejected: true, report })
}
