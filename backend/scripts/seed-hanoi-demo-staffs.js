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
    avatarUrl: 'https://source.unsplash.com/600x600/?vietnamese,woman,portrait,spa',
    specialties: ['Nail', 'Chăm sóc da'],
    experienceYears: 5,
    rating: 4.8,
  },
  {
    fullName: 'Mai Trần',
    avatarUrl: 'https://source.unsplash.com/600x600/?vietnamese,woman,portrait,beauty',
    specialties: ['Gội đầu dưỡng sinh', 'Massage cổ vai gáy'],
    experienceYears: 4,
    rating: 4.7,
  },
  {
    fullName: 'Hương Phạm',
    avatarUrl: 'https://source.unsplash.com/600x600/?vietnamese,woman,portrait,skincare',
    specialties: ['Chăm sóc da', 'Detox da'],
    experienceYears: 6,
    rating: 4.9,
  },
  {
    fullName: 'Ngọc Anh',
    avatarUrl: 'https://source.unsplash.com/600x600/?vietnamese,woman,portrait,salon',
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
          shortBio: `${profile.fullName} luôn nhẹ nhàng, tỉ mỉ và tư vấn dịch vụ phù hợp với nhu cầu của từng khách hàng.`,
          bio: `${profile.fullName} có kinh nghiệm chăm sóc khách hàng trong lĩnh vực làm đẹp tại Hà Nội, nổi bật với phong cách phục vụ chu đáo, thao tác kỹ và gu thẩm mỹ tinh tế.`,
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

