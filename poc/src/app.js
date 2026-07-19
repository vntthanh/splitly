import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { randomUUID } from 'node:crypto'
import { AppError } from './errors.js'
import { parseImageUpload } from './upload.js'
import { createReceiptProcessingService } from './billService.js'

const publicDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../public')

const sendJson = (response, status, payload) => {
  response.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' })
  response.end(JSON.stringify(payload))
}

const staticFiles = new Map([
  ['/', ['index.html', 'text/html; charset=utf-8']],
  ['/app.js', ['app.js', 'text/javascript; charset=utf-8']],
  ['/styles.css', ['styles.css', 'text/css; charset=utf-8']],
])

export const createApp = ({ config, provider, store, logger }) => {
  const processingService = createReceiptProcessingService({ provider, store, logger })

  return async (request, response) => {
    const requestId = randomUUID()
    const url = new URL(request.url, 'http://localhost')
    try {
      if (request.method === 'GET' && staticFiles.has(url.pathname)) {
        const [fileName, contentType] = staticFiles.get(url.pathname)
        response.writeHead(200, { 'content-type': contentType })
        response.end(await fs.readFile(path.join(publicDirectory, fileName)))
        return
      }

      if (request.method === 'GET' && url.pathname === '/api/poc/health') {
        sendJson(response, 200, { status: 'ok', ocrMode: config.ocrMode, storage: 'json-file' })
        return
      }

      if (request.method === 'GET' && url.pathname.startsWith('/api/poc/bills/')) {
        const id = decodeURIComponent(url.pathname.slice('/api/poc/bills/'.length))
        const bill = store.findById(id)
        if (!bill) throw new AppError(404, 'BILL_NOT_FOUND', 'Bill was not found')
        sendJson(response, 200, { success: true, bill })
        return
      }

      if (request.method === 'POST' && url.pathname === '/api/poc/receipts/process') {
        console.log('\n[Step 1] Nhận ảnh hóa đơn: Bắt đầu parse multipart/form-data lấy buffer...');
        const image = await parseImageUpload(request, config.maxFileSizeBytes)
        logger.info('upload.received', { requestId, mimeType: image.mimeType, size: image.size })
        const result = await processingService.process(image, requestId)
        logger.info('request.completed', { requestId, billId: result.bill.id })
        console.log('[Step 7] Trả kết quả về UI: Hoàn tất.');
        sendJson(response, 201, result)
        return
      }

      throw new AppError(404, 'NOT_FOUND', 'Route was not found')
    } catch (error) {
      const status = error instanceof AppError ? error.status : 500
      const code = error instanceof AppError ? error.code : 'INTERNAL_ERROR'
      const message = error instanceof AppError ? error.message : 'Unexpected server error'
      logger.error('request.failed', { requestId, code, status })
      sendJson(response, status, { success: false, requestId, error: { code, message } })
    }
  }
}
