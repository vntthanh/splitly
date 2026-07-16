/* eslint-disable no-console */
import exitHook from 'async-exit-hook'
import express from 'express'
import cors from 'cors'
import { CONNECT_DB, CLOSE_DB } from '~/config/mongodb'
import { env } from '~/config/environment.js'
import { corsOptions } from '~/config/cors.js'
import { APIs_V1 } from '~/routes/v1'
import { errorHandlingMiddleware } from '~/middlewares/errorHandlingMiddleware'
import { initializeDatabase } from '~/config/initDB'
import cookieParser from 'cookie-parser'
import { BrevoEmailProvider } from '~/providers/BrevoEmailProvider'
import { NodemailerProvider } from '~/providers/NodemailerProvider'
import socketIo from 'socket.io'
import http from 'http'
import { notificationSocket, setIoInstance } from '~/sockets/notificationSocket'

const START_SERVER = () => {
  const app = express()
  // Cloud platforms provide PORT and require the server to listen on all interfaces.
  const hostname = env.APP_HOST || '0.0.0.0'
  const PORT = process.env.PORT || env.APP_PORT || 3000

  app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store')
    next()
  })
  app.use(cookieParser())
  // Middleware to enable CORS with proper configuration
  app.use(cors(corsOptions))
  app.use(express.json({ limit: '20mb' }))
  app.use('/v1', APIs_V1)
  app.use(errorHandlingMiddleware)

  const server = http.createServer(app)
  const io = socketIo(server, { cors: corsOptions })

  // Set io instance for notification service
  setIoInstance(io)

  io.on('connection', (socket) => {
    notificationSocket(socket)
  })

  server.listen(PORT, hostname, () => {
    console.log(`7.Server is running on http://${hostname}:${PORT}`)
  })

  exitHook(() => {
    console.log('\n8.Exiting application, closing MongoDB connection...')
    CLOSE_DB()
    console.log('9.MongoDB connection closed.')
  })
}

;(async () => {
  try {
    console.log('1.Connecting to MongoDB...')
    await CONNECT_DB()
    console.log('2.Connected to MongoDB successfully!')

    console.log('3.Initializing database indexes...')
    await initializeDatabase()
    console.log('4.Database indexes initialized!')

    console.log('5.Verifying email services...')

    // Verify Brevo (for registration emails)
    const brevoReady = await BrevoEmailProvider.verifyConnection()
    if (!brevoReady) {
      console.warn('Ă¢ÂÂ Ă¯Â¸Â  WARNING: Brevo is not configured. Registration emails will fail!')
      console.warn('   Please check your BREVO_API_KEY environment variable')
    } else {
      console.log('6a.Brevo email service verified successfully!')
    }

    // Verify Nodemailer/SMTP (for other emails)
    const smtpReady = await NodemailerProvider.verifyConnection()
    if (!smtpReady) {
      console.warn('Ă¢ÂÂ Ă¯Â¸Â  WARNING: SMTP is not configured. Other emails may fail!')
      console.warn('   Please check SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD')
    } else {
      console.log('6b.SMTP connection verified successfully!')
    }

    START_SERVER()
  } catch (error) {
    console.error('Error connecting to MongoDB:', error)
    process.exit(0)
  }
})()
