import Joi from 'joi'
import { ObjectId } from 'mongodb'
import { GET_DB } from '~/config/mongodb'
import { BILL_TYPE } from '~/utils/constants.js'

// Define Collection name and schema
const BILL_COLLECTION_NAME = 'bills'

const BILL_COLLECTION_SCHEMA = Joi.object({
  billName: Joi.string().min(1).max(200).required(),
  description: Joi.string().max(500).optional().allow(''),
  category: Joi.string().max(100).optional(),
  creatorId: Joi.alternatives().try(Joi.string(), Joi.object().instance(ObjectId)).required(),
  payerId: Joi.alternatives().try(Joi.string(), Joi.object().instance(ObjectId)).required(),
  totalAmount: Joi.number().min(0).required(),
  paymentDate: Joi.date().optional().default(null),
  creationDate: Joi.date().required().default(Date.now),
  paymentDeadline: Joi.date().required(),
  splittingMethod: Joi.string()
    .valid(...BILL_TYPE)
    .optional(),
  participants: Joi.array()
    .items(Joi.alternatives().try(Joi.string(), Joi.object().instance(ObjectId)))
    .optional(),
  items: Joi.array()
    .items(
      Joi.object({
        name: Joi.string().required(),
        amount: Joi.number().required(),
        quantity: Joi.number().min(1).optional(),
        allocatedTo: Joi.array()
          .items(Joi.alternatives().try(Joi.string(), Joi.object().instance(ObjectId)))
          .optional(),
      })
    )
    .optional(),
  paymentStatus: Joi.array()
    .items(
      Joi.object({
        userId: Joi.alternatives().try(Joi.string(), Joi.object().instance(ObjectId)).required(),
        amountOwed: Joi.number().required(),
        amountPaid: Joi.number().default(0),
        paidDate: Joi.date().allow(null).optional(),
      })
    )
    .optional(),
  isSettled: Joi.boolean().optional(),
  optedOutUsers: Joi.array()
    .items(Joi.alternatives().try(Joi.string(), Joi.object().instance(ObjectId)))
    .optional(),
  createdAt: Joi.date().timestamp('javascript').default(Date.now),
  updatedAt: Joi.date().timestamp('javascript').default(null),
  _destroy: Joi.boolean().default(false),
})

// fields that cannot be updated
const INVALID_UPDATE_FIELDS = ['_id', 'createdAt']

const validateBeforeCreate = async (data) => {
  return await BILL_COLLECTION_SCHEMA.validateAsync(data, { abortEarly: false })
}

/**
 * Convert string IDs to ObjectId for consistency
 */
const convertIdsToObjectId = (data) => {
  const converted = { ...data }

  // Convert creatorId
  if (converted.creatorId && typeof converted.creatorId === 'string' && ObjectId.isValid(converted.creatorId)) {
    converted.creatorId = new ObjectId(converted.creatorId)
  }

  // Convert payerId
  if (converted.payerId && typeof converted.payerId === 'string' && ObjectId.isValid(converted.payerId)) {
    converted.payerId = new ObjectId(converted.payerId)
  }

  // Convert participants
  if (converted.participants && Array.isArray(converted.participants)) {
    converted.participants = converted.participants.map((p) =>
      typeof p === 'string' && ObjectId.isValid(p) ? new ObjectId(p) : p
    )
  }

  // Convert paymentStatus.userId
  if (converted.paymentStatus && Array.isArray(converted.paymentStatus)) {
    converted.paymentStatus = converted.paymentStatus.map((ps) => ({
      ...ps,
      userId: typeof ps.userId === 'string' && ObjectId.isValid(ps.userId) ? new ObjectId(ps.userId) : ps.userId,
    }))
  }

  // Convert optedOutUsers
  if (converted.optedOutUsers && Array.isArray(converted.optedOutUsers)) {
    converted.optedOutUsers = converted.optedOutUsers.map((u) =>
      typeof u === 'string' && ObjectId.isValid(u) ? new ObjectId(u) : u
    )
  }

  // Convert items.allocatedTo
  if (converted.items && Array.isArray(converted.items)) {
    converted.items = converted.items.map((item) => ({
      ...item,
      allocatedTo:
        item.allocatedTo && Array.isArray(item.allocatedTo)
          ? item.allocatedTo.map((u) => (typeof u === 'string' && ObjectId.isValid(u) ? new ObjectId(u) : u))
          : item.allocatedTo,
    }))
  }

  return converted
}

const createNew = async (data) => {
  try {
    const convertedData = convertIdsToObjectId(data)
    const validData = await validateBeforeCreate(convertedData)
    const createdBill = await GET_DB().collection(BILL_COLLECTION_NAME).insertOne(validData)
    return createdBill
  } catch (error) {
    throw new Error(error)
  }
}

const findOneById = async (billId) => {
  try {
    return await GET_DB()
      .collection(BILL_COLLECTION_NAME)
      .findOne({ _id: new ObjectId(billId) })
  } catch (error) {
    throw new Error(error)
  }
}

