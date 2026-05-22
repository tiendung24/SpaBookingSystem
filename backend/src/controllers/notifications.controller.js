import { httpError } from '../utils/httpError.js'
import { EmailService } from '../services/email.service.js'

export async function sendEmail(req, res) {
  const to = req.body?.to
  const subject = req.body?.subject
  const html = req.body?.html || req.body?.text || ''
  if (!to || !subject || !html) {
    throw httpError(400, 'Thiếu to, subject hoặc html/text')
  }

  const email = new EmailService()
  const result = await email.send({ to, subject, html, text: req.body?.text || '' })
  res.status(201).json(result)
}
