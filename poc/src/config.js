import fs from 'node:fs'
import path from 'node:path'

const envFile = path.resolve(process.cwd(), '.env')
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/)
    if (match && process.env[match[1]] === undefined) process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, '')
  }
}

const positiveInteger = (value, fallback, name) => {
  const parsed = Number(value ?? fallback)
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive integer`)
  }
  return parsed
}

const ocrMode = process.env.OCR_MODE ?? 'mock'
if (!['mock', 'real'].includes(ocrMode)) {
  throw new Error('OCR_MODE must be either mock or real')
}

export const config = Object.freeze({
  port: positiveInteger(process.env.PORT, 8089, 'PORT'),
  maxFileSizeBytes: positiveInteger(process.env.MAX_FILE_SIZE_BYTES, 5 * 1024 * 1024, 'MAX_FILE_SIZE_BYTES'),
  ocrMode,
  geminiApiKey: process.env.GEMINI_API_KEY ?? '',
  geminiModel: process.env.GEMINI_MODEL ?? 'gemini-3.1-flash-lite',
  billStoreFile: path.resolve(process.cwd(), process.env.BILL_STORE_FILE ?? './data/bills.json'),
})
