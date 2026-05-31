import { Booking, Customer, LoyaltyAccount, LoyaltyTransaction } from '../models/index.js'
import { httpError } from '../utils/httpError.js'

export const LOYALTY_EARN_BASE_VND = 10000
export const LOYALTY_REDEEM_VALUE_PER_POINT = 100
export const LOYALTY_MAX_REDEEM_DEPOSIT_PERCENT = 80

function nowDate() {
  return new Date()
}

function safeNumber(value) {
  const n = Number(value || 0)
  return Number.isFinite(n) ? n : 0
}

export function calculateEarnPoints(totalAmount) {
  return Math.max(0, Math.floor(safeNumber(totalAmount) / LOYALTY_EARN_BASE_VND))
}

export function calculateRedeemPlan({ depositAmount, requestedPoints, currentPointsBalance }) {
  const deposit = Math.max(0, safeNumber(depositAmount))
  const balance = Math.max(0, Math.floor(safeNumber(currentPointsBalance)))
  const requested = Math.max(0, Math.floor(safeNumber(requestedPoints)))
  const maxDiscountVnd = Math.min(deposit, Math.floor((deposit * LOYALTY_MAX_REDEEM_DEPOSIT_PERCENT) / 100))
  const maxRedeemablePoints = Math.max(0, Math.floor(maxDiscountVnd / LOYALTY_REDEEM_VALUE_PER_POINT))
  const pointsToUse = Math.max(0, Math.min(requested, balance, maxRedeemablePoints))
  const redeemDiscountVnd = pointsToUse * LOYALTY_REDEEM_VALUE_PER_POINT
  const finalDepositAmount = Math.max(0, deposit - redeemDiscountVnd)
  return { depositAmount: deposit, currentPointsBalance: balance, requestedPoints: requested, maxDiscountVnd, maxRedeemablePoints, pointsToUse, redeemDiscountVnd, finalDepositAmount }
}

export async function getOrCreateLoyaltyAccount(customerId) {
  const normalizedCustomerId = String(customerId || '').trim()
  if (!normalizedCustomerId) throw httpError(400, 'Thiếu customerId để tạo tài khoản điểm')
  const now = nowDate()
  let account = await LoyaltyAccount.findOne({ customerId: normalizedCustomerId })
  if (!account) {
    account = await LoyaltyAccount.create({ customerId: normalizedCustomerId, pointsBalance: 0, lifetimeEarned: 0, lifetimeSpent: 0, createdAt: now, updatedAt: now })
  }
  return account
}

export async function getLoyaltySummary(customerId) {
  const account = await getOrCreateLoyaltyAccount(customerId)
  return {
    customerId: String(account.customerId),
    pointsBalance: Math.max(0, Math.floor(safeNumber(account.pointsBalance))),
    redeemValueVnd: Math.max(0, Math.floor(safeNumber(account.pointsBalance))) * LOYALTY_REDEEM_VALUE_PER_POINT,
    lifetimeEarned: Math.max(0, Math.floor(safeNumber(account.lifetimeEarned))),
    lifetimeSpent: Math.max(0, Math.floor(safeNumber(account.lifetimeSpent))),
    rules: {
      earnBaseVnd: LOYALTY_EARN_BASE_VND,
      redeemValuePerPoint: LOYALTY_REDEEM_VALUE_PER_POINT,
      maxRedeemDepositPercent: LOYALTY_MAX_REDEEM_DEPOSIT_PERCENT
    }
  }
}

