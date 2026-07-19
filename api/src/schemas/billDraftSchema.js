import Joi from 'joi'

const BILL_CATEGORIES = ['food', 'entertainment', 'transportation', 'shopping', 'utilities', 'other']

const BILL_SPLIT_TYPES = ['equal', 'by-person', 'by-item']

const participantInputSchema = Joi.object({
  query: Joi.string().trim().min(1).max(200).required(),
  usedAmount: Joi.number().integer().min(0).default(0),
}).unknown(false)

const itemInputSchema = Joi.object({
  name: Joi.string().trim().min(1).max(200).required(),
  quantity: Joi.number().integer().min(1).required(),
  unitPrice: Joi.number().integer().min(0).required(),

  allocatedToQueries: Joi.array().items(Joi.string().trim().min(1).max(200)).min(1).max(50).required(),
}).unknown(false)

const billDraftInputSchema = Joi.object({
  billName: Joi.string().trim().min(1).max(200).required(),

  category: Joi.string()
    .valid(...BILL_CATEGORIES)
    .required(),

  notes: Joi.string().trim().max(500).allow('').default(''),

  paymentDeadline: Joi.string().isoDate().required(),

  payerQuery: Joi.string().trim().min(1).max(200).required(),

  splitType: Joi.string()
    .valid(...BILL_SPLIT_TYPES)
    .required(),

  totalAmount: Joi.number().integer().positive().required(),

  participants: Joi.array().items(participantInputSchema).min(1).max(50).required(),

  items: Joi.when('splitType', {
    is: 'by-item',
    then: Joi.array().items(itemInputSchema).min(1).max(100).required(),
    otherwise: Joi.array().items(itemInputSchema).max(100).default([]),
  }),
}).unknown(false)

const validateBillDraftInput = async (input) => {
  return billDraftInputSchema.validateAsync(input, {
    abortEarly: false,
    allowUnknown: false,
    convert: true,
  })
}

export { BILL_CATEGORIES, BILL_SPLIT_TYPES, billDraftInputSchema, validateBillDraftInput }
