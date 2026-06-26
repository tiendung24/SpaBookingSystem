import { EmailService } from '../services/email.service.js'

function logEmailEvent(level, event, meta = {}) {
  try {
    const safe = {
      event,
      to: meta.to,
      subject: meta.subject,
      provider: meta.provider,
      reason: meta.reason,
      messageId: meta.messageId,
      accepted: meta.accepted,
      bookingCode: meta.bookingCode,
      refundId: meta.refundId,
      shopId: meta.shopId
    }
    const msg = `[email] ${event}`
    if (level === 'error') console.error(msg, safe)
    else if (level === 'warn') console.warn(msg, safe)
    else console.log(msg, safe)
  } catch {
    // ignore
  }
}

const VIETNAM_TZ = 'Asia/Ho_Chi_Minh'

function fmtDateTimeVi(date) {
  try {
    const d = new Date(date)
    return new Intl.DateTimeFormat('vi-VN', {
      timeZone: VIETNAM_TZ,
      dateStyle: 'short',
      timeStyle: 'short',
      hour12: false
    }).format(d)
  } catch {
    return String(date || '')
  }
}

function fmtDateVi(date) {
  try {
    const d = new Date(date)
    return new Intl.DateTimeFormat('vi-VN', { timeZone: VIETNAM_TZ, dateStyle: 'short' }).format(d)
  } catch {
    return String(date || '')
  }
}

function fmtTimeVi(date) {
  try {
    const d = new Date(date)
    return new Intl.DateTimeFormat('vi-VN', { timeZone: VIETNAM_TZ, timeStyle: 'short', hour12: false }).format(d)
  } catch {
    return ''
  }
}

