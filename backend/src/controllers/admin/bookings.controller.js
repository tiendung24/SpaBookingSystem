import { Booking, Deposit, PayosPayment } from '../../models/index.js'
import { httpError } from '../../utils/httpError.js'

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
    { status: req.body?.status || 'pending', updatedAt: new Date() },
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

