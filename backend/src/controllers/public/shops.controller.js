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

function getHoldMinutes() {
  return Number(process.env.BOOKING_HOLD_MINUTES || 3)
}

async function cleanupExpiredAwaitingDeposits(shopId) {
  const now = new Date()
  const expiredBookings = await Booking.find({
    shopId: String(shopId),
    status: 'awaiting_deposit',
    depositExpiresAt: { $lte: now }
  }).lean()

  if (!expiredBookings.length) return

  const ids = expiredBookings.map((b) => String(b._id))

  await Booking.updateMany(
    { _id: { $in: expiredBookings.map((b) => b._id) } },
    { $set: { status: 'cancelled', updatedAt: now } }
  )

  await BookingSlotLock.deleteMany({ bookingId: { $in: ids } })

  await Deposit.updateMany(
    { bookingId: { $in: ids }, status: { $in: ['pending'] } },
    { $set: { status: 'expired_unpaid', updatedAt: now } }
  )
}
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
  const { date, serviceId, staffId, holdToken } = req.query
  if (!date || !serviceId) throw httpError(400, 'Thiếu date hoặc serviceId')

  const shop = await findShopBySlug(req.params.slug)
  const shopId = String(shop._id)
  const service = await Service.findById(serviceId).lean()
  await cleanupExpiredAwaitingDeposits(shopId)
  if (!service) throw httpError(404, 'Không tìm thấy dịch vụ')

  const plan = await getWorkingPlan(shopId, date)
  if (plan.isClosed) return res.json({ date, slots: [] })

  const bookings = await getBookingsInDate(shopId, date)
  const now = new Date()
  const activeLocksRaw = await BookingSlotLock.find({
    shopId,
    lockType: 'temp_hold',
    expiresAt: { $gt: now }
  }).lean()
  const activeLocks = holdToken
    ? activeLocksRaw.filter((lock) => String(lock.holdToken || '') !== String(holdToken))
    : activeLocksRaw

  const activeStaffs = await ShopStaff.find({ shopId, status: 'active' }).lean()
  const candidateStaffs = Array.isArray(service.availableStaffIds) && service.availableStaffIds.length
    ? activeStaffs.filter((s) => service.availableStaffIds.includes(String(s._id)))
    : activeStaffs
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

    const overlapLocks = activeLocks.filter((lock) => {
      const lockStart = new Date(lock.startTime)
      const lockEnd = lock.endTime ? new Date(lock.endTime) : new Date(lockStart.getTime() + 60 * 60 * 1000)
      return slotStart < lockEnd && slotEnd > lockStart
    })

    if (staffId) {
      const isStaffBusy =
        overlapBookings.some((booking) => String(booking.staffId || '') === String(staffId)) ||
        overlapLocks.some((lock) => String(lock.staffId || '') === String(staffId))
      if (!isStaffBusy) slots.push(formatHm(slotStart))
    } else {
      const availableCount = candidateStaffs.filter((s) => {
        const busyByBooking = overlapBookings.some((b) => String(b.staffId || '') === String(s._id))
        const busyByHold = overlapLocks.some((l) => String(l.staffId || '') === String(s._id))
        return !busyByBooking && !busyByHold
      }).length
      const capacity = Math.min(Number(plan.maxConcurrent || 1), Math.max(candidateStaffs.length, 1))
      const occupiedCount = overlapBookings.length + overlapLocks.length
      if (availableCount > 0 && occupiedCount < capacity) slots.push(formatHm(slotStart))
    }
    cursor = new Date(cursor.getTime() + plan.slotMinutes * 60 * 1000)
  }

  res.json({ date, slots })
}