function formatVnd(amount) {
  return `${Number(amount || 0).toLocaleString('vi-VN')}đ`
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function safe(value) {
  return String(value || '').trim()
}

function renderEmailLayout({
  title,
  subtitle,
  badgeText,
  badgeTone = 'primary',
  preheader,
  bodyHtml,
  ctaLabel,
  ctaUrl,
  footerNote
}) {
  const badgeBg = badgeTone === 'success' ? '#dcfce7' : badgeTone === 'warning' ? '#ffedd5' : badgeTone === 'danger' ? '#fee2e2' : '#dbeafe'
  const badgeTextColor = badgeTone === 'success' ? '#166534' : badgeTone === 'warning' ? '#9a3412' : badgeTone === 'danger' ? '#991b1b' : '#1d4ed8'

  const safePreheader = escapeHtml(preheader || '')
  const safeTitle = escapeHtml(title || '')
  const safeSubtitle = escapeHtml(subtitle || '')
  const safeBadge = escapeHtml(badgeText || '')

  const ctaBlock = ctaUrl
    ? `
      <tr>
        <td style="padding: 16px 0 0 0;">
          <a href="${escapeHtml(ctaUrl)}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:12px 16px;border-radius:12px;font-weight:700;font-size:14px;">${escapeHtml(ctaLabel || 'Xem chi tiết')}</a>
        </td>
      </tr>
      <tr>
        <td style="padding: 10px 0 0 0;font-size:12px;color:#64748b;">
          Nếu nút không hoạt động, copy link: <span style="word-break:break-all;color:#0f172a">${escapeHtml(ctaUrl)}</span>
        </td>
      </tr>
    `
    : ''

  return `
  <!doctype html>
  <html lang="vi">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width,initial-scale=1" />
      <meta name="x-apple-disable-message-reformatting" />
      <title>${safeTitle}</title>
    </head>
    <body style="margin:0;padding:0;background:#f8fafc;">
      <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${safePreheader}</div>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f8fafc;">
        <tr>
          <td align="center" style="padding:24px 12px;">
            <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="width:600px;max-width:600px;">
              <tr>
                <td style="padding:6px 6px 14px 6px;">
                  <div style="font-family:Arial,Helvetica,sans-serif;font-size:18px;font-weight:800;color:#0f172a;">
                    LumiX
                  </div>
                </td>
              </tr>

              <tr>
                <td style="background:#ffffff;border:1px solid #e2e8f0;border-radius:18px;padding:20px 20px 18px 20px;">
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                    <tr>
                      <td>
                        ${badgeText ? `<span style="display:inline-block;padding:6px 10px;border-radius:999px;background:${badgeBg};color:${badgeTextColor};font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:700;">${safeBadge}</span>` : ''}
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:10px 0 0 0;font-family:Arial,Helvetica,sans-serif;font-size:20px;line-height:1.25;font-weight:800;color:#0f172a;">${safeTitle}</td>
                    </tr>
                    ${subtitle ? `<tr><td style="padding:6px 0 0 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.45;color:#334155;">${safeSubtitle}</td></tr>` : ''}
                    <tr>
                      <td style="padding:14px 0 0 0;">
                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;">
                          <tr>
                            <td style="padding:14px 14px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.55;color:#0f172a;">
                              ${bodyHtml || ''}
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    ${ctaBlock}
                  </table>
                </td>
              </tr>

              <tr>
                <td style="padding:14px 6px 0 6px;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.45;color:#64748b;">
                  ${escapeHtml(footerNote || 'Bạn nhận được email này vì có thao tác trên LumiX. Nếu có vấn đề, hãy liên hệ shop hoặc phản hồi email này.')}
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>
  `.trim()
}

export async function sendEmailBestEffort({ to, subject, html, text, meta }) {
  const email = safe(to)
  if (!email) return { sent: false, skipped: true, reason: 'missing_to' }
  try {
    const service = new EmailService()
    const result = await service.send({ to: email, subject, html, text })
    logEmailEvent(result?.sent ? 'info' : (result?.skipped ? 'warn' : 'warn'), result?.sent ? 'sent' : (result?.skipped ? 'skipped' : 'not_sent'), { to: email, subject, provider: result?.provider, reason: result?.reason, messageId: result?.messageId, accepted: result?.accepted, ...(meta || {}) })
    return result
  } catch (err) {
    const reason = err?.message || 'unknown_error'
    logEmailEvent('error', 'failed', { to: email, subject, reason, ...(meta || {}) })
    return { sent: false, failed: true, reason }
  }
}

export function buildBookingEmailForCustomer({ shopName, bookingCode, startTime, serviceName, staffName, depositAmount, createdAt }) {
  const when = fmtDateTimeVi(startTime)
  const placed = fmtDateTimeVi(createdAt)
  const deposit = formatVnd(depositAmount)

  const subject = `[LumiX] Xác nhận lịch hẹn ${bookingCode}`
  const text = [
    `Bạn đã đặt lịch thành công tại ${shopName}.`,
    `Mã booking: ${bookingCode}`,
    `Thời gian hẹn: ${when}`,
    `Thời gian đặt: ${placed}`,
    serviceName ? `Dịch vụ: ${serviceName}` : null,
    staffName ? `Nhân viên: ${staffName}` : null,
    `Tiền cọc: ${deposit}`
  ].filter(Boolean).join('\n')

  const bodyHtml = `
    <div style="margin:0 0 10px 0;">Bạn đã đặt lịch thành công tại <b>${escapeHtml(shopName)}</b>.</div>
    <div style="margin:0;">
      <div><b>Mã booking:</b> ${escapeHtml(bookingCode)}</div>
      <div><b>Thời gian hẹn:</b> ${escapeHtml(when)}</div>
      <div><b>Thời gian đặt:</b> ${escapeHtml(placed)}</div>
      ${serviceName ? `<div><b>Dịch vụ:</b> ${escapeHtml(serviceName)}</div>` : ''}
      ${staffName ? `<div><b>Nhân viên:</b> ${escapeHtml(staffName)}</div>` : ''}
      <div><b>Tiền cọc:</b> ${escapeHtml(deposit)}</div>
    </div>
  `.trim()

  const html = renderEmailLayout({
    title: 'Xác nhận lịch hẹn',
    subtitle: `Booking ${bookingCode}`,
    badgeText: 'Đặt lịch thành công',
    badgeTone: 'success',
    preheader: `Xác nhận lịch hẹn ${bookingCode} - ${when}`,
    bodyHtml,
    footerNote: 'Cảm ơn bạn đã sử dụng LumiX.'
  })

  return { subject, text, html }
}

export function buildBookingEmailForShop({ shopName, bookingCode, startTime, customerName, customerPhone, serviceName, staffName, createdAt }) {
  const when = fmtDateTimeVi(startTime)
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
  ].filter(Boolean).join('\n')

  const bodyHtml = `
    <div style="margin:0 0 10px 0;"><b>${escapeHtml(shopName)}</b> có booking mới.</div>
    <div>
      <div><b>Mã booking:</b> ${escapeHtml(bookingCode)}</div>
      <div><b>Thời gian hẹn:</b> ${escapeHtml(when)}</div>
      <div><b>Thời gian đặt:</b> ${escapeHtml(placed)}</div>
      ${customerName ? `<div><b>Khách:</b> ${escapeHtml(customerName)}</div>` : ''}
      ${customerPhone ? `<div><b>SĐT:</b> ${escapeHtml(customerPhone)}</div>` : ''}
      ${serviceName ? `<div><b>Dịch vụ:</b> ${escapeHtml(serviceName)}</div>` : ''}
      ${staffName ? `<div><b>Nhân viên:</b> ${escapeHtml(staffName)}</div>` : ''}
    </div>
  `.trim()

  const html = renderEmailLayout({
    title: 'Bạn có booking mới',
    subtitle: `Booking ${bookingCode}`,
    badgeText: 'Booking mới',
    badgeTone: 'primary',
    preheader: `Booking mới ${bookingCode} - ${when}`,
    bodyHtml
  })

  return { subject, text, html }
}


