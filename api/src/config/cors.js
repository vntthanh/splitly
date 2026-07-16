import { env } from '~/config/environment'
import { StatusCodes } from 'http-status-codes'
import APIError from '~/utils/APIError'

// CORS Options Configuration
export const corsOptions = {
  origin: function (origin, callback) {
    // Health checks and same-origin requests do not include an Origin header.
    if (!origin || env.BUILD_MODE === 'dev') {
      return callback(null, true)
    }

    const allowedOrigins = [
      'http://localhost:5173',
      ...String(env.WEBSITE_DOMAIN_PRODUCTION || '')
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean),
    ]

    if (allowedOrigins.includes(origin)) {
      return callback(null, true)
    }

    // If the domain is not allowed, return an error
    return callback(new APIError(StatusCodes.FORBIDDEN, `${origin} not allowed by our CORS Policy.`))
  },
  optionsSuccessStatus: 200,

  // CORS will allow receiving cookies from requests
  credentials: true,
}
