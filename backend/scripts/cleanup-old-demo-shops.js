import 'dotenv/config'
import dotenv from 'dotenv'
import mongoose from 'mongoose'

import { connectDb, disconnectDb } from '../src/config/db.js'
import {
  Booking,
  BookingSlotLock,
  BookingStatusLog,
  Customer,
  Deposit,
  FraudReport,
  Notification,
  PayosPayment,
  Penalty,
  PlatformFee,
  RefundRequest,
  Service,
  ServiceCategory,
  Shop,
  ShopClosureDay,
  ShopPayout,
  ShopStaff,
  ShopWorkingHour,
  Upload,
  User,
  Wallet,
  WalletTransaction
} from '../src/models/index.js'

dotenv.config({ path: new URL('../.env', import.meta.url) })

const OLD_DEMO_SLUGS = [
  'urban-serenity-spa',
  'glow-nail-beauty',
  'lumina-skin-center',
  'artisan-hair-studio',
  'zenith-wellness',
  'velvet-beauty-loft',
  'purezen-spa',
  'hairlab-studio',
  'glowup-clinic',
  'auraskin-center',
  'elitecare-spa',
  'diamond-nails',
  'bloom-beauty-house',
  'ocean-sense-spa',
  'muse-hair-lounge',
  'serene-nail-bar',
  'lavie-skincare',
  'sunset-wellness',
  'herbal-touch-spa',
  'ruby-beauty-salon',
  'moc-lan-spa',
  'the-calm-room',
  'pearl-nail-studio',
  'lotus-spa-cantho',
  'iris-skin-lab',
  'golden-touch-beauty',
  'blue-moon-spa',
  'silk-hair-nail',
  'lotus-beauty-hue',
  'royal-skin-spa'
]

const KEEP_SLUGS = ['vanlavi', 'tiem-nail-minh-huyen', 'spa-thu-trang']

async function del(label, promise) {
  const result = await promise
  return [label, result?.deletedCount ?? result?.modifiedCount ?? 0]
}

async function main() {
  await connectDb()

  const shops = await Shop.find({ slug: { $in: OLD_DEMO_SLUGS, $nin: KEEP_SLUGS } }).select({ _id: 1, slug: 1, ownerId: 1, email: 1 }).lean()
  const shopIds = shops.map((shop) => String(shop._id))
  const ownerIds = shops.map((shop) => String(shop.ownerId || '')).filter((id) => /^[a-f0-9]{24}$/i.test(id))
  const shopEmails = shops.map((shop) => String(shop.email || '')).filter(Boolean)
  const bookings = await Booking.find({ shopId: { $in: shopIds } }).select({ _id: 1, customerId: 1, customerEmail: 1 }).lean()
  const bookingIds = bookings.map((booking) => String(booking._id))
  const candidateCustomerIds = [...new Set(bookings.map((booking) => String(booking.customerId || '')).filter(Boolean))]
  const candidateCustomerEmails = [...new Set(bookings.map((booking) => String(booking.customerEmail || '')).filter(Boolean))]

  const safeCustomerIds = []
  for (const customerId of candidateCustomerIds) {
    const otherBooking = await Booking.exists({ customerId, shopId: { $nin: shopIds } })
    if (!otherBooking) safeCustomerIds.push(customerId)
  }

  const summary = {
    targetSlugs: shops.map((shop) => shop.slug).sort(),
    targetShopCount: shops.length,
    targetBookingCount: bookings.length,
    targetCustomerCandidateCount: candidateCustomerIds.length,
    deleted: {}
  }

  const deletions = []
  deletions.push(await del('booking_status_logs', BookingStatusLog.deleteMany({ bookingId: { $in: bookingIds } })))
  deletions.push(await del('booking_slot_locks', BookingSlotLock.deleteMany({ $or: [{ shopId: { $in: shopIds } }, { bookingId: { $in: bookingIds } }] })))
  deletions.push(await del('deposits', Deposit.deleteMany({ $or: [{ shopId: { $in: shopIds } }, { bookingId: { $in: bookingIds } }] })))
  deletions.push(await del('payos_payments', PayosPayment.deleteMany({ $or: [{ shopId: { $in: shopIds } }, { bookingId: { $in: bookingIds } }] })))
  deletions.push(await del('platform_fees', PlatformFee.deleteMany({ $or: [{ shopId: { $in: shopIds } }, { bookingId: { $in: bookingIds } }] })))
  deletions.push(await del('refund_requests', RefundRequest.deleteMany({ $or: [{ shopId: { $in: shopIds } }, { bookingId: { $in: bookingIds } }] })))
  deletions.push(await del('wallet_transactions', WalletTransaction.deleteMany({ shopId: { $in: shopIds } })))
  deletions.push(await del('wallets', Wallet.deleteMany({ shopId: { $in: shopIds } })))
  deletions.push(await del('services', Service.deleteMany({ shopId: { $in: shopIds } })))
  deletions.push(await del('service_categories', ServiceCategory.deleteMany({ shopId: { $in: shopIds } })))
  deletions.push(await del('shop_staffs', ShopStaff.deleteMany({ shopId: { $in: shopIds } })))
  deletions.push(await del('shop_working_hours', ShopWorkingHour.deleteMany({ shopId: { $in: shopIds } })))
  deletions.push(await del('shop_closure_days', ShopClosureDay.deleteMany({ shopId: { $in: shopIds } })))
  deletions.push(await del('shop_payouts', ShopPayout.deleteMany({ shopId: { $in: shopIds } })))
  deletions.push(await del('penalties', Penalty.deleteMany({ shopId: { $in: shopIds } })))
  deletions.push(await del('fraud_reports', FraudReport.deleteMany({ shopId: { $in: shopIds } })))
  deletions.push(await del('notifications', Notification.deleteMany({ $or: [{ shopId: { $in: shopIds } }, { ownerShopId: { $in: shopIds } }, { entityId: { $in: shopIds } }] })))
  deletions.push(await del('uploads', Upload.deleteMany({ ownerShopId: { $in: shopIds } })))
  deletions.push(await del('bookings', Booking.deleteMany({ shopId: { $in: shopIds } })))
  deletions.push(await del('customers', Customer.deleteMany({ $or: [{ _id: { $in: safeCustomerIds } }, { email: { $in: candidateCustomerEmails.filter((email) => /demo|fake|lumix/i.test(email)) } }] })))
  deletions.push(await del('users', User.deleteMany({ $or: [{ shopId: { $in: shopIds } }, { _id: { $in: ownerIds } }, { email: { $in: shopEmails } }, { email: /@demo\.lumix\.vn$/i }] })))
  deletions.push(await del('shops', Shop.deleteMany({ _id: { $in: shopIds } })))

  for (const [label, count] of deletions) summary.deleted[label] = count

  const keepShops = await Shop.find({ slug: { $in: KEEP_SLUGS } }).select({ slug: 1 }).lean()
  summary.keepShopSlugsStillExist = keepShops.map((shop) => shop.slug).sort()

  console.log(JSON.stringify(summary, null, 2))
}

main()
  .catch((err) => {
    console.error('[cleanup-old-demo-shops] failed', err)
    process.exitCode = 1
  })
  .finally(async () => {
    try { await disconnectDb() } catch {}
    try { await mongoose.disconnect() } catch {}
  })
