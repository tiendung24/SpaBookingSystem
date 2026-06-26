import mongoose from 'mongoose'
import dotenv from 'dotenv'
import { Service } from '../src/models/schemas/service.model.js'
import { ServiceCategory } from '../src/models/schemas/serviceCategory.model.js'
import { ShopStaff } from '../src/models/schemas/shopStaff.model.js'

dotenv.config()

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/SpaBooking'

function createSlug(text) {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "")
}

const SHOPS = [
  { id: '6a27bbae5b693dd37e391a4e', name: 'Spa Thu Trang' },
  { id: '6a2b9f6ec023a7dd207abba4', name: 'Liên Facial Spa' },
  { id: '6a2b9f5fc023a7dd207abb27', name: 'Nail Minh Hải' },
  { id: '6a29265939d5230a11084542', name: 'Ngọc Thơ' },
]

const NEW_SERVICES = [
  {
    name: 'Gội Đầu Thư Giãn',
    price: 30000,
    durationMinutes: 20,
    shortDescription: 'Gội đầu cơ bản, thư giãn nhẹ nhàng với dầu gội thông thường.',
    detailedDescription: 'Ướt tóc\nGội lần 1\nGội lần 2\nXả tóc\nSấy khô nhẹ\n\nPhù hợp:\nKhách muốn gội nhanh, sạch tóc',
    sortOrder: 1
  },
  {
    name: 'Gội Đầu Massage Đầu',
    price: 50000,
    durationMinutes: 35,
    shortDescription: 'Gội đầu kết hợp massage da đầu thư giãn, giảm căng thẳng.',
    detailedDescription: 'Ướt tóc\nGội lần 1\nMassage da đầu 10 phút\nGội lần 2\nXả tóc\nSấy khô nhẹ\n\nPhù hợp:\nKhách muốn thư giãn\nGiảm căng thẳng sau ngày dài',
    sortOrder: 2
  }
]

async function run() {
  try {
    console.log('Connecting to MongoDB...')
    await mongoose.connect(MONGODB_URI)
    console.log('Connected.\n')

    for (const shop of SHOPS) {
      console.log(`Processing shop: ${shop.name}`)

      // Ensure "Gội đầu" category exists for this shop
      let category = await ServiceCategory.findOne({ shopId: shop.id, name: 'Gội đầu' })
      if (!category) {
        category = await ServiceCategory.create({
          shopId: shop.id,
          name: 'Gội đầu',
          slug: 'goi-dau',
          sortOrder: 10,
          status: 'active'
        })
        console.log(`  Created category: Gội đầu`)
      } else {
        console.log(`  Category "Gội đầu" already exists`)
      }

      // Get staff IDs
      const staffs = await ShopStaff.find({ shopId: shop.id })
      const staffIds = staffs.map(s => String(s._id))

      // Add services
      for (const item of NEW_SERVICES) {
        const baseSlug = createSlug(item.name)
        let finalSlug = baseSlug
        let counter = 1
        while (await Service.exists({ shopId: shop.id, slug: finalSlug })) {
          finalSlug = `${baseSlug}-${counter++}`
        }

        await Service.create({
          shopId: shop.id,
          categoryId: String(category._id),
          name: item.name,
          slug: finalSlug,
          description: item.shortDescription,
          shortDescription: item.shortDescription,
          detailedDescription: item.detailedDescription,
          price: item.price,
          durationMinutes: item.durationMinutes,
          imageUrl: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=1000&q=80',
          status: 'active',
          availableStaffIds: staffIds,
          sortOrder: item.sortOrder
        })
        console.log(`  Added: ${item.name} (${item.price.toLocaleString()}đ)`)
      }
      console.log('')
    }

    console.log('Done! Gội đầu services added to all 4 shops.')
    process.exit(0)
  } catch (err) {
    console.error('Error:', err)
    process.exit(1)
  }
}

run()
