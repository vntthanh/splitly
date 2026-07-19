import { StatusCodes } from 'http-status-codes'
import ApiError from '~/utils/APIError.js'

const WINDOW_MS = 60 * 1000
const MAX_REQUESTS_PER_WINDOW = 20
const userWindows = new Map()

let requestCounter = 0

const pruneExpiredWindows = (now) => {
  for (const [userId, window] of userWindows.entries()) {
    if (now - window.startedAt >= WINDOW_MS) {
      userWindows.delete(userId)
    }
  }
}

const assistantRateLimiter = (req, res, next) => {
  const userId = req.jwtDecoded?._id

  if (!userId) {
    next(new ApiError(StatusCodes.UNAUTHORIZED, 'You are not authorized'))
    return
  }

  const now = Date.now()
  requestCounter += 1

  if (requestCounter % 100 === 0) {
    pruneExpiredWindows(now)
  }

  const currentWindow = userWindows.get(userId)

  if (!currentWindow || now - currentWindow.startedAt >= WINDOW_MS) {
    userWindows.set(userId, { startedAt: now, count: 1 })
    next()
    return
  }

  if (currentWindow.count >= MAX_REQUESTS_PER_WINDOW) {
    const retryAfterSeconds = Math.max(1, Math.ceil((WINDOW_MS - (now - currentWindow.startedAt)) / 1000))
    res.set('Retry-After', String(retryAfterSeconds))
    next(new ApiError(StatusCodes.TOO_MANY_REQUESTS, 'Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau.'))
    return
  }

  currentWindow.count += 1
  next()
}

export { assistantRateLimiter }
