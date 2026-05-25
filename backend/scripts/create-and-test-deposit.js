import 'dotenv/config'
import { connectDb, disconnectDb } from '../src/config/db.js'
import { Shop, Service, Booking, PayosPayment, Deposit } from '../src/models/index.js'
import { PayOSService } from '../src/services/payos.service.js'

async function ensureShopAndService() {
  const slug = 'tmp-payos-test-shop'
  let shop = await Shop.findOne({ slug }).lean()
  if (!shop) {
    const now = new Date()
    const shopDoc = await Shop.create({
      name: 'TMP PayOS Test Shop',
      slug,
      status: 'active',
      depositConfig: { enabled: true, type: 'fixed', value: 100 },
      hours: { open: '09:00', close: '20:00', slotDuration: 60, capacity: 1 },
      createdAt: now,
      updatedAt: now
    })
    shop = shopDoc
    console.log('Created temp shop', slug)
  } else {
    console.log('Found existing temp shop', slug)
    if (!shop.depositConfig || !shop.depositConfig.enabled) {
      await Shop.findByIdAndUpdate(shop._id, { depositConfig: { enabled: true, type: 'fixed', value: 100 }, updatedAt: new Date() })
      console.log('Enabled depositConfig on existing shop')
      shop = await Shop.findById(shop._id).lean()
    }
  }

  let service = await Service.findOne({ shopId: String(shop._id) }).lean()
  if (!service) {
    const svc = await Service.create({
      shopId: String(shop._id),
      name: 'TMP Service',
      price: 500,
      durationMinutes: 60,
      visible: true,
      createdAt: new Date(),
      updatedAt: new Date()
    })
    service = svc
    console.log('Created temp service for shop')
  } else {
    console.log('Found existing service for temp shop')
  }

  return { shop, service }
}

async function main() {
  await connectDb()
  const { shop, service } = await ensureShopAndService()
  const depositAmount = service && shop ? (shop.depositConfig && shop.depositConfig.enabled ? (shop.depositConfig.type === 'percent' ? Math.max(0, Math.round((Number(service.price||0) * Number(shop.depositConfig.value||0)) / 100)) : Number(shop.depositConfig.value||0)) : 0) : 0
  if (!depositAmount || depositAmount <= 0) {
    console.error('Computed depositAmount is 0, aborting')
    await disconnectDb()
    process.exit(1)
  }

  const bookingCode = `TMPBT_${Date.now()}`
  const now = new Date()
  const startTime = new Date(now.getTime() + 24 * 60 * 60 * 1000)
  const endTime = new Date(startTime.getTime() + (service.durationMinutes || 60) * 60 * 1000)

  const booking = await Booking.create({
    bookingCode,
    shopId: String(shop._id),
    customerId: '',
    customerName: 'TMP Test',
    customerPhone: '0900000000',
    serviceId: String(service._id),
    staffId: null,
    startTime,
    endTime,
    note: 'TMP deposit test',
    status: 'awaiting_deposit',
    depositAmount: Number(depositAmount || 0),
    totalAmount: Number(service.price || 0),
    createdAt: new Date(),
    updatedAt: new Date()
  })

  console.log('Created booking', { bookingCode, bookingId: String(booking._id), depositAmount })

  const payos = new PayOSService()
  try {
    let payment
    if (!process.env.PAYOS_CLIENT_ID || !process.env.PAYOS_API_KEY || !process.env.PAYOS_CHECKSUM_KEY) {
      // Dev fallback when PayOS env is not configured: simulate response
      payment = {
        amount: depositAmount,
        checkoutUrl: `https://payos.test/checkout/${bookingCode}`,
        orderCode: `SIM_${Date.now()}`,
        payosOrderId: `SIM_${Date.now()}`,
        status: 'pending',
        qrCode: null,
        raw: { simulated: true }
      }
      console.log('[SIMULATED] PayOS response:', payment)
    } else {
      payment = await payos.createDepositPayment({ bookingCode, amount: depositAmount, description: `LUMIX_${bookingCode}` })
      console.log('PayOS response:', payment)
    }

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
