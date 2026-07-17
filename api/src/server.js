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
import { MicrosoftGraphEmailProvider } from '~/providers/MicrosoftGraphEmailProvider'
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

    console.log('5.Verifying Microsoft Graph email service...')

    const graphReady = await MicrosoftGraphEmailProvider.verifyConnection()
    if (!graphReady) {
      console.warn('Ă¢ÂÂ Ă¯Â¸Â  WARNING: Microsoft Graph is not configured. Email delivery will fail!')
      console.warn('   Please check GRAPH_TENANT_ID, GRAPH_CLIENT_ID, GRAPH_CLIENT_SECRET, GRAPH_SENDER_EMAIL')
    } else {
      console.log('6.Microsoft Graph email service verified successfully!')
    }

    START_SERVER()
  } catch (error) {
    console.error('Error connecting to MongoDB:', error)
    process.exit(0)
  }
})()