export async function reserveRedeemPointsForBooking({ customerId, bookingId, bookingCode, depositAmount, requestedPoints }) {
  const account = await getOrCreateLoyaltyAccount(customerId)
  const plan = calculateRedeemPlan({ depositAmount, requestedPoints, currentPointsBalance: account.pointsBalance })
  if (plan.pointsToUse <= 0) return { account, plan, transaction: null }

  const existing = await LoyaltyTransaction.findOne({ bookingId: String(bookingId), type: 'redeem_reserve' })
  if (existing) return { account, plan: { ...plan, pointsToUse: safeNumber(existing.points), redeemDiscountVnd: safeNumber(existing.amountVnd), finalDepositAmount: Math.max(0, safeNumber(depositAmount) - safeNumber(existing.amountVnd)) }, transaction: existing }

  if (plan.pointsToUse > safeNumber(account.pointsBalance)) throw httpError(409, 'Điểm hiện có không đủ để áp dụng')

  const now = nowDate()
  account.pointsBalance = Math.max(0, safeNumber(account.pointsBalance) - plan.pointsToUse)
  account.updatedAt = now
  await account.save()

  const tx = await LoyaltyTransaction.create({
    customerId: String(customerId),
    bookingId: String(bookingId),
    bookingCode: String(bookingCode || ''),
    type: 'redeem_reserve',
    status: 'reserved',
    points: plan.pointsToUse,
    amountVnd: plan.redeemDiscountVnd,
    note: `Giữ ${plan.pointsToUse} điểm cho booking ${bookingCode || bookingId}`,
    createdAt: now,
    updatedAt: now
  })

  return { account, plan, transaction: tx }
}

export async function applyRedeemForBooking(bookingId) {
  const tx = await LoyaltyTransaction.findOne({ bookingId: String(bookingId), type: 'redeem_reserve' })
  if (!tx) return null
  if (String(tx.status) === 'applied') return tx
  tx.status = 'applied'
  tx.updatedAt = nowDate()
  await tx.save()

  const account = await getOrCreateLoyaltyAccount(tx.customerId)
  account.lifetimeSpent = safeNumber(account.lifetimeSpent) + safeNumber(tx.points)
  account.updatedAt = nowDate()
  await account.save()

  return tx
}

export async function releaseRedeemForBooking(bookingId, note = '') {
  const tx = await LoyaltyTransaction.findOne({ bookingId: String(bookingId), type: 'redeem_reserve' })
  if (!tx) return null
  if (String(tx.status) === 'released') return tx
  if (String(tx.status) === 'applied') return tx

  const account = await getOrCreateLoyaltyAccount(tx.customerId)
  account.pointsBalance = safeNumber(account.pointsBalance) + safeNumber(tx.points)
  account.updatedAt = nowDate()
  await account.save()

  tx.status = 'released'
  tx.note = note || tx.note || 'Hoàn điểm do booking chưa thanh toán cọc thành công'
  tx.updatedAt = nowDate()
  await tx.save()
  return tx
}

export async function earnPointsForCompletedBooking(bookingId) {
  const booking = await Booking.findById(String(bookingId)).lean()
  if (!booking) throw httpError(404, 'Không tìm thấy booking để cộng điểm')
  if (String(booking.status) !== 'completed') return null

  const customerId = String(booking.customerId || '').trim()
  if (!customerId) return null

  const existing = await LoyaltyTransaction.findOne({ bookingId: String(booking._id), type: 'earn' })
  if (existing) return existing

  const points = calculateEarnPoints(booking.totalAmount)
  if (points <= 0) return null

  const account = await getOrCreateLoyaltyAccount(customerId)
  const now = nowDate()
  account.pointsBalance = safeNumber(account.pointsBalance) + points
  account.lifetimeEarned = safeNumber(account.lifetimeEarned) + points
  account.updatedAt = now
  await account.save()

  return LoyaltyTransaction.create({
    customerId,
    bookingId: String(booking._id),
    bookingCode: String(booking.bookingCode || ''),
    type: 'earn',
    status: 'applied',
    points,
    amountVnd: safeNumber(booking.totalAmount),
    note: `Cộng ${points} điểm từ booking ${booking.bookingCode || booking._id}`,
    createdAt: now,
    updatedAt: now
  })
}

export async function getCustomerLoyaltyHistory(customerId, limit = 20) {
  return LoyaltyTransaction.find({ customerId: String(customerId) }).sort({ createdAt: -1 }).limit(Math.max(1, Math.min(100, Number(limit || 20)))).lean()
}
