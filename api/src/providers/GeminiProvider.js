import { FunctionCallingConfigMode, GoogleGenAI } from '@google/genai'

const DEFAULT_MODEL = 'gemini-3-flash-preview'
const DEFAULT_TIMEOUT_MS = 60000

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
   * Chuyển message của Splitly sang Gemini contents.
   * Browser chỉ được gửi role user và assistant.
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
   * Hỗ trợ cả tool schema cũ:
   * { type: 'function', function: { name, description, parameters } }
   *
   * và Gemini schema:
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
   * Trả về contract nội bộ:
   *
   * { type: 'text', text: string }
   *
   * hoặc:
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
}

export { GeminiClient }
