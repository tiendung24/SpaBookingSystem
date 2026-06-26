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

const TARGET_SHOPS = {
  'Linh Hương - Mi Nails': 0, // offset
  'Nail Minh Hải': 5000,
  'Ngọc Thơ': 10000
}

const CATEGORY = { name: 'Nối Mi', slug: 'noi-mi', sortOrder: 5 }

const NEW_SERVICES = [
  {
    name: 'Mi Classic',
    durationMinutes: 60,
    price: 240000,
    shortDescription: 'Nối mi tự nhiên, nhẹ nhàng.',
    detailedDescription: 'Kỹ thuật 1 sợi mi giả gắn lên 1 sợi mi thật.\nTạo hiệu ứng tự nhiên như mi thật.\nPhù hợp học sinh, sinh viên, nhân viên văn phòng.\nDành cho khách mới nối mi lần đầu.',
    sortOrder: 1,
    imageUrl: 'https://images.unsplash.com/photo-1588636184518-e737c35e6c51?auto=format&fit=crop&w=1000&q=80'
  },
  {
    name: 'Mi Em Bé',
    durationMinutes: 60,
    price: 270000,
    shortDescription: 'Kiểu mi trong trẻo, đáng yêu.',
    detailedDescription: 'Thiết kế các sợi mi ngắn và mềm.\nTạo cảm giác mắt to tròn, ngây thơ.\nPhù hợp phong cách Hàn Quốc.\nThích hợp sử dụng hằng ngày.',
    sortOrder: 2,
    imageUrl: 'https://images.unsplash.com/photo-1512413316925-fd4b2d4c1075?auto=format&fit=crop&w=1000&q=80'
  },
  {
    name: 'Mi Classic Mix Size',
    durationMinutes: 70,
    price: 270000,
    shortDescription: 'Mi Classic kết hợp nhiều độ dài.',
    detailedDescription: 'Sử dụng nhiều size mi khác nhau.\nTạo hiệu ứng mắt sâu và tự nhiên hơn.\nGiữ được vẻ nhẹ nhàng nhưng có điểm nhấn.',
    sortOrder: 3,
    imageUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1000&q=80'
  },
  {
    name: 'Mi Lông Thỏ Mix Size',
    durationMinutes: 75,
    price: 300000,
    shortDescription: 'Hiệu ứng mềm mại như lông thỏ.',
    detailedDescription: 'Kết hợp nhiều độ dài mi.\nTạo độ tơi và mềm tự nhiên.\nGiúp mắt trông ngọt ngào hơn.\nPhù hợp phong cách nữ tính.',
    sortOrder: 4,
    imageUrl: 'https://images.unsplash.com/photo-1596755389378-c31d21fd1273?auto=format&fit=crop&w=1000&q=80'
  },
  {
    name: 'Mi Lông Chồn Natural',
    durationMinutes: 80,
    price: 330000,
    shortDescription: 'Nối mi tự nhiên bằng form lông chồn.',
    detailedDescription: 'Sợi mi mảnh và nhẹ.\nĐộ cong vừa phải.\nMang lại vẻ đẹp tự nhiên.\nKhông tạo cảm giác nặng mắt.',
    sortOrder: 5,
    imageUrl: 'https://images.unsplash.com/photo-1629367466141-8eaf5fb50731?auto=format&fit=crop&w=1000&q=80'
  },
  {
    name: 'Mi Lông Chồn Thiết Kế',
    durationMinutes: 90,
    price: 370000,
    shortDescription: 'Thiết kế riêng theo dáng mắt.',
    detailedDescription: 'Chuyên viên tư vấn kiểu mi phù hợp.\nĐiều chỉnh độ cong và độ dài.\nKhắc phục nhược điểm mắt.\nTạo hiệu ứng sắc nét hơn.',
    sortOrder: 6,
    imageUrl: 'https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?auto=format&fit=crop&w=1000&q=80'
  },
  {
    name: 'Mi Volume 3D',
    durationMinutes: 90,
    price: 410000,
    shortDescription: 'Mi dày và nổi bật.',
    detailedDescription: 'Một sợi mi thật gắn nhiều sợi mi siêu mảnh.\nTạo độ dày rõ rệt.\nMắt sâu và cuốn hút hơn.\nPhù hợp khách thích trang điểm.',
    sortOrder: 7,
    imageUrl: 'https://images.unsplash.com/photo-1587778082149-bd5b1bf5d3fa?auto=format&fit=crop&w=1000&q=80'
  },
  {
    name: 'Mi Volume 5D',
    durationMinutes: 100,
    price: 410000,
    shortDescription: 'Mi volume dày hơn 3D.',
    detailedDescription: 'Tăng số lượng sợi mi trên mỗi fan.\nHiệu ứng đậm và sắc nét.\nTạo chiều sâu cho đôi mắt.\nPhù hợp khách thích phong cách nổi bật.',
    sortOrder: 8,
    imageUrl: 'https://images.unsplash.com/photo-1631558237748-032958cb53d7?auto=format&fit=crop&w=1000&q=80'
  },
  {
    name: 'Mi 3D Thiết Kế',
    durationMinutes: 100,
    price: 440000,
    shortDescription: 'Mi 3D được thiết kế theo dáng mắt.',
    detailedDescription: 'Kết hợp kỹ thuật volume và tạo kiểu.\nCá nhân hóa theo khuôn mặt khách hàng.\nTăng độ cân đối cho đôi mắt.\nHiệu ứng sang trọng và chuyên nghiệp.',
    sortOrder: 9,
    imageUrl: 'https://images.unsplash.com/photo-1589718539308-1692e850eb26?auto=format&fit=crop&w=1000&q=80'
  }
]

