import {
  Booking,
  Customer,
  PayosPayment,
  Service,
  ServiceCategory,
  Shop,
  ShopClosureDay,
  ShopStaff,
  ShopWorkingHour
} from '../models/index.js'
import { httpError } from './httpError.js'

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

export function isShopBookable(shop) {
  return shop.status !== 'locked' && shop.status !== 'inactive' && shop.onlineBookingEnabled !== false
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
  const targetDate = new Date(date)
  const iso = targetDate.toISOString().slice(0, 10)
  const weekday = targetDate.getDay()
  const [workingHours, closureDays] = await Promise.all([
    ShopWorkingHour.findOne({ shopId }).lean(),
    ShopClosureDay.find({ shopId }).lean()
  ])

  const isClosed = closureDays.some((item) => {
    const closureDate = new Date(item.date || item.closedDate || item.day || 0)
    return !Number.isNaN(closureDate.getTime()) && closureDate.toISOString().slice(0, 10) === iso
  })

  const slotMinutes =
    Number(workingHours?.slotConfig?.slotMinutes) ||
    Number(workingHours?.slotMinutes) ||
    Number(workingHours?.slotDurationMinutes) ||
    30

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

export function buildTimeOnDate(dateString, hhmm) {
  return new Date(`${dateString}T${hhmm}:00`)
}

export function formatHm(date) {
  return new Date(date).toISOString().slice(11, 16)
}

export async function getBookingsInDate(shopId, dateString) {
  const start = new Date(`${dateString}T00:00:00`)
  const end = new Date(`${dateString}T23:59:59.999`)
  return Booking.find({
    shopId,
    startTime: { $gte: start, $lte: end },
    status: { $nin: ['cancelled', 'canceled'] }
  }).lean()
}

export async function getBookingWithRelations(bookingQuery) {
  const booking = await Booking.findOne(bookingQuery).lean()
  if (!booking) throw httpError(404, 'Không tìm thấy booking')

  const [service, staff, shop, payment] = await Promise.all([
    booking.serviceId ? Service.findById(booking.serviceId).lean() : null,
    booking.staffId ? ShopStaff.findById(booking.staffId).lean() : null,
    booking.shopId ? Shop.findById(booking.shopId).lean() : null,
    PayosPayment.findOne({ bookingId: String(booking._id) }).sort({ createdAt: -1 }).lean()
  ])

  return { booking, service, staff, shop, payment }
}
