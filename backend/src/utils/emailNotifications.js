import { EmailService } from '../services/email.service.js'

function fmtDateTimeVi(date) {
  try {
    const d = new Date(date)
    return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(d)
  } catch {
    return String(date || '')
  }
}

function fmtDateVi(date) {
  try {
    const d = new Date(date)
    return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short' }).format(d)
  } catch {
    return String(date || '')
  }
}

function fmtTimeVi(date) {
  try {
    const d = new Date(date)
    return new Intl.DateTimeFormat('vi-VN', { timeStyle: 'short' }).format(d)
  } catch {
    return ''
  }
}

function safe(value) {
  return String(value || '').trim()
}

export async function sendEmailBestEffort({ to, subject, html, text }) {
  const email = safe(to)
  if (!email) return { sent: false, skipped: true, reason: 'missing_to' }
  try {
    const service = new EmailService()
    return await service.send({ to: email, subject, html, text })
  } catch (err) {
    return { sent: false, failed: true, reason: err?.message || 'unknown_error' }
  }
}

export function buildBookingEmailForCustomer({ shopName, bookingCode, startTime, serviceName, staffName, depositAmount, createdAt }) {
  const when = fmtDateTimeVi(startTime)
  const date = fmtDateVi(startTime)
  const time = fmtTimeVi(startTime)
  const placed = fmtDateTimeVi(createdAt)
  const deposit = Number(depositAmount || 0).toLocaleString('vi-VN')
  const subject = `[LumiX] Xác nhận lịch hẹn ${bookingCode}`
  const text = [
    `Bạn đã đặt lịch thành công tại ${shopName}.`,
    `Mã booking: ${bookingCode}`,
    `Thời gian hẹn: ${when}`,
    `Thời gian đặt: ${placed}`,
    serviceName ? `Dịch vụ: ${serviceName}` : null,
    staffName ? `Nhân viên: ${staffName}` : null,
    `Tiền cọc: ${deposit}đ`,
    '',
    'Cảm ơn bạn đã sử dụng LumiX.'
  ]
    .filter(Boolean)
    .join('\n')

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.5">
      <h2 style="margin:0 0 8px">Xác nhận lịch hẹn</h2>
      <p style="margin:0 0 12px">Bạn đã đặt lịch thành công tại <b>${shopName}</b>.</p>
      <ul>
        <li><b>Mã booking:</b> ${bookingCode}</li>
        <li><b>Thời gian hẹn:</b> ${when}</li>
        <li><b>Thời gian đặt:</b> ${placed}</li>
        ${serviceName ? `<li><b>Dịch vụ:</b> ${serviceName}</li>` : ''}
        ${staffName ? `<li><b>Nhân viên:</b> ${staffName}</li>` : ''}
        <li><b>Tiền cọc:</b> ${deposit}đ</li>
      </ul>
      <p style="margin:12px 0 0">Cảm ơn bạn đã sử dụng LumiX.</p>
    </div>
  `
  return { subject, text, html }
}

export function buildBookingEmailForShop({ shopName, bookingCode, startTime, customerName, customerPhone, serviceName, staffName, createdAt }) {
  const when = fmtDateTimeVi(startTime)
  const date = fmtDateVi(startTime)
  const time = fmtTimeVi(startTime)
  const placed = fmtDateTimeVi(createdAt)
  const subject = `[LumiX] Booking mới ${bookingCode}`
  const text = [
    `Shop ${shopName} có booking mới.`,
    `Mã booking: ${bookingCode}`,
    `Thời gian hẹn: ${when}`,
    `Thời gian đặt: ${placed}`,
    customerName ? `Khách: ${customerName}` : null,
    customerPhone ? `SĐT: ${customerPhone}` : null,
    serviceName ? `Dịch vụ: ${serviceName}` : null,
    staffName ? `Nhân viên: ${staffName}` : null
  ]
    .filter(Boolean)
    .join('\n')
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.5">
      <h2 style="margin:0 0 8px">Booking mới</h2>
      <p style="margin:0 0 12px">Shop <b>${shopName}</b> có booking mới.</p>
      <ul>
        <li><b>Mã booking:</b> ${bookingCode}</li>
        <li><b>Thời gian hẹn:</b> ${when}</li>
        <li><b>Thời gian đặt:</b> ${placed}</li>
        ${customerName ? `<li><b>Khách:</b> ${customerName}</li>` : ''}
        ${customerPhone ? `<li><b>SĐT:</b> ${customerPhone}</li>` : ''}
        ${serviceName ? `<li><b>Dịch vụ:</b> ${serviceName}</li>` : ''}
        ${staffName ? `<li><b>Nhân viên:</b> ${staffName}</li>` : ''}
      </ul>
    </div>
  `
  return { subject, text, html }
}

export function buildBookingStatusEmailForCustomer({ shopName, bookingCode, startTime, statusLabel, createdAt }) {
  const when = fmtDateTimeVi(startTime)
  const date = fmtDateVi(startTime)
  const time = fmtTimeVi(startTime)
  const placed = fmtDateTimeVi(createdAt)
  const subject = `[LumiX] Cập nhật booking ${bookingCode}`
  const text = [`Booking ${bookingCode} tại ${shopName} đã chuyển trạng thái: ${statusLabel}.`, `Thời gian hẹn: ${when}`, `Thời gian đặt: ${placed}`].join('\n')
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.5">
      <h2 style="margin:0 0 8px">Cập nhật booking</h2>
      <p style="margin:0 0 12px">Booking <b>${bookingCode}</b> tại <b>${shopName}</b> đã chuyển trạng thái: <b>${statusLabel}</b>.</p>
      <p style="margin:0">Thời gian hẹn: ${when}</p>
      <p style="margin:0">Thời gian đặt: ${placed}</p>
    </div>
  `
  return { subject, text, html }
}

export function buildRefundStatusEmailForCustomer({ bookingCode, statusLabel }) {
  const subject = `[LumiX] Cập nhật hoàn tiền ${bookingCode}`
  const text = `Yêu cầu hoàn tiền của booking ${bookingCode} đã chuyển trạng thái: ${statusLabel}.`
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.5">
      <h2 style="margin:0 0 8px">Cập nhật hoàn tiền</h2>
      <p style="margin:0">Yêu cầu hoàn tiền của booking <b>${bookingCode}</b> đã chuyển trạng thái: <b>${statusLabel}</b>.</p>
    </div>
  `
  return { subject, text, html }
}

export function buildShopStatusEmailForShop({ shopName, statusLabel }) {
  const subject = `[LumiX] Cập nhật trạng thái shop`
  const text = `Shop ${shopName} đã chuyển trạng thái: ${statusLabel}.`
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.5">
      <h2 style="margin:0 0 8px">Cập nhật trạng thái shop</h2>
      <p style="margin:0">Shop <b>${shopName}</b> đã chuyển trạng thái: <b>${statusLabel}</b>.</p>
    </div>
  `
  return { subject, text, html }
}

