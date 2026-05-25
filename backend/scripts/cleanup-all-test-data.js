import 'dotenv/config'
import { connectDb, disconnectDb } from '../src/config/db.js'
import { Booking, BookingSlotLock, Deposit, PayosPayment } from '../src/models/index.js'

async function main() {
  await connectDb()
  
  // Delete all test bookings for phone +84911111111
  const result = await Booking.deleteMany({ customerPhone: '+84911111111' })
  console.log(`Deleted ${result.deletedCount} bookings for +84911111111`)
  
  // Also delete related locks, deposits, payments
  const locks = await BookingSlotLock.deleteMany({})
  console.log(`Deleted ${locks.deletedCount} booking slot locks`)
  
  const deposits = await Deposit.deleteMany({})
  console.log(`Deleted ${deposits.deletedCount} deposits`)
  
  const payments = await PayosPayment.deleteMany({})
  console.log(`Deleted ${payments.deletedCount} payos payments`)
  
  await disconnectDb()
  process.exit(0)
}

main().catch(err => { console.error('Error', err); process.exit(1) })
