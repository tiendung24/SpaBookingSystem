import 'dotenv/config'
import { connectDb, disconnectDb } from '../src/config/db.js'
import { Shop, ShopStaff, Service } from '../src/models/index.js'

async function main() {
  await connectDb()
  const slug = 'tmp-payos-test-shop'
  const shop = await Shop.findOne({ slug }).lean()
  if (!shop) {
    console.error('Shop not found', slug)
    await disconnectDb()
    process.exit(1)
  }
  const service = await Service.findOne({ shopId: String(shop._id) }).lean()
  const staff = await ShopStaff.create({
    shopId: String(shop._id),
    fullName: 'Test Staff',
    phone: '0123456789',
    role: 'therapist',
    status: 'active',
    serviceIds: [String(service._id)],
    createdAt: new Date(),
    updatedAt: new Date()
  })
  console.log('Created staff', { _id: String(staff._id), name: staff.fullName })
  await disconnectDb()
  process.exit(0)
}

main().catch(err => { console.error('Error', err); process.exit(1) })
