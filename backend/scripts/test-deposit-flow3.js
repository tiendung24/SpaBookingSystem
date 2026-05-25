import 'dotenv/config'
import { connectDb, disconnectDb } from '../src/config/db.js'
import { Shop, Service, Booking, PayosPayment, Deposit } from '../src/models/index.js'
import { PayOSService } from '../src/services/payos.service.js'

async function calcDepositAmount(shop, service) {
  const cfg = shop?.depositConfig || {}
  if (!cfg.enabled) return 0
  const type = cfg.type || 'fixed'
  const value = Number(cfg.value || 0)
  if (value <= 0) return 0
  if (type === 'percent') {
    const total = Number(service?.price || 0)
    return Math.max(0, Math.round((total * value) / 100))
  }
  return Math.max(0, value)
}

async function main() {
  await connectDb()
  const shop = await Shop.findOne({ 'depositConfig.enabled': true }).lean()
  if (!shop) {
    console.error('No shop with deposit enabled found in DB')
    await disconnectDb()
    process.exit(1)
  }
  const service = await Service.findOne({ shopId: String(shop._id) }).lean()
  if (!service) {
    console.error('No service found for shop', shop.slug)
    await disconnectDb()
    process.exit(1)
  }

  console.log('Using shop', shop.slug, 'service', service._id)

  const depositAmount = await calcDepositAmount(shop, service)
  if (!depositAmount || depositAmount <= 0) {
    console.error('Shop deposit config exists but depositAmount resolved to 0')
    await disconnectDb()
    process.exit(1)
  }

  const bookingCode = `BTST_${Date.now()}`
  const now = new Date()
  const startTime = new Date(now.getTime() + 24 * 60 * 60 * 1000)
  const endTime = new Date(startTime.getTime() + (service.durationMinutes || 60) * 60 * 1000)

  const booking = await Booking.create({
    bookingCode,
    shopId: String(shop._id),
    customerId: '',
    customerName: 'Test User',
    customerPhone: '0900000000',
    serviceId: String(service._id),
    staffId: null,
    startTime,
    endTime,
    note: 'E2E deposit test',
    status: 'awaiting_deposit',
    depositAmount: Number(depositAmount || 0),
    totalAmount: Number(service.price || 0),
    createdAt: new Date(),
    updatedAt: new Date()
  })

  console.log('Created booking', { bookingCode, bookingId: String(booking._id), depositAmount })

  const payos = new PayOSService()
  try {
    const payment = await payos.createDepositPayment({ bookingCode, amount: depositAmount, description: `LUMIX_${bookingCode}` })
    console.log('PayOS response:', payment)

    await PayosPayment.create({
      bookingId: String(booking._id),
      shopId: String(shop._id),
      amount: payment.amount,
      orderCode: String(payment.payosOrderId || ''),
      status: payment.status,
      raw: payment,
      createdAt: new Date(),
      updatedAt: new Date()
    })

    await Deposit.create({
      bookingId: String(booking._id),
      shopId: String(shop._id),
      amount: Number(depositAmount || 0),
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    })

    console.log('PayOS payment recorded and Deposit created')
  } catch (err) {
    console.error('Error creating PayOS payment:', err && err.message)
  }

  await disconnectDb()
  process.exit(0)
}

main().catch((err) => {
  console.error('Script error', err)
  process.exit(1)
})
