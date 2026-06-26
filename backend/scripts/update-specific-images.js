import dotenv from 'dotenv'
import mongoose from 'mongoose'
import { Service } from '../src/models/index.js'

dotenv.config()
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/SpaBooking'

async function run() {
  try {
    console.log('Connecting to MongoDB...')
    await mongoose.connect(MONGODB_URI)
    console.log('Connected.')

    const res1 = await Service.updateMany(
      { name: { $regex: 'Gội Đầu Thư Giãn', $options: 'i' } },
      { $set: { imageUrl: 'https://hispa.vn/wp-content/uploads/2022/09/goi-dau-duong-sinh-01.jpg' } }
    )
    console.log(`Gội Đầu Thư Giãn updated. Matched: ${res1.matchedCount}, Modified: ${res1.modifiedCount}`)

    const res2 = await Service.updateMany(
      { name: { $regex: 'Gội Đầu Massage', $options: 'i' } },
      { $set: { imageUrl: 'https://nhaspa.com.vn/wp-content/uploads/2024/01/8.jpg' } }
    )
    console.log(`Gội Đầu Massage Đầu updated. Matched: ${res2.matchedCount}, Modified: ${res2.modifiedCount}`)

    console.log('Done successfully!')
    process.exit(0)
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

run()
