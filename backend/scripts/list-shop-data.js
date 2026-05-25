import 'dotenv/config'
import { connectDb, disconnectDb } from '../src/config/db.js'
import { Shop, Service, ShopStaff } from '../src/models/index.js'

async function main() {
  await connectDb()
  const slug = 'tmp-payos-test-shop'
  const shop = await Shop.findOne({ slug }).lean()
  if (!shop) {
    console.error('Shop not found for slug', slug)
    await disconnectDb()
    process.exit(1)
  }
  console.log('Shop:', { _id: String(shop._id), name: shop.name, slug: shop.slug })

  const services = await Service.find({ shopId: String(shop._id) }).lean()
  console.log('\nServices:')
  if (!services.length) console.log('  (no services)')
  services.forEach(s => console.log(`  id: ${s._id}  name: ${s.name}  price: ${s.price || 0}`))

  const staffs = await ShopStaff.find({ shopId: String(shop._id) }).lean()
  console.log('\nStaffs:')
  if (!staffs.length) console.log('  (no staffs)')
  staffs.forEach(st => console.log(`  id: ${st._id}  name: ${st.fullName || st.name || '(no name)'}  status: ${st.status || 'unknown'}`))

  await disconnectDb()
  process.exit(0)
}

main().catch(err => { console.error('Error', err); process.exit(1) })
