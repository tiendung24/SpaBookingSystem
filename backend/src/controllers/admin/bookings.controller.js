import { Booking, Deposit, PayosPayment } from '../../models/index.js'
import { httpError } from '../../utils/httpError.js'
import { requireString } from '../../utils/validation.js'

export async function getBookings(req, res) {
  const query = {}
  if (req.query.status) query.status = req.query.status
  if (req.query.shopId) query.shopId = req.query.shopId
  const items = await Booking.find(query).sort({ createdAt: -1 }).lean()
  res.json({ items })
}

export async function getBookingById(req, res) {
  const booking = await Booking.findById(req.params.bookingId).lean()
  if (!booking) throw httpError(404, 'Không tìm thấy booking')
  res.json({ booking })
}

export async function updateStatus(req, res) {
  const booking = await Booking.findByIdAndUpdate(
    req.params.bookingId,
    { status: (() => { const s = requireString(req.body?.status, 'status'); if (!['pending','confirmed','checked_in','completed','cancelled','canceled','no_show'].includes(s)) throw httpError(400, 'status không hợp lệ'); return s })(), updatedAt: new Date() },
    { new: true }
  ).lean()
  if (!booking) throw httpError(404, 'Không tìm thấy booking')
  res.json({ booking })
}

export async function getPayments(req, res) {
  const booking = await Booking.findById(req.params.bookingId).lean()
  if (!booking) throw httpError(404, 'Không tìm thấy booking')

  const items = await PayosPayment.find({
    $or: [{ bookingId: String(booking._id) }, { orderCode: booking.bookingCode }]
  }).lean()
  res.json({ items })
}

export async function getEscrow(req, res) {
  const booking = await Booking.findById(req.params.bookingId).lean()
  if (!booking) throw httpError(404, 'Không tìm thấy booking')
  const deposit = await Deposit.findOne({ bookingId: String(booking._id) }).sort({ createdAt: -1 }).lean()
  res.json({
    bookingId: String(booking._id),
    amount: Number(deposit?.amount || booking.depositAmount || 0),
    status: deposit?.status || 'holding'
  })
}

