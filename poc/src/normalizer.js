const LABELS = {
  invoiceNumber: /^(?:invoice|receipt|hoa don|ma hoa don)\s*:/i,
  transactionDate: /^(?:date|ngay)\s*:/i,
  subtotal: /^(?:subtotal|tam tinh)\s*:/i,
  discount: /^(?:discount|giam gia)\s*:/i,
  tax: /^(?:tax|thue)\s*:/i,
  serviceFee: /^(?:service fee|phi dich vu)\s*:/i,
  total: /^(?:grand total|total|tong cong|thanh toan)\s*:/i,
  paymentMethod: /^(?:payment|payment method|thanh toan bang)\s*:/i,
}

export const normalizeMoney = (value) => {
  if (value === null || value === undefined || value === '') return null
  const normalized = String(value).trim().replace(/[₫đ$€£\s]/gi, '')
  const negative = normalized.startsWith('-')
  const digits = normalized.replace(/[^0-9]/g, '')
  if (!digits) return null
  const amount = Number(digits)
  if (!Number.isSafeInteger(amount)) return null
  return negative ? -amount : amount
}

const valueAfterColon = (line) => line.slice(line.indexOf(':') + 1).trim()

const normalizeDate = (value) => {
  const match = value.match(/(\d{1,2})[/-](\d{1,2})[/-](\d{4})(?:\s+(\d{1,2}):(\d{2}))?/)
  if (!match) return null
  const [, day, month, year, hour = '00', minute = '00'] = match
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${hour.padStart(2, '0')}:${minute}:00+07:00`
}

const findValue = (lines, key) => {
  const line = lines.find((candidate) => LABELS[key].test(candidate))
  return line ? valueAfterColon(line) : null
}

const parseItem = (line) => {
  const parts = line.split('|').map((part) => part.trim())
  if (parts.length !== 4) return null
  const quantity = Number(parts[1])
  const unitPrice = normalizeMoney(parts[2])
  const lineTotal = normalizeMoney(parts[3])
  if (!parts[0] || !Number.isSafeInteger(quantity) || quantity <= 0 || unitPrice === null || lineTotal === null) return null
  return { name: parts[0], quantity, unitPrice, lineTotal }
}

const detectCurrency = (rawText) => {
  if (/\bUSD\b|\$/i.test(rawText)) return 'USD'
  if (/\bEUR\b|€/i.test(rawText)) return 'EUR'
  return 'VND'
}

const normalizeStructuredResult = (data, rawText, fallbackConfidence) => {
  console.log('[Step 4] Trích xuất thông tin (từ JSON)...');
  const items = Array.isArray(data.items) ? data.items.map((item) => ({
    name: String(item.name ?? '').trim(),
    quantity: Number(item.quantity ?? 1),
    unitPrice: normalizeMoney(item.unitPrice),
    lineTotal: normalizeMoney(item.lineTotal ?? item.amount),
  })).filter((item) => item.name && Number.isSafeInteger(item.quantity) && item.quantity > 0 && item.unitPrice !== null && item.lineTotal !== null) : []
  const itemSum = items.reduce((sum, item) => sum + item.lineTotal, 0)
  const subtotal = normalizeMoney(data.subtotal) ?? itemSum
  const discount = normalizeMoney(data.discount) ?? 0
  const tax = normalizeMoney(data.tax) ?? 0
  const serviceFee = normalizeMoney(data.serviceFee) ?? 0
  const total = normalizeMoney(data.total ?? data.totalAmount) ?? subtotal - discount + tax + serviceFee
  const computedTotal = subtotal - discount + tax + serviceFee
  const merchantName = String(data.merchantName ?? data.billName ?? '').trim() || null
  console.log('[Step 5] Validate dữ liệu và xử lý lỗi (từ JSON)...');
  const warnings = []
  if (!merchantName) warnings.push('MERCHANT_MISSING')
  if (items.length === 0) warnings.push('ITEMS_MISSING')
  if (itemSum > 0 && subtotal !== itemSum) warnings.push('SUBTOTAL_MISMATCH')
  if (total !== computedTotal) warnings.push('TOTAL_MISMATCH_REQUIRES_CONFIRMATION')
  return {
    extractedData: {
      merchantName,
      merchantAddress: String(data.merchantAddress ?? '').trim() || null,
      invoiceNumber: String(data.invoiceNumber ?? '').trim() || null,
      transactionDate: data.transactionDate ?? data.paymentDate ?? null,
      currency: String(data.currency ?? 'VND').toUpperCase(),
      items,
      subtotal,
      discount,
      tax,
      serviceFee,
      total,
      paymentMethod: String(data.paymentMethod ?? '').trim() || null,
      confidence: Number.isFinite(Number(data.confidence)) ? Number(data.confidence) : fallbackConfidence,
      rawText,
    },
    computedTotal,
    warnings,
  }
}

export const normalizeOcrResult = ({ rawText, confidence = null }) => {
  const trimmedRawText = String(rawText ?? '').trim()
  if (trimmedRawText.startsWith('{')) {
    try {
      return normalizeStructuredResult(JSON.parse(trimmedRawText), trimmedRawText, confidence)
    } catch {
      // Fall through so malformed model JSON is handled safely as raw OCR text.
    }
  }
  console.log('[Step 4] Trích xuất thông tin (từ Raw Text)...');
  const lines = trimmedRawText.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
  const itemLines = new Set(lines.filter((line) => line.includes('|')))
  const items = [...itemLines].map(parseItem).filter(Boolean)
  const metadataLines = new Set(lines.filter((line) => Object.values(LABELS).some((pattern) => pattern.test(line))))
  const merchantName = lines.find((line) => !metadataLines.has(line) && !itemLines.has(line) && !/\d/.test(line)) ?? null
  const merchantIndex = merchantName ? lines.indexOf(merchantName) : -1
  const merchantAddress = merchantIndex >= 0 && lines[merchantIndex + 1] && !metadataLines.has(lines[merchantIndex + 1])
    ? lines[merchantIndex + 1]
    : null

  const itemSum = items.reduce((sum, item) => sum + item.lineTotal, 0)
  const reportedSubtotal = normalizeMoney(findValue(lines, 'subtotal'))
  const discount = normalizeMoney(findValue(lines, 'discount')) ?? 0
  const tax = normalizeMoney(findValue(lines, 'tax')) ?? 0
  const serviceFee = normalizeMoney(findValue(lines, 'serviceFee')) ?? 0
  const reportedTotal = normalizeMoney(findValue(lines, 'total'))
  const computedTotal = (reportedSubtotal ?? itemSum) - discount + tax + serviceFee
  const total = reportedTotal ?? computedTotal
  console.log('[Step 5] Validate dữ liệu và xử lý lỗi (từ Raw Text)...');
  const warnings = []

  if (!merchantName) warnings.push('MERCHANT_MISSING')
  if (items.length === 0) warnings.push('ITEMS_MISSING')
  if (reportedSubtotal !== null && itemSum > 0 && reportedSubtotal !== itemSum) warnings.push('SUBTOTAL_MISMATCH')
  if (reportedTotal !== null && computedTotal !== reportedTotal) warnings.push('TOTAL_MISMATCH_REQUIRES_CONFIRMATION')

  return {
    extractedData: {
      merchantName,
      merchantAddress,
      invoiceNumber: findValue(lines, 'invoiceNumber'),
      transactionDate: normalizeDate(findValue(lines, 'transactionDate') ?? ''),
      currency: detectCurrency(rawText),
      items,
      subtotal: reportedSubtotal ?? itemSum,
      discount,
      tax,
      serviceFee,
      total,
      paymentMethod: findValue(lines, 'paymentMethod'),
      confidence,
      rawText: String(rawText ?? '').trim(),
    },
    computedTotal,
    warnings,
  }
}
