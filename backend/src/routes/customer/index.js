import { Router } from 'express'
import { requireAuth, requireRole } from '../../middlewares/auth.js'
import { asyncHandler } from '../../utils/asyncHandler.js'
import * as CustomerBookingsController from '../../controllers/customer/bookings.controller.js'

export const customerRouter = Router()
customerRouter.use(requireAuth, requireRole(['customer']))
customerRouter.get('/me', asyncHandler(CustomerBookingsController.me))
customerRouter.get('/bookings', asyncHandler(CustomerBookingsController.myBookings))

customerRouter.post('/refunds/:bookingCode/bank-info', asyncHandler(CustomerBookingsController.submitRefundBankInfo))

customerRouter.post('/bookings/:bookingCode/cancel', asyncHandler(CustomerBookingsController.cancelMyBooking))