// NOT CHECKED YET
const update = async (billId, updateData) => {
  try {
    // Remove invalid fields from updateData
    Object.keys(updateData).forEach((key) => {
      if (INVALID_UPDATE_FIELDS.includes(key)) {
        delete updateData[key]
      }
    })
    const result = await GET_DB()
      .collection(BILL_COLLECTION_NAME)
      .findOneAndUpdate({ _id: new ObjectId(billId) }, { $set: updateData }, { returnDocument: 'after' })
    return result
  } catch (error) {
    throw new Error(error)
  }
}

const getAll = async () => {
  try {
    return await GET_DB().collection(BILL_COLLECTION_NAME).find({ _destroy: false }).sort({ createdAt: -1 }).toArray()
  } catch (error) {
    throw new Error(error)
  }
}

const getAllWithPagination = async (page = 1, limit = 10) => {
  try {
    const skip = (page - 1) * limit
    const bills = await GET_DB()
      .collection(BILL_COLLECTION_NAME)
      .find({ _destroy: false })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray()

    const total = await GET_DB().collection(BILL_COLLECTION_NAME).countDocuments({ _destroy: false })

    return {
      bills,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  } catch (error) {
    throw new Error(error)
  }
}

const getBillsByUser = async (userId) => {
  try {
    return await GET_DB()
      .collection(BILL_COLLECTION_NAME)
      .find({
        participants: new ObjectId(userId),
        optedOutUsers: { $ne: new ObjectId(userId) },
        _destroy: false,
      })
      .sort({ createdAt: -1 })
      .toArray()
  } catch (error) {
    throw new Error(error)
  }
}

const getBillsWithPagination = async (userId, page, limit, status, fromDate, toDate, isPayer, searchQuery) => {
  try {
    const skip = (page - 1) * limit
    const userObjectId = new ObjectId(userId)

    // Build the base query
    let query = {
      _destroy: false,
    }

    // Priority 1 & 2: User is either payer OR participant
    // If isPayer is true, only get bills where user is payer
    if (isPayer === true || isPayer === 'true') {
      query.payerId = userObjectId
      query.optedOutUsers = { $ne: userObjectId }

      // If filtering by status and user is payer, add isSettled condition
      if (status !== undefined && status !== 'all') {
        if (status === 'paid') {
          query.isSettled = true
        } else if (status === 'unpaid') {
          query.isSettled = { $ne: true }
        }
      }
    } else {
      // User is either payer or participant
      if (status !== undefined && status !== 'all') {
        // For mixed queries (payer OR participant), we need to use $or with complex conditions
        const payerCondition = {
          payerId: userObjectId,
          optedOutUsers: { $ne: userObjectId },
          ...(status === 'paid' ? { isSettled: true } : { isSettled: { $ne: true } }),
        }

        const participantCondition = {
          payerId: { $ne: userObjectId },
          participants: { $in: [userObjectId] },
          optedOutUsers: { $ne: userObjectId },
          paymentStatus: {
            $elemMatch: {
              userId: userObjectId,
              ...(status === 'paid'
                ? { paidDate: { $ne: null, $exists: true } }
                : { $or: [{ paidDate: null }, { paidDate: { $exists: false } }] }),
            },
          },
        }

        query.$or = [payerCondition, participantCondition]
      } else {
        // No status filter, just check user participation
        query.$or = [{ payerId: userObjectId }, { participants: { $in: [userObjectId] }, optedOutUsers: { $ne: userObjectId } }]
      }
    }

    // Date range filter (check createdAt between fromDate and toDate)
    if (fromDate || toDate) {
      query.createdAt = {}

      if (fromDate) {
        const fromDateMatch = fromDate.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/)
        if (fromDateMatch) {
          const [, day, month, year] = fromDateMatch
          const startDate = new Date(year, month - 1, day, 0, 0, 0)
          if (!isNaN(startDate.getTime())) {
            query.createdAt.$gte = startDate.getTime()
          }
        }
      }

      if (toDate) {
        const toDateMatch = toDate.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/)
        if (toDateMatch) {
          const [, day, month, year] = toDateMatch
          const endDate = new Date(year, month - 1, day, 23, 59, 59)
          if (!isNaN(endDate.getTime())) {
            query.createdAt.$lte = endDate.getTime()
          }
        }
      }

      if (Object.keys(query.createdAt).length === 0) {
        delete query.createdAt
      }
    }

    // Search query (searchQuery is an object with MongoDB query conditions)
    if (searchQuery && Object.keys(searchQuery).length > 0) {
      const baseConditions = { ...query }
      const finalQuery = {
        $and: [baseConditions, searchQuery],
      }
      for (const key in query) delete query[key]
      Object.assign(query, finalQuery)
    }

    // Get bills from database
    const bills = await GET_DB()
      .collection(BILL_COLLECTION_NAME)
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray()

    // Count total for pagination (using same query but without status filter)
    const total = await GET_DB().collection(BILL_COLLECTION_NAME).countDocuments(query)

    return {
      bills,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  } catch (error) {
    throw new Error(error)
  }
}

