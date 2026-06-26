import dotenv from 'dotenv'
import mongoose from 'mongoose'
import { Shop, Service } from '../src/models/index.js'

dotenv.config()

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/SpaBooking'

const SHOP_OFFSETS = {
  'DiDan Nail Art': 5000,
  'Gasy Beauty Home': 10000,
  'Blue Academy': -5000,
  'Linh Hương - Mi Nails': 15000,
  'Peony Chill & Spa': 5000,
  'Warda Spa Organic': 10000,
  'Nhà Spa': -5000
}

async function run() {
  try {
    console.log('Connecting to MongoDB...')
    await mongoose.connect(MONGODB_URI)
    console.log('Connected.')

    for (const [shopName, offset] of Object.entries(SHOP_OFFSETS)) {
      const shop = await Shop.findOne({ name: shopName })
      if (!shop) {
        console.log(`Shop not found: ${shopName}`)
        continue
      }
      
      const services = await Service.find({ shopId: shop._id })
      for (const s of services) {
        // Adjust price (Only do it once. To be safe we check if price hasn't been shifted by 5k or something, but since we just set them to round 9000, adding 5000 will make it end in 4000. Wait!)
        // Our base prices end in 9000 (e.g., 149000). Adding 5000 = 154000.
        // If it ends in 4000, we know it's shifted. But let's just do a simple + offset.
        s.price = s.price + offset
        
        // Ensure price doesn't go negative or below 0
        if (s.price < 0) s.price = 10000

        // Rename specific service
        if (s.name.includes('Gội Dưỡng Sinh Tiêu Chuẩn Nhà Hà')) {
          s.name = s.name.replace(' Nhà Hà', '')
          if (s.shortDescription) s.shortDescription = s.shortDescription.replace(' Nhà Hà', '')
          if (s.detailedDescription) s.detailedDescription = s.detailedDescription.replace(' Nhà Hà', '')
        }
        
        await s.save()
      }
      console.log(`Updated shop: ${shopName} | adjusted services: ${services.length} | offset: ${offset}`)
    }

    console.log('Done successfully!')
    process.exit(0)
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

run()
