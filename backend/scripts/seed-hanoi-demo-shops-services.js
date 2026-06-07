import 'dotenv/config'
import dotenv from 'dotenv'
import mongoose from 'mongoose'

import { connectDb, disconnectDb } from '../src/config/db.js'
import { Service, ServiceCategory, Shop } from '../src/models/index.js'

dotenv.config({ path: new URL('../.env', import.meta.url) })

const shopCoverImages = [
  'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1600334129128-685c5582fd35?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=1200&q=80',
]

const serviceImages = {
  nail: [
    'https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1632345031435-8727f6897d53?auto=format&fit=crop&w=1000&q=80',
  ],
  hairWash: [
    'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1000&q=80',
  ],
  skincare: [
    'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?auto=format&fit=crop&w=1000&q=80',
  ],
}

const hanoiAddresses = [
  ['124 Phố Huế', 'Phường Hai Bà Trưng'],
  ['45 Trần Duy Hưng', 'Phường Cầu Giấy'],
  ['88 Nguyễn Chí Thanh', 'Phường Giảng Võ'],
  ['12 Thái Hà', 'Phường Đống Đa'],
  ['201 Bà Triệu', 'Phường Hai Bà Trưng'],
  ['56 Nguyễn Trãi', 'Phường Thanh Xuân'],
  ['32 Hai Bà Trưng', 'Phường Cửa Nam'],
  ['18 Lý Thường Kiệt', 'Phường Hoàn Kiếm'],
  ['71 Kim Mã', 'Phường Giảng Võ'],
  ['25 Xuân Thủy', 'Phường Cầu Giấy'],
  ['90 Hoàng Quốc Việt', 'Phường Nghĩa Đô'],
  ['16 Bà Triệu', 'Phường Hoàn Kiếm'],
  ['29 Nguyễn Văn Huyên', 'Phường Nghĩa Đô'],
  ['110 Lạc Long Quân', 'Phường Tây Hồ'],
  ['42 Nguyễn Văn Cừ', 'Phường Long Biên'],
  ['68 Trần Phú', 'Phường Hà Đông'],
  ['15 Tô Hiệu', 'Phường Hà Đông'],
  ['99 Nguyễn Hoàng', 'Phường Từ Liêm'],
  ['22 Lê Văn Lương', 'Phường Thanh Xuân'],
  ['35 Hùng Vương', 'Phường Ba Đình'],
  ['77 Phan Đình Phùng', 'Phường Ba Đình'],
  ['11 Trần Quốc Toản', 'Phường Cửa Nam'],
  ['64 Nguyễn Khang', 'Phường Cầu Giấy'],
  ['28 Yên Phụ', 'Phường Tây Hồ'],
  ['81 Mậu Lương', 'Phường Hà Đông'],
  ['19 Điện Biên Phủ', 'Phường Ba Đình'],
  ['52 An Dương', 'Phường Tây Hồ'],
  ['40 Lê Duẩn', 'Phường Cửa Nam'],
  ['73 Nguyễn Hữu Thọ', 'Phường Hoàng Mai'],
  ['108 Lê Trọng Tấn', 'Phường Thanh Xuân'],
]

