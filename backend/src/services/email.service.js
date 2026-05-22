import nodemailer from 'nodemailer'
import { AuditLog } from '../models/index.js'

let transporterPromise = null

function buildTransporter() {
  const provider = process.env.EMAIL_PROVIDER || ''
  const host = process.env.EMAIL_SMTP_HOST || ''
  const port = Number(process.env.EMAIL_SMTP_PORT || 465)
  const secure = String(process.env.EMAIL_SMTP_SECURE || 'true').toLowerCase() === 'true'
  const user = process.env.EMAIL_SMTP_USER || ''
  const pass = process.env.EMAIL_API_KEY || ''

  if (provider !== 'smtp' || !host || !user || !pass) {
    return null
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass
    }
  })
}

async function getTransporter() {
  if (!transporterPromise) {
    const transporter = buildTransporter()
    transporterPromise = transporter ? Promise.resolve(transporter) : Promise.resolve(null)
  }
  return transporterPromise
}

export class EmailService {
  constructor() {
    this.provider = process.env.EMAIL_PROVIDER || ''
    this.from = process.env.EMAIL_FROM || ''
  }

  async send({ to, subject, html, text }) {
    const transporter = await getTransporter()

    if (!transporter || !this.from) {
      await AuditLog.create({
        actorUserId: '',
        action: 'email.skipped',
        entity: 'notification',
        entityId: '',
        meta: { to, subject, reason: 'missing_provider_config' },
        createdAt: new Date()
      })
      return {
        sent: false,
        skipped: true,
        provider: this.provider || 'none',
        reason: 'Email provider chưa cấu hình đầy đủ'
      }
    }

    try {
      const info = await transporter.sendMail({
        from: this.from,
        to,
        subject,
        text: text || '',
        html: html || text || ''
      })

      await AuditLog.create({
        actorUserId: '',
        action: 'email.sent',
        entity: 'notification',
        entityId: '',
        meta: {
          to,
          subject,
          provider: this.provider,
          messageId: info.messageId,
          accepted: info.accepted || []
        },
        createdAt: new Date()
      })

      return {
        sent: true,
        provider: this.provider,
        messageId: info.messageId,
        accepted: info.accepted || []
      }
    } catch (error) {
      await AuditLog.create({
        actorUserId: '',
        action: 'email.failed',
        entity: 'notification',
        entityId: '',
        meta: {
          to,
          subject,
          provider: this.provider,
          error: error?.message || 'unknown_error'
        },
        createdAt: new Date()
      })
      throw error
    }
  }
}

