/**
 * Activity Model
 * Tracks user activities and events in the Spitly application
 */

import Joi from 'joi'
import { GET_DB } from '~/config/mongodb.js'
import { ObjectId } from 'mongodb'

// Collection name
const ACTIVITY_COLLECTION_NAME = 'activities'

// Activity types enum
const ACTIVITY_TYPES = {
  // Bill activities
  BILL_CREATED: 'bill_created',
  BILL_UPDATED: 'bill_updated',
  BILL_DELETED: 'bill_deleted',
  BILL_PAID: 'bill_paid',
  BILL_SETTLED: 'bill_settled',
  BILL_REMINDER_SENT: 'bill_reminder_sent',
  BILL_USER_OPTED_OUT: 'bill_user_opted_out',
  BILL_PARTICIPATION_DECLINED: 'bill_participation_declined',
  
  // Payment activities
  PAYMENT_INITIATED: 'payment_initiated',
  PAYMENT_CONFIRMATION_REQUESTED: 'payment_confirmation_requested',
  PAYMENT_CONFIRMED: 'payment_confirmed',
  PAYMENT_REJECTED: 'payment_rejected',
  
  // Debt activities
  DEBT_BALANCED: 'debt_balanced',
  
  // Group activities
  GROUP_CREATED: 'group_created',
  GROUP_UPDATED: 'group_updated',
  GROUP_DELETED: 'group_deleted',
  GROUP_MEMBER_ADDED: 'group_member_added',
  GROUP_MEMBER_REMOVED: 'group_member_removed',
  GROUP_BILL_ADDED: 'group_bill_added',
  
  // User activities
  //USER_CREATED: 'user_created',
  // USER_UPDATED: 'user_updated',
  // USER_LOGIN: 'user_login',
  // USER_LOGOUT: 'user_logout'
}

const ACTIVITY_COLLECTION_SCHEMA = Joi.object({
  activityType: Joi.string().valid(...Object.values(ACTIVITY_TYPES)).required(),
  
  // User who performed the activity - MUST be ObjectId
  userId: Joi.object().instance(ObjectId).required(),
  
  // Resource information - MUST be ObjectId
  resourceType: Joi.string().valid('bill', 'group', 'user').required(),
  resourceId: Joi.object().instance(ObjectId).required(),
  
  // Activity details and metadata
  details: Joi.object({
    // For bill activities
    billName: Joi.string().optional(),
    amount: Joi.number().optional(),
    paymentStatus: Joi.string().optional(),
    
    // For group activities  
    groupName: Joi.string().optional(),
    memberEmail: Joi.string().email().optional(),
    memberId: Joi.object().instance(ObjectId).optional(),
    
    // For user activities
    userEmail: Joi.string().email().optional(),
    userName: Joi.string().optional(),
    
    // For payment activities
    note: Joi.string().allow('').optional(),
    debtorName: Joi.string().optional(),
    creditorName: Joi.string().optional(),
    debtorEmail: Joi.string().email().optional(),
    creditorEmail: Joi.string().email().optional(),
    paymentId: Joi.object().instance(ObjectId).optional(),
    payerId: Joi.object().instance(ObjectId).optional(),
    
    // For reminders
    reminderType: Joi.string().valid('email', 'notification', 'sms').optional(),
    recipientId: Joi.object().instance(ObjectId).optional(),
    audienceUserIds: Joi.array().items(Joi.object().instance(ObjectId)).optional(),
    
    // Previous and new values for updates
    previousValue: Joi.object().optional(),
    newValue: Joi.object().optional(),
    
    // Additional metadata
    ipAddress: Joi.string().ip().optional(),
    userAgent: Joi.string().optional(),
    description: Joi.string().max(500).optional()
  }).unknown(true).default({}),
  
  // Activity timestamp
  createdAt: Joi.date().timestamp('javascript').default(Date.now),
  
  // Soft delete flag
  _destroy: Joi.boolean().default(false)
})

// Fields that should not be updated after creation
const INVALID_UPDATE_FIELDS = ['_id', 'userId', 'resourceType', 'resourceId', 'activityType', 'createdAt']

/**
 * Convert string IDs to ObjectId for consistency
 */
