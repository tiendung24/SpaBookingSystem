import 'dotenv/config'
import { connectDb, disconnectDb } from '../src/config/db.js'
import { Booking, BookingSlotLock, Deposit, PayosPayment, Service, Shop, ShopStaff } from '../src/models/index.js'
import { PayOSService } from '../src/services/payos.service.js'
import { ensureCustomer, buildTimeOnDate } from '../src/utils/shop.js'
import fs from 'fs/promises'

async function main() {
  await connectDb()
  const slug = 'tmp-payos-test-shop'
  const payloadText = await fs.readFile(new URL('./booking-payload.json', import.meta.url), 'utf-8')
  const payload = JSON.parse(payloadText)

  const shop = await Shop.findOne({ slug }).lean()
  if (!shop) throw new Error('shop not found')

  const service = await Service.findById(payload.serviceId).lean()
  if (!service) throw new Error('service not found')

  const customer = await ensureCustomer({ name: payload.customerName, phone: payload.phone })
  const duration = Number(service.durationMinutes || 60)
  const startTime = buildTimeOnDate(payload.date, payload.time)
  const endTime = new Date(startTime.getTime() + duration * 60 * 1000)

  const now = new Date()
  const holdLock = payload.holdToken
    ? await BookingSlotLock.findOne({ holdToken: payload.holdToken, shopId: String(shop._id), lockType: 'temp_hold', expiresAt: { $gt: now } }).lean()
    : null

  if (payload.holdToken && !holdLock) throw new Error('hold lock not found or expired')

  if (holdLock) {
    const lockStart = new Date(holdLock.startTime).getTime()
    const lockEnd = new Date(holdLock.endTime).getTime()
    if (lockStart !== startTime.getTime() || lockEnd !== endTime.getTime()) throw new Error('hold lock times do not match')
  }

  // create booking
  const bookingCode = `BK${Math.floor(Math.random() * 900000 + 100000)}`
  const bookingDoc = {
    bookingCode,
    shopId: String(shop._id),
    customerId: String(customer._id),
    customerName: payload.customerName,
    customerPhone: String(payload.phone).replace(/\s+/g, ''),
    customerEmail: payload.email ? String(payload.email).toLowerCase() : undefined,
    serviceId: payload.serviceId,
    staffId: holdLock ? String(holdLock.staffId) : null,
    startTime,
    endTime,
    note: payload.note || '',
    status: 'awaiting_deposit',
    depositAmount: 0,
    totalAmount: Number(service.price || 0),
    createdAt: new Date(),
    updatedAt: new Date()
  }

  // calculate deposit
  const cfg = shop?.depositConfig || {}
  let depositAmount = 0
  if (cfg.enabled) {
    const type = cfg.type || 'fixed'
    const value = Number(cfg.value || 0)
    if (value > 0) {
      if (type === 'percent') depositAmount = Math.max(0, Math.round((Number(service.price || 0) * value) / 100))
      else depositAmount = Math.max(0, value)
    }
  }
  bookingDoc.depositAmount = depositAmount
  if (depositAmount <= 0) bookingDoc.status = 'pending'

  const booking = await Booking.create(bookingDoc)

  // update lock
  if (holdLock) {
    await BookingSlotLock.updateOne({ _id: holdLock._id }, { $set: { bookingId: String(booking._id), lockType: 'booking', holdToken: '', expiresAt: null } })
  } else {
    await BookingSlotLock.create({ shopId: String(shop._id), staffId: String(booking.staffId), startTime, endTime, bookingId: String(booking._id), lockType: 'booking', createdAt: new Date() })
  }

  let payment = null
  if (depositAmount > 0) {
    const payos = new PayOSService()
    payment = await payos.createDepositPayment({ bookingCode, amount: Number(depositAmount), description: `LUMIX_${bookingCode}` })
    await PayosPayment.create({ bookingId: String(booking._id), shopId: String(shop._id), amount: payment.amount, orderCode: String(payment.payosOrderId || ''), status: payment.status, raw: payment, createdAt: new Date(), updatedAt: new Date() })
    await Deposit.create({ bookingId: String(booking._id), shopId: String(shop._id), amount: Number(depositAmount), status: 'pending', createdAt: new Date(), updatedAt: new Date() })
  }

  console.log('Booking created:', { bookingId: String(booking._id), bookingCode, payment })

  await disconnectDb()
  process.exit(0)
}

main().catch(err => { console.error('Error', err && err.message || err); process.exit(1) })
