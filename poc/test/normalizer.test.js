import test from 'node:test'
import assert from 'node:assert/strict'
import { normalizeMoney, normalizeOcrResult } from '../src/normalizer.js'
import { mapExtractedDataToBill } from '../src/billService.js'
import { VALID_OCR_TEXT, MISSING_FIELDS_OCR_TEXT, MISMATCH_OCR_TEXT } from '../src/fixtures.js'

test('normalizes Vietnamese money separators and symbols to integer VND', () => {
  assert.equal(normalizeMoney('35.000 ₫'), 35000)
  assert.equal(normalizeMoney('100,000 VND'), 100000)
  assert.equal(normalizeMoney(null), null)
})

test('parses and normalizes a complete OCR receipt', () => {
  const result = normalizeOcrResult({ rawText: VALID_OCR_TEXT, confidence: 0.96 })
  assert.equal(result.extractedData.merchantName, 'SPLITLY COFFEE')
  assert.equal(result.extractedData.items.length, 2)
  assert.equal(result.extractedData.total, 90000)
  assert.deepEqual(result.warnings, [])
})

test('maps normalized OCR data to existing Splitly-like bill fields', () => {
  const normalized = normalizeOcrResult({ rawText: VALID_OCR_TEXT })
  const bill = mapExtractedDataToBill(normalized.extractedData, normalized.warnings)
  assert.equal(bill.status, 'DRAFT')
  assert.equal(bill.splittingMethod, 'item-based')
  assert.equal(bill.items[0].amount, 70000)
  assert.equal(bill.totalAmount, 90000)
})

test('missing merchant and items produce review warnings without crashing', () => {
  const result = normalizeOcrResult({ rawText: MISSING_FIELDS_OCR_TEXT })
  assert.equal(result.extractedData.merchantName, null)
  assert.deepEqual(result.extractedData.items, [])
  assert.ok(result.warnings.includes('MERCHANT_MISSING'))
  assert.ok(result.warnings.includes('ITEMS_MISSING'))
})

test('total mismatch is preserved and marked for confirmation', () => {
  const result = normalizeOcrResult({ rawText: MISMATCH_OCR_TEXT })
  assert.equal(result.extractedData.total, 100000)
  assert.equal(result.computedTotal, 70000)
  assert.ok(result.warnings.includes('TOTAL_MISMATCH_REQUIRES_CONFIRMATION'))
})

test('normalizes structured JSON returned by Clova', () => {
  const rawText = JSON.stringify({ billName: 'JSON MART', items: [{ name: 'Tea', quantity: 2, unitPrice: '10.000', amount: '20.000' }], totalAmount: '20.000', currency: 'vnd' })
  const result = normalizeOcrResult({ rawText })
  assert.equal(result.extractedData.merchantName, 'JSON MART')
  assert.equal(result.extractedData.items[0].lineTotal, 20000)
  assert.equal(result.extractedData.currency, 'VND')
})
