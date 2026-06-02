import 'dotenv/config'
import dotenv from 'dotenv'
import mongoose from 'mongoose'

import { connectDb, disconnectDb } from '../src/config/db.js'
import { Shop } from '../src/models/index.js'

dotenv.config({ path: new URL('../.env', import.meta.url) })

const coverImages = [
  'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1600334129128-685c5582fd35?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=1200&q=80',
]

const shopSeeds = [
  ['urban-serenity-spa', 'Urban Serenity Spa', 'Spa', '124 Lê Lợi', 'Phường Sài Gòn', 'Thành phố Hồ Chí Minh'],
  ['glow-nail-beauty', 'Glow Nail & Beauty', 'Nail', '45 Thảo Điền', 'Phường An Khánh', 'Thành phố Hồ Chí Minh'],
  ['lumina-skin-center', 'Lumina Skin Center', 'Skincare', '88 Nguyễn Huệ', 'Phường Sài Gòn', 'Thành phố Hồ Chí Minh'],
  ['artisan-hair-studio', 'Artisan Hair Studio', 'Hair Salon', '12 Phan Xích Long', 'Phường Gia Định', 'Thành phố Hồ Chí Minh'],
  ['zenith-wellness', 'Zenith Wellness', 'Massage', '201 Võ Văn Tần', 'Phường Xuân Hòa', 'Thành phố Hồ Chí Minh'],
  ['velvet-beauty-loft', 'Velvet Beauty Loft', 'Beauty', '56 Trần Hưng Đạo', 'Phường Chợ Quán', 'Thành phố Hồ Chí Minh'],
  ['purezen-spa', 'PureZen Spa', 'Spa', '32 Hai Bà Trưng', 'Phường Cửa Nam', 'Thành phố Hà Nội'],
  ['hairlab-studio', 'HairLab Studio', 'Hair Salon', '18 Lý Thường Kiệt', 'Phường Hoàn Kiếm', 'Thành phố Hà Nội'],
  ['glowup-clinic', 'GlowUp Clinic', 'Skincare', '71 Nguyễn Chí Thanh', 'Phường Giảng Võ', 'Thành phố Hà Nội'],
  ['auraskin-center', 'AuraSkin Center', 'Skincare', '25 Trần Duy Hưng', 'Phường Cầu Giấy', 'Thành phố Hà Nội'],
  ['elitecare-spa', 'EliteCare Spa', 'Spa', '90 Xuân Thủy', 'Phường Cầu Giấy', 'Thành phố Hà Nội'],
  ['diamond-nails', 'Diamond Nails', 'Nail', '16 Bà Triệu', 'Phường Hoàn Kiếm', 'Thành phố Hà Nội'],
  ['bloom-beauty-house', 'Bloom Beauty House', 'Beauty', '29 Võ Nguyên Giáp', 'Phường An Hải', 'Thành phố Đà Nẵng'],
  ['ocean-sense-spa', 'Ocean Sense Spa', 'Spa', '110 Hoàng Sa', 'Phường Sơn Trà', 'Thành phố Đà Nẵng'],
  ['muse-hair-lounge', 'Muse Hair Lounge', 'Hair Salon', '42 Nguyễn Văn Linh', 'Phường Hải Châu', 'Thành phố Đà Nẵng'],
  ['serene-nail-bar', 'Serene Nail Bar', 'Nail', '68 Trần Phú', 'Phường Hải Châu', 'Thành phố Đà Nẵng'],
  ['lavie-skincare', 'LaVie Skincare', 'Skincare', '15 Nguyễn Trãi', 'Phường Nha Trang', 'Tỉnh Khánh Hòa'],
  ['sunset-wellness', 'Sunset Wellness', 'Massage', '99 Trần Phú', 'Phường Nha Trang', 'Tỉnh Khánh Hòa'],
  ['herbal-touch-spa', 'Herbal Touch Spa', 'Spa', '22 Lê Thánh Tôn', 'Phường Nha Trang', 'Tỉnh Khánh Hòa'],
  ['ruby-beauty-salon', 'Ruby Beauty Salon', 'Beauty', '35 Hùng Vương', 'Phường Đà Lạt', 'Tỉnh Lâm Đồng'],
  ['moc-lan-spa', 'Mộc Lan Spa', 'Spa', '77 Phan Đình Phùng', 'Phường Đà Lạt', 'Tỉnh Lâm Đồng'],
  ['the-calm-room', 'The Calm Room', 'Massage', '11 Trần Quốc Toản', 'Phường Đà Lạt', 'Tỉnh Lâm Đồng'],
  ['pearl-nail-studio', 'Pearl Nail Studio', 'Nail', '64 Nguyễn Văn Cừ', 'Phường Ninh Kiều', 'Thành phố Cần Thơ'],
  ['lotus-spa-cantho', 'Lotus Spa Cần Thơ', 'Spa', '28 Hai Bà Trưng', 'Phường Ninh Kiều', 'Thành phố Cần Thơ'],
  ['iris-skin-lab', 'Iris Skin Lab', 'Skincare', '81 Mậu Thân', 'Phường Ninh Kiều', 'Thành phố Cần Thơ'],
  ['golden-touch-beauty', 'Golden Touch Beauty', 'Beauty', '19 Điện Biên Phủ', 'Phường Quy Nhơn', 'Tỉnh Gia Lai'],
  ['blue-moon-spa', 'Blue Moon Spa', 'Spa', '52 An Dương Vương', 'Phường Quy Nhơn', 'Tỉnh Gia Lai'],
  ['silk-hair-nail', 'Silk Hair & Nail', 'Hair Salon', '40 Lê Duẩn', 'Phường Huế', 'Thành phố Huế'],
  ['lotus-beauty-hue', 'Lotus Beauty Huế', 'Beauty', '73 Nguyễn Huệ', 'Phường Huế', 'Thành phố Huế'],
  ['royal-skin-spa', 'Royal Skin Spa', 'Spa', '108 Lê Hồng Phong', 'Phường Vũng Tàu', 'Thành phố Hồ Chí Minh'],
]