const shopSeeds = [
  ['urban-serenity-spa', 'Urban Serenity Spa', 'Spa & Beauty'],
  ['glow-nail-beauty', 'Glow Nail & Beauty', 'Nail & Beauty'],
  ['lumina-skin-center', 'Lumina Skin Center', 'Skincare'],
  ['artisan-hair-studio', 'Artisan Hair Studio', 'Gội đầu dưỡng sinh'],
  ['zenith-wellness', 'Zenith Wellness', 'Spa & Wellness'],
  ['velvet-beauty-loft', 'Velvet Beauty Loft', 'Beauty Studio'],
  ['purezen-spa', 'PureZen Spa', 'Spa'],
  ['hairlab-studio', 'HairLab Studio', 'Gội đầu dưỡng sinh'],
  ['glowup-clinic', 'GlowUp Clinic', 'Skincare'],
  ['auraskin-center', 'AuraSkin Center', 'Skincare'],
  ['elitecare-spa', 'EliteCare Spa', 'Spa'],
  ['diamond-nails', 'Diamond Nails', 'Nail'],
  ['bloom-beauty-house', 'Bloom Beauty House', 'Beauty'],
  ['ocean-sense-spa', 'Ocean Sense Spa', 'Spa'],
  ['muse-hair-lounge', 'Muse Hair Lounge', 'Gội đầu dưỡng sinh'],
  ['serene-nail-bar', 'Serene Nail Bar', 'Nail'],
  ['lavie-skincare', 'LaVie Skincare', 'Skincare'],
  ['sunset-wellness', 'Sunset Wellness', 'Spa & Wellness'],
  ['herbal-touch-spa', 'Herbal Touch Spa', 'Spa'],
  ['ruby-beauty-salon', 'Ruby Beauty Salon', 'Beauty'],
  ['moc-lan-spa', 'Mộc Lan Spa', 'Spa'],
  ['the-calm-room', 'The Calm Room', 'Spa & Wellness'],
  ['pearl-nail-studio', 'Pearl Nail Studio', 'Nail'],
  ['lotus-spa-cantho', 'Lotus Spa Hà Nội', 'Spa'],
  ['iris-skin-lab', 'Iris Skin Lab', 'Skincare'],
  ['golden-touch-beauty', 'Golden Touch Beauty', 'Beauty'],
  ['blue-moon-spa', 'Blue Moon Spa', 'Spa'],
  ['silk-hair-nail', 'Silk Hair & Nail', 'Nail & Gội đầu'],
  ['lotus-beauty-hue', 'Lotus Beauty Hà Nội', 'Beauty'],
  ['royal-skin-spa', 'Royal Skin Spa', 'Skincare'],
]

const serviceTemplates = [
  {
    category: 'Nail',
    slug: 'nail-gel-co-ban',
    name: 'Sơn gel cơ bản',
    price: 180000,
    durationMinutes: 60,
    imageUrl: serviceImages.nail[0],
    shortDescription: 'Sơn gel bền màu, làm sạch form móng gọn gàng.',
  },
  {
    category: 'Nail',
    slug: 'nail-art-design',
    name: 'Nail art thiết kế',
    price: 320000,
    durationMinutes: 90,
    imageUrl: serviceImages.nail[1],
    shortDescription: 'Trang trí móng theo mẫu, phù hợp đi chơi và dự tiệc.',
  },
  {
    category: 'Gội đầu dưỡng sinh',
    slug: 'goi-dau-duong-sinh-thu-gian',
    name: 'Gội đầu dưỡng sinh thư giãn',
    price: 220000,
    durationMinutes: 60,
    imageUrl: serviceImages.hairWash[0],
    shortDescription: 'Gội sạch sâu kết hợp massage đầu, cổ, vai gáy.',
  },
  {
    category: 'Gội đầu dưỡng sinh',
    slug: 'massage-co-vai-gay',
    name: 'Massage cổ vai gáy',
    price: 260000,
    durationMinutes: 60,
    imageUrl: serviceImages.hairWash[1],
    shortDescription: 'Giảm căng cơ vùng cổ vai gáy, giúp thư giãn nhẹ nhàng.',
  },
  {
    category: 'Chăm sóc da',
    slug: 'cham-soc-da-co-ban',
    name: 'Chăm sóc da cơ bản',
    price: 350000,
    durationMinutes: 60,
    imageUrl: serviceImages.skincare[0],
    shortDescription: 'Làm sạch, tẩy tế bào chết, cấp ẩm và phục hồi da.',
  },
  {
    category: 'Chăm sóc da',
    slug: 'detox-da-chuyen-sau',
    name: 'Detox da chuyên sâu',
    price: 520000,
    durationMinutes: 90,
    imageUrl: serviceImages.skincare[1],
    shortDescription: 'Làm sạch sâu, hút dầu thừa và cấp dưỡng phục hồi.',
  },
]

function makeAddress(detail, communeName, index) {
  return {
    provinceId: '01',
    provinceName: 'Thành phố Hà Nội',
    communeId: `hanoi-demo-${String(index + 1).padStart(2, '0')}`,
    communeName,
    detail,
    fullAddress: [detail, communeName, 'Thành phố Hà Nội'].join(', '),
  }
}

