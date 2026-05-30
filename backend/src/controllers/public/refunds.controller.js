import { Booking, RefundRequest } from '../../models/index.js'
import { httpError } from '../../utils/httpError.js'
import { writeAuditLog } from '../../utils/audit.js'

function sanitizeBankInfo(body = {}) {
  return {
    bankName: String(body.bankName || body.bank || '').trim(),
    accountNumber: String(body.accountNumber || body.account || '').trim(),
    accountName: String(body.accountName || body.name || '').trim()
  }
}

export async function getRefundByToken(req, res) {
  const token = String(req.params.token || '').trim()
  if (!token) throw httpError(400, 'Thiếu token')

  const refund = await RefundRequest.findOne({ token }).lean()
  if (!refund) throw httpError(404, 'Không tìm thấy yêu cầu hoàn tiền')
  if (refund.tokenExpiresAt && new Date(refund.tokenExpiresAt).getTime() < Date.now()) {
    throw httpError(410, 'Link nhập thông tin hoàn tiền đã hết hạn')
  }

  const booking = await Booking.findById(refund.bookingId).lean()
  if (!booking) throw httpError(404, 'Không tìm thấy booking')

  res.json({
    refund: {
      id: String(refund._id),
      bookingCode: refund.bookingCode || booking.bookingCode,
      amount: Number(refund.amount || 0),
      status: refund.status,
      tokenExpiresAt: refund.tokenExpiresAt || null,
      bankInfo: refund.bankInfo || null
    },
    booking: {
      bookingCode: booking.bookingCode,
      customerName: booking.customerName,
      startTime: booking.startTime,
      status: booking.status
    }
  })
}

export async function submitRefundBankInfo(req, res) {
  const token = String(req.params.token || '').trim()
  if (!token) throw httpError(400, 'Thiếu token')

  const refund = await RefundRequest.findOne({ token })
  if (!refund) throw httpError(404, 'Không tìm thấy yêu cầu hoàn tiền')
  if (refund.tokenExpiresAt && new Date(refund.tokenExpiresAt).getTime() < Date.now()) {
    throw httpError(410, 'Link nhập thông tin hoàn tiền đã hết hạn')
  }

  const bankInfo = sanitizeBankInfo(req.body || {})
  if (!bankInfo.bankName || !bankInfo.accountNumber || !bankInfo.accountName) {
    throw httpError(400, 'Thiếu thông tin ngân hàng nhận hoàn tiền')
  }

  refund.bankInfo = bankInfo
  refund.status = 'pending_payout'
  refund.updatedAt = new Date()
  await refund.save()

  const booking = await Booking.findById(refund.bookingId)
  if (booking) {
    booking.status = 'cancelled_refund_pending'
    booking.updatedAt = new Date()
    await booking.save()
  }

  await writeAuditLog({
    actorUserId: '',
    action: 'public.refund_bank_info_submit',
    entity: 'refund_request',
    entityId: String(refund._id),
    meta: { bookingCode: refund.bookingCode || booking?.bookingCode || '' }
  })

  res.json({ ok: true, status: refund.status })
}
