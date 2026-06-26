import mongoose from 'mongoose'
import dotenv from 'dotenv'
import { Shop } from '../src/models/schemas/shop.model.js'
import { Service } from '../src/models/schemas/service.model.js'
import { ServiceCategory } from '../src/models/schemas/serviceCategory.model.js'
import { ShopStaff } from '../src/models/schemas/shopStaff.model.js'
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/SpaBooking'

function createSlug(text) {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "")
}

const SHOP_ID = '6a2b9f6ec023a7dd207abba4' // Liên Facial Spa

const newServices = [
  {
    name: 'PERFECT',
    price: 249000,
    originalPrice: 450000,
    durationMinutes: 60,
    shortDescription: 'Làm sạch sâu, cấp ẩm và phục hồi hàng rào bảo vệ da.',
    detailedDescription: 'Tẩy trang\nRửa mặt\nTẩy tế bào chết\nHút bã nhờn\nĐắp tinh chất cấp ẩm\nĐiện di dưỡng chất\nMassage thư giãn\nMặt nạ phục hồi\nKem khóa ẩm\n\nPhù hợp:\nDa khô\nDa thiếu nước\nDa nhạy cảm\nChăm sóc định kỳ',
    sortOrder: 1
  },
  {
    name: 'RF',
    price: 249000,
    originalPrice: 750000,
    durationMinutes: 70,
    shortDescription: 'Nâng cơ, săn chắc da và cải thiện đường nét khuôn mặt.',
    detailedDescription: 'Làm sạch da\nMassage nâng cơ\nSóng RF\nKích thích collagen\nMặt nạ làm dịu\nSerum tái tạo\n\nPhù hợp:\nDa chảy xệ\nDa lão hóa nhẹ\nNgười trên 25 tuổi',
    sortOrder: 2
  },
  {
    name: 'HYCINIC',
    price: 249000,
    originalPrice: 650000,
    durationMinutes: 60,
    shortDescription: 'Trẻ hóa, làm đầy da và cải thiện nếp nhăn.',
    detailedDescription: 'Làm sạch\nTinh chất Hyaluronic\nĐiện di HA\nMassage nâng cơ\nĐắp mask collagen\n\nPhù hợp:\nDa khô\nDa có nếp nhăn nhỏ',
    sortOrder: 3
  },
  {
    name: 'HYDRA PEELING',
    price: 349000,
    originalPrice: 850000,
    durationMinutes: 75,
    shortDescription: 'Peel sinh học nhẹ giúp thay da an toàn và làm sáng da.',
    detailedDescription: 'Làm sạch\nPeel sinh học\nTrung hòa peel\nĐắp mặt nạ phục hồi\nĐiện di cấp ẩm\n\nPhù hợp:\nDa xỉn màu\nDa sần\nChăm sóc định kỳ',
    sortOrder: 4
  },
  {
    name: 'PRO SKIN',
    price: 379000,
    originalPrice: 1200000,
    durationMinutes: 90,
    shortDescription: 'Nặn mụn không kim, giảm thâm và làm sạch nhân mụn.',
    detailedDescription: 'Soi da\nXông nóng\nLàm mềm nhân\nLấy nhân mụn\nSát khuẩn\nPlasma lạnh\nĐắp mask kháng viêm\n\nPhù hợp:\nDa mụn\nDa dầu\nDa nhiều bít tắc',
    sortOrder: 5
  },
  {
    name: 'DETOX CARBON',
    price: 379000,
    originalPrice: 850000,
    durationMinutes: 80,
    shortDescription: 'Thanh lọc độc tố, làm sạch sâu và kích thích tuần hoàn da.',
    detailedDescription: 'Làm sạch\nThan hoạt tính\nCông nghệ Carbon\nThải độc da\nSerum phục hồi\n\nPhù hợp:\nDa dầu\nDa xỉn màu',
    sortOrder: 6
  },
  {
    name: 'TONING',
    price: 379000,
    originalPrice: 1200000,
    durationMinutes: 75,
    shortDescription: 'Hỗ trợ sáng da và làm mờ thâm sau mụn.',
    detailedDescription: 'Peel nhẹ\nSerum Vitamin C\nĐiện di dưỡng trắng\nMask sáng da\n\nPhù hợp:\nThâm mụn\nDa không đều màu',
    sortOrder: 7
  },
  {
    name: 'PLASMA COLD',
    price: 379000,
    originalPrice: 1000000,
    durationMinutes: 70,
    shortDescription: 'Kháng khuẩn, phục hồi tổn thương và giảm viêm.',
    detailedDescription: 'Plasma lạnh\nKháng khuẩn\nGiảm sưng đỏ\nTái tạo mô\n\nPhù hợp:\nSau nặn mụn\nDa nhạy cảm',
    sortOrder: 8
  },
  {
    name: 'CHEMICAL PEEL',
    price: 499000,
    originalPrice: 1200000,
    durationMinutes: 90,
    shortDescription: 'Peel hóa học cải thiện sắc tố và tái tạo bề mặt da.',
    detailedDescription: 'Soi da\nChọn nồng độ peel\nPeel hóa học\nTrung hòa\nMask phục hồi\n\nPhù hợp:\nThâm mụn\nSẹo nhẹ\nDa sần',
    sortOrder: 9
  },
  {
    name: 'FOTONA',
    price: 499000,
    originalPrice: 1200000,
    durationMinutes: 90,
    shortDescription: 'Công nghệ laser trẻ hóa, tái tạo collagen và thu nhỏ lỗ chân lông.',
    detailedDescription: 'Làm sạch\nChiếu laser Fotona\nSerum tái tạo\nMask phục hồi\n\nPhù hợp:\nDa lão hóa\nLỗ chân lông to',
    sortOrder: 10
  },
  {
    name: 'PICOSECOND',
    price: 499000,
    originalPrice: 1200000,
    durationMinutes: 90,
    shortDescription: 'Điều trị sắc tố, nám và tàn nhang bằng công nghệ Pico.',
    detailedDescription: 'Soi da\nBắn Pico\nLàm dịu da\nĐiện di phục hồi\nKem chống nắng chuyên dụng\n\nPhù hợp:\nNám\nTàn nhang\nĐốm nâu\nTăng sắc tố sau viêm',
    sortOrder: 11
  }
]