const getBillsByUserWithPagination = async (userId, page = 1, limit = 10) => {
  try {
    const skip = (page - 1) * limit
    const bills = await GET_DB()
      .collection(BILL_COLLECTION_NAME)
      .find({
        participants: new ObjectId(userId),
        optedOutUsers: { $ne: new ObjectId(userId) },
        _destroy: false,
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray()

    const total = await GET_DB()
      .collection(BILL_COLLECTION_NAME)
      .countDocuments({
        participants: new ObjectId(userId),
        optedOutUsers: { $ne: new ObjectId(userId) },
        _destroy: false,
      })

    return {
      bills,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  } catch (error) {
    throw new Error(error)
  }
}

/**
 * Search bills by user with pagination
 * Accepts a custom query object for flexible searching
 * @param {string} userId - User ID
 * @param {Object} customQuery - Custom MongoDB query filters (e.g., for billName, paymentDate)
 * @param {number} page - Page number (starts from 1)
 * @param {number} limit - Number of bills per page
 * @returns {Promise<{bills: Array, pagination: Object}>}
 */
const searchBillsByUserWithPagination = async (userId, customQuery = {}, page = 1, limit = 10) => {
  try {
    const skip = (page - 1) * limit

    // Build base query with user filter
    // If customQuery has payerId, it means we're filtering by payer only
    // Otherwise, filter by participants
    const query = {
      ...(customQuery.payerId ? {} : { participants: new ObjectId(userId) }),
      _destroy: false,
      ...customQuery,
    }

    const bills = await GET_DB()
      .collection(BILL_COLLECTION_NAME)
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray()

    const total = await GET_DB().collection(BILL_COLLECTION_NAME).countDocuments(query)

    return {
      bills,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  } catch (error) {
    throw new Error(error)
  }
}

const getBillsByCreator = async (creatorId) => {
  try {
    return await GET_DB()
      .collection(BILL_COLLECTION_NAME)
      .find({
        creatorId: creatorId,
        _destroy: false,
      })
      .sort({ createdAt: -1 })
      .toArray()
  } catch (error) {
    throw new Error(error)
  }
}

const markAsPaid = async (billId, userId, amountPaid) => {
  try {
    const bill = await findOneById(billId)
    if (!bill) {
      throw new Error('Bill not found')
    }

    const userObjectId = new ObjectId(userId)

    // Check if user has opted out
    if (bill.optedOutUsers && bill.optedOutUsers.some(id => id.equals(userObjectId))) {
      throw new Error('User has opted out from this bill')
    }

    // Find the payment status for this user by comparing ObjectIds
    const paymentStatusIndex = bill.paymentStatus.findIndex((ps) => ps.userId.equals(userObjectId))

    if (paymentStatusIndex === -1) {
      throw new Error('User not found in payment status')
    }

    // Use the actual userId from the database (ObjectId)
    const actualUserId = bill.paymentStatus[paymentStatusIndex].userId

    // Use $inc to increment the amount (supports partial payments)
    const result = await GET_DB()
      .collection(BILL_COLLECTION_NAME)
      .findOneAndUpdate(
        {
          _id: new ObjectId(billId),
          'paymentStatus.userId': actualUserId,
        },
        {
          $inc: {
            'paymentStatus.$.amountPaid': amountPaid,
          },
          $set: {
            'paymentStatus.$.paidDate': Date.now(),
            updatedAt: Date.now(),
          },
        },
        { returnDocument: 'after' }
      )

    if (!result) {
      throw new Error('Failed to update payment status')
    }

    return result
  } catch (error) {
    throw new Error(error)
  }
}

const optOutUser = async (billId, userId) => {
  try {
    const result = await GET_DB()
      .collection(BILL_COLLECTION_NAME)
      .findOneAndUpdate(
        { _id: new ObjectId(billId) },
        {
          $addToSet: { optedOutUsers: new ObjectId(userId) },
          $pull: { paymentStatus: { userId: new ObjectId(userId) } },
          $set: { updatedAt: Date.now() },
        },
        { returnDocument: 'after' }
      )
    return result
  } catch (error) {
    throw new Error(error)
  }
}

const deleteOneById = async (billId) => {
  try {
    const result = await GET_DB()
      .collection(BILL_COLLECTION_NAME)
      .findOneAndUpdate(
        { _id: new ObjectId(billId) },
        { $set: { _destroy: true, updatedAt: Date.now() } },
        { returnDocument: 'after' }
      )
    return result
  } catch (error) {
    throw new Error(error)
  }
}

export const billModel = {
  BILL_COLLECTION_NAME,
  BILL_COLLECTION_SCHEMA,
  createNew,
  findOneById,
  update,
  getAll,
  getAllWithPagination,
  getBillsByUser,
  getBillsByUserWithPagination,
  getBillsWithPagination,
  searchBillsByUserWithPagination,
  getBillsByCreator,
  markAsPaid,
  optOutUser,
  deleteOneById,
}
