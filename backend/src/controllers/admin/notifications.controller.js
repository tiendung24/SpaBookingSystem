import { Notification, Shop } from '../../models/index.js'
import { EmailService } from '../../services/email.service.js'

export async function getNotifications(req, res) {
  const items = await Notification.find({ userId: req.auth.userId }).sort({ createdAt: -1 }).lean()
  res.json({ items })
}

export async function sendNotification(req, res) {
  const { shopId, title, content, type, channels = [] } = req.body || {}
  let targetShops = []
  if (shopId) {
    targetShops = [shopId]
  } else {
    const shops = await Shop.find().select({ _id: 1 }).lean()
    targetShops = shops.map((s) => String(s._id))
  }

  const now = new Date()
  const docs = targetShops.map((targetShopId) => ({
    userId: '',
    shopId: targetShopId,
    type: type || 'admin_broadcast',
    title: title || 'Thông báo hệ thống',
    content: content || '',
    createdAt: now
  }))

  const created = await Notification.insertMany(docs)

  const emailService = new EmailService()
  const channelResults = []

  if (channels.includes('email')) {
    channelResults.push(
      await emailService.send({
        to: req.body?.email || '',
        subject: title || 'Thông báo LumiX',
        html: content || ''
      })
    )
  }
  res.status(201).json({ sent: true, count: created.length, channelResults })
}
