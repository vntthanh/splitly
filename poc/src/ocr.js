import crypto from 'node:crypto'
import { AppError } from './errors.js'
import { VALID_OCR_TEXT } from './fixtures.js'

const mockProvider = {
  name: 'mock-fixture',
  async recognize() {
    if (process.env.MOCK_OCR_FAILURE === 'true') {
      throw new AppError(502, 'OCR_FAILED', 'Mock OCR failure requested')
    }
    return { rawText: VALID_OCR_TEXT, confidence: 0.96 }
  },
}

const realProvider = (config) => ({
  name: 'gemini',
  async recognize(image) {
    if (!config.geminiApiKey) {
      throw new AppError(503, 'OCR_NOT_CONFIGURED', 'GEMINI_API_KEY is required when OCR_MODE=real')
    }
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'].includes(image.mimeType)) {
      throw new AppError(415, 'REAL_OCR_IMAGE_TYPE', 'Gemini real mode accepts JPG, PNG, WEBP, HEIC, and HEIF')
    }
    const requestBody = {
      contents: [{
        parts: [
          { text: 'Extract receipt data as JSON only. Include merchantName, merchantAddress, invoiceNumber, transactionDate, currency, items (name, quantity, unitPrice, lineTotal), subtotal, discount, tax, serviceFee, total, paymentMethod and confidence when visible.' },
          {
            inline_data: {
              mime_type: image.mimeType,
              data: image.buffer.toString('base64')
            }
          }
        ]
      }],
      generationConfig: {
        temperature: 0.2,
        topP: 0.8,
        topK: 40,
        responseMimeType: "application/json",
      }
    }

    let response
    try {
      response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${config.geminiModel}:generateContent?key=${config.geminiApiKey}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(requestBody),
      })
    } catch {
      throw new AppError(502, 'OCR_UNAVAILABLE', 'Could not connect to OCR provider')
    }
    if (!response.ok) {
      const errBody = await response.text().catch(() => '')
      throw new AppError(502, 'OCR_FAILED', `OCR provider returned HTTP ${response.status} ${errBody}`)
    }
    const result = await response.json()
    const rawText = result?.candidates?.[0]?.content?.parts?.[0]?.text
    if (typeof rawText !== 'string' || !rawText.trim()) {
      throw new AppError(422, 'OCR_NO_TEXT', 'OCR provider could not extract receipt text')
    }
    return { rawText: rawText.replace(/^```(?:json)?\s*|\s*```$/g, ''), confidence: null }
  },
})

export const createOcrProvider = (config) => (config.ocrMode === 'real' ? realProvider(config) : mockProvider)
