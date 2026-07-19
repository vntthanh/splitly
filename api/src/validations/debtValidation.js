import Joi from 'joi'
import { StatusCodes } from 'http-status-codes'
import ApiError from '~/utils/APIError'

const getUserDebts = async (req, res, next) => {
  const correctCondition = Joi.object({
    userId: Joi.string().required()
  })

  try {
    await correctCondition.validateAsync(req.params, { abortEarly: false })
    next()
  } catch (error) {
    const errorMessage = new Error(error).message
    const customError = new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, errorMessage)
    next(customError)
  }
}

const initiatePayment = async (req, res, next) => {
  const correctCondition = Joi.object({
    creditorId: Joi.string().required(),
    amount: Joi.number().positive().required(),
    note: Joi.string().allow('').optional(),
    priorityBill: Joi.string().optional().allow(null)
  })

  try {
    await correctCondition.validateAsync(req.body, { abortEarly: false })
    next()
  } catch (error) {
    const errorMessage = new Error(error).message
    const customError = new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, errorMessage)
    next(customError)
  }
}

// Validation for confirming payment (in-app, not via email token)
const confirmPayment = async (req, res, next) => {
  const Joi = (await import('joi')).default
  const schema = Joi.object({
    debtorId: Joi.string().required(),
    amount: Joi.number().positive().required(),
    bills: Joi.array().items(
      Joi.object({
        billId: Joi.string().required(),
        amount: Joi.number().positive().required()
      })
    ).min(1).required(),
    note: Joi.string().allow('').optional(),
    isConfirmed: Joi.boolean().required()
  })
  try {
    await schema.validateAsync(req.body, { abortEarly: false })
    next()
  } catch (error) {
    const errorMessage = new Error(error).message
    const customError = new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, errorMessage)
    next(customError)
  }
}

const remindPayment = async (req, res, next) => {
  const correctCondition = Joi.object({
    creditorId: Joi.string().required(),
    debtorId: Joi.string().required(),
    bill: Joi.string().optional()
  })

  try {
    await correctCondition.validateAsync(req.body, { abortEarly: false })
    next()
  } catch (error) {
    const errorMessage = new Error(error).message
    const customError = new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, errorMessage)
    next(customError)
  }
}

export const debtValidation = {
  getUserDebts,
  initiatePayment,
  confirmPayment,
  remindPayment
}
