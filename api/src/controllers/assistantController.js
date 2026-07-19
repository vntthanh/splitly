import { randomUUID } from 'crypto'
import { StatusCodes } from 'http-status-codes'
import ApiError from '~/utils/APIError.js'
import { GeminiClient } from '~/providers/GeminiProvider.js'
import { processAssistantTurn } from '~/services/assistantService.js'
import { getDataForAnalysis } from '~/utils/assistantHelpers'

const ASSISTANT_ERROR_RESPONSES = {
  AI_INVALID_REQUEST: { statusCode: StatusCodes.UNPROCESSABLE_ENTITY, message: 'Nội dung trò chuyện không hợp lệ.' },
  AI_ACTOR_NOT_FOUND: { statusCode: StatusCodes.NOT_FOUND, message: 'Không tìm thấy tài khoản đang đăng nhập.' },
  AI_INVALID_RESPONSE: { statusCode: StatusCodes.BAD_GATEWAY, message: 'TingTing trả về dữ liệu không hợp lệ. Vui lòng thử lại.' },
  AI_RATE_LIMITED: { statusCode: StatusCodes.TOO_MANY_REQUESTS, message: 'TingTing đang nhận quá nhiều yêu cầu. Vui lòng thử lại sau.' },
  AI_TIMEOUT: { statusCode: StatusCodes.GATEWAY_TIMEOUT, message: 'TingTing phản hồi quá lâu. Vui lòng thử lại.' },
  AI_PERMISSION_DENIED: { statusCode: StatusCodes.SERVICE_UNAVAILABLE, message: 'TingTing hiện chưa được cấu hình để xử lý yêu cầu.' },
  AI_CONFIGURATION_ERROR: { statusCode: StatusCodes.SERVICE_UNAVAILABLE, message: 'TingTing hiện chưa được cấu hình để xử lý yêu cầu.' },
  AI_UNAVAILABLE: { statusCode: StatusCodes.SERVICE_UNAVAILABLE, message: 'TingTing đang tạm thời không khả dụng. Vui lòng thử lại sau.' },
}

const processAIRequest = async (req, res, next) => {
  const requestId = randomUUID()
  res.set('X-Request-ID', requestId)

  try {
    const result = await processAssistantTurn({
      actorId: req.jwtDecoded._id,
      messages: req.body.messages,
    })

    res.status(StatusCodes.OK).json({ data: result, meta: { requestId } })
  } catch (error) {
    const response = ASSISTANT_ERROR_RESPONSES[error.code] || {
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      message: 'Không thể xử lý yêu cầu với TingTing.',
    }

    console.error('Assistant request failed', {
      requestId,
      code: error.code || 'UNKNOWN_ERROR',
      statusCode: response.statusCode,
    })

    next(new ApiError(response.statusCode, response.message))
  }
}

const analysisByAssistant = async (userId) => {
  const data = await getDataForAnalysis(userId)
  return new GeminiClient().analyzeSpending(data)
}

const getAIAnalysis = async (req, res, next) => {
  try {
    const { userId } = req.params

    if (req.jwtDecoded._id.toString() !== userId) {
      throw new ApiError(StatusCodes.FORBIDDEN, 'You can only access your own analysis data')
    }

    res.status(StatusCodes.OK).json(await analysisByAssistant(userId))
  } catch (error) {
    if (error instanceof ApiError) return next(error)

    console.error('Error in getAIAnalysis:', error)
    next(new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Không thể tạo phân tích chi tiêu.'))
  }
}

export const assistantController = {
  processAIRequest,
  analysisByAssistant: getAIAnalysis,
}
