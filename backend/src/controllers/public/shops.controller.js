import { PayOSService } from '../../services/payos.service.js'
import mongoose from 'mongoose'
import { Booking, BookingSlotLock, Deposit, PayosPayment, Service, ServiceCategory, ShopStaff } from '../../models/index.js'
import { httpError } from '../../utils/httpError.js'
import { writeAuditLog } from '../../utils/audit.js'
import { buildBookingEmailForCustomer, buildBookingEmailForShop, sendEmailBestEffort } from '../../utils/emailNotifications.js'
import {
  buildTimeOnDate,
  ensureCustomer,
  findShopBySlug,
  formatHm,
  getBookingWithRelations,
  getBookingsInDate,
  getWorkingPlan,
  isShopBookable
} from '../../utils/shop.js'

function calcDepositAmount({ shop, service }) {
  const cfg = shop?.depositConfig || {}
  if (!cfg.enabled) return 0

  const type = cfg.type || 'fixed'
  const value = Number(cfg.value || 0)
  if (value <= 0) return 0

  if (type === 'percent') {
    const total = Number(service?.price || 0)
    return Math.max(0, Math.round((total * value) / 100))
  }

  return Math.max(0, value)
}

export async function getShopBySlug(req, res) {
  const shop = await findShopBySlug(req.params.slug)
  res.json({ shop })
}

export async function getShopStatus(req, res) {
  const shop = await findShopBySlug(req.params.slug)
  res.json({
    slug: shop.slug,
    status: shop.status,
    acceptingBookings: isShopBookable(shop)
  })
}

export async function getServiceCategories(req, res) {
  const shop = await findShopBySlug(req.params.slug)
  const categories = await ServiceCategory.find({ shopId: String(shop._id) }).sort({ sortOrder: 1, createdAt: 1 }).lean()
  res.json({ items: categories })
}

export async function getServices(req, res) {
  const shop = await findShopBySlug(req.params.slug)
  const query = { shopId: String(shop._id) }
  if (req.query.categoryId) query.categoryId = req.query.categoryId
  const services = await Service.find(query).sort({ sortOrder: 1, createdAt: 1 }).lean()
  res.json({ items: services })
}

export async function getServiceDetail(req, res) {
  const service = await Service.findById(req.params.serviceId).lean()
  if (!service) throw httpError(404, 'Không tìm thấy dịch vụ')
  res.json({ service })
}

export async function getStaffs(req, res) {
  const shop = await findShopBySlug(req.params.slug)
  const query = { shopId: String(shop._id) }
  if (req.query.status) query.status = req.query.status
  const staffs = await ShopStaff.find(query).sort({ createdAt: 1 }).lean()
  res.json({ items: staffs })
}

export async function getAvailableSlots(req, res) {
  const { date, serviceId, staffId } = req.query
  if (!date || !serviceId) throw httpError(400, 'Thiếu date hoặc serviceId')

  const shop = await findShopBySlug(req.params.slug)
  const shopId = String(shop._id)
  const service = await Service.findById(serviceId).lean()
  if (!service) throw httpError(404, 'Không tìm thấy dịch vụ')

  const plan = await getWorkingPlan(shopId, date)
  if (plan.isClosed) return res.json({ date, slots: [] })

  const bookings = await getBookingsInDate(shopId, date)
  const duration = Number(service.durationMinutes || 60)
  const slots = []

  let cursor = buildTimeOnDate(date, plan.openTime)
  const close = buildTimeOnDate(date, plan.closeTime)
  while (cursor < close) {
    const slotStart = new Date(cursor)
    const slotEnd = new Date(slotStart.getTime() + duration * 60 * 1000)
    if (slotEnd > close) break

    const overlapBookings = bookings.filter((booking) => {
      const bookingStart = new Date(booking.startTime)
      const bookingEnd = booking.endTime ? new Date(booking.endTime) : new Date(bookingStart.getTime() + 60 * 60 * 1000)
      return slotStart < bookingEnd && slotEnd > bookingStart
    })

    if (staffId) {
      const isStaffBusy = overlapBookings.some((booking) => String(booking.staffId || '') === String(staffId))
      if (!isStaffBusy) slots.push(formatHm(slotStart))
    } else if (overlapBookings.length < plan.maxConcurrent) {
      slots.push(formatHm(slotStart))
    }
    cursor = new Date(cursor.getTime() + plan.slotMinutes * 60 * 1000)
  }

  res.json({ date, slots })
}

