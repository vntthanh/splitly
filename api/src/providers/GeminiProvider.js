import { FunctionCallingConfigMode, GoogleGenAI } from '@google/genai'

const DEFAULT_MODEL = 'gemini-3-flash-preview'
const DEFAULT_TIMEOUT_MS = 60000
const SENSITIVE_FIELDS = new Set([
  'billId', 'creditorId', 'creditorName', 'creditorEmail', 'debtorId',
  'debtorName', 'debtorEmail', 'email', 'itemName',
])

const analysisSchema = {
  type: 'object',
  properties: {
    debtAdvice: { type: 'object', properties: { description: { type: 'string' }, suggestion: { type: 'string' } }, required: ['description', 'suggestion'] },
    oweAdvice: { type: 'object', properties: { description: { type: 'string' }, suggestion: { type: 'string' } }, required: ['description', 'suggestion'] },
    monthlyAdvice: { type: 'object', properties: { description: { type: 'string' }, suggestion: { type: 'string' } }, required: ['description', 'suggestion'] },
    productAdvice: { type: 'object', properties: { description: { type: 'string' }, suggestion: { type: 'string' } }, required: ['description', 'suggestion'] },
  },
  required: ['debtAdvice', 'oweAdvice', 'monthlyAdvice', 'productAdvice'],
}

const removeSensitiveData = (data) =>
  JSON.parse(JSON.stringify(data, (key, value) => (SENSITIVE_FIELDS.has(key) ? undefined : value)))

const validateAnalysis = (analysis) => {
  const isValid = analysisSchema.required.every((field) => {
    const advice = analysis?.[field]
    return advice && typeof advice.description === 'string' && advice.description.trim() &&
      typeof advice.suggestion === 'string' && advice.suggestion.trim()
  })

  if (!isValid) {
    throw createProviderError('AI_INVALID_RESPONSE', 'Gemini returned an invalid analysis response')
  }

  return analysis
}

const createProviderError = (code, message) => {
  const error = new Error(message)
  error.code = code
  return error
}

class GeminiClient {
  constructor({
    apiKey = process.env.GEMINI_API_KEY,
    model = process.env.GEMINI_MODEL || DEFAULT_MODEL,
    timeoutMs = Number(process.env.GEMINI_TIMEOUT_MS) || DEFAULT_TIMEOUT_MS,
  } = {}) {
    if (!apiKey) {
      throw createProviderError('AI_CONFIGURATION_ERROR', 'Missing required environment variable: GEMINI_API_KEY')
    }

    if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
      throw createProviderError('AI_CONFIGURATION_ERROR', 'GEMINI_TIMEOUT_MS must be a positive number')
    }