function makeShop([slug, name, businessType], index) {
  const [detail, communeName] = hanoiAddresses[index]
  const now = Date.now()
  const updatedAt = new Date(now - index * 60 * 60 * 1000)
  const createdAt = new Date(now - (index + 30) * 24 * 60 * 60 * 1000)

  return {
    ownerId: `demo-owner-${index + 1}`,
    name,
    slug,
    publicUrl: `/${slug}`,
    phone: `09${String(12000000 + index * 13729).slice(0, 8)}`,
    email: `${slug}@demo.lumix.vn`,
    address: makeAddress(detail, communeName, index),
    businessTypes: [businessType],
    description: `${name} là cửa hàng demo tại Hà Nội trên LumiX, chuyên các dịch vụ nail, gội đầu dưỡng sinh và chăm sóc da với không gian thư giãn, sạch đẹp.`,
    logoUrl: '',
    coverUrl: shopCoverImages[index % shopCoverImages.length],
    status: 'active',
    onlineBookingEnabled: true,
    bankInfo: {},
    depositConfig: { enabled: true, type: 'fixed', value: 50000, cancelHours: 4 },
    slotConfig: { slotDurationMinutes: 30, bookingAdvanceDays: 14 },
    fraudConfig: {},
    stats: { rating: 4.6 + (index % 4) * 0.1, bookingCount: 80 + index * 17 },
    notificationConfig: {},
    createdAt,
    updatedAt,
  }
}

async function upsertCategories(shopId, now) {
  const categories = ['Nail', 'Gội đầu dưỡng sinh', 'Chăm sóc da']
  const categoryMap = new Map()

  for (const [index, name] of categories.entries()) {
    const slug = name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')

    const category = await ServiceCategory.findOneAndUpdate(
      { shopId, slug },
      {
        $set: { shopId, name, slug, sortOrder: index + 1, status: 'active', updatedAt: now },
        $setOnInsert: { createdAt: now },
      },
      { upsert: true, new: true },
    ).lean()

    categoryMap.set(name, String(category._id))
  }

  return categoryMap
}

async function upsertServices(shopId, categoryMap, now) {
  const operations = serviceTemplates.map((service, index) => ({
    updateOne: {
      filter: { shopId, slug: service.slug },
      update: {
        $set: {
          shopId,
          categoryId: categoryMap.get(service.category),
          name: service.name,
          slug: service.slug,
          description: service.shortDescription,
          shortDescription: service.shortDescription,
          detailedDescription: `${service.shortDescription} Dịch vụ được chuẩn bị cho dữ liệu demo LumiX tại Hà Nội.`,
          price: service.price,
          durationMinutes: service.durationMinutes,
          imageUrl: service.imageUrl,
          status: 'active',
          availableStaffIds: [],
          sortOrder: index + 1,
          updatedAt: now,
        },
        $setOnInsert: { createdAt: now },
      },
      upsert: true,
    },
  }))

  return Service.bulkWrite(operations)
}

async function main() {
  await connectDb()
  const now = new Date()
  const shops = shopSeeds.map(makeShop)

  const shopResult = await Shop.bulkWrite(
    shops.map((shop) => ({
      updateOne: {
        filter: { slug: shop.slug },
        update: { $set: shop, $setOnInsert: { _id: new mongoose.Types.ObjectId().toString() } },
        upsert: true,
      },
    })),
  )

  let serviceUpserted = 0
  let serviceModified = 0

  for (const shop of shops) {
    const savedShop = await Shop.findOne({ slug: shop.slug }).select({ _id: 1 }).lean()
    const shopId = String(savedShop._id)
    const categoryMap = await upsertCategories(shopId, now)
    const serviceResult = await upsertServices(shopId, categoryMap, now)
    serviceUpserted += Number(serviceResult.upsertedCount || 0)
    serviceModified += Number(serviceResult.modifiedCount || 0)
  }

  console.log('[seed] hanoi demo shops/services completed', {
    shopsMatched: shopResult.matchedCount,
    shopsModified: shopResult.modifiedCount,
    shopsUpserted: shopResult.upsertedCount,
    shopsTotal: shops.length,
    servicesUpserted: serviceUpserted,
    servicesModified: serviceModified,
    servicesTotal: shops.length * serviceTemplates.length,
  })
}

main()
  .catch((error) => {
    console.error('[seed] hanoi demo shops/services failed:', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await disconnectDb()
  })
