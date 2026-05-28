import { connectDb, disconnectDb } from '../src/config/db.js'
import { Shop, PayosPayment } from '../src/models/index.js'

async function run() {
  const slug = process.argv[2]
  if (!slug) {
    console.error('Usage: node list-payments.js <shop-slug>')
    process.exit(2)
  }
  await connectDb()
  try {
    const shop = await Shop.findOne({ slug }).lean()
    if (!shop) {
      console.error('Shop not found:', slug)
      process.exit(3)
    }
    const items = await PayosPayment.find({ shopId: String(shop._id) }).sort({ createdAt: -1 }).limit(50).lean()
    console.log(JSON.stringify(items, null, 2))
  } catch (err) {
    console.error('Error:', err)
    process.exit(4)
  } finally {
    await disconnectDb()
  }
}

run()