function makeAddress(detail, communeName, provinceName, index) {
  return {
    provinceId: `demo-province-${index + 1}`,
    provinceName,
    communeId: `demo-commune-${index + 1}`,
    communeName,
    detail,
    fullAddress: [detail, communeName, provinceName].filter(Boolean).join(', '),
  }
}

function makeShop([slug, name, businessType, detail, communeName, provinceName], index) {
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
    address: makeAddress(detail, communeName, provinceName, index),
    businessTypes: [businessType],
    description: `${name} là cửa hàng demo trên LumiX, chuyên cung cấp dịch vụ ${businessType.toLowerCase()} với không gian thư giãn và đội ngũ chuyên nghiệp.`,
    logoUrl: '',
    coverUrl: coverImages[index % coverImages.length],
    status: 'active',
    onlineBookingEnabled: true,
    bankInfo: {},
    depositConfig: { enabled: false, percent: 0 },
    slotConfig: { slotDurationMinutes: 30, bookingAdvanceDays: 14 },
    fraudConfig: {},
    stats: { rating: 4.6 + (index % 4) * 0.1, bookingCount: 80 + index * 17 },
    notificationConfig: {},
    createdAt,
    updatedAt,
  }
}

async function main() {
  await connectDb()

  const shops = shopSeeds.map(makeShop)
  const result = await Shop.bulkWrite(
    shops.map((shop) => ({
      updateOne: {
        filter: { slug: shop.slug },
        update: { $set: shop, $setOnInsert: { _id: new mongoose.Types.ObjectId().toString() } },
        upsert: true,
      },
    })),
  )

  console.log('[seed] fake shops completed', {
    matched: result.matchedCount,
    modified: result.modifiedCount,
    upserted: result.upsertedCount,
    total: shops.length,
  })
}

main()
  .catch((error) => {
    console.error('[seed] fake shops failed:', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await disconnectDb()
  })
