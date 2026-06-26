import dotenv from 'dotenv'
import bcrypt from 'bcryptjs'
import mongoose from 'mongoose'
import {
  Shop,
  ShopStaff,
  ShopWorkingHour,
  User,
  Wallet,
  ServiceCategory,
  Service
} from '../src/models/index.js'

dotenv.config()

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/SpaBooking'

function createSlug(text) {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "")
}

const NEW_SHOPS = [
  {
    name: 'Peony Chill & Spa',
    phone: '0865030252',
    openTime: '09:00',
    closeTime: '19:00',
    facebook: '',
    address: 'Số 6 P. Trương Hán Siêu, Trần Hưng Đạo, Q.Hoàn Kiếm, Hà Nội'
  },
  {
    name: 'Warda Spa Organic',
    phone: '0979040998',
    openTime: '08:30',
    closeTime: '20:00',
    facebook: '',
    address: 'Số 106a2 P. Lạc Chính, Trúc Bạch, Ba Đình, Hà Nội'
  },
  {
    name: 'Nhà Spa',
    phone: '0359000468',
    openTime: '10:00',
    closeTime: '22:00',
    facebook: '',
    address: 'Sảnh B, Tòa nhà Hongkong Tower, số 1 đường Cầu Giấy, Láng Thượng, Hà Nội'
  }
]

async function run() {
  try {
    console.log('Connecting to MongoDB...')
    await mongoose.connect(MONGODB_URI)
    console.log('Connected.')

    // Get the template shop "Liên Facial Spa"
    const templateShop = await Shop.findOne({ name: 'Liên Facial Spa' })
    if (!templateShop) throw new Error('Could not find template shop Liên Facial Spa')
    
    // Get template categories
    const templateCategories = await ServiceCategory.find({ shopId: templateShop._id }).lean()
    const categoryMap = {}
    for (const c of templateCategories) {
      categoryMap[String(c._id)] = c.name
    }

    // Get template services
    const templateServices = await Service.find({ shopId: templateShop._id }).lean()

    for (const shopInfo of NEW_SHOPS) {
      console.log(`Processing shop: ${shopInfo.name}`)
      const slug = createSlug(shopInfo.name)
      
      // Check if user already exists
      const email = `${slug}@gmail.com`
      let user = await User.findOne({ email })
      if (!user) {
        user = await User.create({
          email,
          password: await bcrypt.hash('123456', 10),
          fullName: `Chủ tiệm ${shopInfo.name}`,
          phone: shopInfo.phone,
          role: 'shop_owner',
          status: 'active'
        })
      }

      // Check if shop already exists
      let shop = await Shop.findOne({ ownerId: user._id })
      if (!shop) {
        shop = await Shop.create({
          ownerId: user._id,
          name: shopInfo.name,
          slug,
          description: `Tiệm spa chuyên nghiệp ${shopInfo.name}`,
          address: shopInfo.address,
          phone: shopInfo.phone,
          status: 'active',
          rating: 5,
          reviewCount: 1,
          tags: ['spa', 'chăm sóc da'],
          coverImage: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1000&q=80',
          logo: 'https://cdn-icons-png.flaticon.com/512/1944/1944654.png',
          socialLinks: { facebook: shopInfo.facebook }
        })

        // Setup working hours
        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
        for (const day of days) {
          await ShopWorkingHour.create({
            shopId: shop._id,
            dayOfWeek: day,
            isOpen: true,
            openTime: shopInfo.openTime,
            closeTime: shopInfo.closeTime,
            maxCustomersPerSlot: 5
          })
        }

        // Setup Wallet
        await Wallet.create({
          shopId: shop._id,
          balance: 0,
          minBalance: 100000,
          status: 'active'
        })
      } else {
        shop.tags = ['spa', 'chăm sóc da']
        await shop.save()
      }

      // Create 2 staff: 1 thợ + 1 chủ
      let ownerStaff = await ShopStaff.findOne({ shopId: shop._id, fullName: user.fullName })
      if (!ownerStaff) {
        ownerStaff = await ShopStaff.create({
          shopId: shop._id,
          fullName: user.fullName,
          phone: user.phone,
          avatarUrl: 'https://cdn-icons-png.flaticon.com/512/4140/4140047.png',
          shortBio: 'Chủ tiệm kiêm chuyên viên tư vấn, kinh nghiệm dày dặn.',
          status: 'active'
        })
      }

      let techStaff = await ShopStaff.findOne({ shopId: shop._id, fullName: `Kỹ thuật viên ${shopInfo.name}` })
      if (!techStaff) {
        techStaff = await ShopStaff.create({
          shopId: shop._id,
          fullName: `Kỹ thuật viên ${shopInfo.name}`,
          phone: shopInfo.phone,
          avatarUrl: 'https://cdn-icons-png.flaticon.com/512/4140/4140048.png',
          shortBio: 'Kỹ thuật viên spa nhẹ nhàng, tay nghề cao.',
          status: 'active'
        })
      }

      const staffIds = [String(ownerStaff._id), String(techStaff._id)]

      // Clear existing services if any
      await Service.deleteMany({ shopId: shop._id })

      // Duplicate categories & services
      for (const tSvc of templateServices) {
        const catName = categoryMap[String(tSvc.categoryId)] || 'Chăm sóc da'
        
        let category = await ServiceCategory.findOne({ shopId: shop._id, name: catName })
        if (!category) {
          category = await ServiceCategory.create({
            shopId: shop._id,
            name: catName,
            slug: createSlug(catName),
            sortOrder: 1,
            status: 'active'
          })
        }

        const baseSlug = createSlug(tSvc.name)
        let finalSlug = baseSlug
        let counter = 1
        while (await Service.exists({ shopId: shop._id, slug: finalSlug })) {
          finalSlug = `${baseSlug}-${counter++}`
        }

        await Service.create({
          shopId: shop._id,
          categoryId: category._id,
          name: tSvc.name,
          slug: finalSlug,
          description: tSvc.description,
          shortDescription: tSvc.shortDescription,
          detailedDescription: tSvc.detailedDescription,
          price: tSvc.price,
          durationMinutes: tSvc.durationMinutes,
          imageUrl: tSvc.imageUrl,
          status: 'active',
          availableStaffIds: staffIds,
          sortOrder: tSvc.sortOrder
        })
      }

      console.log(`  Finished setting up ${shopInfo.name}`)
    }

    console.log('Done successfully!')
    process.exit(0)
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

run()
