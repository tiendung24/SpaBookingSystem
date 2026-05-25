import 'dotenv/config'
import { connectDb, disconnectDb } from '../src/config/db.js'
import { BookingSlotLock } from '../src/models/index.js'

async function main() {
  await connectDb()
  const holdToken = 'HLD_1779722739365_2506'
  const lock = await BookingSlotLock.findOne({ holdToken }).lean()
  if (!lock) {
    console.log('Lock not found for', holdToken)
  } else {
    console.log('Lock found:')
    console.log(JSON.stringify(lock, null, 2))
  }
  await disconnectDb()
  process.exit(0)
}

main().catch(err => { console.error('Error', err); process.exit(1) })