const convertIdsToObjectId = (data) => {
  const converted = { ...data }
  
  // Convert userId
  if (converted.userId && typeof converted.userId === 'string' && ObjectId.isValid(converted.userId)) {
    converted.userId = new ObjectId(converted.userId)
  }
  
  // Convert resourceId
  if (converted.resourceId && typeof converted.resourceId === 'string' && ObjectId.isValid(converted.resourceId)) {
    converted.resourceId = new ObjectId(converted.resourceId)
  }
  
  // Convert detail fields that may contain IDs
  if (converted.details) {
    // Convert memberId
    if (converted.details.memberId && typeof converted.details.memberId === 'string' && ObjectId.isValid(converted.details.memberId)) {
      converted.details.memberId = new ObjectId(converted.details.memberId)
    }
    
    // Convert recipientId
    if (converted.details.recipientId && typeof converted.details.recipientId === 'string' && ObjectId.isValid(converted.details.recipientId)) {
      converted.details.recipientId = new ObjectId(converted.details.recipientId)
    }
    
    // Convert audience user IDs if they are valid ObjectIds
    if (Array.isArray(converted.details.audienceUserIds)) {
      converted.details.audienceUserIds = converted.details.audienceUserIds.map((userId) =>
        typeof userId === 'string' && ObjectId.isValid(userId) ? new ObjectId(userId) : userId
      )
    }

    // Convert paymentId if it's a valid ObjectId
    if (converted.details.paymentId && typeof converted.details.paymentId === 'string' && ObjectId.isValid(converted.details.paymentId)) {
      converted.details.paymentId = new ObjectId(converted.details.paymentId)
    }
    
    // Convert payerId if it's a valid ObjectId
    if (converted.details.payerId && typeof converted.details.payerId === 'string' && ObjectId.isValid(converted.details.payerId)) {
      converted.details.payerId = new ObjectId(converted.details.payerId)
    }
  }
  
  return converted
}

const validateBeforeCreate = async (data) => {
  return await ACTIVITY_COLLECTION_SCHEMA.validateAsync(data, { abortEarly: false })
}

const createNew = async (data) => {
  try {
    const convertedData = convertIdsToObjectId(data)
    const validData = await validateBeforeCreate(convertedData)
    const newActivityToAdd = {
      ...validData,
      createdAt: Date.now()
    }
    const createdActivity = await GET_DB().collection(ACTIVITY_COLLECTION_NAME).insertOne(newActivityToAdd)
    return createdActivity
  } catch (error) {
    throw new Error(error)
  }
}

const findOneById = async (activityId) => {
  try {
    const result = await GET_DB().collection(ACTIVITY_COLLECTION_NAME).findOne({
      _id: new ObjectId(activityId)
    })
    return result
  } catch (error) {
    throw new Error(error)
  }
}

const getAll = async (limit = 100, offset = 0) => {
  try {
    const result = await GET_DB()
      .collection(ACTIVITY_COLLECTION_NAME)
      .find({ _destroy: false })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(offset)
      .toArray()
    return result
  } catch (error) {
    throw new Error(error)
  }
}

const getActivitiesByUser = async (userId, limit = 50, offset = 0) => {
  try {
    const result = await GET_DB()
      .collection(ACTIVITY_COLLECTION_NAME)
      .find({
        userId: new ObjectId(userId),
        _destroy: false
      })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(offset)
      .toArray()
    return result
  } catch (error) {
    throw new Error(error)
  }
}

const getActivitiesByResource = async (resourceType, resourceId, limit = 50) => {
  try {
    const result = await GET_DB()
      .collection(ACTIVITY_COLLECTION_NAME)
      .find({
        resourceType: resourceType,
        resourceId: new ObjectId(resourceId),
        _destroy: false
      })
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray()
    return result
  } catch (error) {
    throw new Error(error)
  }
}

const getActivitiesByType = async (activityType, limit = 50, offset = 0) => {
  try {
    const result = await GET_DB()
      .collection(ACTIVITY_COLLECTION_NAME)
      .find({
        activityType: activityType,
        _destroy: false
      })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(offset)
      .toArray()
    return result
  } catch (error) {
    throw new Error(error)
  }
}

const getActivitiesByDateRange = async (startDate, endDate, limit = 100) => {
  try {
    const result = await GET_DB()
      .collection(ACTIVITY_COLLECTION_NAME)
      .find({
        createdAt: {
          $gte: startDate.getTime(),
          $lte: endDate.getTime()
        },
        _destroy: false
      })
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray()
    return result
  } catch (error) {
    throw new Error(error)
  }
}

const update = async (activityId, updateData) => {
  try {
    // Filter out invalid fields
    Object.keys(updateData).forEach(fieldName => {
      if (INVALID_UPDATE_FIELDS.includes(fieldName)) {
        delete updateData[fieldName]
      }
    })

    const result = await GET_DB().collection(ACTIVITY_COLLECTION_NAME).findOneAndUpdate(
      { _id: new ObjectId(activityId) },
      { $set: updateData },
      { returnDocument: 'after' }
    )
    return result
  } catch (error) {
    throw new Error(error)
  }
}

