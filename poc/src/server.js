import http from 'node:http'
import { pathToFileURL } from 'node:url'
import { config } from './config.js'
import { logger } from './logger.js'
import { JsonBillStore } from './billStore.js'
import { createOcrProvider } from './ocr.js'
import { createApp } from './app.js'

export const startServer = async (overrides = {}) => {
  const runtimeConfig = overrides.config ?? config
  const runtimeLogger = overrides.logger ?? logger
  const store = overrides.store ?? new JsonBillStore(runtimeConfig.billStoreFile)
  await store.initialize?.()
  const provider = overrides.provider ?? createOcrProvider(runtimeConfig)
  const server = http.createServer(createApp({ config: runtimeConfig, provider, store, logger: runtimeLogger }))
  await new Promise((resolve, reject) => {
    const handleError = (error) => {
      server.off('listening', handleListening)
      reject(error)
    }
    const handleListening = () => {
      server.off('error', handleError)
      resolve()
    }
    server.once('error', handleError)
    server.once('listening', handleListening)
    server.listen(runtimeConfig.port, '127.0.0.1')
  })
  const address = server.address()
  runtimeLogger.info('server.started', { port: address.port, ocrMode: runtimeConfig.ocrMode })
  return server
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  startServer().catch((error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`Cannot start OCR PoC: port ${config.port} is already in use. Stop the process using that port or set a different PORT in poc/.env.`)
    } else {
      logger.error('server.failed', { message: error.message })
    }
    process.exitCode = 1
  })
}
