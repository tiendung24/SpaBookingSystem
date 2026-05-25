import 'dotenv/config'
import { connectDb, disconnectDb } from '../src/config/db.js'
import { BookingSlotLock, Booking, PayosPayment, Deposit } from '../src/models/index.js'

async function main() {
  await connectDb()
  // Clean up test bookings, locks, payments from tmp-payos-test-shop
  const shopId = '6a145fefa26ecbcabc100df1'
  const deleted = await Promise.all([
    BookingSlotLock.deleteMany({ shopId }),
    Booking.deleteMany({ shopId }),
    PayosPayment.deleteMany({ shopId }),
    Deposit.deleteMany({ shopId })
  ])
  console.log('Deleted:', { locks: deleted[0].deletedCount, bookings: deleted[1].deletedCount, payments: deleted[2].deletedCount, deposits: deleted[3].deletedCount })
  await disconnectDb()
  process.exit(0)
}

main().catch(err => { console.error('Error', err); process.exit(1) })
