import { ShopClosureDay, ShopWorkingHour } from '../../models/index.js'
import { httpError } from '../../utils/httpError.js'
import { writeAuditLog } from '../../utils/audit.js'
import { requireNumber, requireString, requireTimeOrder, toNumber } from '../../utils/validation.js'

export async function getWorkingHours(req, res) {
  const shopId = req.auth.shopId
  const workingHours = await ShopWorkingHour.findOne({ shopId }).lean()
  res.json({ workingHours })
}

export async function updateWorkingHours(req, res) {
  const shopId = req.auth.shopId

  requireString(req.body?.openTime, 'openTime')
  requireString(req.body?.closeTime, 'closeTime')
  requireTimeOrder(req.body?.openTime, req.body?.closeTime)


  const rawWeekDays = Array.isArray(req.body?.weekDays) ? req.body.weekDays : undefined
  const normalizedWeekDays = Array.isArray(rawWeekDays)
    ? rawWeekDays
        .map((day) => Number(day))
        .map((day) => (day === 7 ? 0 : day))
        .filter((day) => Number.isFinite(day) && day >= 0 && day <= 6)
        .filter((day, idx, arr) => arr.indexOf(day) == idx)
        .sort((a, b) => a - b)
    : undefined

  const payload = {
    openTime: req.body?.openTime,
    closeTime: req.body?.closeTime,
    weekDays: normalizedWeekDays,
    lunchBreakStart: req.body?.lunchBreakStart,
    lunchBreakEnd: req.body?.lunchBreakEnd,
    updatedAt: new Date()
  }

  const workingHours = await ShopWorkingHour.findOneAndUpdate(
    { shopId },
    { $set: payload, $setOnInsert: { createdAt: new Date(), slotDurationMinutes: 30, maxCustomersPerSlot: 1 } },
    { upsert: true, new: true }
  ).lean()

  await writeAuditLog({
    actorUserId: req.auth.userId,
    action: 'shop.working_hours_update',
    entity: 'shop_working_hours',
    entityId: String(workingHours._id),
    meta: { shopId }
  })

  res.json({ workingHours })
}

export async function getHolidaySettings(req, res) {
  const shopId = req.auth.shopId
  const items = await ShopClosureDay.find({ shopId }).sort({ date: 1 }).lean()
  res.json({ items })
}

export async function createHoliday(req, res) {
  const shopId = req.auth.shopId
  requireString(req.body?.date, 'date')

  const holiday = await ShopClosureDay.create({
    shopId,
    date: new Date(req.body.date),
    reason: req.body?.reason || '',
    createdAt: new Date()
  })
  await writeAuditLog({
    actorUserId: req.auth.userId,
    action: 'shop.holiday_create',
    entity: 'shop_closure_day',
    entityId: String(holiday._id),
    meta: { shopId }
  })
  res.status(201).json({ holiday })
}

export async function deleteHoliday(req, res) {
  const shopId = req.auth.shopId
  const deleted = await ShopClosureDay.findOneAndDelete({ _id: req.params.holidayId, shopId }).lean()
  if (!deleted) throw httpError(404, 'Không tìm thấy ngày nghỉ')
  await writeAuditLog({
    actorUserId: req.auth.userId,
    action: 'shop.holiday_delete',
    entity: 'shop_closure_day',
    entityId: String(deleted._id),
    meta: { shopId }
  })
  res.json({ deleted: true })
}

export async function getSlotSettings(req, res) {
  const shopId = req.auth.shopId
  const workingHours = await ShopWorkingHour.findOne({ shopId }).lean()
  res.json({
    slotDurationMinutes: Number(workingHours?.slotDurationMinutes || 30),
    maxCustomersPerSlot: Number(workingHours?.maxCustomersPerSlot || 1)
  })
}

export async function updateSlotSettings(req, res) {
  const shopId = req.auth.shopId
  const slotDurationMinutes = requireNumber(req.body?.slotDurationMinutes || 30, 'slotDurationMinutes', { min: 15 })
  const maxCustomersPerSlot = requireNumber(req.body?.maxCustomersPerSlot || 1, 'maxCustomersPerSlot', { min: 1 })

  const workingHours = await ShopWorkingHour.findOneAndUpdate(
    { shopId },
    {
      $set: { slotDurationMinutes, maxCustomersPerSlot, updatedAt: new Date() },
      $setOnInsert: { createdAt: new Date(), openTime: '09:00', closeTime: '20:00' }
    },
    { upsert: true, new: true }
  ).lean()
  await writeAuditLog({
    actorUserId: req.auth.userId,
    action: 'shop.slot_settings_update',
    entity: 'shop_working_hours',
    entityId: String(workingHours._id),
    meta: { shopId, slotDurationMinutes, maxCustomersPerSlot }
  })
  res.json({ workingHours })
}