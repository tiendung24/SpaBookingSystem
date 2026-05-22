import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import path from 'path'

import { buildSwaggerSpec, swaggerUi, swaggerUiSetup, swaggerJsonHandler } from './swagger/index.js'
import { notFoundHandler, errorHandler } from './middlewares/errorHandlers.js'
import { apiRouter } from './routes/index.js'
import { connectDb } from './config/db.js'
import { startJobs } from './jobs/index.js'

const app = express()

app.use(helmet())
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true
  })
)
app.use(express.json({ limit: '2mb' }))
app.use(express.urlencoded({ extended: true }))
app.use(morgan('dev'))
app.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads')))

// Health
app.get('/health', (req, res) => res.json({ ok: true }))

// Swagger
const swaggerSpec = buildSwaggerSpec()
app.get('/api/docs.json', swaggerJsonHandler(swaggerSpec))
app.use('/api/docs', swaggerUi.serve, swaggerUiSetup(swaggerSpec))

// API
app.use('/api', apiRouter)

app.use(notFoundHandler)
app.use(errorHandler)

const port = Number(process.env.PORT || 4000)
connectDb()
  .then(() => {
    startJobs()
    app.listen(port, () => {
      // eslint-disable-next-line no-console
      console.log(`[backend] listening on http://localhost:${port}`)
    })
  })
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error('[db] connection failed', err)
    process.exit(1)
  })
