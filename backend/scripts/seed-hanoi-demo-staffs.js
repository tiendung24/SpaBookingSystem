import 'dotenv/config'
import dotenv from 'dotenv'

import { connectDb, disconnectDb } from '../src/config/db.js'
import { Service, Shop, ShopStaff, ShopWorkingHour } from '../src/models/index.js'

dotenv.config({ path: new URL('../.env', import.meta.url) })

const demoShopSlugs = [
  'urban-serenity-spa', 'glow-nail-beauty', 'lumina-skin-center', 'artisan-hair-studio', 'zenith-wellness',
  'velvet-beauty-loft', 'purezen-spa', 'hairlab-studio', 'glowup-clinic', 'auraskin-center',
  'elitecare-spa', 'diamond-nails', 'bloom-beauty-house', 'ocean-sense-spa', 'muse-hair-lounge',
  'serene-nail-bar', 'lavie-skincare', 'sunset-wellness', 'herbal-touch-spa', 'ruby-beauty-salon',
  'moc-lan-spa', 'the-calm-room', 'pearl-nail-studio', 'lotus-spa-cantho', 'iris-skin-lab',
  'golden-touch-beauty', 'blue-moon-spa', 'silk-hair-nail', 'lotus-beauty-hue', 'royal-skin-spa',
]

const staffProfiles = [
  {
    fullName: 'Linh Nguyễn',
    avatarUrl: 'https://baothainguyen.vn/file/e7837c027f6ecd14017ffa4e5f2a0e34/052023/picture63_20230509163719.jpg',
    shortBio: 'Khéo léo với các dịch vụ nail và luôn chú trọng từng chi tiết nhỏ để mang lại cảm giác chỉn chu, tinh tế.',
    bio: 'Linh Nguyễn có kinh nghiệm chăm sóc khách hàng trong lĩnh vực làm đẹp tại Hà Nội, nổi bật với phong cách phục vụ chu đáo, thao tác kỹ và gu thẩm mỹ tinh tế.',
    specialties: ['Nail', 'Chăm sóc da'],
    experienceYears: 5,
    rating: 4.8,
  },
  {
    fullName: 'Mai Trần',
    avatarUrl: 'https://image.phunuonline.com.vn/fckeditor/upload/2021/20211024/images/lich-su-nganh-nail-va-nghe-_331635058283.jpg',
    shortBio: 'Có thế mạnh ở gội đầu dưỡng sinh, massage êm và nhịp chăm sóc nhẹ nhàng giúp khách thư giãn rõ rệt.',
    bio: 'Mai Trần được nhiều khách yêu thích nhờ sự nhẹ nhàng, chỉn chu và cảm giác thư thái trong từng liệu trình chăm sóc tóc và da đầu.',
    specialties: ['Gội đầu dưỡng sinh', 'Massage cổ vai gáy'],
    experienceYears: 4,
    rating: 4.7,
  },
  {
    fullName: 'Hương Phạm',
    avatarUrl: 'https://kenh14cdn.com/2019/3/20/15515744203550318-15530757538691590261383.jpg',
    shortBio: 'Tư vấn chăm sóc da kỹ, thao tác sạch sẽ và phù hợp với khách muốn phục hồi, cấp ẩm hoặc làm dịu da.',
    bio: 'Hương Phạm có nhiều kinh nghiệm trong chăm sóc da và detox da chuyên sâu, luôn ưu tiên sự an toàn, sạch sẽ và hiệu quả bền vững cho làn da.',
    specialties: ['Chăm sóc da', 'Detox da'],
    experienceYears: 6,
    rating: 4.9,
  },
  {
    fullName: 'Ngọc Anh',
    avatarUrl: 'https://diva.edu.vn/wp-content/uploads/2024/09/tho-nail-trang-tri-mong-cho-khach-hang.jpg',
    shortBio: 'Phong cách trẻ trung, gu thẩm mỹ hiện đại và đặc biệt hợp với khách thích nail art hoặc trải nghiệm thư giãn nhẹ.',
    bio: 'Ngọc Anh mang đến trải nghiệm làm đẹp trẻ trung, tinh tế và gần gũi, phù hợp với khách thích sự mềm mại, tự nhiên nhưng vẫn nổi bật.',
    specialties: ['Nail art', 'Gội đầu dưỡng sinh'],
    experienceYears: 3,
    rating: 4.6,
  },
]

function makePhone(shopIndex, staffIndex) {
  return '08' + String(60000000 + shopIndex * 1000 + staffIndex * 17).slice(0, 8)
}

async function upsertStaffsForShop(shop, shopIndex, services, now) {
  const serviceIds = services.map((service) => String(service._id))
  const staffIds = []

  for (const [staffIndex, profile] of staffProfiles.entries()) {
    const staffKey = `demo-staff-${shop.slug}-${staffIndex + 1}`
    const staff = await ShopStaff.findOneAndUpdate(
      { shopId: String(shop._id), userId: staffKey },
      {
        $set: {
          shopId: String(shop._id),
          userId: staffKey,
          fullName: profile.fullName,
          phone: makePhone(shopIndex, staffIndex),
          avatarUrl: profile.avatarUrl,
          shortBio: profile.shortBio,
          bio: profile.bio,
          specialties: profile.specialties,
          role: 'tech',
          status: 'active',
          serviceIds,
          slotAssignments: [],
          experienceYears: profile.experienceYears,
          rating: profile.rating,
          updatedAt: now,
        },
        $setOnInsert: { createdAt: now },
      },
      { upsert: true, new: true },
    ).lean()

    staffIds.push(String(staff._id))
  }

  await Service.updateMany(
    { shopId: String(shop._id), _id: { $in: serviceIds } },
    { $set: { availableStaffIds: staffIds, updatedAt: now } },
  )

  await ShopWorkingHour.findOneAndUpdate(
    { shopId: String(shop._id) },
    {
      $set: {
        shopId: String(shop._id),
        openTime: '09:00',
        closeTime: '20:00',
        weekDays: [1, 2, 3, 4, 5, 6, 0],
        lunchBreakStart: '',
        lunchBreakEnd: '',
        slotDurationMinutes: 15,
        maxCustomersPerSlot: 4,
        updatedAt: now,
      },
      $setOnInsert: { createdAt: now },
    },
    { upsert: true, new: true },
  )

  return staffIds.length
}

async function main() {
  await connectDb()
  const now = new Date()
  const shops = await Shop.find({ slug: { $in: demoShopSlugs } }).sort({ updatedAt: -1 }).lean()

  if (shops.length !== demoShopSlugs.length) {
    console.warn('[seed] expected demo shops:', demoShopSlugs.length, 'found:', shops.length)
  }

  let staffTotal = 0
  let servicesUpdated = 0

  for (const [shopIndex, shop] of shops.entries()) {
    const services = await Service.find({ shopId: String(shop._id), status: 'active' }).select({ _id: 1 }).lean()
    if (!services.length) {
      console.warn('[seed] skip shop without services:', shop.slug)
      continue
    }

    staffTotal += await upsertStaffsForShop(shop, shopIndex, services, now)
    servicesUpdated += services.length
  }

  console.log('[seed] hanoi staffs completed', {
    shops: shops.length,
    staffsTotal: staffTotal,
    servicesUpdated,
    staffsPerShop: staffProfiles.length,
    fullSlotMode: 'slotAssignments empty + active + maxCustomersPerSlot 4',
  })
}

main()
  .catch((error) => {
    console.error('[seed] hanoi staffs failed:', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await disconnectDb()
  })