export async function createBooking(req, res) {
  const { serviceId, staffId: requestedStaffId, customerName, phone, email, date, time, note } = req.body || {}
  if (!serviceId || !customerName || !phone || !date || !time) throw httpError(400, 'Thiếu thông tin đặt lịch')

  const shop = await findShopBySlug(req.params.slug)
  if (!isShopBookable(shop)) throw httpError(409, 'Shop hiện không nhận lịch')

  const service = await Service.findById(serviceId).lean()
  if (!service) throw httpError(404, 'Không tìm thấy dịch vụ')

  const customer = await ensureCustomer({ name: customerName, phone })
  const durationMinutes = Number(service.durationMinutes || 60)
  const startTime = buildTimeOnDate(date, time)
  const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000)

  const plan = await getWorkingPlan(String(shop._id), date)
  if (plan.isClosed) throw httpError(409, 'Shop nghỉ vào ngày này')
  const overlapping = await Booking.find({
    shopId: String(shop._id),
    status: { $in: ['awaiting_deposit', 'pending', 'confirmed', 'checked_in'] },
    startTime: { $lt: endTime },
    endTime: { $gt: startTime }
  }).lean()

  let staffId = requestedStaffId || null
  if (staffId) {
    const staffBusy = overlapping.some((booking) => String(booking.staffId || '') === String(staffId))
    if (staffBusy) throw httpError(409, 'Nhân viên đã kín lịch trong khung giờ này')
  } else {
    const staffs = await ShopStaff.find({ shopId: String(shop._id), status: 'active' }).lean()
    const availableStaff = staffs.find((staff) => {
      const busy = overlapping.some((booking) => String(booking.staffId || '') === String(staff._id))
      return !busy
    })
    if (!availableStaff) throw httpError(409, 'Hiện không còn nhân viên trống trong khung giờ này')
    staffId = String(availableStaff._id)
  }

  const depositAmount = calcDepositAmount({ shop, service })
  const needsDeposit = depositAmount > 0

  const bookingCode = `BK${Math.floor(Math.random() * 900000 + 100000)}`
  const session = await mongoose.startSession()
  let booking
  try {
    await session.withTransaction(async () => {
      await BookingSlotLock.create(
        [
          {
            shopId: String(shop._id),
            staffId: String(staffId),
            startTime,
            endTime
          }
        ],
        { session }
      )

      booking = await Booking.create(
        [
          {
            bookingCode,
            shopId: String(shop._id),
            customerId: String(customer._id),
            customerName,
            customerPhone: String(phone).replace(/\s+/g, ''),
            customerEmail: email ? String(email).toLowerCase() : undefined,
            serviceId,
            staffId: staffId || null,
            startTime,
            endTime,
            note: note || '',
            status: needsDeposit ? 'awaiting_deposit' : 'pending',
            depositAmount: Number(depositAmount || 0),
            totalAmount: Number(service.price || 0),
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ],
        { session }
      )
      booking = booking[0]
    })
  } catch (error) {
    await session.endSession()
    if (error?.code === 11000) throw httpError(409, 'Slot đã được người khác vừa đặt, vui lòng chọn giờ khác')
    throw error
  }
  await session.endSession()

  let payment = null

  if (needsDeposit) {
    const payos = new PayOSService()
    payment = await payos.createDepositPayment({
      bookingCode,
      amount: Number(booking.depositAmount || 0),
      description: `LUMIX_${bookingCode}`
    })

    await PayosPayment.create({
      bookingId: String(booking._id),
      shopId: String(shop._id),
      amount: payment.amount,
      orderCode: String(payment.payosOrderId || ''),
      status: payment.status,
      raw: payment,
      createdAt: new Date(),
      updatedAt: new Date()
    })

    await Deposit.create({
      bookingId: String(booking._id),
      shopId: String(shop._id),
      amount: Number(booking.depositAmount || 0),
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    })
  }

  await writeAuditLog({
    actorUserId: '',
    action: 'public.booking_create',
    entity: 'booking',
    entityId: String(booking._id),
    meta: {
      bookingCode,
      shopId: String(shop._id),
      customerPhone: phone,
      serviceId,
      staffId,
      depositAmount: Number(booking.depositAmount || 0)
    }
  })

  const staffName = staffId ? (await ShopStaff.findById(staffId).lean())?.fullName || '' : ''
  const shopEmail = shop.email || ''
  const customerEmail = email ? String(email).toLowerCase() : booking.customerEmail || ''

  if (shopEmail) {
    const payload = buildBookingEmailForShop({
      shopName: shop.name,
      bookingCode,
      startTime,
      customerName,
      customerPhone: phone,
      serviceName: service.name || '',
      staffName
    })
    await sendEmailBestEffort({ to: shopEmail, ...payload })
  }

  if (customerEmail) {
    const payload = buildBookingEmailForCustomer({
      shopName: shop.name,
      bookingCode,
      startTime,
      serviceName: service.name || '',
      staffName,
      depositAmount: booking.depositAmount || 0
    })
    await sendEmailBestEffort({ to: customerEmail, ...payload })
  }

  res.status(201).json({ booking, payment })
}

export async function getBookingsByPhone(req, res) {
  const phone = String(req.query?.phone || '').trim()
  if (!phone) throw httpError(400, 'Thiếu phone')

  const shop = await findShopBySlug(req.params.slug)
  const normalized = phone.replace(/\s+/g, '')
  const items = await Booking.find({
    shopId: String(shop._id),
    customerPhone: normalized
  })
    .sort({ startTime: -1, createdAt: -1 })
    .lean()

  res.json({ items })
}
