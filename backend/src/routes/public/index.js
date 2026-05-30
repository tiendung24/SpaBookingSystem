import { Router } from 'express'
import { publicShopsRouter } from './shops.js'
import { publicBookingsRouter } from './bookings.js'
import { publicRefundsRouter } from './refunds.js'

export const publicRouter = Router()

publicRouter.use('/shops', publicShopsRouter)
publicRouter.use('/bookings', publicBookingsRouter)


publicRouter.use('/refunds', publicRefundsRouter)
