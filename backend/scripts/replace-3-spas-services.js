import dotenv from 'dotenv'
import mongoose from 'mongoose'
import {
  Shop,
  ShopStaff,
  ServiceCategory,
  Service
} from '../src/models/index.js'

dotenv.config()

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/SpaBooking'

function createSlug(text) {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "")
}

const TARGET_SHOPS = [
  'Peony Chill & Spa',
  'Warda Spa Organic',
  'Nhà Spa'
]

const OLD_SERVICE_NAMES = [
  'Nhặt da + sửa form',
  'Phá sơn úp / đắp gel',
  'Cứng móng cao cấp',
  'Tạo cầu móng',
  'Úp base',
  'Fill gel',
  'Đắp gel móng thật',
  'Sơn biab',
  'Combo sơn gel / thạch',
  'French / Ombre'
]

const OLD_SERVICE_IMAGES = [
  'https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1632345031435-8727f6897d53?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1519014816548-bf5fe059798b?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1522337660859-02fbefca4702?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1610992015732-2449b76344bc?auto=format&fit=crop&w=1000&q=80',
  'https://diva.edu.vn/wp-content/uploads/2024/09/tho-nail-trang-tri-mong-cho-khach-hang.jpg',
  'https://images.unsplash.com/photo-1599948128020-9a44505b0d1b?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1000&q=80'
]

const OLD_PRICES = [60000, 40000, 40000, 60000, 110000, 90000, 160000, 120000, 110000, 90000]

async function run() {
  try {
    console.log('Connecting to MongoDB...')
    await mongoose.connect(MONGODB_URI)
    console.log('Connected.')

    for (const shopName of TARGET_SHOPS) {
      console.log(`Processing shop: ${shopName}`)
      const shop = await Shop.findOne({ name: shopName })
      if (!shop) {
        console.log(`  Not found!`)
        continue
      }

      const allStaffs = await ShopStaff.find({ shopId: shop._id })
      const staffIds = allStaffs.map(s => String(s._id))

      // Clear existing services
      await Service.deleteMany({ shopId: shop._id })

      // Also reset category to standard
      let category = await ServiceCategory.findOne({ shopId: shop._id, name: 'Chăm sóc da' })
      if (!category) {
        category = await ServiceCategory.create({
          shopId: shop._id,
          name: 'Chăm sóc da',
          slug: 'cham-soc-da',
          sortOrder: 1,
          status: 'active'
        })
      }

      // Add the "old" Liên Facial Spa services
      for (let i = 0; i < OLD_SERVICE_NAMES.length; i++) {
        const name = OLD_SERVICE_NAMES[i]
        
        const baseSlug = createSlug(name)
        let finalSlug = baseSlug
        let counter = 1
        while (await Service.exists({ shopId: shop._id, slug: finalSlug })) {
          finalSlug = `${baseSlug}-${counter++}`
        }

        await Service.create({
          shopId: shop._id,
          categoryId: category._id,
          name: name,
          slug: finalSlug,
          description: `${name} tại ${shopName}, thao tác kỹ, sạch sẽ và chú trọng cảm giác thư giãn.`,
          shortDescription: name,
          detailedDescription: `${name} tại ${shopName}, thao tác kỹ, sạch sẽ và chú trọng cảm giác thư giãn.`,
          price: OLD_PRICES[i],
          durationMinutes: 60,
          imageUrl: OLD_SERVICE_IMAGES[i],
          status: 'active',
          availableStaffIds: staffIds,
          sortOrder: i + 1
        })
      }

      console.log(`  Finished replacing services for ${shopName}`)
    }

    console.log('Done successfully!')
    process.exit(0)
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

run()
