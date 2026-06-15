

import 'dotenv/config'
import mongoose from 'mongoose'

import {
  Booking,
  BookingStatusLog,
  Deposit,
  PlatformFee,
  Service,
  Shop,
  ShopStaff,
  ShopWorkingHour,
  User,
  Wallet,
  WalletTransaction
} from '../src/models/index.js'

async function connect() {
  const uri = process.env.MONGODB_URI
  if (!uri) throw new Error('Missing MONGODB_URI')
  await mongoose.connect(uri)
  console.log('Connected to MongoDB')
}

async function removeShopByName(shopName) {
  const existing = await Shop.findOne({ name: new RegExp(shopName, 'i') }).lean()
  if (!existing) {
    console.log(`Shop with name matching "${shopName}" not found.`)
    return
  }

  console.log(`Found shop: ${existing.name} (Slug: ${existing.slug}, ID: ${existing._id})`)
  
  const shopId = String(existing._id)
  const bookingIds = (await Booking.find({ shopId }).distinct('_id')).map(String)
  
  const [
    bookingLogRes,
    platformFeeRes,
    walletTxRes,
    depositRes,
    bookingRes,
    serviceRes,
    staffRes,
    workingHourRes,
    walletRes,
    userRes,
    shopRes
  ] = await Promise.all([
    BookingStatusLog.deleteMany({ bookingId: { $in: bookingIds } }),
    PlatformFee.deleteMany({ shopId }),
    WalletTransaction.deleteMany({ shopId }),
    Deposit.deleteMany({ shopId }),
    Booking.deleteMany({ shopId }),
    Service.deleteMany({ shopId }),
    ShopStaff.deleteMany({ shopId }),
    ShopWorkingHour.deleteMany({ shopId }),
    Wallet.deleteMany({ shopId }),
    User.deleteMany({ shopId }),
    Shop.deleteMany({ _id: shopId })
  ])

  console.log('Deletion results:')
  console.log(`- BookingStatusLog: ${bookingLogRes.deletedCount}`)
  console.log(`- PlatformFee: ${platformFeeRes.deletedCount}`)
  console.log(`- WalletTransaction: ${walletTxRes.deletedCount}`)
  console.log(`- Deposit: ${depositRes.deletedCount}`)
  console.log(`- Booking: ${bookingRes.deletedCount}`)
  console.log(`- Service: ${serviceRes.deletedCount}`)
  console.log(`- ShopStaff: ${staffRes.deletedCount}`)
  console.log(`- ShopWorkingHour: ${workingHourRes.deletedCount}`)
  console.log(`- Wallet: ${walletRes.deletedCount}`)
  console.log(`- User: ${userRes.deletedCount}`)
  console.log(`- Shop: ${shopRes.deletedCount}`)
}

async function main() {
  await connect()
  await removeShopByName('Thu Kim')
}

main()
  .then(() => {
    console.log('Finished.')
    process.exit(0)
  })
  .catch((err) => {
    console.error('Error:', err)
    process.exit(1)
  })
