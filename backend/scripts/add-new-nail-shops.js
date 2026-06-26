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
    name: 'DiDan Nail Art',
    phone: '0941191968',
    openTime: '08:00',
    closeTime: '19:30',
    facebook: 'www.facebook.com/www.didan.vn/',
    address: 'Số 89 Vĩnh Phúc, Ba Đình, Hà Nội'
  },
  {
    name: 'Gasy Beauty Home',
    phone: '0987029100',
    openTime: '09:00',
    closeTime: '21:00',
    facebook: 'www.facebook.com/gasybeautyhome',
    address: 'Số 10 Ngõ 1 - Ao Sen, Hà Đông, Hà Nội'
  },
  {
    name: 'Blue Academy',
    phone: '0975747280',
    openTime: '09:00',
    closeTime: '21:01',
    facebook: 'www.facebook.com/daotaonailmiHaDong',
    address: '117 Thanh Bình, Hà Đông, Hà Nội'
  },
  {
    name: 'Linh Hương - Mi Nails',
    phone: '0974518607',
    openTime: '09:00',
    closeTime: '21:02',
    facebook: 'www.facebook.com/Linhhuong905',
    address: '140 Nguyễn Viết Xuân, Quang Trung, Hà Đông, Hà Nội'
  }
]

const NAIL_SERVICES = [
  { name: 'Combo Sơn Gel + Thạch', price: 150000, durationMinutes: 60, shortDesc: 'Sơn gel cao cấp kết hợp thạch' },
  { name: 'Đắp Gel Móng Nối', price: 250000, durationMinutes: 90, shortDesc: 'Nối móng đắp gel chuyên nghiệp' },
  { name: 'Sơn Biab', price: 120000, durationMinutes: 45, shortDesc: 'Sơn Biab cứng móng' },
  { name: 'Úp Base', price: 80000, durationMinutes: 30, shortDesc: 'Úp base bảo vệ móng thật' },
  { name: 'Combo Sơn Mắt Mèo + Tráng Gương', price: 200000, durationMinutes: 60, shortDesc: 'Sơn mắt mèo sành điệu' },
  { name: 'Fill Gel', price: 100000, durationMinutes: 45, shortDesc: 'Fill gel dặm lại móng' },
  { name: 'Đắp Gel Móng Ngắn', price: 200000, durationMinutes: 75, shortDesc: 'Đắp gel cho móng ngắn' },
  { name: 'French / Ombre', price: 180000, durationMinutes: 60, shortDesc: 'Sơn French viền móng hoặc Ombre' },
  { name: 'Tạo cấu móng', price: 150000, durationMinutes: 45, shortDesc: 'Định hình và tạo cấu trúc móng' },
  { name: 'Charm (đính đá)', price: 50000, durationMinutes: 30, shortDesc: 'Đính đá trang trí móng' },
  { name: 'Nhật da + sửa form móng', price: 50000, durationMinutes: 30, shortDesc: 'Làm sạch da chết và sửa form móng' }
]

async function run() {
  try {
    console.log('Connecting to MongoDB...')
    await mongoose.connect(MONGODB_URI)
    console.log('Connected.')

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
          description: `Tiệm nail chuyên nghiệp ${shopInfo.name}`,
          address: shopInfo.address,
          phone: shopInfo.phone,
          status: 'active',
          rating: 5,
          reviewCount: 1,
          coverImage: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=1000&q=80',
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
      }

      // Create Category "Làm móng (Nail)"
      let category = await ServiceCategory.findOne({ shopId: shop._id, name: 'Làm móng (Nail)' })
      if (!category) {
        category = await ServiceCategory.create({
          shopId: shop._id,
          name: 'Làm móng (Nail)',
          slug: 'lam-mong',
          sortOrder: 1,
          status: 'active'
        })
      }

      // Create dummy staff
      let staff = await ShopStaff.findOne({ shopId: shop._id })
      if (!staff) {
        staff = await ShopStaff.create({
          shopId: shop._id,
          fullName: `Thợ Nail ${shopInfo.name}`,
          phone: shopInfo.phone,
          avatarUrl: 'https://cdn-icons-png.flaticon.com/512/4140/4140048.png',
          shortBio: 'Chuyên viên nail nhiệt tình, tay nghề cao.',
          status: 'active'
        })
      }

      // Add Nail Services
      for (let i = 0; i < NAIL_SERVICES.length; i++) {
        const svc = NAIL_SERVICES[i]
        const svcSlug = createSlug(svc.name)
        
        let finalSlug = svcSlug
        let counter = 1
        while (await Service.exists({ shopId: shop._id, slug: finalSlug })) {
          finalSlug = `${svcSlug}-${counter++}`
        }

        const existing = await Service.findOne({ shopId: shop._id, name: svc.name })
        if (!existing) {
          await Service.create({
            shopId: shop._id,
            categoryId: category._id,
            name: svc.name,
            slug: finalSlug,
            description: svc.shortDesc,
            shortDescription: svc.shortDesc,
            detailedDescription: svc.shortDesc,
            price: svc.price,
            durationMinutes: svc.durationMinutes,
            imageUrl: 'https://images.unsplash.com/photo-1632345031435-8727f6897d53?auto=format&fit=crop&w=1000&q=80',
            status: 'active',
            availableStaffIds: [staff._id],
            sortOrder: i + 1
          })
        }
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
