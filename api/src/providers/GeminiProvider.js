const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1/interactions'
const DEFAULT_GEMINI_MODEL = 'gemini-3.1-flash-lite'

const SENSITIVE_FIELDS = new Set([
  'billId',
  'creditorId',
  'creditorName',
  'creditorEmail',
  'debtorId',
  'debtorName',
  'debtorEmail',
  'email',
  'itemName',
])

const adviceSchema = {
  type: 'object',
  properties: {
    description: { type: 'string' },
    suggestion: { type: 'string' },
  },
  required: ['description', 'suggestion'],
}

const analysisSchema = {
  type: 'object',
  properties: {
    debtAdvice: adviceSchema,
    oweAdvice: adviceSchema,
    monthlyAdvice: adviceSchema,
    productAdvice: adviceSchema,
  },
  required: ['debtAdvice', 'oweAdvice', 'monthlyAdvice', 'productAdvice'],
}

const removeSensitiveData = (data) => {
  return JSON.parse(JSON.stringify(data, (key, value) => (SENSITIVE_FIELDS.has(key) ? undefined : value)))
}

const validateAnalysis = (analysis) => {
  const requiredFields = analysisSchema.required
  const isValid =
    analysis &&
    requiredFields.every((field) => {
      const advice = analysis[field]
      return (
        advice &&
        typeof advice.description === 'string' &&
        advice.description.trim() &&
        typeof advice.suggestion === 'string' &&
        advice.suggestion.trim()
      )
    })

  if (!isValid) {
    throw new Error('Gemini returned an invalid analysis response')
  }

  return analysis
}

const extractOutputText = (result) => {
  if (typeof result?.output_text === 'string' && result.output_text.trim()) {
    return result.output_text
  }

  if (!Array.isArray(result?.steps)) return ''

  const modelOutputSteps = result.steps.filter((step) => step?.type === 'model_output')
  const lastModelOutput = modelOutputSteps[modelOutputSteps.length - 1]

  if (!Array.isArray(lastModelOutput?.content)) return ''

  return lastModelOutput.content
    .filter((content) => content?.type === 'text' && typeof content.text === 'string')
    .map((content) => content.text)
    .join('')
}

export class GeminiClient {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY || ''
    this.model = process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL

    if (!this.apiKey) {
      throw new Error('Missing required environment variable: GEMINI_API_KEY')
    }
  }

  async analyzeSpending(data) {
    const safeData = removeSensitiveData(data)
    const response = await globalThis.fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': this.apiKey,
      },
      body: JSON.stringify({
        model: this.model,
        input: `Bạn là TingTing, trợ lý quản lý chi tiêu và hóa đơn chia tiền.

Phân tích dữ liệu dưới đây và trả về bốn nhóm kết quả bằng tiếng Việt:
- debtAdvice: Giúp người dùng ưu tiên các khoản đang nợ và tránh quá hạn.
- oweAdvice: Giúp người dùng thu hồi các khoản người khác đang nợ một cách lịch sự.
- monthlyAdvice: Dự đoán ngắn gọn xu hướng chi tiêu tháng tới và cách kiểm soát ngân sách.
- productAdvice: Xác định danh mục chi tiêu nổi bật và cách cân bằng chi tiêu.

Mỗi nhóm phải có đúng hai nội dung:
- description: Nhận xét hoặc phân tích dựa trên số liệu, dài 1-2 câu.
- suggestion: Một hành động cụ thể người dùng nên thực hiện, dài 1 câu.

Không lặp lại description trong suggestion. Không bịa thêm số liệu hoặc danh tính.

Dữ liệu đã ẩn thông tin nhận dạng cá nhân:
${JSON.stringify(safeData)}`,
        response_format: {
          type: 'text',
          mime_type: 'application/json',
          schema: analysisSchema,
        },
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Gemini API error: ${response.status} ${response.statusText} - ${errorText.slice(0, 1000)}`)
    }

    const result = await response.json()
    const outputText = extractOutputText(result)

    if (!outputText) {
      throw new Error('Gemini did not return analysis content')
    }

    try {
      return validateAnalysis(JSON.parse(outputText))
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error('Gemini returned malformed JSON')
      }
      throw error
    }
  }
}
