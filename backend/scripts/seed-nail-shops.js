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
  ServiceCategory,
  Shop,
  ShopStaff,
  ShopWorkingHour,
  User,
  Wallet,
  WalletTransaction
} from '../src/models/index.js'

dotenv.config({ path: new URL('../.env', import.meta.url) })

function createSlug(text) {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "")
}

const NAIL_SERVICES = [
  { name: 'Sơn Gel Cơ Bản', price: 80000, duration: 45, image: 'https://images.unsplash.com/photo-1632345031435-8727f6897d53?auto=format&fit=crop&w=1000&q=80' },
  { name: 'Sơn Gel Nghệ Thuật', price: 120000, duration: 60, image: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=1000&q=80' },
  { name: 'Đắp Gel Móng Ngắn', price: 150000, duration: 75, image: 'https://images.unsplash.com/photo-1599948128020-9a44505b0d1b?auto=format&fit=crop&w=1000&q=80' },
  { name: 'Đắp Gel Móng Nối', price: 200000, duration: 90, image: 'https://images.unsplash.com/photo-1519014816548-bf5fe059798b?auto=format&fit=crop&w=1000&q=80' },
  { name: 'Combo Sơn Gel + Thạch', price: 140000, duration: 60, image: 'https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?auto=format&fit=crop&w=1000&q=80' },
  { name: 'Combo Sơn Mắt Mèo + Tráng Gương', price: 130000, duration: 60, image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1000&q=80' },
  { name: 'Fill Gel', price: 100000, duration: 45, image: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=1000&q=80' },
  { name: 'French / Ombre', price: 110000, duration: 60, image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1000&q=80' },
  { name: 'Tạo cấu móng', price: 160000, duration: 80, image: 'https://images.unsplash.com/photo-1610992015732-2449b76344bc?auto=format&fit=crop&w=1000&q=80' },
  { name: 'Nhật da + sửa form móng', price: 50000, duration: 30, image: 'https://images.unsplash.com/photo-1522337660859-02fbefca4702?auto=format&fit=crop&w=1000&q=80' },
  { name: 'Charm (đính đá)', price: 20000, duration: 15, image: 'https://images.unsplash.com/photo-1600573472591-ee6b68d14c68?auto=format&fit=crop&w=1000&q=80' },
  { name: 'Sơn Biab', price: 90000, duration: 50, image: 'https://images.unsplash.com/photo-1632345031435-8727f6897d53?auto=format&fit=crop&w=1000&q=80' },
  { name: 'Úp Base', price: 40000, duration: 20, image: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=1000&q=80' },
]

const SHOPS = [
  {
    slug: 'didan-nail-art',
    shopName: 'DiDan Nail Art',
    ownerName: 'Chủ tiệm DiDan',
    email: 'didan.nail@gmail.com',
    phone: '0941191968',
    facebookUrl: 'https://www.facebook.com/www.didan.vn/',
    openTime: '08:00',
    closeTime: '19:30',
    address: {
      provinceId: '01',
      provinceName: 'Thành phố Hà Nội',
      communeId: 'ba-dinh',
      communeName: 'Ba Đình',
      detail: 'Số 89 Vĩnh Phúc',
      fullAddress: 'Số 89 Vĩnh Phúc, Ba Đình, Hà Nội'
    },
    staff: [
      { fullName: 'Lan Anh', phone: '0941191969', shortBio: 'Chuyên viên nail, tay nghề 3 năm, thao tác nhanh và chính xác.' },
      { fullName: 'Hà My', phone: '0941191970', shortBio: 'Kỹ thuật viên nail nghệ thuật, sáng tạo và tỉ mỉ.' },
    ]
  },
  {
    slug: 'gasy-beauty-home',
    shopName: 'Gasy Beauty Home',
    ownerName: 'Chủ tiệm Gasy',
    email: 'gasy.beauty@gmail.com',
    phone: '0987029100',
    facebookUrl: 'https://www.facebook.com/gasybeautyhome',
    openTime: '09:00',
    closeTime: '21:00',
    address: {
      provinceId: '01',
      provinceName: 'Thành phố Hà Nội',
      communeId: 'ha-dong',
      communeName: 'Hà Đông',
      detail: 'Số 10 Ngõ 1 - Ao Sen',
      fullAddress: 'Số 10 Ngõ 1 - Ao Sen, Hà Đông, Hà Nội'
    },
    staff: [
      { fullName: 'Thu Hà', phone: '0987029101', shortBio: 'Chuyên viên nail trẻ, nhiều năm kinh nghiệm làm nail nghệ thuật.' },
      { fullName: 'Minh Châu', phone: '0987029102', shortBio: 'Kỹ thuật viên nail, thành thạo các mẫu nail Hàn Quốc và Nhật Bản.' },
    ]
  },
  {
    slug: 'blue-academy-nail',
    shopName: 'Blue Academy',
    ownerName: 'Chủ tiệm Blue Academy',
    email: 'blue.academy.nail@gmail.com',
    phone: '0975747280',
    facebookUrl: 'https://www.facebook.com/daotaonailmiHaDong',
    openTime: '09:00',
    closeTime: '21:00',
    address: {
      provinceId: '01',
      provinceName: 'Thành phố Hà Nội',
      communeId: 'ha-dong',
      communeName: 'Hà Đông',
      detail: '117 Thanh Bình',
      fullAddress: '117 Thanh Bình, Hà Đông, Hà Nội'
    },
    staff: [
      { fullName: 'Phương Linh', phone: '0975747281', shortBio: 'Giảng viên nail, 5 năm kinh nghiệm, chuyên đào tạo và làm đẹp.' },
      { fullName: 'Khánh Vân', phone: '0975747282', shortBio: 'Chuyên viên nail cao cấp, thành thạo mọi kỹ thuật đắp gel và vẽ nail.' },
    ]
  },
  {
    slug: 'linh-huong-mi-nails',
    shopName: 'Linh Hương - Mi Nails',
    ownerName: 'Linh Hương',
    email: 'linhuong.minails@gmail.com',
    phone: '0974518607',
    facebookUrl: 'https://www.facebook.com/Linhhuong905',
    openTime: '09:00',
    closeTime: '21:00',
    address: {
      provinceId: '01',
      provinceName: 'Thành phố Hà Nội',
      communeId: 'ha-dong',
      communeName: 'Hà Đông',
      detail: '140 Nguyễn Viết Xuân, Quang Trung',
      fullAddress: '140 Nguyễn Viết Xuân, Quang Trung, Hà Đông, Hà Nội'
    },
    staff: [
      { fullName: 'Linh Hương', phone: '0974518608', shortBio: 'Chủ tiệm kiêm thợ chính, chuyên nail nghệ thuật và mi thẩm mỹ.' },
      { fullName: 'Thúy Nga', phone: '0974518609', shortBio: 'Thợ nail lành nghề, chuyên làm gel và thiết kế móng theo yêu cầu.' },
    ]
  }
]

const STAFF_AVATARS = [
  'https://cdn.pixabay.com/photo/2020/08/31/03/21/girl-5531217_1280.jpg',
  'https://diva.edu.vn/wp-content/uploads/2024/05/nen-hoc-nghe-spa-hay-nail-16.png',
]

async function connect() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI
  if (!uri) throw new Error('Missing MONGODB_URI')
  await mongoose.connect(uri)
  console.log('Connected to MongoDB')
}

async function removeExisting(slug, email) {
  const existing = await Shop.findOne({ slug }).lean()
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
    ServiceCategory.deleteMany({ shopId }),
    ShopStaff.deleteMany({ shopId }),
    ShopWorkingHour.deleteMany({ shopId }),
    Wallet.deleteMany({ shopId }),
    User.deleteMany({ $or: [{ shopId }, { email }] }),
    Shop.deleteMany({ _id: shopId })
  ])
  console.log(`  Removed existing shop: ${slug}`)
}

async function seedShop(def) {
  const now = new Date()
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
    businessTypes: ['nail'],
    description: `${def.shopName} – tiệm nail uy tín, dịch vụ đẹp, thái độ chuyên nghiệp tại ${def.address.fullAddress}.`,
    logoUrl: '',
    coverUrl: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=1200&q=80',
    facebookUrl: def.facebookUrl || '',
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
    balance: 500000,
    minBalance: 100000,
    escrowBalance: 0,
    status: 'active',
    updatedAt: now
  })

  await WalletTransaction.create({
    shopId: String(shop._id),
    walletId: String(wallet._id),
    type: 'seed_topup',
    amount: 500000,
    description: 'Seed số dư ví ban đầu',
    refId: `seed-wallet-${def.slug}`,
    status: 'success',
    createdAt: now
  })

  await ShopWorkingHour.create({
    shopId: String(shop._id),
    openTime: def.openTime,
    closeTime: def.closeTime,
    weekDays: [1, 2, 3, 4, 5, 6, 7],
    lunchBreakStart: null,
    lunchBreakEnd: null,
    slotDurationMinutes: 60,
    maxCustomersPerSlot: 1,
    createdAt: now,
    updatedAt: now
  })

  // Create nail category
  const category = await ServiceCategory.create({
    shopId: String(shop._id),
    name: 'Làm móng (Nail)',
    slug: 'lam-mong',
    sortOrder: 1,
    status: 'active'
  })

  // Create services
  const services = []
  for (let i = 0; i < NAIL_SERVICES.length; i++) {
    const svc = NAIL_SERVICES[i]
    const slug = `${def.slug}-${createSlug(svc.name)}`
    services.push(await Service.create({
      shopId: String(shop._id),
      categoryId: String(category._id),
      name: svc.name,
      slug,
      description: `${svc.name} – dịch vụ chuyên nghiệp tại ${def.shopName}, chất lượng cao, an toàn.`,
      shortDescription: `${svc.name} chuyên nghiệp, thẩm mỹ cao.`,
      detailedDescription: `Quy trình ${svc.name} bài bản, sử dụng sản phẩm chất lượng cao.\nThao tác cẩn thận, đảm bảo an toàn và hiệu quả tốt nhất cho khách hàng.`,
      price: svc.price,
      durationMinutes: svc.duration,
      imageUrl: svc.image,
      status: 'active',
      availableStaffIds: [],
      sortOrder: i + 1,
      createdAt: now,
      updatedAt: now
    }))
  }

  // Create staff
  const staffList = []
  for (let i = 0; i < def.staff.length; i++) {
    const s = def.staff[i]
    const staff = await ShopStaff.create({
      shopId: String(shop._id),
      userId: '',
      fullName: s.fullName,
      phone: s.phone,
      avatarUrl: STAFF_AVATARS[i % STAFF_AVATARS.length],
      shortBio: s.shortBio,
      bio: `${s.fullName} là thành viên của ${def.shopName}, tận tâm phục vụ và mang lại sự hài lòng cho mọi khách hàng.`,
      specialties: ['nail'],
      role: 'tech',
      status: 'active',
      serviceIds: services.map(sv => String(sv._id)),
      slotAssignments: [],
      experienceYears: 2 + i,
      rating: 4.8,
      createdAt: now,
      updatedAt: now
    })
    staffList.push(staff)
  }

  // Assign staff to services
  for (const service of services) {
    service.availableStaffIds = staffList.map(s => String(s._id))
    await service.save()
  }

  return {
    shopId: String(shop._id),
    name: def.shopName,
    slug: def.slug,
    email: def.email,
    phone: def.phone,
    services: services.length,
    staff: staffList.length
  }
}

async function main() {
  await connect()

  const results = []
  for (const def of SHOPS) {
    console.log(`\nSeeding: ${def.shopName}`)
    await removeExisting(def.slug, def.email)
    const result = await seedShop(def)
    results.push(result)
    console.log(`  ✓ Done: ${result.name} | ${result.services} services | ${result.staff} staff`)
  }

  console.log('\n===== SEED COMPLETE =====')
  console.log(JSON.stringify(results, null, 2))
}

main()
  .catch(err => { console.error('Error:', err); process.exitCode = 1 })
  .finally(async () => { await mongoose.disconnect().catch(() => {}) })
