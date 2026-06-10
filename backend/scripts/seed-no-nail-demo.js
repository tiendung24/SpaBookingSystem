import 'dotenv/config'
import dotenv from 'dotenv'
import bcrypt from 'bcryptjs'
import mongoose from 'mongoose'

import {
  Booking,
  BookingStatusLog,
  Deposit,
  PlatformFee,
  Service,
  Shop,
  ShopStaff,
  ShopWorkingHour,
  User,
  Wallet,
  WalletTransaction
} from '../src/models/index.js'

dotenv.config({ path: new URL('../.env', import.meta.url) })

const SERVICE_NAMES = [
  'Nhặt da + sửa form',
  'Phá sơn úp / đắp gel',
  'Cứng móng cao cấp',
  'Tạo cầu móng',
  'Úp base',
  'Fill gel',
  'Đắp gel móng thật',
  'Sơn biab',
  'Combo sơn gel / thạch',
  'French / Ombre'
]

const SERVICE_IMAGES = [
  'https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1632345031435-8727f6897d53?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1519014816548-bf5fe059798b?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1522337660859-02fbefca4702?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1610992015732-2449b76344bc?auto=format&fit=crop&w=1000&q=80',
  'https://diva.edu.vn/wp-content/uploads/2024/09/tho-nail-trang-tri-mong-cho-khach-hang.jpg',
  'https://images.unsplash.com/photo-1599948128020-9a44505b0d1b?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1000&q=80'
]

const STAFF = [
  {
    fullName: 'Ngọc An',
    phone: '0967504601',
    avatarUrl: 'https://cdn.pixabay.com/photo/2020/08/31/03/21/girl-5531217_1280.jpg',
    shortBio: 'Kỹ thuật viên chăm sóc da nhẹ nhàng, tỉ mỉ và rất hiểu làn da nhạy cảm.'
  },
  {
    fullName: 'Thảo Vy',
    phone: '0967504602',
    avatarUrl: 'https://diva.edu.vn/wp-content/uploads/2024/05/nen-hoc-nghe-spa-hay-nail-16.png',
    shortBio: 'Luôn tư vấn kỹ trước liệu trình, thao tác chuẩn và tạo cảm giác thư giãn.'
  },
  {
    fullName: 'Mai Linh',
    phone: '0967504603',
    avatarUrl: 'https://dulichtoday.vn/wp-content/uploads/2019/03/z4367698998285_3e5997f147f6803c63e3f13b3d0fd9f2.jpg',
    shortBio: 'Phong cách phục vụ chỉn chu, chú trọng trải nghiệm thoải mái cho khách.'
  }
]

const SHOP_DEF = {
  slug: 'no-nail',
  shopName: 'Nơ Nail',
  ownerName: 'Nơ Nail',
  email: 'nonail.lumix@gmail.com',
  phone: '0356460022',
  businessTypes: ['spa-salon'],
  balance: 400000,
  prices: [60000, 40000, 40000, 60000, 110000, 90000, 160000, 120000, 110000, 90000],
  coverUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80',
  address: {
    provinceId: '01',
    provinceName: 'Thành phố Hà Nội',
    communeId: 'thach-hoa',
    communeName: 'Thạch Hòa',
    detail: 'Nơ Nail',
    fullAddress: 'Nơ Nail, Thạch Hòa, Hà Nội'
  }
}

function serviceDescription(name) {
  return `${name} tại ${SHOP_DEF.shopName}, thao tác kỹ, sạch sẽ và chú trọng cảm giác thư giãn.`
}

async function connect() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI
  if (!uri) throw new Error('Missing MONGODB_URI')
  await mongoose.connect(uri)
}

async function removeExistingShopBundle() {
  const existing = await Shop.findOne({ slug: SHOP_DEF.slug }).lean()
  if (!existing) return

  const shopId = String(existing._id)
  const bookingIds = (await Booking.find({ shopId }).distinct('_id')).map(String)
  await Promise.all([
    BookingStatusLog.deleteMany({ bookingId: { $in: bookingIds } }),
    PlatformFee.deleteMany({ shopId }),
    WalletTransaction.deleteMany({ shopId }),
    Deposit.deleteMany({ shopId }),
    Booking.deleteMany({ shopId }),
    Service.deleteMany({ shopId }),
    ShopStaff.deleteMany({ shopId }),
    ShopWorkingHour.deleteMany({ shopId }),
    Wallet.deleteMany({ shopId }),
    User.deleteMany({ $or: [{ shopId }, { email: SHOP_DEF.email }] }),
    Shop.deleteMany({ _id: shopId })
  ])
}

