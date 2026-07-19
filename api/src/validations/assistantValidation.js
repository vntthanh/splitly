import Joi from 'joi'
import { StatusCodes } from 'http-status-codes'
import ApiError from '~/utils/APIError'

const validateAIRequest = async (req, res, next) => {
  const messageSchema = Joi.object({
    role: Joi.string().valid('user', 'assistant').required(),
    content: Joi.string().trim().min(1).max(2000).required(),
  }).unknown(false)

  const schema = Joi.object({
    messages: Joi.array()
      .items(messageSchema)
      .min(1)
      .max(30)
      .custom((messages, helpers) => {
        if (messages[messages.length - 1]?.role !== 'user') {
          return helpers.message({ custom: 'Tin nhắn cuối cùng phải có role user.' })
        }

        return messages
      })
      .required(),
  }).unknown(false)

  try {
    req.body = await schema.validateAsync(req.body, {
      abortEarly: false,
      allowUnknown: false,
      convert: true,
    })
    next()
  } catch (error) {
    next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, error.message))
  }
}

export const assistantValidation = {
    validateAIRequest
}
