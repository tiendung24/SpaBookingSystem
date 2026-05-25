import 'dotenv/config'
import { connectDb, disconnectDb } from '../src/config/db.js'
import { Service, BookingSlotLock } from '../src/models/index.js'
import { buildTimeOnDate } from '../src/utils/shop.js'

async function main() {
  await connectDb()
  const serviceId = '6a145fefa26ecbcabc100e1b'
  const service = await Service.findById(serviceId).lean()
  if (!service) throw new Error('service not found')
  const shopId = String(service.shopId)
  const startTime = buildTimeOnDate('2026-05-26', '09:00')
  const res = await BookingSlotLock.deleteMany({ shopId, startTime, lockType: 'temp_hold', bookingId: '' })
  console.log('Deleted', res.deletedCount, 'locks')
  await disconnectDb()
  process.exit(0)
}

main().catch(err => { console.error('Error', err); process.exit(1) })