async function seed() {
  await connect()
  await removeExistingShopBundle()

  const now = new Date('2026-06-10T18:30:00+07:00')
  const passwordHash = await bcrypt.hash('123456', 10)

  const user = await User.create({
    fullName: SHOP_DEF.ownerName,
    phone: SHOP_DEF.phone,
    email: SHOP_DEF.email,
    passwordHash,
    role: 'shop',
    status: 'active',
    createdAt: now,
    updatedAt: now
  })

  const shop = await Shop.create({
    ownerId: String(user._id),
    name: SHOP_DEF.shopName,
    slug: SHOP_DEF.slug,
    publicUrl: `/${SHOP_DEF.slug}`,
    phone: SHOP_DEF.phone,
    email: SHOP_DEF.email,
    address: SHOP_DEF.address,
    businessTypes: SHOP_DEF.businessTypes,
    description: `${SHOP_DEF.shopName} là tiệm nail tại Thạch Hòa, phục vụ chăm sóc sắc đẹp và thư giãn trên LumiX.`,
    logoUrl: '',
    coverUrl: SHOP_DEF.coverUrl,
    status: 'active',
    onlineBookingEnabled: true,
    depositConfig: { enabled: true, type: 'fixed', value: 50000, cancelHours: 4 },
    slotConfig: { slotDurationMinutes: 60, bookingAdvanceDays: 14 },
    notificationConfig: {},
    createdAt: now,
    updatedAt: now
  })

  user.shopId = String(shop._id)
  await user.save()

  const wallet = await Wallet.create({
    shopId: String(shop._id),
    balance: SHOP_DEF.balance,
    minBalance: 100000,
    escrowBalance: 0,
    status: 'active',
    updatedAt: now
  })

  await WalletTransaction.create({
    shopId: String(shop._id),
    walletId: String(wallet._id),
    type: 'seed_topup',
    amount: SHOP_DEF.balance,
    description: 'Seed số dư ví ban đầu',
    refId: `seed-wallet-${SHOP_DEF.slug}`,
    status: 'success',
    createdAt: now
  })

  await ShopWorkingHour.create({
    shopId: String(shop._id),
    openTime: '08:30',
    closeTime: '20:30',
    weekDays: [1, 2, 3, 4, 5, 6, 7],
    lunchBreakStart: '12:00',
    lunchBreakEnd: '13:00',
    slotDurationMinutes: 60,
    maxCustomersPerSlot: 1,
    createdAt: now,
    updatedAt: now
  })

  const services = []
  for (let index = 0; index < SERVICE_NAMES.length; index += 1) {
    const name = SERVICE_NAMES[index]
    services.push(await Service.create({
      shopId: String(shop._id),
      categoryId: '',
      name,
      slug: `${SHOP_DEF.slug}-${index + 1}`,
      description: serviceDescription(name),
      shortDescription: name,
      detailedDescription: serviceDescription(name),
      price: SHOP_DEF.prices[index],
      durationMinutes: 60,
      imageUrl: SERVICE_IMAGES[index],
      status: 'active',
      availableStaffIds: [],
      sortOrder: index + 1,
      createdAt: now,
      updatedAt: now
    }))
  }

  const staffList = []
  for (let index = 0; index < STAFF.length; index += 1) {
    const staffDef = STAFF[index]
    const staff = await ShopStaff.create({
      shopId: String(shop._id),
      userId: '',
      fullName: staffDef.fullName,
      phone: staffDef.phone,
      avatarUrl: staffDef.avatarUrl,
      shortBio: staffDef.shortBio,
      bio: `${staffDef.fullName} đồng hành cùng ${SHOP_DEF.shopName}, luôn ưu tiên sự dễ chịu, sạch sẽ và đúng giờ trong từng lịch hẹn.`,
      specialties: SHOP_DEF.businessTypes,
      role: 'tech',
      status: 'active',
      serviceIds: services.map((item) => String(item._id)),
      slotAssignments: [],
      experienceYears: 2 + index,
      rating: 4.8,
      createdAt: now,
      updatedAt: now
    })
    staffList.push(staff)
  }

  for (const service of services) {
    service.availableStaffIds = staffList.map((item) => String(item._id))
    await service.save()
  }

  console.log(JSON.stringify({
    shop: { id: String(shop._id), name: shop.name, slug: shop.slug, email: shop.email, phone: shop.phone },
    account: { email: SHOP_DEF.email, password: '123456' },
    wallet: SHOP_DEF.balance,
    services: services.length,
    staff: staffList.length,
    workingHours: '08:30-20:30'
  }, null, 2))
}

seed()
  .catch((err) => {
    console.error('[seed-no-nail-demo] failed', err)
    process.exitCode = 1
  })
  .finally(async () => {
    await mongoose.disconnect().catch(() => {})
  })
