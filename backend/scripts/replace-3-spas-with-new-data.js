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

const NEW_CATEGORIES = [
  { name: 'Gội Đầu Dưỡng Sinh', slug: 'goi-dau-duong-sinh', sortOrder: 1 },
  { name: 'Facial', slug: 'facial', sortOrder: 2 },
  { name: 'Spa Foot', slug: 'spa-foot', sortOrder: 3 },
  { name: 'Spa Body', slug: 'spa-body', sortOrder: 4 },
  { name: 'VIP List', slug: 'vip-list', sortOrder: 5 }
]

const NEW_SERVICES = [
  // GỘI ĐẦU DƯỠNG SINH
  {
    categoryName: 'Gội Đầu Dưỡng Sinh',
    name: 'Gội Thảo Dược (Cơ Bản)',
    durationMinutes: 30,
    price: 149000,
    shortDescription: 'Gội đầu thư giãn bằng thảo dược.',
    detailedDescription: 'Làm sạch tóc và da đầu.\nThư giãn nhẹ nhàng với các thao tác massage cơ bản.\nPhù hợp khách hàng cần chăm sóc tóc định kỳ.',
    sortOrder: 1,
    imageUrl: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=1000&q=80'
  },
  {
    categoryName: 'Gội Đầu Dưỡng Sinh',
    name: 'Gội Đầu Bông Bưởi',
    durationMinutes: 45,
    price: 299000,
    shortDescription: 'Gội dưỡng sinh kết hợp tinh chất bưởi.',
    detailedDescription: 'Ngâm chân.\nGội với bưởi.\nChăm sóc da vùng đầu.\nVòm nước dưỡng sinh.\nXả tóc collagen.\nChăm sóc cổ vai gáy.\nSấy tóc.',
    sortOrder: 2,
    imageUrl: 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?auto=format&fit=crop&w=1000&q=80'
  },
  {
    categoryName: 'Gội Đầu Dưỡng Sinh',
    name: 'Gội Dưỡng Sinh Bông Bưởi / Hạ Trắng',
    durationMinutes: 60,
    price: 309000,
    shortDescription: 'Dưỡng sinh chuyên sâu kết hợp làm sáng da.',
    detailedDescription: 'Ngâm chân.\nGội bưởi.\nGừng.\nChăm sóc da vùng đầu.\nVòm nước dưỡng sinh.\nXả tóc collagen.\nChăm sóc đầu vai gáy.\nSấy tóc.',
    sortOrder: 3,
    imageUrl: 'https://images.unsplash.com/photo-1633681926022-84c23e8cb2d6?auto=format&fit=crop&w=1000&q=80'
  },
  {
    categoryName: 'Gội Đầu Dưỡng Sinh',
    name: 'Gội Dưỡng Sinh Thủ Đạo Thang',
    durationMinutes: 90,
    price: 489000,
    shortDescription: 'Gội dưỡng sinh kết hợp thủ đạo thang thư giãn.',
    detailedDescription: 'Ngâm chân.\nChăm sóc đầu.\nGội gừng.\nHạ trắng.\nDưỡng sinh thang thảo mộc.\nChăm sóc cổ vai gáy.\nVòm nước dưỡng sinh.\nChăm sóc da vùng đầu.\nSấy tóc.',
    sortOrder: 4,
    imageUrl: 'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?auto=format&fit=crop&w=1000&q=80'
  },
  {
    categoryName: 'Gội Đầu Dưỡng Sinh',
    name: 'Gội Dưỡng Sinh Tiêu Chuẩn Nhà Hà',
    durationMinutes: 100,
    price: 599000,
    shortDescription: 'Gói dưỡng sinh cao cấp toàn diện.',
    detailedDescription: 'Ngâm chân.\nRửa mặt.\nChăm sóc thảo mộc vùng mặt.\nChăm sóc cổ vai gáy.\nChăm sóc da vùng đầu.\nGội gừng.\nHạ trắng.\nDưỡng sinh thang thảo mộc.\nVòm nước dưỡng sinh.\nChăm sóc tai.\nTẩy tế bào chết.\nSấy tóc.',
    sortOrder: 5,
    imageUrl: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=1000&q=80'
  },

  // FACIAL
  {
    categoryName: 'Facial',
    name: 'Thanh Lọc Làn Da Organic / Organic Sensitive',
    durationMinutes: 45,
    price: 395000,
    shortDescription: 'Làm sạch và thanh lọc da nhạy cảm.',
    detailedDescription: 'Làm sạch sâu.\nLoại bỏ bụi bẩn, dầu thừa.\nHỗ trợ cân bằng làn da nhạy cảm.\nTăng độ thông thoáng lỗ chân lông.',
    sortOrder: 1,
    imageUrl: 'https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?auto=format&fit=crop&w=1000&q=80'
  },
  {
    categoryName: 'Facial',
    name: 'Thanh Lọc Dưỡng Sáng Chuyên Sâu Micro Vital / Collagen Sensitive',
    durationMinutes: 60,
    price: 495000,
    shortDescription: 'Dưỡng sáng và phục hồi da.',
    detailedDescription: 'Làm sạch chuyên sâu.\nBổ sung collagen.\nHỗ trợ sáng da.\nTăng độ đàn hồi.',
    sortOrder: 2,
    imageUrl: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=1000&q=80'
  },
  {
    categoryName: 'Facial',
    name: 'Combo Sáng Da Chống Lão Hóa Elite Peptide / Stem Cell Extract',
    durationMinutes: 75,
    price: 549000,
    shortDescription: 'Trẻ hóa và cải thiện độ sáng da.',
    detailedDescription: 'Cấp dưỡng chất chuyên sâu.\nHỗ trợ tái tạo tế bào.\nCải thiện dấu hiệu lão hóa.',
    sortOrder: 3,
    imageUrl: 'https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?auto=format&fit=crop&w=1000&q=80'
  },
  {
    categoryName: 'Facial',
    name: 'Combo Giảm Nám + Cấp Ẩm Plant Cell Darksort',
    durationMinutes: 75,
    price: 549000,
    shortDescription: 'Hỗ trợ giảm nám và dưỡng ẩm.',
    detailedDescription: 'Bổ sung độ ẩm.\nHỗ trợ đều màu da.\nGiảm tình trạng khô ráp.',
    sortOrder: 4,
    imageUrl: 'https://images.unsplash.com/photo-1552693673-1bf958298935?auto=format&fit=crop&w=1000&q=80'
  },
  {
    categoryName: 'Facial',
    name: 'Combo Cấp Ẩm Chống Lão Hóa Aqua Silky',
    durationMinutes: 75,
    price: 638000,
    shortDescription: 'Dưỡng ẩm chuyên sâu.',
    detailedDescription: 'Phục hồi độ ẩm.\nTăng độ mềm mịn.\nHỗ trợ chống lão hóa.',
    sortOrder: 5,
    imageUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1000&q=80'
  },
  {
    categoryName: 'Facial',
    name: 'Combo Detox - Cấp Ẩm - Sáng Da Luxury 4',
    durationMinutes: 90,
    price: 738000,
    shortDescription: 'Chăm sóc da cao cấp toàn diện.',
    detailedDescription: 'Thanh lọc.\nCấp ẩm.\nCăng bóng.\nGiảm nếp nhăn li ti.\nHỗ trợ sáng da.',
    sortOrder: 6,
    imageUrl: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=1000&q=80'
  },

  // SPA FOOT
  {
    categoryName: 'Spa Foot',
    name: 'Spa Foot 45\'',
    durationMinutes: 45,
    price: 309000,
    shortDescription: 'Đả thông kinh lạc chân cơ bản.',
    detailedDescription: 'Ngâm chân.\nĐả thông kinh lạc vùng đùi.\nBắp chân.\nBàn chân.\nTinh dầu.',
    sortOrder: 1,
    imageUrl: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=1000&q=80'
  },
  {
    categoryName: 'Spa Foot',
    name: 'Spa Foot 60\'',
    durationMinutes: 60,
    price: 399000,
    shortDescription: 'Đả thông kinh lạc chân chuyên sâu 60 phút.',
    detailedDescription: 'Ngâm chân.\nĐả thông kinh lạc vùng đùi.\nBắp chân.\nBàn chân.\nTinh dầu.',
    sortOrder: 2,
    imageUrl: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=1000&q=80'
  },
  {
    categoryName: 'Spa Foot',
    name: 'Spa Foot 75\'',
    durationMinutes: 75,
    price: 489000,
    shortDescription: 'Thư giãn chân chuyên sâu kết hợp đá nóng 75 phút.',
    detailedDescription: 'Ngâm chân.\nĐả thông kinh lạc vùng đùi.\nBắp chân.\nBàn chân.\nTinh dầu.\nĐá nóng.',
    sortOrder: 3,
    imageUrl: 'https://images.unsplash.com/photo-1519014816548-bf5fe059798b?auto=format&fit=crop&w=1000&q=80'
  },
  {
    categoryName: 'Spa Foot',
    name: 'Spa Foot 90\'',
    durationMinutes: 90,
    price: 599000,
    shortDescription: 'Thư giãn chân cao cấp kết hợp đá nóng 90 phút.',
    detailedDescription: 'Ngâm chân.\nĐả thông kinh lạc vùng đùi.\nBắp chân.\nBàn chân.\nTinh dầu.\nĐá nóng.',
    sortOrder: 4,
    imageUrl: 'https://images.unsplash.com/photo-1515362778563-6a8d0e44bc0b?auto=format&fit=crop&w=1000&q=80'
  },

  // SPA BODY
  {
    categoryName: 'Spa Body',
    name: 'Spa Body 60\'',
    durationMinutes: 60,
    price: 399000,
    shortDescription: 'Thư giãn toàn thân cơ bản.',
    detailedDescription: 'Ngâm chân.\nXông hơi 15 phút.\nĐả thông kinh lạc toàn thân 60 phút.',
    sortOrder: 1,
    imageUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=1000&q=80'
  },
  {
    categoryName: 'Spa Body',
    name: 'Spa Body 75\'',
    durationMinutes: 75,
    price: 489000,
    shortDescription: 'Thư giãn toàn thân 75 phút.',
    detailedDescription: 'Ngâm chân.\nXông hơi 15 phút.\nĐả thông kinh lạc toàn thân 75 phút.',
    sortOrder: 2,
    imageUrl: 'https://images.unsplash.com/photo-1522337660859-02fbefca4702?auto=format&fit=crop&w=1000&q=80'
  },
  {
    categoryName: 'Spa Body',
    name: 'Spa Body + Đá Nóng 90\'',
    durationMinutes: 90,
    price: 579000,
    shortDescription: 'Thư giãn toàn thân kết hợp đá nóng.',
    detailedDescription: 'Ngâm chân.\nXông hơi 15 phút.\nĐả thông kinh lạc toàn thân 90 phút.\nĐá nóng.',
    sortOrder: 3,
    imageUrl: 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?auto=format&fit=crop&w=1000&q=80'
  },
  {
    categoryName: 'Spa Body',
    name: 'Spa Body + Đá Nóng 120\'',
    durationMinutes: 120,
    price: 769000,
    shortDescription: 'Thư giãn toàn thân chuyên sâu cao cấp.',
    detailedDescription: 'Ngâm chân.\nXông hơi 15 phút.\nĐả thông kinh lạc toàn thân 120 phút.\nĐá nóng.',
    sortOrder: 4,
    imageUrl: 'https://images.unsplash.com/photo-1610992015732-2449b76344bc?auto=format&fit=crop&w=1000&q=80'
  },

  // VIP LIST
  {
    categoryName: 'VIP List',
    name: 'Spa 4 Hands 60\'',
    durationMinutes: 60,
    price: 689000,
    shortDescription: '2 kỹ thuật viên thực hiện đồng thời.',
    detailedDescription: 'Massage toàn thân.\nĐá nóng.\nThư giãn chuyên sâu.',
    sortOrder: 1,
    imageUrl: 'https://images.unsplash.com/photo-1583416750470-965b2707b355?auto=format&fit=crop&w=1000&q=80'
  },
  {
    categoryName: 'VIP List',
    name: 'Spa 4 Hands 90\'',
    durationMinutes: 90,
    price: 979000,
    shortDescription: '2 kỹ thuật viên massage đồng bộ 90 phút.',
    detailedDescription: '2 kỹ thuật viên.\nMassage đồng bộ.\nĐá nóng.',
    sortOrder: 2,
    imageUrl: 'https://images.unsplash.com/photo-1599948128020-9a44505b0d1b?auto=format&fit=crop&w=1000&q=80'
  },
  {
    categoryName: 'VIP List',
    name: 'Spa 4 Hands 120\'',
    durationMinutes: 120,
    price: 1199000,
    shortDescription: 'Liệu trình VIP cao cấp với 2 kỹ thuật viên.',
    detailedDescription: 'Liệu trình VIP cao cấp.\n2 kỹ thuật viên thực hiện cùng lúc.\nĐá nóng toàn thân.',
    sortOrder: 3,
    imageUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1000&q=80'
  }
]

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

      // Clear existing services and categories
      await Service.deleteMany({ shopId: shop._id })
      await ServiceCategory.deleteMany({ shopId: shop._id })

      // Create new categories
      const categoryMap = {}
      for (const catDef of NEW_CATEGORIES) {
        const category = await ServiceCategory.create({
          shopId: shop._id,
          name: catDef.name,
          slug: catDef.slug,
          sortOrder: catDef.sortOrder,
          status: 'active'
        })
        categoryMap[catDef.name] = category._id
      }

      // Add services
      for (const item of NEW_SERVICES) {
        const categoryId = categoryMap[item.categoryName]
        if (!categoryId) {
          console.warn(`Warning: Category ${item.categoryName} not found!`)
          continue
        }

        const baseSlug = createSlug(item.name)
        let finalSlug = baseSlug
        let counter = 1
        while (await Service.exists({ shopId: shop._id, slug: finalSlug })) {
          finalSlug = `${baseSlug}-${counter++}`
        }

        await Service.create({
          shopId: shop._id,
          categoryId: categoryId,
          name: item.name,
          slug: finalSlug,
          description: item.shortDescription || item.name,
          shortDescription: item.shortDescription || item.name,
          detailedDescription: item.detailedDescription || item.name,
          price: item.price,
          durationMinutes: item.durationMinutes,
          imageUrl: item.imageUrl,
          status: 'active',
          availableStaffIds: staffIds,
          sortOrder: item.sortOrder
        })
      }

      console.log(`  Finished replacing services and categories for ${shopName}`)
    }

    console.log('Done successfully!')
    process.exit(0)
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

run()