export async function holdSlot(req, res) {
  const { serviceId, staffId: requestedStaffId, date, time, holdToken: clientHoldToken, clientAttemptId } = req.body || {}
  if (!serviceId || !date || !time) throw httpError(400, 'Thiếu serviceId/date/time')

  const shop = await findShopBySlug(req.params.slug)
  await cleanupExpiredAwaitingDeposits(String(shop._id))
  if (!isShopBookable(shop)) throw httpError(409, 'Shop hiện không nhận lịch')

    const service = await Service.findById(serviceId).lean()
    if (!service) throw httpError(404, 'Không tìm thấy dịch vụ')

  const durationMinutes = Number(service.durationMinutes || 60)
  const startTime = buildTimeOnDate(date, time)
  const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000)

  const plan = await getWorkingPlan(String(shop._id), date)
  if (plan.isClosed) throw httpError(409, 'Shop nghỉ vào ngày này')

  const now = new Date()

  // Check if client is re-holding with existing token
  if (clientHoldToken) {
    const existingHold = await BookingSlotLock.findOne({
      holdToken: clientHoldToken,
      shopId: String(shop._id),
      lockType: 'temp_hold',
      expiresAt: { $gt: now }
    }).lean()
    if (existingHold) {
      const lockStart = new Date(existingHold.startTime).getTime()
      const lockEnd = new Date(existingHold.endTime).getTime()
      const requestStart = startTime.getTime()
      const requestEnd = endTime.getTime()
      if (lockStart === requestStart && lockEnd === requestEnd && String(existingHold.serviceId || '') === String(serviceId)) {
        // Token still valid for same slot/service, return it without creating new
        return res.status(200).json({ holdToken: clientHoldToken, staffId: String(existingHold.staffId), expiresAt: existingHold.expiresAt })
      }
    }
  }

  const overlapping = await Booking.find({
    shopId: String(shop._id),
    status: { $in: ['awaiting_deposit', 'pending', 'confirmed', 'checked_in'] },
    startTime: { $lt: endTime },
    endTime: { $gt: startTime }
  }).lean()

  const activeStaffs = await ShopStaff.find({ shopId: String(shop._id), status: 'active' }).lean()
  const candidateStaffs = Array.isArray(service.availableStaffIds) && service.availableStaffIds.length
    ? activeStaffs.filter((s) => service.availableStaffIds.includes(String(s._id)))
    : activeStaffs

  const activeLocks = await BookingSlotLock.find({
    shopId: String(shop._id),
    expiresAt: { $gt: now },
    startTime: { $lt: endTime },
    endTime: { $gt: startTime }
  }).lean()

  let staffId = requestedStaffId || null
  if (staffId) {
    const staffExists = candidateStaffs.some((s) => String(s._id) === String(staffId))
      if (!staffExists) throw httpError(409, 'Nhân viên không khả dụng cho dịch vụ hoặc đang tạm nghỉ')
    const staffBusy = overlapping.some((b) => String(b.staffId || '') === String(staffId)) || activeLocks.some((l) => String(l.staffId || '') === String(staffId))
      if (staffBusy) throw httpError(409, 'Nhân viên đã kín lịch trong khung giờ này')
  } else {
    const availableStaff = candidateStaffs.find((s) => {
      const busyByBooking = overlapping.some((b) => String(b.staffId || '') === String(s._id))
      const busyByHold = activeLocks.some((l) => String(l.staffId || '') === String(s._id))
      return !busyByBooking && !busyByHold
    })
      if (!availableStaff) throw httpError(409, 'Hiện không còn nhân viên trống trong khung giờ này')
    staffId = String(availableStaff._id)
  }

  const holdToken = `HLD_${Date.now()}_${Math.floor(Math.random() * 9000 + 1000)}`
  const expiresAt = new Date(Date.now() + getHoldMinutes() * 60 * 1000)

  try {
    await BookingSlotLock.create({
      shopId: String(shop._id),
      staffId: String(staffId),
      serviceId: String(serviceId),
      startTime,
      endTime,
      bookingId: '',
      holdToken,
      clientAttemptId: clientAttemptId || undefined,
      lockType: 'temp_hold',
      expiresAt,
      createdAt: new Date()
    })
  } catch (error) {
    if (error?.code === 11000) throw httpError(409, 'Slot vừa được người khác giữ, vui lòng chọn giờ khác')
    throw error
  }

  res.status(201).json({ holdToken, staffId: String(staffId), expiresAt })
}
export async function createBooking(req, res) {
  const { serviceId, staffId: requestedStaffId, customerName, phone, email, date, time, note, holdToken, clientBookingAttemptId } = req.body || {}
  if (!serviceId || !customerName || !phone || !date || !time) throw httpError(400, 'Thiếu thông tin đặt lịch')

  const shop = await findShopBySlug(req.params.slug)
  await cleanupExpiredAwaitingDeposits(String(shop._id))
  if (!isShopBookable(shop)) throw httpError(409, 'Shop hiện không nhận lịch')

    const service = await Service.findById(serviceId).lean()
    if (!service) throw httpError(404, 'Không tìm thấy dịch vụ')

  const customer = await ensureCustomer({ name: customerName, phone })
  const durationMinutes = Number(service.durationMinutes || 60)
  const startTime = buildTimeOnDate(date, time)
  const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000)

  const plan = await getWorkingPlan(String(shop._id), date)
  if (plan.isClosed) throw httpError(409, 'Shop nghỉ vào ngày này')

  const now = new Date()
  // Idempotency: if client sent an attempt id and booking already exists, return it
  if (clientBookingAttemptId) {
    const existingBooking = await Booking.findOne({ shopId: String(shop._id), clientAttemptId: String(clientBookingAttemptId) }).lean()
    if (existingBooking) {
      const paymentRow = await PayosPayment.findOne({ bookingId: String(existingBooking._id) }).lean()
      return res.status(200).json({ booking: existingBooking, payment: paymentRow || null })
    }
  }
  const holdLock = holdToken
    ? await BookingSlotLock.findOne({
        holdToken,
        shopId: String(shop._id),
        lockType: 'temp_hold',
        expiresAt: { $gt: now }
      }).lean()
    : null

  if (holdToken && !holdLock) {
    throw httpError(409, 'Giữ chỗ tạm đã hết hạn. Vui lòng chọn lại khung giờ.')
  }

  const overlapping = await Booking.find({
    shopId: String(shop._id),
    status: { $in: ['awaiting_deposit', 'pending', 'confirmed', 'checked_in'] },
    startTime: { $lt: endTime },
    endTime: { $gt: startTime }
  }).lean()

  const activeStaffsForBooking = await ShopStaff.find({ shopId: String(shop._id), status: 'active' }).lean()
  const candidateStaffsForBooking = Array.isArray(service.availableStaffIds) && service.availableStaffIds.length
    ? activeStaffsForBooking.filter((s) => service.availableStaffIds.includes(String(s._id)))
    : activeStaffsForBooking

  let staffId = requestedStaffId || null

  if (holdLock) {
    const lockStart = new Date(holdLock.startTime).getTime()
    const lockEnd = new Date(holdLock.endTime).getTime()
    if (lockStart !== startTime.getTime() || lockEnd !== endTime.getTime()) {
      throw httpError(409, 'Thông tin giữ chỗ không khớp. Vui lòng chọn lại giờ.')
    }
    staffId = String(holdLock.staffId)
  }

  if (staffId) {
    const staffExists = candidateStaffsForBooking.some((s) => String(s._id) === String(staffId))
      if (!staffExists) throw httpError(409, 'Nhân viên không khả dụng cho dịch vụ hoặc đang tạm nghỉ')
    const staffBusy = overlapping.some((booking) => String(booking.staffId || '') === String(staffId))
      if (staffBusy) throw httpError(409, 'Nhân viên đã kín lịch trong khung giờ này')
  } else {
    const availableStaff = candidateStaffsForBooking.find((staff) => {
      const busy = overlapping.some((booking) => String(booking.staffId || '') === String(staff._id))
      return !busy
    })
    if (!availableStaff) throw httpError(409, 'Hiện không còn nhân viên trống trong khung giờ này')
      if (!availableStaff) throw httpError(409, 'Hiện không còn nhân viên trống trong khung giờ này')
    staffId = String(availableStaff._id)
  }

  const depositAmount = calcDepositAmount({ shop, service })
  const needsDeposit = depositAmount > 0

  const bookingCode = `BK${Math.floor(Math.random() * 900000 + 100000)}`
  const session = await mongoose.startSession()
  let booking
  try {
    const runOps = async (useSession) => {
      const createOpts = useSession ? { session } : undefined
      const updateOpts = useSession ? { session } : undefined

      const created = await Booking.create(
        [
          {
            bookingCode,
            clientAttemptId: clientBookingAttemptId || undefined,
            shopId: String(shop._id),
            customerId: String(customer._id),
            customerName,
            customerPhone: String(phone).replace(/\\s+/g, ''),
            customerEmail: email ? String(email).toLowerCase() : undefined,
            serviceId,
            staffId: staffId || null,
            startTime,
            endTime,
            note: note || '',
            status: needsDeposit ? 'awaiting_deposit' : 'pending',
            depositExpiresAt: needsDeposit ? new Date(Date.now() + getHoldMinutes() * 60 * 1000) : null,
            depositAmount: Number(depositAmount || 0),
            totalAmount: Number(service.price || 0),
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ],
        createOpts
      )
      booking = created[0]

      if (holdLock) {
        await BookingSlotLock.updateOne(
          { _id: holdLock._id },
          {
            $set: {
              bookingId: String(booking._id),
              lockType: 'booking',
              holdToken: '',
              expiresAt: null
            }
          },
          updateOpts
        )
      } else {
        await BookingSlotLock.create(
          [
            {
              shopId: String(shop._id),
              staffId: String(staffId),
              serviceId: String(serviceId),
              startTime,
              endTime,
              bookingId: String(booking._id),
              lockType: 'booking',
              createdAt: new Date()
            }
          ],
          createOpts
        )
      }
    }

    try {
      await session.withTransaction(async () => runOps(true))
    } catch (error) {
      const msg = String(error?.message || '')
      const illegalTxn = error?.code === 20 || msg.includes('Transaction numbers are only allowed')
      if (!illegalTxn) throw error
      await runOps(false)
    }
  } catch (error) {
    await session.endSession()
    if (error?.code === 11000) throw httpError(409, 'Slot đã được người khác vừa đặt, vui lòng chọn giờ khác')
    throw error
  }
  await session.endSession()

  let payment = null

  if (needsDeposit) {
    const payos = new PayOSService()
    try {
      payment = await payos.createDepositPayment({
        bookingCode,
        amount: Number(booking.depositAmount || 0),
        description: `LUMIX_${bookingCode}`
      })
      console.log('[createBooking] deposit payment created', { bookingCode, payosOrderId: payment.payosOrderId, checkoutUrl: payment.checkoutUrl })
    } catch (err) {
      console.error('[createBooking] createDepositPayment failed', err && err.message)
      throw httpError(500, 'Không thể tạo link thanh toán cọc lúc này, vui lòng thử lại sau')
    }

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

export async function getBookingAttempt(req, res) {
  const attemptId = String(req.params.attemptId || '').trim()
  if (!attemptId) throw httpError(400, 'Thiếu attemptId')

  const shop = await findShopBySlug(req.params.slug)
  const shopId = String(shop._id)

  const booking = await Booking.findOne({ shopId, clientAttemptId: attemptId }).lean()
  if (booking) {
    const payment = await PayosPayment.findOne({ bookingId: String(booking._id) }).lean()
    return res.json({ booking, payment: payment || null })
  }

  const now = new Date()
  const hold = await BookingSlotLock.findOne({ shopId, clientAttemptId: attemptId, lockType: 'temp_hold', expiresAt: { $gt: now } }).lean()
  if (hold) return res.json({ hold })

  throw httpError(404, 'Không tìm thấy booking/hold cho attemptId này')
}





