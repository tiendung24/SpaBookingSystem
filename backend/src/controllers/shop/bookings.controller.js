import mongoose from 'mongoose'
import {
  Booking,
  BookingSlotLock,
  BookingStatusLog,
  Deposit,
  PlatformFee,
  Service,
  Shop,
  ShopStaff,
  SystemSetting,
  Wallet,
  WalletTransaction
} from '../../models/index.js'
import { httpError } from '../../utils/httpError.js'
import { getSettingNumber } from '../../utils/settings.js'
import { buildTimeOnDate, ensureCustomer, getWorkingPlan } from '../../utils/shop.js'
import { buildBookingStatusEmailForCustomer, sendEmailBestEffort } from '../../utils/emailNotifications.js'
import { derivePaymentStatus } from '../../utils/paymentStatus.js'

function normalizeDateRange(date) {
  const start = new Date(`${date}T00:00:00`)
  const end = new Date(`${date}T23:59:59.999`)
  return { start, end }
}

async function appendStatusLog(bookingId, toStatus, actorUserId, fromStatus = '') {
  await BookingStatusLog.create({
    bookingId: String(bookingId),
    fromStatus,
    toStatus,
    actorUserId,
    createdAt: new Date()
  })
}

async function getPlatformFeeAmount() {
  const setting = await SystemSetting.findOne({ key: 'platform_fee_per_completed_booking' }).lean()
  return Number(setting?.value || 10000)
}

async function getNoShowPlatformCutRatio() {
  return await getSettingNumber('no_show_platform_cut_ratio', 0.2)
}

function ensureTransition(currentStatus, nextStatus, allowedCurrent) {
  if (!allowedCurrent.includes(currentStatus)) {
    throw httpError(409, `Không thể chuyển trạng thái từ ${currentStatus} sang ${nextStatus}`)
  }
}

function getShopCancelThresholdHours(shop) {
  const hours = Number(shop?.depositConfig?.cancelHours ?? 4)
  return Number.isFinite(hours) && hours > 0 ? hours : 4
}

function classifyShopCancel(booking, shop, now = new Date()) {
  const thresholdHours = getShopCancelThresholdHours(shop)
  const startTime = new Date(booking.startTime)
  const diffHours = (startTime.getTime() - now.getTime()) / (60 * 60 * 1000)
  const valid = diffHours >= thresholdHours
  return {
    cancelType: valid ? 'valid' : 'late',
    refundPercent: valid ? 100 : 0,
    thresholdHours,
    diffHours
  }
}

function decorateBooking(booking) {
  return booking ? { ...booking, paymentStatus: derivePaymentStatus(booking) } : booking
}

