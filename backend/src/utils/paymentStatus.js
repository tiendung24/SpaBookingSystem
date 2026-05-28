export function derivePaymentStatus(booking = {}) {
  const bookingStatus = String(booking.status || '').toLowerCase()
  const depositAmount = Number(booking.depositAmount || 0)

  if (bookingStatus === 'completed' || bookingStatus === 'checked_out') {
    return {
      key: 'service_paid',
      label: 'Đã nhận thanh toán dịch vụ'
    }
  }

  if (depositAmount > 0 && ['confirmed', 'checked_in'].includes(bookingStatus)) {
    return {
      key: 'deposit_received',
      label: 'Đã nhận cọc'
    }
  }

  return {
    key: 'not_received',
    label: 'Chưa nhận'
  }
}
