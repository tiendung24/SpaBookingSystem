export function derivePaymentStatus(ctx = {}) {
  // ctx may be a booking object, or { booking, payment, deposit }
  const booking = ctx.booking || ctx || {}
  const payment = ctx.payment || null
  const deposit = ctx.deposit || null

  const bookingStatus = String(booking.status || '').toLowerCase()
  const depositAmount = Number(booking.depositAmount || deposit?.amount || 0)
  const paymentStatus = String(payment?.status || '').toLowerCase()

  // Completed/checked-out means service paid
  if (bookingStatus === 'completed' || bookingStatus === 'checked_out') {
    return { key: 'service_paid', label: 'Đã nhận thanh toán dịch vụ' }
  }

  // If we have an explicit successful payment record, treat as deposit received
  const successPaymentKeys = ['success', 'paid', 'completed', 'captured', 'settled']
  if (payment && successPaymentKeys.includes(paymentStatus)) {
    return { key: 'deposit_received', label: 'Đã nhận cọc' }
  }

  // If deposit row indicates holding/paid/released, treat as received
  if (deposit && ['holding', 'paid', 'released'].includes(String(deposit.status || '').toLowerCase())) {
    return { key: 'deposit_received', label: 'Đã nhận cọc' }
  }

  // Fallback: if booking is confirmed/checked_in and deposit amount > 0
  if (depositAmount > 0 && ['confirmed', 'checked_in'].includes(bookingStatus)) {
    return { key: 'deposit_received', label: 'Đã nhận cọc' }
  }

  return { key: 'not_received', label: 'Chưa nhận' }
}