// Shop tạo booking thủ công (không qua public flow, không tạo deposit)
export async function createBooking(req, res) {
  const shopId = req.auth.shopId
  const { serviceId, staffId: requestedStaffId, customerName, phone, date, time, note } = req.body || {}
  if (!serviceId || !customerName || !phone || !date || !time) throw httpError(400, 'Thiếu thông tin đặt lịch')

  const service = await Service.findOne({ _id: serviceId, shopId }).lean()
  if (!service) throw httpError(404, 'Không tìm thấy dịch vụ')

  const customer = await ensureCustomer({ name: customerName, phone })
  const durationMinutes = Number(service.durationMinutes || 60)
  const startTime = buildTimeOnDate(date, time)
  const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000)

  const plan = await getWorkingPlan(shopId, date)
  if (plan.isClosed) throw httpError(409, 'Shop nghỉ vào ngày này')

  const overlapping = await Booking.find({
    shopId,
    status: { $in: ['pending', 'confirmed', 'checked_in'] },
    startTime: { $lt: endTime },
    endTime: { $gt: startTime }
  }).lean()

  let staffId = requestedStaffId || null
  if (staffId) {
    const staff = await ShopStaff.findOne({ _id: staffId, shopId, status: 'active' }).lean()
      if (!staff) throw httpError(404, 'Không tìm thấy nhân viên khả dụng')
    const staffBusy = overlapping.some((booking) => String(booking.staffId || '') === String(staffId))
      if (staffBusy) throw httpError(409, 'Nhân viên đã kín lịch trong khung giờ này')
  } else {
    const staffs = await ShopStaff.find({ shopId, status: 'active' }).lean()
    const availableStaff = staffs.find((staff) => {
      const busy = overlapping.some((booking) => String(booking.staffId || '') === String(staff._id))
      return !busy
    })
      if (!availableStaff) throw httpError(409, 'Hiện không còn nhân viên trống trong khung giờ này')
    staffId = String(availableStaff._id)
  }

  const bookingCode = `BK${Math.floor(Math.random() * 900000 + 100000)}`
  const session = await mongoose.startSession()
  let booking
  try {
    const runOps = async (useSession) => {
      const createOpts = useSession ? { session } : undefined
      await BookingSlotLock.create([{ shopId, staffId: String(staffId), serviceId: String(serviceId), startTime, endTime }], createOpts)
      const newBooking = await Booking.create(
        [
          {
            bookingCode,
            shopId,
            customerId: String(customer._id),
            customerName,
            customerPhone: String(phone).replace(/\\s+/g, ''),
            serviceId,
            staffId: staffId || null,
            startTime,
            endTime,
            note: note || '',
            status: 'confirmed',
            depositAmount: 0,
            totalAmount: Number(service.price || 0),
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ],
        createOpts
      )
      booking = newBooking[0]
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
    if (error?.code === 11000) throw httpError(409, 'Slot vừa được đặt, vui lòng chọn giờ khác')
    throw error
  }
  await session.endSession()

  await appendStatusLog(booking._id, 'confirmed', req.auth.userId, '')
  if (booking.customerEmail) {
    const payload = buildBookingStatusEmailForCustomer({
      shopName: '',
      bookingCode: booking.bookingCode,
      startTime: booking.startTime,
      statusLabel: 'Đã xác nhận'
    })
    await sendEmailBestEffort({ to: booking.customerEmail, ...payload })
  }
  res.status(201).json({ booking: decorateBooking(booking) })
}

export async function getBookings(req, res) {
  const shopId = req.auth.shopId
  const query = { shopId }

  // Default: only return "active" bookings unless explicitly requested.
  // This avoids showing expired/unpaid or cancelled bookings as if they are still active.
  const includeHistory = String(req.query.includeHistory || '').trim() === '1'
  if (!includeHistory && !req.query.status) {
    query.status = { $in: ['pending', 'confirmed', 'checked_in'] }
  }

  if (req.query.status) query.status = req.query.status
  if (req.query.staffId) query.staffId = req.query.staffId
  if (req.query.date) {
    const { start, end } = normalizeDateRange(req.query.date)
    query.startTime = { $gte: start, $lte: end }
  }

  const items = (await Booking.find(query).sort({ startTime: 1, createdAt: -1 }).lean()).map(decorateBooking)
  res.json({ items })
}

export async function getBookingById(req, res) {
  const shopId = req.auth.shopId
  const booking = await Booking.findOne({ _id: req.params.bookingId, shopId }).lean()
  if (!booking) throw httpError(404, 'Không tìm thấy booking')
  res.json({ booking: decorateBooking(booking) })
}

export async function confirmBooking(req, res) {
  const shopId = req.auth.shopId
  const existing = await Booking.findOne({ _id: req.params.bookingId, shopId }).lean()
  if (!existing) throw httpError(404, 'Không tìm thấy booking')
  ensureTransition(existing.status, 'confirmed', ['pending'])
  const booking = await Booking.findOneAndUpdate(
    { _id: req.params.bookingId, shopId },
    { status: 'confirmed', updatedAt: new Date() },
    { new: true }
  ).lean()
  await appendStatusLog(booking._id, 'confirmed', req.auth.userId, existing.status || '')
  if (booking.customerEmail) {
    const payload = buildBookingStatusEmailForCustomer({
      shopName: '',
      bookingCode: booking.bookingCode,
      startTime: booking.startTime,
      statusLabel: 'Đã xác nhận'
    })
    await sendEmailBestEffort({ to: booking.customerEmail, ...payload })
  }
  res.json({ booking })
}

export async function cancelBooking(req, res) {
  const shopId = req.auth.shopId
  const existing = await Booking.findOne({ _id: req.params.bookingId, shopId }).lean()
  if (!existing) throw httpError(404, 'Không tìm thấy booking')
  ensureTransition(existing.status, 'cancelled', ['pending', 'confirmed'])
  const shop = await Shop.findById(shopId).lean()
  const cancelMeta = classifyShopCancel(existing, shop)
  const booking = await Booking.findOneAndUpdate(
    { _id: req.params.bookingId, shopId },
    {
      status: 'cancelled',
      cancelReason: req.body?.reason || '',
      cancelReasonId: req.body?.cancelReasonId || '',
      updatedAt: new Date()
    },
    { new: true }
  ).lean()

  const deposit = await Deposit.findOne({ bookingId: String(booking._id) })
  if (deposit && ['pending', 'holding', 'refund_pending'].includes(deposit.status)) {
    deposit.status = cancelMeta.cancelType === 'valid' ? 'refund_pending' : 'forfeited'
    deposit.updatedAt = new Date()
    await deposit.save()
  }

  await BookingSlotLock.deleteMany({
    shopId,
    staffId: String(booking.staffId || ''),
    startTime: booking.startTime
  })

  await appendStatusLog(booking._id, 'cancelled', req.auth.userId, existing.status || '')
  if (booking.customerEmail) {
    const payload = buildBookingStatusEmailForCustomer({
      shopName: '',
      bookingCode: booking.bookingCode,
      startTime: booking.startTime,
      statusLabel: cancelMeta.cancelType === 'valid' ? 'Đã hủy bởi shop (hợp lệ)' : 'Đã hủy bởi shop (muộn)'
    })
    await sendEmailBestEffort({ to: booking.customerEmail, ...payload })
  }
  res.json({
    booking,
    depositStatus: deposit?.status || null,
    cancellationType: cancelMeta.cancelType,
    refundPercent: cancelMeta.refundPercent,
    cancelPolicyHours: cancelMeta.thresholdHours
  })
}

export async function checkIn(req, res) {
  const shopId = req.auth.shopId
  const existing = await Booking.findOne({ _id: req.params.bookingId, shopId }).lean()
  if (!existing) throw httpError(404, 'Không tìm thấy booking')
  ensureTransition(existing.status, 'checked_in', ['confirmed'])
  const booking = await Booking.findOneAndUpdate(
    { _id: req.params.bookingId, shopId },
    { status: 'checked_in', updatedAt: new Date() },
    { new: true }
  ).lean()
  await appendStatusLog(booking._id, 'checked_in', req.auth.userId, existing.status || '')
  if (booking.customerEmail) {
    const payload = buildBookingStatusEmailForCustomer({
      shopName: '',
      bookingCode: booking.bookingCode,
      startTime: booking.startTime,
      statusLabel: 'Đã check-in'
    })
    await sendEmailBestEffort({ to: booking.customerEmail, ...payload })
  }
  res.json({ booking })
}

export async function checkOut(req, res) {
  const shopId = req.auth.shopId
  const existing = await Booking.findOne({ _id: req.params.bookingId, shopId }).lean()
  if (!existing) throw httpError(404, 'Không tìm thấy booking')
  ensureTransition(existing.status, 'completed', ['checked_in'])
  const booking = await Booking.findOneAndUpdate(
    { _id: req.params.bookingId, shopId },
    { status: 'completed', updatedAt: new Date() },
    { new: true }
  ).lean()

  const feeAmount = await getPlatformFeeAmount()

  const wallet = await Wallet.findOneAndUpdate(
    { shopId },
    { $setOnInsert: { minBalance: 0, escrowBalance: 0, status: 'active' }, $set: { updatedAt: new Date() } },
    { upsert: true, new: true }
  )

  const oldBalance = Number(wallet.balance || 0)
  wallet.balance = oldBalance - feeAmount

  const deposit = await Deposit.findOne({ bookingId: String(booking._id) })
  if (deposit && ['holding', 'pending', 'refund_pending'].includes(deposit.status)) {
    const depositAmount = Number(deposit.amount || 0)
    // booking hoàn thành -> release cọc cho shop
    wallet.escrowBalance = Math.max(0, Number(wallet.escrowBalance || 0) - depositAmount)
    wallet.balance = Number(wallet.balance || 0) + depositAmount
    deposit.status = 'released_to_shop'
    deposit.updatedAt = new Date()
    await deposit.save()

    await WalletTransaction.create({
      shopId,
      walletId: String(wallet._id),
      type: 'escrow_release_auto',
      amount: depositAmount,
      description: `Tự động release cọc booking ${booking.bookingCode || booking._id}`,
      refId: String(booking._id),
      status: 'success',
      createdAt: new Date()
    })
  }
  await wallet.save()

  await PlatformFee.create({
    shopId,
    bookingId: String(booking._id),
    amount: feeAmount,
    createdAt: new Date()
  })

  await WalletTransaction.create({
    shopId,
    walletId: String(wallet._id),
    type: 'platform_fee',
    amount: -feeAmount,
    description: `Trừ phí nền tảng cho booking ${booking.bookingCode || booking._id}`,
    refId: String(booking._id),
    status: 'success',
    createdAt: new Date()
  })

  await appendStatusLog(booking._id, 'completed', req.auth.userId, existing.status || '')
  if (booking.customerEmail) {
    const payload = buildBookingStatusEmailForCustomer({
      shopName: '',
      bookingCode: booking.bookingCode,
      startTime: booking.startTime,
      statusLabel: 'Đã hoàn thành'
    })
    await sendEmailBestEffort({ to: booking.customerEmail, ...payload })
  }
  res.json({ booking, feeAmount })
}

export async function noShow(req, res) {
  const shopId = req.auth.shopId
  const existing = await Booking.findOne({ _id: req.params.bookingId, shopId }).lean()
  if (!existing) throw httpError(404, 'Không tìm thấy booking')
  ensureTransition(existing.status, 'no_show', ['confirmed'])
  const booking = await Booking.findOneAndUpdate(
    { _id: req.params.bookingId, shopId },
    { status: 'no_show', updatedAt: new Date() },
    { new: true }
  ).lean()

  const deposit = await Deposit.findOne({ bookingId: String(booking._id) })
  if (deposit && ['holding', 'pending', 'refund_pending'].includes(deposit.status)) {
    const wallet = await Wallet.findOneAndUpdate(
      { shopId },
      { $setOnInsert: { minBalance: 0, escrowBalance: 0, status: 'active' }, $set: { updatedAt: new Date() } },
      { upsert: true, new: true }
    )
    const amount = Number(deposit.amount || 0)
    const ratio = await getNoShowPlatformCutRatio()
    const platformCut = Math.round(amount * ratio)
    const shopPart = Math.max(0, amount - platformCut)
    wallet.escrowBalance = Math.max(0, Number(wallet.escrowBalance || 0) - amount)
    wallet.balance = Number(wallet.balance || 0) + shopPart
    await wallet.save()

    deposit.status = 'split_no_show'
    deposit.updatedAt = new Date()
    await deposit.save()

    await WalletTransaction.create({
      shopId,
      walletId: String(wallet._id),
      type: 'escrow_split_no_show_auto',
      amount: shopPart,
      description: `Tự động chia cọc no-show booking ${booking.bookingCode || booking._id}`,
      refId: String(booking._id),
      status: 'success',
      createdAt: new Date()
    })
  }

  await appendStatusLog(booking._id, 'no_show', req.auth.userId, existing.status || '')
  if (booking.customerEmail) {
    const payload = buildBookingStatusEmailForCustomer({
      shopName: '',
      bookingCode: booking.bookingCode,
      startTime: booking.startTime,
      statusLabel: 'No-show'
    })
    await sendEmailBestEffort({ to: booking.customerEmail, ...payload })
  }
  res.json({ booking, depositStatus: deposit?.status || null })
}

export async function updateNote(req, res) {
  const shopId = req.auth.shopId
  const booking = await Booking.findOneAndUpdate(
    { _id: req.params.bookingId, shopId },
    { note: req.body?.note || '', updatedAt: new Date() },
    { new: true }
  ).lean()
  if (!booking) throw httpError(404, 'Không tìm thấy booking')
  res.json({ booking })
}