const deleteOneById = async (activityId) => {
  try {
    const result = await GET_DB().collection(ACTIVITY_COLLECTION_NAME).findOneAndUpdate(
      { _id: new ObjectId(activityId) },
      { $set: { _destroy: true } },
      { returnDocument: 'after' }
    )
    return result
  } catch (error) {
    throw new Error(error)
  }
}

// Helper functions to log activities
const logBillActivity = async (activityType, userId, billId, details = {}) => {
  return await createNew({
    activityType,
    userId,
    resourceType: 'bill',
    resourceId: billId,
    details
  })
}

const logGroupActivity = async (activityType, userId, groupId, details = {}) => {
  return await createNew({
    activityType,
    userId,
    resourceType: 'group',
    resourceId: groupId,
    details
  })
}

const logUserActivity = async (activityType, userId, targetUserId, details = {}) => {
  return await createNew({
    activityType,
    userId,
    resourceType: 'user',
    resourceId: targetUserId,
    details
  })
}

/**
 * Get activities with filters (types, date range, pagination) and user info
 * @param {string} userId - User ID
 * @param {Object} filters - Filter options (limit, offset, types, dateFrom, dateTo)
 * @returns {Promise<Array>} Array of filtered activities with user info
 */
const getActivitiesWithFilters = async (userId, filters = {}) => {
  try {
    const { limit = 10, offset = 0, types = null, dateFrom = null, dateTo = null } = filters

    // Build match query
    const userObjectId = new ObjectId(userId)
    const matchQuery = {
      $or: [
        { userId: userObjectId },
        { 'details.audienceUserIds': userObjectId }
      ],
      _destroy: false
    }

    // Add types filter if provided
    if (types && Array.isArray(types) && types.length > 0) {
      matchQuery.activityType = { $in: types }
    }

    // Add date range filter if provided
    if (dateFrom || dateTo) {
      matchQuery.createdAt = {}
      if (dateFrom) {
        matchQuery.createdAt.$gte = dateFrom
      }
      if (dateTo) {
        matchQuery.createdAt.$lte = dateTo
      }
    }

    const result = await GET_DB()
      .collection(ACTIVITY_COLLECTION_NAME)
      .aggregate([
        { $match: matchQuery },
        { $sort: { createdAt: -1 } },
        { $skip: offset },
        { $limit: limit },
        {
          $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: '_id',
            as: 'userInfo'
          }
        },
        {
          $addFields: {
            user: {
              $let: {
                vars: { userDoc: { $arrayElemAt: ['$userInfo', 0] } },
                in: {
                  _id: '$$userDoc._id',
                  name: '$$userDoc.name',
                  email: '$$userDoc.email',
                  avatar: '$$userDoc.avatar'
                }
              }
            }
          }
        },
        {
          $project: {
            userInfo: 0
          }
        }
      ])
      .toArray()

    return result
  } catch (error) {
    throw new Error(error)
  }
}

/**
 * Get activity count for a user with optional filters
 * @param {string} userId - User ID
 * @param {Object} filters - Filter options (types, dateFrom, dateTo)
 * @returns {Promise<number>} Count of activities
 */
const getActivityCountByUser = async (userId, filters = {}) => {
  try {
    const { types = null, dateFrom = null, dateTo = null } = filters

    // Build query
    const userObjectId = new ObjectId(userId)
    const query = {
      $or: [
        { userId: userObjectId },
        { 'details.audienceUserIds': userObjectId }
      ],
      _destroy: false
    }

    // Add types filter if provided
    if (types && Array.isArray(types) && types.length > 0) {
      query.activityType = { $in: types }
    }

    // Add date range filter if provided
    if (dateFrom || dateTo) {
      query.createdAt = {}
      if (dateFrom) {
        query.createdAt.$gte = dateFrom
      }
      if (dateTo) {
        query.createdAt.$lte = dateTo
      }
    }

    const count = await GET_DB()
      .collection(ACTIVITY_COLLECTION_NAME)
      .countDocuments(query)

    return count
  } catch (error) {
    throw new Error(error)
  }
}

export const activityModel = {
  ACTIVITY_COLLECTION_NAME,
  ACTIVITY_COLLECTION_SCHEMA,
  ACTIVITY_TYPES,
  createNew,
  findOneById,
  getAll,
  getActivitiesByUser,
  getActivitiesByResource,
  getActivitiesByType,
  getActivitiesByDateRange,
  update,
  deleteOneById,
  logBillActivity,
  logGroupActivity,
  logUserActivity,
  getActivitiesWithFilters,
  getActivityCountByUser
}
