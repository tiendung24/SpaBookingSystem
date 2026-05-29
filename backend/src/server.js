import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import path from 'path'
import http from 'http'

import { buildSwaggerSpec, swaggerUi, swaggerUiSetup, swaggerJsonHandler } from './swagger/index.js'
import { notFoundHandler, errorHandler } from './middlewares/errorHandlers.js'
import { apiRouter } from './routes/index.js'
import { connectDb } from './config/db.js'
import { startJobs } from './jobs/index.js'
import { initRealtimeServer } from './utils/realtime.js'

const app = express()
const server = http.createServer(app)

app.use(helmet())
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
    maxAge: 86400
  })
)
app.use(express.json({ limit: '2mb' }))
app.use(express.urlencoded({ extended: true }))
app.use(morgan('dev'))
app.use('/uploads', (req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin')
  res.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*')
  next()
})
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
    initRealtimeServer(server)
    server.listen(port, () => {
      console.log(`[backend] listening on http://localhost:${port}`)
    })
  })
  .catch((err) => {
    console.error('[db] connection failed', err)
    process.exit(1)
  })
