import {
  Booking,
  Customer,
  PayosPayment,
  Deposit,
  BookingSlotLock,
  Service,
  ServiceCategory,
  Shop,
  ShopClosureDay,
  ShopStaff,
  ShopWorkingHour,
  Wallet
} from '../models/index.js'
import { httpError } from './httpError.js'


function toDateIsoByOffset(date, offsetMinutes) {
  const shiftedMillis = new Date(date).getTime() + Number(offsetMinutes || 0) * 60 * 1000
  const shifted = new Date(shiftedMillis)
  const yyyy = shifted.getUTCFullYear()
  const mm = String(shifted.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(shifted.getUTCDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}


export async function findShopBySlug(slug) {
  const shop = await Shop.findOne({ slug }).lean()
  if (!shop) throw httpError(404, 'Không tìm thấy shop')
  return shop
}

export async function findShopById(shopId) {
  const shop = await Shop.findById(shopId).lean()
  if (!shop) throw httpError(404, 'Không tìm thấy shop')
  return shop
}

export async function isShopBookable(shop) {
  if (!shop) return false
  if (shop.status === 'locked' || shop.status === 'inactive' || shop.onlineBookingEnabled === false) return false

  const wallet = shop._id ? await Wallet.findOne({ shopId: String(shop._id) }).lean() : null
  const minBalance = Number(wallet?.minBalance || process.env.SHOP_WALLET_MIN_BALANCE || 100000)
  const balance = Number(wallet?.balance || 0)
  return balance >= minBalance
}

export async function ensureCustomer({ name, phone }) {
  let customer = await Customer.findOne({ phone })
  if (!customer) {
    customer = await Customer.create({
      fullName: name,
      phone,
      createdAt: new Date(),
      updatedAt: new Date()
    })
  }
  return customer
}

export function getShopObjectIdString(shop) {
  return String(shop._id)
}

export async function getShopContextBySlug(slug) {
  const shop = await findShopBySlug(slug)
  const shopId = getShopObjectIdString(shop)
  const [categories, services, staffs] = await Promise.all([
    ServiceCategory.find({ shopId }).sort({ sortOrder: 1, createdAt: 1 }).lean(),
    Service.find({ shopId }).sort({ sortOrder: 1, createdAt: 1 }).lean(),
    ShopStaff.find({ shopId }).sort({ createdAt: 1 }).lean()
  ])
  return { shop, shopId, categories, services, staffs }
}

export async function getWorkingPlan(shopId, date) {
  const targetDate = new Date(`${date}T00:00:00Z`)
  const iso = date
  const weekday = targetDate.getUTCDay()
  const [workingHours, closureDays] = await Promise.all([
    ShopWorkingHour.findOne({ shopId }).lean(),
    ShopClosureDay.find({ shopId }).lean()
  ])

  const offsetMinutes = getShopTimezoneOffsetMinutes()
  const explicitlyClosed = closureDays.some((item) => {
    const closureDate = new Date(item.date || item.closedDate || item.day || 0)
    return !Number.isNaN(closureDate.getTime()) && toDateIsoByOffset(closureDate, offsetMinutes) === iso
  })
  const configuredWeekDays = Array.isArray(workingHours?.weekDays) ? workingHours.weekDays.map((day) => (Number(day) == 7 ? 0 : Number(day))) : []
  const isRegularDayOff = configuredWeekDays.length > 0 && !configuredWeekDays.includes(weekday)
  const isClosed = explicitlyClosed || isRegularDayOff

  const slotMinutes = 15

  const maxConcurrent =
    Number(workingHours?.slotConfig?.maxConcurrentBookings) ||
    Number(workingHours?.maxConcurrentBookings) ||
    Number(workingHours?.maxCustomersPerSlot) ||
    1

  const days = workingHours?.days || workingHours?.workingDays || workingHours?.schedule || workingHours?.weekDays || []
  const foundDay =
    Array.isArray(days) &&
    days.find((item) => {
      if (typeof item === 'number') return Number(item) === weekday
      return Number(item.dayOfWeek ?? item.weekday ?? item.day) === weekday
    })

  const openTime = foundDay?.openTime || workingHours?.openTime || '09:00'
  const closeTime = foundDay?.closeTime || workingHours?.closeTime || '20:00'

  return {
    isClosed,
    openTime,
    closeTime,
    slotMinutes,
    maxConcurrent
  }
}

function pad2(value) {
  return String(value).padStart(2, '0')
}

function getShopTimezoneOffsetMinutes() {
  const offset = Number(process.env.SHOP_TIMEZONE_OFFSET_MINUTES || 420)
  return Number.isFinite(offset) ? offset : 420
}

export function buildTimeOnDate(dateString, hhmm) {
  const [year, month, day] = String(dateString || '').split('-').map((v) => Number(v))
  const [hour, minute] = String(hhmm || '').split(':').map((v) => Number(v))
  const offsetMinutes = getShopTimezoneOffsetMinutes()
  const utcMillis = Date.UTC(year, month - 1, day, hour, minute) - offsetMinutes * 60 * 1000
  return new Date(utcMillis)
}

export function formatHm(date) {
  const offsetMinutes = getShopTimezoneOffsetMinutes()
  const localMillis = new Date(date).getTime() + offsetMinutes * 60 * 1000
  const local = new Date(localMillis)
  return `${pad2(local.getUTCHours())}:${pad2(local.getUTCMinutes())}`
}

export async function getBookingsInDate(shopId, dateString) {
  const start = buildTimeOnDate(dateString, '00:00')
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1)
  return Booking.find({
    shopId,
    startTime: { $gte: start, $lte: end },
    status: { $nin: ['cancelled', 'canceled'] }
  }).lean()
}

export async function getBookingWithRelations(bookingQuery) {
  let booking = await Booking.findOne(bookingQuery).lean()
  if (!booking) throw httpError(404, 'Không tìm thấy booking')

  booking = await expireAwaitingDepositIfNeeded(booking)

  const [service, staff, shop, payment] = await Promise.all([
    booking.serviceId ? Service.findById(booking.serviceId).lean() : null,
    booking.staffId ? ShopStaff.findById(booking.staffId).lean() : null,
    booking.shopId ? Shop.findById(booking.shopId).lean() : null,
    PayosPayment.findOne({ bookingId: String(booking._id) }).sort({ createdAt: -1 }).lean()
  ])

  return { booking, service, staff, shop, payment }
}

async function expireAwaitingDepositIfNeeded(booking) {
  if (!booking) return booking
  if (booking.status !== 'pending') return booking
  if (!booking.depositExpiresAt || Number(booking.depositAmount || 0) <= 0) return booking

  const now = new Date()
  const expiresAt = new Date(booking.depositExpiresAt)
  if (Number.isNaN(expiresAt.getTime()) || expiresAt > now) return booking

  await Booking.updateOne({ _id: booking._id }, { $set: { status: 'cancelled', updatedAt: now } })
  await BookingSlotLock.deleteMany({ bookingId: String(booking._id) })
  await Deposit.updateMany(
    { bookingId: String(booking._id), status: { $in: ['pending'] } },
    { $set: { status: 'expired_unpaid', updatedAt: now } }
  )

  return { ...booking, status: 'cancelled', updatedAt: now }
}