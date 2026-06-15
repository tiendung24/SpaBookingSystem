import 'dotenv/config'
import dotenv from 'dotenv'
import mongoose from 'mongoose'

dotenv.config({ path: new URL('../.env', import.meta.url) })

const TARGET_TEXT = 'thu kim'
const normalize = (value) => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
const toObjectIds = (ids) => ids.filter((id) => /^[a-f0-9]{24}$/i.test(String(id))).map((id) => new mongoose.Types.ObjectId(String(id)))

async function connect() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI
  if (!uri) throw new Error('Missing MONGODB_URI or MONGO_URI')
  await mongoose.connect(uri)
}

async function del(db, collection, filter) {
  const exists = await db.listCollections({ name: collection }).hasNext()
  if (!exists) return [collection, 0]
  const result = await db.collection(collection).deleteMany(filter)
  return [collection, result.deletedCount]
}

async function main() {
  await connect()
  const db = mongoose.connection.db
  const shops = await db.collection('shops').find({}).toArray()
  const targets = shops.filter((shop) => {
    const text = normalize(`${shop.name || ''} ${shop.slug || ''} ${shop.email || ''}`)
    return text.includes(TARGET_TEXT)
  })

  if (!targets.length) {
    console.log(JSON.stringify({ deletedShops: [], message: 'Không tìm thấy shop Spa Thu Kim' }, null, 2))
    return
  }

  const shopObjectIds = targets.map((shop) => shop._id)
  const shopIds = targets.map((shop) => String(shop._id))
  const ownerIds = targets.map((shop) => shop.ownerId).filter(Boolean)
  const ownerObjectIds = toObjectIds(ownerIds)
  const shopEmails = targets.map((shop) => String(shop.email || '')).filter(Boolean)

  const bookings = await db.collection('bookings').find({ $or: [{ shopId: { $in: shopIds } }, { shopId: { $in: shopObjectIds } }] }).toArray()
  const bookingIds = bookings.map((booking) => String(booking._id))
  const bookingObjectIds = toObjectIds(bookingIds)
  const candidateCustomerIds = [...new Set(bookings.map((booking) => String(booking.customerId || '')).filter(Boolean))]
  const candidateCustomerObjectIds = toObjectIds(candidateCustomerIds)
  const candidateCustomerEmails = [...new Set(bookings.map((booking) => String(booking.customerEmail || '')).filter(Boolean))]
  const safeCustomerObjectIds = []

  for (const customerId of candidateCustomerIds) {
    const otherBooking = await db.collection('bookings').findOne({
      customerId,
      $and: [{ shopId: { $nin: shopIds } }, { shopId: { $nin: shopObjectIds } }]
    })
    if (!otherBooking && /^[a-f0-9]{24}$/i.test(customerId)) safeCustomerObjectIds.push(new mongoose.Types.ObjectId(customerId))
  }

  const shopFilter = { $or: [{ shopId: { $in: shopIds } }, { shopId: { $in: shopObjectIds } }] }
  const bookingFilter = { $or: [{ bookingId: { $in: bookingIds } }, { bookingId: { $in: bookingObjectIds } }] }
  const shopOrBookingFilter = { $or: [...shopFilter.$or, ...bookingFilter.$or] }

  const deleted = []
  deleted.push(await del(db, 'booking_status_logs', bookingFilter))
  deleted.push(await del(db, 'booking_slot_locks', shopOrBookingFilter))
  deleted.push(await del(db, 'deposits', shopOrBookingFilter))
  deleted.push(await del(db, 'payos_payments', shopOrBookingFilter))
  deleted.push(await del(db, 'platform_fees', shopOrBookingFilter))
  deleted.push(await del(db, 'refund_requests', shopOrBookingFilter))
  deleted.push(await del(db, 'wallet_transactions', shopFilter))
  deleted.push(await del(db, 'wallets', shopFilter))
  deleted.push(await del(db, 'services', shopFilter))
  deleted.push(await del(db, 'service_categories', shopFilter))
  deleted.push(await del(db, 'shop_staffs', shopFilter))
  deleted.push(await del(db, 'shop_working_hours', shopFilter))
  deleted.push(await del(db, 'shop_closure_days', shopFilter))
  deleted.push(await del(db, 'shop_payouts', shopFilter))
  deleted.push(await del(db, 'penalties', shopFilter))
  deleted.push(await del(db, 'fraud_reports', shopFilter))
  deleted.push(await del(db, 'notifications', { $or: [{ shopId: { $in: shopIds } }, { shopId: { $in: shopObjectIds } }, { ownerShopId: { $in: shopIds } }, { ownerShopId: { $in: shopObjectIds } }, { entityId: { $in: shopIds } }, { entityId: { $in: shopObjectIds } }] }))
  deleted.push(await del(db, 'uploads', { $or: [{ ownerShopId: { $in: shopIds } }, { ownerShopId: { $in: shopObjectIds } }] }))
  deleted.push(await del(db, 'bookings', shopFilter))
  deleted.push(await del(db, 'customers', { $or: [{ _id: { $in: safeCustomerObjectIds } }, { _id: { $in: candidateCustomerObjectIds }, email: { $in: candidateCustomerEmails.filter((email) => /demo|fake|lumix/i.test(email)) } }] }))
  deleted.push(await del(db, 'users', { $or: [{ shopId: { $in: shopIds } }, { shopId: { $in: shopObjectIds } }, { _id: { $in: ownerObjectIds } }, { email: { $in: shopEmails } }] }))
  deleted.push(await del(db, 'audit_logs', { $or: [{ entityId: { $in: shopIds } }, { entityId: { $in: shopObjectIds } }, { actorUserId: { $in: ownerIds.map(String) } }, { actorUserId: { $in: ownerObjectIds } }] }))
  deleted.push(await del(db, 'shops', { _id: { $in: shopObjectIds } }))

  const remaining = await db.collection('shops').find({}).toArray()
  const remainingTargets = remaining.filter((shop) => normalize(`${shop.name || ''} ${shop.slug || ''} ${shop.email || ''}`).includes(TARGET_TEXT))

  console.log(JSON.stringify({
    deletedShops: targets.map((shop) => ({ id: String(shop._id), name: shop.name, slug: shop.slug, email: shop.email })),
    bookingCount: bookings.length,
    deleted: Object.fromEntries(deleted),
    remainingTargets: remainingTargets.map((shop) => ({ id: String(shop._id), name: shop.name, slug: shop.slug }))
  }, null, 2))
}

main()
  .catch((err) => {
    console.error('[cleanup-spa-thu-kim] failed', err)
    process.exitCode = 1
  })
  .finally(async () => {
    await mongoose.disconnect().catch(() => {})
  })
