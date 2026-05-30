import { Router } from 'express'
import { asyncHandler } from '../../utils/asyncHandler.js'
import * as PublicRefundsController from '../../controllers/public/refunds.controller.js'

export const publicRefundsRouter = Router()

publicRefundsRouter.get('/:token', asyncHandler(PublicRefundsController.getRefundByToken))
publicRefundsRouter.post('/:token/bank-info', asyncHandler(PublicRefundsController.submitRefundBankInfo))
