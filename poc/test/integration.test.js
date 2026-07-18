import test from 'node:test'
import assert from 'node:assert/strict'
import { once } from 'node:events'
import { startServer } from '../src/server.js'
import { AppError } from '../src/errors.js'
import { VALID_OCR_TEXT } from '../src/fixtures.js'

class MemoryStore {
  bills = new Map()
  async initialize() {}
  async create(bill) { this.bills.set(bill.id, bill) }
  findById(id) { return this.bills.get(id) ?? null }
}

const silentLogger = { info() {}, error() {} }
const png = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 0])

const withServer = async (provider, run) => {
  const store = new MemoryStore()
  const server = await startServer({
    config: { port: 0, ocrMode: 'mock', maxFileSizeBytes: 1024 * 1024 },
    provider,
    store,
    logger: silentLogger,
  })
  const baseUrl = `http://127.0.0.1:${server.address().port}`
  try {
    await run(baseUrl, store)
  } finally {
    server.close()
    await once(server, 'close')
  }
}

test('happy path uploads image, runs OCR, creates and retrieves a bill', async () => {
  await withServer({ name: 'test-fixture', async recognize() { return { rawText: VALID_OCR_TEXT, confidence: 0.96 } } }, async (baseUrl, store) => {
    const form = new FormData()
    form.set('file', new Blob([png], { type: 'image/png' }), 'ignored-client-name.png')
    const response = await fetch(`${baseUrl}/api/poc/receipts/process`, { method: 'POST', body: form })
    const payload = await response.json()
    assert.equal(response.status, 201)
    assert.equal(payload.success, true)
    assert.equal(payload.bill.totalAmount, 90000)
    assert.equal(payload.bill.items.length, 2)
    assert.ok(store.findById(payload.bill.id))

    const saved = await fetch(`${baseUrl}/api/poc/bills/${payload.bill.id}`)
    assert.equal(saved.status, 200)
    assert.equal((await saved.json()).bill.id, payload.bill.id)
  })
})

test('rejects invalid file type with a clear error', async () => {
  await withServer({ name: 'unused', async recognize() { throw new Error('must not run') } }, async (baseUrl) => {
    const form = new FormData()
    form.set('file', new Blob(['not an image'], { type: 'text/plain' }), 'receipt.txt')
    const response = await fetch(`${baseUrl}/api/poc/receipts/process`, { method: 'POST', body: form })
    const payload = await response.json()
    assert.equal(response.status, 415)
    assert.equal(payload.error.code, 'UNSUPPORTED_FILE_TYPE')
  })
})

test('returns a controlled response when OCR provider fails', async () => {
  await withServer({ name: 'failing-provider', async recognize() { throw new AppError(502, 'OCR_FAILED', 'OCR test failure') } }, async (baseUrl) => {
    const form = new FormData()
    form.set('file', new Blob([png], { type: 'image/png' }), 'receipt.png')
    const response = await fetch(`${baseUrl}/api/poc/receipts/process`, { method: 'POST', body: form })
    const payload = await response.json()
    assert.equal(response.status, 502)
    assert.equal(payload.error.code, 'OCR_FAILED')
  })
})

test('rejects a port conflict without emitting an unhandled server error', async () => {
  const provider = { name: 'unused', async recognize() { return { rawText: VALID_OCR_TEXT } } }
  const firstServer = await startServer({
    config: { port: 0, ocrMode: 'mock', maxFileSizeBytes: 1024 * 1024 },
    provider,
    store: new MemoryStore(),
    logger: silentLogger,
  })
  const occupiedPort = firstServer.address().port
  try {
    await assert.rejects(
      startServer({
        config: { port: occupiedPort, ocrMode: 'mock', maxFileSizeBytes: 1024 * 1024 },
        provider,
        store: new MemoryStore(),
        logger: silentLogger,
      }),
      (error) => error.code === 'EADDRINUSE'
    )
  } finally {
    firstServer.close()
    await once(firstServer, 'close')
  }
})
