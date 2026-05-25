import 'dotenv/config'
import { connectDb, disconnectDb } from '../src/config/db.js'
import { Shop } from '../src/models/index.js'

async function main() {
  await connectDb()
  const shops = await Shop.find({}).sort({ createdAt: -1 }).limit(50).lean()
  console.log('Shops:')
  if (!shops.length) console.log('  (no shops)')
  shops.forEach(s => console.log(`  slug: ${s.slug}  name: ${s.name}  _id: ${s._id}`))
  await disconnectDb()
  process.exit(0)
}

main().catch(err => { console.error('Error', err); process.exit(1) })