    this.model = model
    this.timeoutMs = timeoutMs
    this.client = new GoogleGenAI({ apiKey })
  }

  /**
   * Chuyá»ƒn message cá»§a Splitly sang Gemini contents.
   * Browser chá»‰ Ä‘Æ°á»£c gá»­i role user vĂ  assistant.
   */
  toGeminiContents(messages) {
    if (!Array.isArray(messages) || messages.length === 0) {
      throw createProviderError('AI_INVALID_REQUEST', 'Messages must be a non-empty array')
    }

    return messages.map((message) => {
      if (!['user', 'assistant'].includes(message.role)) {
        throw createProviderError('AI_INVALID_REQUEST', `Unsupported message role: ${message.role}`)
      }

      if (typeof message.content !== 'string' || !message.content.trim()) {
        throw createProviderError('AI_INVALID_REQUEST', 'Message content must be a non-empty string')
      }

      return {
        role: message.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: message.content.trim() }],
      }
    })
  }

  /**
   * Há»— trá»£ cáº£ tool schema cÅ©:
   * { type: 'function', function: { name, description, parameters } }
   *
   * vĂ  Gemini schema:
   * { name, description, parametersJsonSchema }
   */
  toGeminiFunctionDeclarations(tools) {
    return tools.map((tool) => {
      const declaration = tool.function || tool

      if (!declaration.name) {
        throw createProviderError('AI_INVALID_REQUEST', 'Tool declaration is missing its name')
      }

      return {
        name: declaration.name,
        description: declaration.description || '',
        parametersJsonSchema: declaration.parametersJsonSchema ||
          declaration.parameters || {
            type: 'object',
            properties: {},
          },
      }
    })
  }

  /**
   * Tráº£ vá» contract ná»™i bá»™:
   *
   * { type: 'text', text: string }
   *
   * hoáº·c:
   *
   * {
   *   type: 'function_call',
   *   name: string,
   *   args: object
   * }
   */
  async createAssistantTurn({ messages, systemInstruction, tools = [] }) {
    const abortController = new AbortController()
    const timeoutId = setTimeout(() => abortController.abort(), this.timeoutMs)

    try {
      const config = {
        systemInstruction,
        temperature: 0.2,
        abortSignal: abortController.signal,
      }

      if (tools.length > 0) {
        config.tools = [
          {
            functionDeclarations: this.toGeminiFunctionDeclarations(tools),
          },
        ]

        config.toolConfig = {
          functionCallingConfig: {
            mode: FunctionCallingConfigMode.AUTO,
          },
        }
      }

      const response = await this.client.models.generateContent({
        model: this.model,
        contents: this.toGeminiContents(messages),
        config,
      })

      const functionCall = response.functionCalls?.[0]

      if (functionCall) {
        return {
          type: 'function_call',
          name: functionCall.name,
          args: functionCall.args || {},
        }
      }

      const text = response.text?.trim()

      if (!text) {
        throw createProviderError('AI_INVALID_RESPONSE', 'Gemini returned neither text nor a function call')
      }

      return {
        type: 'text',
        text,
      }
    } catch (error) {
      if (abortController.signal.aborted) {
        throw createProviderError('AI_TIMEOUT', `Gemini did not respond within ${this.timeoutMs}ms`)
      }

      if (error.code?.startsWith('AI_')) {
        throw error
      }

      const status = error.status || error.statusCode

      if (status === 401 || status === 403) {
        throw createProviderError('AI_PERMISSION_DENIED', 'Gemini API rejected the project or API key')
      }

      if (status === 429) {
        throw createProviderError('AI_RATE_LIMITED', 'Gemini API rate limit exceeded')
      }

      if (status >= 500) {
        throw createProviderError('AI_UNAVAILABLE', 'Gemini API is temporarily unavailable')
      }

      throw createProviderError('AI_UNAVAILABLE', 'Failed to communicate with Gemini API')
    } finally {
      clearTimeout(timeoutId)
    }
  }
  async analyzeSpending(data) {
    const abortController = new AbortController()
    const timeoutId = setTimeout(() => abortController.abort(), this.timeoutMs)

    try {
      const response = await this.client.models.generateContent({
        model: this.model,
        contents: [{
          role: 'user',
          parts: [{
            text: `Bạn là TingTing, trợ lý quản lý chi tiêu và hóa đơn chia tiền.

Phân tích dữ liệu dưới đây và trả về bốn nhóm kết quả bằng tiếng Việt: debtAdvice, oweAdvice, monthlyAdvice và productAdvice. Mỗi nhóm phải gồm description (nhận xét dựa trên số liệu, 1-2 câu) và suggestion (một hành động cụ thể, 1 câu). Không bịa thêm số liệu hoặc danh tính.

Dữ liệu đã ẩn thông tin nhận dạng cá nhân:
${JSON.stringify(removeSensitiveData(data))}`,
          }],
        }],
        config: {
          temperature: 0.2,
          responseMimeType: 'application/json',
          responseJsonSchema: analysisSchema,
          abortSignal: abortController.signal,
        },
      })
      const text = response.text?.trim()

      if (!text) {
        throw createProviderError('AI_INVALID_RESPONSE', 'Gemini did not return analysis content')
      }

      try {
        return validateAnalysis(JSON.parse(text))
      } catch (error) {
        if (error instanceof SyntaxError) {
          throw createProviderError('AI_INVALID_RESPONSE', 'Gemini returned malformed JSON')
        }
        throw error
      }
    } catch (error) {
      if (abortController.signal.aborted) {
        throw createProviderError('AI_TIMEOUT', `Gemini did not respond within ${this.timeoutMs}ms`)
      }
      if (error.code?.startsWith('AI_')) throw error
      throw createProviderError('AI_UNAVAILABLE', 'Failed to communicate with Gemini API')
    } finally {
      clearTimeout(timeoutId)
    }
  }
}

export { GeminiClient }
