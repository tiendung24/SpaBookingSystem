import { Router } from 'express'

import { publicRouter } from './public/index.js'
import { authRouter } from './auth.js'
import { shopRouter } from './shop/index.js'
import { adminRouter } from './admin/index.js'
import { uploadsRouter } from './uploads.js'
import { webhooksRouter } from './webhooks.js'
import { systemRouter } from './system.js'
import { notificationsRouter } from './notifications.js'
import { shopsRouter } from './shops.js'

export const apiRouter = Router()

apiRouter.use('/public', publicRouter)
apiRouter.use('/auth', authRouter)
apiRouter.use('/shop', shopRouter)
apiRouter.use('/admin', adminRouter)
apiRouter.use('/uploads', uploadsRouter)
apiRouter.use('/webhooks', webhooksRouter)
apiRouter.use('/system', systemRouter)
apiRouter.use('/notifications', notificationsRouter)
apiRouter.use('/shops', shopsRouter)