async function run() {
  try {
    console.log('Connecting to MongoDB...')
    await mongoose.connect(MONGODB_URI)
    console.log('Connected.')

    for (const [shopName, offset] of Object.entries(TARGET_SHOPS)) {
      console.log(`Processing shop: ${shopName}`)
      const shop = await Shop.findOne({ name: shopName })
      if (!shop) {
        console.log(`  Not found!`)
        continue
      }

      const allStaffs = await ShopStaff.find({ shopId: shop._id })
      const staffIds = allStaffs.map(s => String(s._id))

      // Create category if not exists
      let category = await ServiceCategory.findOne({ shopId: shop._id, name: CATEGORY.name })
      if (!category) {
        category = await ServiceCategory.create({
          shopId: shop._id,
          name: CATEGORY.name,
          slug: CATEGORY.slug,
          sortOrder: CATEGORY.sortOrder,
          status: 'active'
        })
      }

      // Delete old Mi services if any, to prevent duplicates on rerun
      const oldServices = await Service.find({ shopId: shop._id, categoryId: category._id })
      if (oldServices.length > 0) {
        await Service.deleteMany({ shopId: shop._id, categoryId: category._id })
      }

      // Add services
      for (const item of NEW_SERVICES) {
        const baseSlug = createSlug(item.name)
        let finalSlug = baseSlug
        let counter = 1
        while (await Service.exists({ shopId: shop._id, slug: finalSlug })) {
          finalSlug = `${baseSlug}-${counter++}`
        }

        const finalPrice = item.price + offset

        await Service.create({
          shopId: shop._id,
          categoryId: category._id,
          name: item.name,
          slug: finalSlug,
          description: item.shortDescription || item.name,
          shortDescription: item.shortDescription || item.name,
          detailedDescription: item.detailedDescription || item.name,
          price: finalPrice,
          durationMinutes: item.durationMinutes,
          imageUrl: item.imageUrl,
          status: 'active',
          availableStaffIds: staffIds,
          sortOrder: item.sortOrder
        })
      }

      console.log(`  Added 9 Eyelash services for ${shopName} (Offset: ${offset})`)
    }

    console.log('Done successfully!')
    process.exit(0)
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

run()
