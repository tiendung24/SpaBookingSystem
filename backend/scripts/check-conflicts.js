import 'dotenv/config'
import { connectDb, disconnectDb } from '../src/config/db.js'
import { Service, BookingSlotLock, Booking } from '../src/models/index.js'

async function main() {
  await connectDb()
  const serviceId = '6a145fefa26ecbcabc100e1b'
  const times = ['2026-05-26T09:00:00.000Z', '2026-05-26T10:00:00.000Z']

  const service = await Service.findById(serviceId).lean()
  if (!service) {
    console.error('Service not found', serviceId)
    await disconnectDb()
    process.exit(1)
  }
  const shopId = String(service.shopId)
  console.log('Service', { _id: serviceId, name: service.name, shopId })

  for (const t of times) {
    const startTime = new Date(t)
    const endTime = new Date(startTime.getTime() + (service.durationMinutes || 60) * 60000)
    console.log('\nChecking slot', startTime.toISOString())

    const locks = await BookingSlotLock.find({ shopId, startTime }).lean()
    console.log('  Locks:', locks.length)
    locks.forEach(l => console.log('   -', { _id: String(l._id), staffId: l.staffId, holdToken: l.holdToken, expiresAt: l.expiresAt }))

    const bookings = await Booking.find({ serviceId, startTime }).lean()
    console.log('  Bookings:', bookings.length)
    bookings.forEach(b => console.log('   -', { _id: String(b._id), bookingCode: b.bookingCode, staffId: b.staffId, status: b.status }))
  }

  await disconnectDb()
  process.exit(0)
}

main().catch(err => { console.error('Error', err); process.exit(1) })
