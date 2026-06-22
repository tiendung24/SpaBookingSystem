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
  console.log('Connected to DB')
}

async function removeMaySpa() {
  const slug = 'may-spa-nail'
  const email = 'mayspa.demo@gmail.com'
  const existing = await Shop.findOne({ slug }).lean()
  
  if (!existing) {
    console.log('Shop Mây Spa & Nail not found.')
    return
  }

  const shopId = String(existing._id)
  const bookingIds = (await Booking.find({ shopId }).distinct('_id')).map(String)
  
  await Promise.all([
    BookingStatusLog.deleteMany({ bookingId: { $in: bookingIds } }),
    PlatformFee.deleteMany({ shopId }),
    WalletTransaction.deleteMany({ shopId }),
    Deposit.deleteMany({ shopId }),
    Booking.deleteMany({ shopId }),
    Service.deleteMany({ shopId }),
    ShopStaff.deleteMany({ shopId }),
    ShopWorkingHour.deleteMany({ shopId }),
    Wallet.deleteMany({ shopId }),
    User.deleteMany({ $or: [{ shopId }, { email }] }),
    Shop.deleteMany({ _id: shopId })
  ])
  console.log('Successfully deleted Mây Spa & Nail and all related data.')
}

async function main() {
  try {
    await connect()
    await removeMaySpa()
  } catch (err) {
    console.error('Failed', err)
  } finally {
    await mongoose.disconnect().catch(() => {})
  }
}

main()