async function run() {
  try {
    console.log('Connecting to MongoDB...')
    await mongoose.connect(MONGODB_URI)
    console.log('Connected.')

    const shop = await Shop.findById(SHOP_ID)
    if (!shop) {
      console.log('Shop not found!')
      process.exit(1)
    }

    console.log('Deleting existing services for the shop...')
    await Service.deleteMany({ shopId: SHOP_ID })

    console.log('Ensuring "Chăm sóc da" category exists...')
    let category = await ServiceCategory.findOne({ shopId: SHOP_ID, name: 'Chăm sóc da' })
    if (!category) {
      category = await ServiceCategory.create({
        shopId: SHOP_ID,
        name: 'Chăm sóc da',
        slug: 'cham-soc-da',
        sortOrder: 1,
        status: 'active'
      })
      console.log('Created "Chăm sóc da" category.')
    }

    const staffs = await ShopStaff.find({ shopId: SHOP_ID })
    const staffIds = staffs.map(s => String(s._id))

    console.log('Creating new services...')
    for (const item of newServices) {
      const slug = createSlug(item.name)
      let finalSlug = slug
      let counter = 1
      while (await Service.exists({ shopId: SHOP_ID, slug: finalSlug })) {
        finalSlug = `${slug}-${counter++}`
      }

      await Service.create({
        shopId: SHOP_ID,
        categoryId: String(category._id),
        name: item.name,
        slug: finalSlug,
        description: item.shortDescription,
        shortDescription: item.shortDescription,
        detailedDescription: item.detailedDescription,
        price: item.price,
        originalPrice: item.originalPrice,
        durationMinutes: item.durationMinutes,
        imageUrl: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=1000&q=80',
        status: 'active',
        availableStaffIds: staffIds,
        sortOrder: item.sortOrder
      })
      console.log(`Created: ${item.name}`)
    }

    console.log('Done replacing services for Liên Facial Spa.')
    process.exit(0)
  } catch (err) {
    console.error('Error:', err)
    process.exit(1)
  }
}

run()