export function buildBookingStatusEmailForCustomer({ shopName, bookingCode, startTime, statusLabel, createdAt }) {
  const when = fmtDateTimeVi(startTime)
  const placed = fmtDateTimeVi(createdAt)
  const subject = `[LumiX] Cập nhật booking ${bookingCode}`
  const text = [`Booking ${bookingCode} tại ${shopName} đã chuyển trạng thái: ${statusLabel}.`, `Thời gian hẹn: ${when}`, `Thời gian đặt: ${placed}`].join('\n')
  const bodyHtml = `
    <div>Booking <b>${escapeHtml(bookingCode)}</b> tại <b>${escapeHtml(shopName)}</b> đã chuyển trạng thái: <b>${escapeHtml(statusLabel)}</b>.</div>
    <div style="margin-top:10px"><b>Thời gian hẹn:</b> ${escapeHtml(when)}</div>
    <div><b>Thời gian đặt:</b> ${escapeHtml(placed)}</div>
  `.trim()
  const html = renderEmailLayout({
    title: 'Cập nhật booking',
    subtitle: `Booking ${bookingCode}`,
    badgeText: statusLabel || 'Cập nhật',
    badgeTone: 'primary',
    preheader: `Booking ${bookingCode} đã cập nhật trạng thái`,
    bodyHtml
  })
  return { subject, text, html }
}

export function buildRefundStatusEmailForCustomer({ bookingCode, statusLabel }) {
  const subject = `[LumiX] Cập nhật hoàn tiền ${bookingCode}`
  const text = `Yêu cầu hoàn tiền của booking ${bookingCode} đã chuyển trạng thái: ${statusLabel}.`
  const bodyHtml = `Yêu cầu hoàn tiền của booking <b>${escapeHtml(bookingCode)}</b> đã chuyển trạng thái: <b>${escapeHtml(statusLabel)}</b>.`
  const html = renderEmailLayout({
    title: 'Cập nhật hoàn tiền',
    subtitle: `Booking ${bookingCode}`,
    badgeText: statusLabel || 'Hoàn tiền',
    badgeTone: 'success',
    preheader: `Cập nhật hoàn tiền ${bookingCode}`,
    bodyHtml
  })
  return { subject, text, html }
}

export function buildShopStatusEmailForShop({ shopName, statusLabel }) {
  const subject = '[LumiX] Cập nhật trạng thái shop'
  const text = `Shop ${shopName} đã chuyển trạng thái: ${statusLabel}.`
  const bodyHtml = `Shop <b>${escapeHtml(shopName)}</b> đã chuyển trạng thái: <b>${escapeHtml(statusLabel)}</b>.`
  const html = renderEmailLayout({
    title: 'Cập nhật trạng thái shop',
    subtitle: shopName || 'LumiX Partner',
    badgeText: statusLabel || 'Cập nhật',
    badgeTone: statusLabel === 'active' ? 'success' : 'warning',
    preheader: `Shop ${shopName} đã cập nhật trạng thái`,
    bodyHtml
  })
  return { subject, text, html }
}

export function buildRefundInfoRequestEmailForCustomer({ shopName, bookingCode, startTime, amount, refundUrl, expiresAt }) {
  const when = fmtDateTimeVi(startTime)
  const amountText = formatVnd(amount)
  const expiresText = expiresAt ? fmtDateTimeVi(expiresAt) : ''

  const subject = `[LumiX] Nhập thông tin nhận hoàn cọc ${bookingCode}`
  const text = [
    `Cửa hàng ${shopName || ''} đã hủy lịch hẹn ${bookingCode}.`,
    `Thời gian hẹn: ${when}`,
    `Số tiền cọc dự kiến hoàn: ${amountText}`,
    `Vui lòng nhập thông tin ngân hàng để LumiX hoàn tiền: ${refundUrl}`,
    expiresText ? `Link có hiệu lực đến: ${expiresText}` : null
  ].filter(Boolean).join('\n')

  const bodyHtml = `
    <div style="margin:0 0 10px 0;">Cửa hàng <b>${escapeHtml(shopName || '')}</b> đã hủy lịch hẹn <b>${escapeHtml(bookingCode)}</b>.</div>
    <div>
      <div><b>Thời gian hẹn:</b> ${escapeHtml(when)}</div>
      <div><b>Số tiền cọc dự kiến hoàn:</b> ${escapeHtml(amountText)}</div>
      ${expiresText ? `<div><b>Hiệu lực đến:</b> ${escapeHtml(expiresText)}</div>` : ''}
    </div>
    <div style="margin:12px 0 0 0;">Vui lòng bấm nút bên dưới để nhập thông tin ngân hàng nhận hoàn tiền.</div>
  `.trim()

  const html = renderEmailLayout({
    title: 'Nhập thông tin nhận hoàn cọc',
    subtitle: `Booking ${bookingCode}`,
    badgeText: 'Cần thông tin hoàn tiền',
    badgeTone: 'warning',
    preheader: `Nhập thông tin hoàn cọc ${bookingCode}`,
    bodyHtml,
    ctaLabel: 'Nhập thông tin nhận hoàn tiền',
    ctaUrl: refundUrl,
    footerNote: 'Nếu bạn không yêu cầu hoàn cọc, có thể bỏ qua email này.'
  })

  return { subject, text, html }
}

