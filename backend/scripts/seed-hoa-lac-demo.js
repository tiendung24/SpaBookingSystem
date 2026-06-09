import 'dotenv/config'
import dotenv from 'dotenv'
import bcrypt from 'bcryptjs'
import mongoose from 'mongoose'

import { connectDb, disconnectDb } from '../src/config/db.js'
import {
  Booking,
  BookingStatusLog,
  Customer,
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

const FALLBACK_COVER = 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=1200&q=80'
const FALLBACK_SERVICE_IMAGES = [
  'https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1632345031435-8727f6897d53?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=1000&q=80'
]
const STAFF_IMAGES = [
  'https://cdn.pixabay.com/photo/2020/08/31/03/21/girl-5531217_1280.jpg',
  'https://media.baocaobang.vn/upload/image/202207/medium/97102_lam%20mong.jpg',
  'https://image.phunuonline.com.vn/fckeditor/upload/2021/20211024/images/lich-su-nganh-nail-va-nghe-_331635058283.jpg',
  'https://static.hotdeal.vn/images/1564/1564128/60x60/352742-combo-lam-nails-7-buoc-duong-mong-xinh-tai-abe-nail.jpg',
  'https://diva.edu.vn/wp-content/uploads/2024/05/nen-hoc-nghe-spa-hay-nail-16.png',
  'https://dulichtoday.vn/wp-content/uploads/2019/03/z4367698998285_3e5997f147f6803c63e3f13b3d0fd9f2.jpg',
  'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ-VsXIde6jHwkfK11HpwwlQAG99ofKZDhHuQ&s'
]

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

const SHOP_DEFS = [
  {
    slug: 'vanlavi',
    shopName: 'VanLavi',
    ownerName: 'Vân Lavi',
    email: 'vanlavi@lumix',
    phone: '0981591604',
    businessTypes: ['nail'],
    address: {
      provinceId: '01', provinceName: 'Thành phố Hà Nội', communeId: 'hoa-lac-1', communeName: 'Hòa Lạc', detail: 'Hòa Lạc (Gần điện máy xanh)', fullAddress: 'Hòa Lạc (Gần điện máy xanh), Hòa Lạc, Thành phố Hà Nội'
    },
    balance: 500000,
    staffCount: 3,
    bookingCount: 2,
    prices: [50000, 30000, 30000, 50000, 100000, 80000, 150000, 110000, 100000, 80000],
    customer: { fullName: 'Khách VanLavi', phone: '0911111111', email: 'khach.vanlavi@lumix.fake' },
    bookingStarts: ['2026-06-09T09:30:00+07:00', '2026-06-10T14:00:00+07:00']
  },
  {
    slug: 'tiem-nail-minh-huyen',
    shopName: 'Tiệm Nail Minh Huyền',
    ownerName: 'Nguyễn Minh Huyền',
    email: 'minhhuyen@lumix',
    phone: '0975211435',
    businessTypes: ['nail'],
    address: {
      provinceId: '01', provinceName: 'Thành phố Hà Nội', communeId: 'hoa-lac-2', communeName: 'Hòa Lạc', detail: 'Quán điện thoại Nam Anh gần cổng phụ FPT', fullAddress: 'Quán điện thoại Nam Anh gần cổng phụ FPT, Hòa Lạc, Thành phố Hà Nội'
    },
    balance: 300000,
    staffCount: 2,
    bookingCount: 1,
    prices: [55000, 35000, 35000, 55000, 105000, 85000, 155000, 115000, 105000, 85000],
    customer: { fullName: 'Khách Minh Huyền', phone: '0922222222', email: 'khach.minhhuyen@lumix.fake' },
    bookingStarts: ['2026-06-09T10:30:00+07:00']
  },
  {
    slug: 'spa-thu-trang',
    shopName: 'Spa Thu Trang',
    ownerName: 'Thu Trang',
    email: 'thutrang@lumix',
    phone: '0343751247',
    businessTypes: ['spa-salon'],
    address: {
      provinceId: '01', provinceName: 'Thành phố Hà Nội', communeId: 'hoa-lac-3', communeName: 'Hòa Lạc', detail: 'Số 18 Khu TĐC Bắc, Hòa Lạc, Hà Nội', fullAddress: 'Số 18 Khu TĐC Bắc, Hòa Lạc, Hà Nội, Hòa Lạc, Thành phố Hà Nội'
    },
    balance: 400000,
    staffCount: 2,
    bookingCount: 1,
    prices: [60000, 40000, 40000, 60000, 110000, 90000, 160000, 120000, 110000, 90000],
    customer: { fullName: 'Khách Thu Trang', phone: '0933333333', email: 'khach.thutrang@lumix.fake' },
    bookingStarts: ['2026-06-10T15:00:00+07:00']
  }
]

function makeCode(shopSlug, index) {
  return `${shopSlug.replace(/-/g, '').toUpperCase().slice(0, 6)}-${String(index + 1).padStart(3, '0')}`
}

function serviceDescription(name, shopName) {
  return `${name} tại ${shopName}, thao tác kỹ, sạch và bền màu.`
}

async function removeExistingShopBundle(shop) {
  const existing = await Shop.findOne({ slug: shop.slug }).lean()
  if (!existing) return null
  const shopId = String(existing._id)
  await Promise.all([
    BookingStatusLog.deleteMany({ bookingId: { $in: (await Booking.find({ shopId }).distinct('_id')).map(String) } }),
    PlatformFee.deleteMany({ shopId }),
    WalletTransaction.deleteMany({ shopId }),
    Deposit.deleteMany({ shopId }),
    Booking.deleteMany({ shopId }),
    Service.deleteMany({ shopId }),
    ShopStaff.deleteMany({ shopId }),
    ShopWorkingHour.deleteMany({ shopId }),
    Wallet.deleteMany({ shopId }),
    User.deleteMany({ $or: [{ shopId }, { email: shop.email }] }),
    Shop.deleteMany({ _id: shopId })
  ])
  return shopId
}

async function seedOneShop(def, shopIndex) {
  await removeExistingShopBundle(def)
  const now = new Date('2026-06-10T18:30:00+07:00')
  const passwordHash = await bcrypt.hash('123456', 10)

  const user = await User.create({
    fullName: def.ownerName,
    phone: def.phone,
    email: def.email,
    passwordHash,
    role: 'shop',
    status: 'active',
    createdAt: now,
    updatedAt: now
  })

  const shop = await Shop.create({
    ownerId: String(user._id),
    name: def.shopName,
    slug: def.slug,
    publicUrl: `/${def.slug}`,
    phone: def.phone,
    email: def.email,
    address: def.address,
    businessTypes: def.businessTypes,
    description: `${def.shopName} là cửa hàng demo tại Hòa Lạc, phục vụ khách đặt lịch trên LumiX.`,
    logoUrl: '',
    coverUrl: FALLBACK_COVER,
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
    balance: def.balance,
    minBalance: 100000,
    escrowBalance: 0,
    status: 'active',
    updatedAt: now
  })

  await WalletTransaction.create({
    shopId: String(shop._id),
    walletId: String(wallet._id),
    type: 'seed_topup',
    amount: def.balance,
    description: 'Seed số dư ví ban đầu',
    refId: `seed-wallet-${def.slug}`,
    status: 'success',
    createdAt: now
  })

  await ShopWorkingHour.create({
    shopId: String(shop._id),
    openTime: '08:30',
    closeTime: '20:00',
    weekDays: [1, 2, 3, 4, 5, 6, 7],
    lunchBreakStart: '12:00',
    lunchBreakEnd: '13:00',
    slotDurationMinutes: 60,
    maxCustomersPerSlot: 1,
    createdAt: now,
    updatedAt: now
  })

  const services = []
  for (let i = 0; i < SERVICE_NAMES.length; i += 1) {
    services.push(await Service.create({
      shopId: String(shop._id),
      categoryId: '',
      name: SERVICE_NAMES[i],
      slug: `${def.slug}-${i + 1}`,
      description: serviceDescription(SERVICE_NAMES[i], def.shopName),
      shortDescription: SERVICE_NAMES[i],
      detailedDescription: serviceDescription(SERVICE_NAMES[i], def.shopName),
      price: def.prices[i],
      durationMinutes: 60,
      imageUrl: FALLBACK_SERVICE_IMAGES[i % FALLBACK_SERVICE_IMAGES.length],
      status: 'active',
      availableStaffIds: [],
      sortOrder: i + 1,
      createdAt: now,
      updatedAt: now
    }))
  }

  const staffList = []
  for (let i = 0; i < def.staffCount; i += 1) {
    const staff = await ShopStaff.create({
      shopId: String(shop._id),
      userId: '',
      fullName: `${def.ownerName.split(' ')[0]} ${['An', 'Vy', 'Linh', 'Trang', 'My', 'Lan', 'Ngọc'][shopIndex + i]}`,
      phone: '',
      avatarUrl: STAFF_IMAGES[(shopIndex * 2 + i) % STAFF_IMAGES.length],
      shortBio: `Kỹ thuật viên ${def.businessTypes[0] === 'spa-salon' ? 'chăm sóc thư giãn' : 'nail'} tỉ mỉ và giàu kinh nghiệm.`,
      bio: `Nhân sự nòng cốt của ${def.shopName}, phong cách phục vụ nhẹ nhàng, chỉn chu và đúng giờ.`,
      specialties: def.businessTypes,
      role: 'tech',
      status: 'active',
      serviceIds: services.map((item) => String(item._id)),
      slotAssignments: [],
      experienceYears: 2 + i,
      rating: 4.7,
      createdAt: now,
      updatedAt: now
    })
    staffList.push(staff)
  }

  for (const service of services) {
    service.availableStaffIds = staffList.map((item) => String(item._id))
    await service.save()
  }

  const customer = await Customer.findOneAndUpdate(
    { email: def.customer.email },
    {
      $set: {
        fullName: def.customer.fullName,
        phone: def.customer.phone,
        email: def.customer.email,
        updatedAt: now
      },
      $setOnInsert: { createdAt: now }
    },
    { upsert: true, new: true }
  )

  for (let i = 0; i < def.bookingCount; i += 1) {
    const start = new Date(def.bookingStarts[i])
    const end = new Date(start.getTime() + 60 * 60 * 1000)
    const createdAt = new Date(start.getTime() - 2 * 60 * 60 * 1000)
    const checkedInAt = new Date(start.getTime() + 5 * 60 * 1000)
    const completedAt = new Date(end.getTime())
    const service = services[i % services.length]
    const staff = staffList[i % staffList.length]
    const bookingCode = makeCode(def.slug, i)

    const booking = await Booking.create({
      bookingCode,
      clientAttemptId: `seed-${def.slug}-${i + 1}`,
      shopId: String(shop._id),
      customerId: String(customer._id),
      customerName: customer.fullName,
      customerPhone: customer.phone,
      customerEmail: customer.email,
      serviceId: String(service._id),
      staffId: String(staff._id),
      startTime: start,
      endTime: end,
      note: 'Seed booking completed',
      status: 'completed',
      depositExpiresAt: new Date(createdAt.getTime() + 30 * 60 * 1000),
      depositAmount: 50000,
      originalDepositAmount: 50000,
      totalAmount: Number(service.price || 0),
      createdAt,
      updatedAt: completedAt
    })

    await Deposit.create({
      bookingId: String(booking._id),
      shopId: String(shop._id),
      amount: 50000,
      status: 'released_to_shop',
      createdAt,
      updatedAt: completedAt
    })

    await PlatformFee.create({
      shopId: String(shop._id),
      bookingId: String(booking._id),
      amount: 10000,
      createdAt: completedAt
    })

    await WalletTransaction.insertMany([
      {
        shopId: String(shop._id),
        walletId: String(wallet._id),
        type: 'escrow_release_auto',
        amount: 50000,
        description: `LumiX trả cọc booking ${bookingCode}`,
        refId: String(booking._id),
        status: 'success',
        createdAt: completedAt
      },
      {
        shopId: String(shop._id),
        walletId: String(wallet._id),
        type: 'platform_fee',
        amount: -10000,
        description: `Trừ phí nền tảng cho booking ${bookingCode}`,
        refId: String(booking._id),
        status: 'success',
        createdAt: completedAt
      }
    ])

    await BookingStatusLog.insertMany([
      { bookingId: String(booking._id), fromStatus: 'pending', toStatus: 'confirmed', actorUserId: String(user._id), createdAt },
      { bookingId: String(booking._id), fromStatus: 'confirmed', toStatus: 'checked_in', actorUserId: String(user._id), createdAt: checkedInAt },
      { bookingId: String(booking._id), fromStatus: 'checked_in', toStatus: 'completed', actorUserId: String(user._id), createdAt: completedAt }
    ])
  }

  const feeTotal = def.bookingCount * 10000
  const releaseTotal = def.bookingCount * 50000
  wallet.balance = def.balance + releaseTotal - feeTotal
  wallet.escrowBalance = 0
  wallet.updatedAt = now
  await wallet.save()

  return {
    slug: def.slug,
    shopId: String(shop._id),
    userId: String(user._id),
    services: services.length,
    staff: staffList.length,
    bookings: def.bookingCount,
    walletBalance: wallet.balance
  }
}

async function main() {
  await connectDb()
  const results = []
  for (const [index, def] of SHOP_DEFS.entries()) {
    results.push(await seedOneShop(def, index))
  }
  console.log(JSON.stringify({ ok: true, results }, null, 2))
}

main()
  .catch((err) => {
    console.error('[seed-hoa-lac-demo] failed', err)
    process.exitCode = 1
  })
  .finally(async () => {
    try { await disconnectDb() } catch {}
    try { await mongoose.disconnect() } catch {}
  })
