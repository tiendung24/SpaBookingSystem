import nodemailer from 'nodemailer'
import { AuditLog } from '../models/index.js'

let smtpTransporterPromise = null

function getEnv(...keys) {
  for (const key of keys) {
    const value = process.env[key]
    if (value !== undefined && value !== null && String(value).trim() !== '') return String(value)
  }
  return ''
}

function buildSmtpTransporter() {
  const host = getEnv('EMAIL_SMTP_HOST', 'SMTP_HOST')
  const port = Number(getEnv('EMAIL_SMTP_PORT', 'SMTP_PORT') || 465)
  const secure = String(getEnv('EMAIL_SMTP_SECURE', 'SMTP_SECURE') || 'true').toLowerCase() === 'true'
  const user = getEnv('EMAIL_SMTP_USER', 'SMTP_USER')
  const pass = getEnv('EMAIL_API_KEY', 'EMAIL_SMTP_PASS', 'SMTP_PASS')

  if (!host || !user || !pass) return null

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000
  })
}

async function getSmtpTransporter() {
  if (!smtpTransporterPromise) {
    const transporter = buildSmtpTransporter()
    smtpTransporterPromise = transporter ? Promise.resolve(transporter) : Promise.resolve(null)
  }
  return smtpTransporterPromise
}

async function writeAudit(payload) {
  try {
    await AuditLog.create(payload)
  } catch {
    // ignore audit failures
  }
}

async function sendViaSmtp({ from, to, subject, html, text }) {
  const transporter = await getSmtpTransporter()
  if (!transporter) {
    return { sent: false, skipped: true, provider: 'smtp', reason: 'missing_provider_config' }
  }

  const info = await transporter.sendMail({
    from,
    to,
    subject,
    text: text || '',
    html: html || text || ''
  })

  return {
    sent: true,
    provider: 'smtp',
    messageId: info?.messageId,
    accepted: info?.accepted || []
  }
}

async function sendViaResend({ from, to, subject, html, text }) {
  const apiKey = getEnv('RESEND_API_KEY', 'EMAIL_API_KEY')
  if (!apiKey) {
    return { sent: false, skipped: true, provider: 'resend', reason: 'missing_provider_config' }
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 15000)

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject,
        text: text || '',
        html: html || text || ''
      }),
      signal: controller.signal
    })

    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
      const message = data?.message || data?.error || `HTTP ${response.status}`
      throw new Error(`Resend API error: ${message}`)
    }

    return {
      sent: true,
      provider: 'resend',
      messageId: data?.id || ''
    }
  } finally {
    clearTimeout(timeoutId)
  }
}

export class EmailService {
  constructor() {
    this.provider = String(getEnv('EMAIL_PROVIDER') || '').toLowerCase()
    this.from = getEnv('EMAIL_FROM', 'MAIL_FROM')
  }

  async send({ to, subject, html, text }) {
    if (!this.from) {
      const result = { sent: false, skipped: true, provider: this.provider || 'none', reason: 'missing_from' }
      try { console.warn('[EmailService] skipped', { to, subject, provider: this.provider || 'none', reason: result.reason }) } catch {}
      await writeAudit({ actorUserId: '', action: 'email.skipped', entity: 'notification', entityId: '', meta: { to, subject, provider: this.provider || 'none', reason: result.reason }, createdAt: new Date() })
      return result
    }

    try {
      let result = null
      if (this.provider === 'resend') {
        result = await sendViaResend({ from: this.from, to, subject, html, text })
      } else if (this.provider === 'smtp') {
        result = await sendViaSmtp({ from: this.from, to, subject, html, text })
      } else {
        result = { sent: false, skipped: true, provider: this.provider || 'none', reason: 'unsupported_provider' }
      }

      const level = result?.sent ? 'log' : 'warn'
      try {
        console[level]('[EmailService] result', {
          to,
          subject,
          provider: result?.provider || this.provider || 'none',
          sent: Boolean(result?.sent),
          skipped: Boolean(result?.skipped),
          reason: result?.reason || '',
          messageId: result?.messageId || '',
          accepted: result?.accepted || []
        })
      } catch {}

      await writeAudit({
        actorUserId: '',
        action: result?.sent ? 'email.sent' : 'email.skipped',
        entity: 'notification',
        entityId: '',
        meta: {
          to,
          subject,
          provider: result?.provider || this.provider || 'none',
          reason: result?.reason || '',
          messageId: result?.messageId || '',
          accepted: result?.accepted || []
        },
        createdAt: new Date()
      })

      return result
    } catch (error) {
      const reason = error?.message || 'unknown_error'
      try { console.error('[EmailService] failed', { to, subject, provider: this.provider || 'none', error: reason }) } catch {}
      await writeAudit({
        actorUserId: '',
        action: 'email.failed',
        entity: 'notification',
        entityId: '',
        meta: { to, subject, provider: this.provider || 'none', error: reason },
        createdAt: new Date()
      })
      throw error
    }
  }
}
