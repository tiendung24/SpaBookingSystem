import { connectDb, disconnectDb } from '../src/config/db.js'
import { Shop } from '../src/models/index.js'

async function run() {
  const slug = process.argv[2]
  if (!slug) {
    console.error('Usage: node unlock-shop.js <slug>')
    process.exit(2)
  }

  await connectDb()
  try {
    const shop = await Shop.findOne({ slug })
    if (!shop) {
      console.error('Shop not found:', slug)
      process.exit(3)
    }
    shop.status = 'active'
    shop.onlineBookingEnabled = true
    shop.updatedAt = new Date()
    await shop.save()
    console.log('Shop unlocked:', shop._id.toString(), shop.slug)
  } catch (err) {
    console.error('Error:', err)
    process.exit(4)
  } finally {
    await disconnectDb()
  }
}

run()