export function buildResetPasswordEmail({ resetUrl, expiresAt }) {
  const expiresText = expiresAt.toLocaleString('vi-VN', { timeZone: VIETNAM_TZ, hour12: false })
  const subject = '[LumiX] Đặt lại mật khẩu'
  const text = `Bạn vừa yêu cầu đặt lại mật khẩu. Truy cập link sau để tiếp tục: ${resetUrl} (hết hạn lúc ${expiresText})`

  const bodyHtml = `
    <div style="margin:0 0 10px 0;">Bạn vừa yêu cầu đặt lại mật khẩu LumiX.</div>
    <div><b>Hết hạn lúc:</b> ${escapeHtml(expiresText)}</div>
    <div style="margin:12px 0 0 0;">Bấm nút bên dưới để đặt lại mật khẩu.</div>
  `.trim()

  const html = renderEmailLayout({
    title: 'Đặt lại mật khẩu',
    subtitle: 'Yêu cầu bảo mật',
    badgeText: 'Reset mật khẩu',
    badgeTone: 'primary',
    preheader: 'Link đặt lại mật khẩu LumiX',
    bodyHtml,
    ctaLabel: 'Đặt lại mật khẩu',
    ctaUrl: resetUrl,
    footerNote: 'Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.'
  })

  return { subject, text, html }
}
export function buildWithdrawalRequestEmailForAdmin({ shopName, shopPhone, amount, bankInfo, adminUrl }) {
  const amountText = formatVnd(amount)
  const subject = `[LumiX] Yêu cầu rút tiền mới từ ${shopName}`
  const text = [
    `Shop ${shopName} (${shopPhone}) vừa gửi yêu cầu rút số tiền ${amountText}.`,
    `Ngân hàng: ${bankInfo.bankName}`,
    `Số tài khoản: ${bankInfo.accountNumber}`,
    `Chủ tài khoản: ${bankInfo.accountName}`,
    `Vui lòng đăng nhập hệ thống admin để kiểm tra và xử lý.`
  ].join('\n')

  const bodyHtml = `
    <p>Hệ thống vừa ghi nhận một yêu cầu rút tiền từ đối tác.</p>
    <table style="width:100%; border-collapse: collapse; margin-top: 16px;">
      <tr>
        <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color:#64748b;">Shop</td>
        <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-weight:bold; text-align:right;">${escapeHtml(shopName)}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color:#64748b;">Số điện thoại</td>
        <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-weight:bold; text-align:right;">${escapeHtml(shopPhone || '')}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color:#64748b;">Số tiền</td>
        <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-weight:bold; text-align:right; color:#2563eb; font-size:16px;">${escapeHtml(amountText)}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color:#64748b;">Ngân hàng</td>
        <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-weight:bold; text-align:right;">${escapeHtml(bankInfo.bankName)}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color:#64748b;">Số tài khoản</td>
        <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-weight:bold; text-align:right;">${escapeHtml(bankInfo.accountNumber)}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color:#64748b;">Chủ tài khoản</td>
        <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-weight:bold; text-align:right;">${escapeHtml(bankInfo.accountName)}</td>
      </tr>
    </table>
  `
  const html = renderEmailLayout({
    title: 'Yêu cầu rút tiền',
    subtitle: 'Hệ thống đối soát',
    badgeText: 'Mới',
    badgeTone: 'warning',
    preheader: `Yêu cầu rút ${amountText} từ ${shopName}`,
    bodyHtml,
    ctaLabel: 'Kiểm tra giao dịch',
    ctaUrl: adminUrl
  })

  return { subject, text, html }
}

export const _emailFormatters = { fmtDateTimeVi, fmtDateVi, fmtTimeVi }
export const _emailTemplate = { renderEmailLayout }
