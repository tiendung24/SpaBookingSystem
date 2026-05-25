import 'dotenv/config'
import { connectDb, disconnectDb } from '../src/config/db.js'
import { Booking } from '../src/models/index.js'

async function main() {
  await connectDb()
  // Get last 10 bookings sorted by createdAt desc, group by phone to see duplicates
  const bookings = await Booking.find().sort({ createdAt: -1 }).limit(20).lean()
  
  const phoneGroups = {}
  bookings.forEach(b => {
    const phone = b.customerPhone || 'unknown'
    if (!phoneGroups[phone]) phoneGroups[phone] = []
    phoneGroups[phone].push({
      bookingCode: b.bookingCode,
      status: b.status,
      serviceId: b.serviceId,
      date: b.startTime ? new Date(b.startTime).toISOString().slice(0, 10) : 'unknown',
      time: b.startTime ? new Date(b.startTime).toISOString().slice(11, 16) : 'unknown',
      createdAt: b.createdAt
    })
  })
  
  console.log('Recent bookings grouped by phone:')
  Object.entries(phoneGroups).forEach(([phone, items]) => {
    console.log(`\n[${phone}] - ${items.length} booking(s)`)
    items.forEach((item, idx) => {
      console.log(`  ${idx + 1}. ${item.bookingCode} | ${item.status} | ${item.date} ${item.time} | ${new Date(item.createdAt).toLocaleString()}`)
    })
  })
  
  await disconnectDb()
  process.exit(0)
}

main().catch(err => { console.error('Error', err); process.exit(1) })
