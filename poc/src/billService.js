import { randomUUID } from 'node:crypto'

export const mapExtractedDataToBill = (extractedData, warnings = []) => {
  const now = new Date().toISOString()
  return {
    id: randomUUID(),
    billName: extractedData.merchantName ? `Receipt - ${extractedData.merchantName}` : 'Receipt - Needs review',
    status: warnings.length > 0 ? 'NEEDS_REVIEW' : 'DRAFT',
    category: 'Other',
    currency: extractedData.currency,
    totalAmount: extractedData.total,
    paymentDate: extractedData.transactionDate,
    splittingMethod: 'item-based',
    items: extractedData.items.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      amount: item.lineTotal,
      allocatedTo: [],
    })),
    source: {
      type: 'OCR_POC',
      invoiceNumber: extractedData.invoiceNumber,
      confidence: extractedData.confidence,
    },
    warnings: [...warnings],
    createdAt: now,
    updatedAt: now,
  }
}

export const createReceiptProcessingService = ({ provider, store, logger }) => ({
  async process(image, requestId) {
    logger.info('ocr.started', { requestId, provider: provider.name })
    const ocr = await provider.recognize(image)
    logger.info('ocr.succeeded', { requestId, provider: provider.name, confidence: ocr.confidence })
    const normalized = normalizeResult(ocr)
    logger.info('receipt.normalized', { requestId, itemCount: normalized.extractedData.items.length, warningCount: normalized.warnings.length })
    const bill = mapExtractedDataToBill(normalized.extractedData, normalized.warnings)
    logger.info('bill.created', { requestId, billId: bill.id, status: bill.status })
    await store.create(bill)
    logger.info('bill.persisted', { requestId, billId: bill.id })
    return {
      success: true,
      requestId,
      ocr: { provider: provider.name, rawText: ocr.rawText, confidence: ocr.confidence },
      extractedData: normalized.extractedData,
      bill,
      warnings: normalized.warnings,
    }
  },
})

import { normalizeOcrResult as normalizeResult } from './normalizer.js'
