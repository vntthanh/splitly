import Joi from 'joi'
import { ObjectId } from 'mongodb'
import { GET_DB } from '~/config/mongodb'
import { EMAIL_RULE_MESSAGE } from '~/utils/constants'

const USER_COLLECTION_NAME = 'users'

const USER_TYPE = {
  MEMBER: 'member',
  GUEST: 'guest',
}

const USER_COLLECTION_SCHEMA = Joi.object({
  email: Joi.string().email().required().trim().lowercase().message(EMAIL_RULE_MESSAGE),
  name: Joi.string().min(3).max(30).trim().strict(),
  avatar: Joi.string().optional().uri().default(null),
  phone: Joi.string()
    .optional()
    .pattern(/^[0-9]{10,11}$/)
    .default(null),
  bankName: Joi.string().optional().default(null),
  bankAccount: Joi.string().optional().default(null),
  password: Joi.string().required(),
  isVerified: Joi.boolean().default(false),
  userType: Joi.string()
    .valid(...Object.values(USER_TYPE))
    .default(USER_TYPE.MEMBER),
  isGuest: Joi.boolean().default(false),
  lastActivityDate: Joi.date().timestamp('javascript').default(null),
  verifyToken: Joi.string().optional().allow(null).default(null),
  createdAt: Joi.date().timestamp('javascript').default(Date.now),
  updatedAt: Joi.date().timestamp('javascript').default(null),
  _destroy: Joi.boolean().default(false),
})

const INVALID_UPDATE_FIELDS = ['_id', 'email', 'createdAt']

const validateBeforeCreate = async (data) => {
  return await USER_COLLECTION_SCHEMA.validateAsync(data, { abortEarly: false })
}

const createNew = async (data) => {
  try {
    const validData = await validateBeforeCreate(data)
    const createdUser = await GET_DB().collection(USER_COLLECTION_NAME).insertOne(validData)
    return createdUser
  } catch (error) {
    throw new Error(error)
  }
}

const findOneById = async (userId) => {
  try {
    const res = await GET_DB()
      .collection(USER_COLLECTION_NAME)
      .findOne({ _id: new ObjectId(userId) })
    return res
  } catch (error) {
    throw new Error(error)
  }
}

const findOneByEmail = async (email) => {
  try {
    const res = await GET_DB().collection(USER_COLLECTION_NAME).findOne({ email: email.toLowerCase() })
    return res
  } catch (error) {
    throw new Error(error)
  }
}

const update = async (userId, updateData) => {
  try {
    Object.keys(updateData).forEach((key) => {
      if (INVALID_UPDATE_FIELDS.includes(key)) {
        delete updateData[key]
      }
    })

    const result = await GET_DB()
      .collection(USER_COLLECTION_NAME)
      .findOneAndUpdate({ _id: new ObjectId(userId) }, { $set: updateData }, { returnDocument: 'after' })
    return result
  } catch (error) {
    throw new Error(error)
  }
}

const getAll = async () => {
  try {
    return await GET_DB().collection(USER_COLLECTION_NAME).find({ _destroy: false }).sort({ createdAt: -1 }).toArray()
  } catch (error) {
    throw new Error(error)
  }
}

const fetchUsers = async (page = 1, limit = 10, search = '') => {
  try {
    const skip = (page - 1) * limit
    const query = { _destroy: false }

    // Add search condition if search term is provided
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ]
    }

    const users = await GET_DB()
      .collection(USER_COLLECTION_NAME)
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray()

    const total = await GET_DB().collection(USER_COLLECTION_NAME).countDocuments(query)

    return {
      users,
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

const findManyByIds = async (userIds) => {
  try {
    const objectIds = userIds.map((id) => new ObjectId(id))
    return await GET_DB()
      .collection(USER_COLLECTION_NAME)
      .find({
        _id: { $in: objectIds },
        _destroy: false,
      })
      .toArray()
  } catch (error) {
    throw new Error(error)
  }
}

const deleteOneById = async (userId) => {
  try {
    const result = await GET_DB()
      .collection(USER_COLLECTION_NAME)
      .findOneAndUpdate(
        { _id: new ObjectId(userId) },
        { $set: { _destroy: true, updatedAt: Date.now() } },
        { returnDocument: 'after' }
      )
    return result
  } catch (error) {
    throw new Error(error)
  }
}

const findManyByKeys = async (keys) => {
  try {
    if (!keys || !keys.length) return []

  const results = await Promise.all(
    keys.map(async (key) => {
      const user = await GET_DB()
        .collection(USER_COLLECTION_NAME)
        .findOne({
          _destroy: false,
          $or: [
            { email: { $regex: key, $options: 'i' } },
            { name: { $regex: key, $options: 'i' } },
          ],
        })
      return user
    })
  )

  return results.filter(Boolean)
  } catch (error) {
    throw new Error(error)
  }
}

const escapeRegex = (value) => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

const findCandidatesByKey = async (key, limit = 5) => {
  try {
    if (typeof key !== 'string' || !key.trim()) {
      return []
    }

    const escapedKey = escapeRegex(key.trim())
    const exactPattern = `^${escapedKey}$`
    const safeLimit = Math.min(Math.max(Number(limit) || 5, 1), 10)

    return await GET_DB()
      .collection(USER_COLLECTION_NAME)
      .find({
        _destroy: false,
        $or: [
          { email: { $regex: exactPattern, $options: 'i' } },
          { name: { $regex: exactPattern, $options: 'i' } },
        ],
      })
      .project({
        _id: 1,
        name: 1,
        email: 1,
        userType: 1,
        isGuest: 1,
      })
      .limit(safeLimit)
      .toArray()
  } catch (error) {
    throw new Error(error)
  }
}

export const userModel = {
  USER_COLLECTION_NAME,
  USER_COLLECTION_SCHEMA,
  USER_TYPE,
  createNew,
  findOneById,
  findOneByEmail,
  update,
  getAll,
  fetchUsers,
  findManyByIds,
  deleteOneById,
  findManyByKeys,
  findCandidatesByKey,
}
