import { Router } from 'express'
import { publicShopsRouter } from './shops.js'
import { publicBookingsRouter } from './bookings.js'

export const publicRouter = Router()

publicRouter.use('/shops', publicShopsRouter)
publicRouter.use('/bookings', publicBookingsRouter)

