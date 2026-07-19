/* eslint-disable no-useless-catch */
import { StatusCodes } from 'http-status-codes'
import { userModel } from '~/models/userModel.js'
import { activityModel } from '~/models/activityModel.js'
import ApiError from '~/utils/APIError.js'
import bcryptjs from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'
import { pickUser } from '~/utils/formatters'
import { WEBSITE_DOMAIN } from '~/utils/constants'
import { MicrosoftGraphEmailProvider } from '~/providers/MicrosoftGraphEmailProvider'
import { verificationEmailTemplate } from '~/utils/emailTemplates'
import { JwtProvider } from '~/providers/JwtProvider'
import { env } from '~/config/environment'

/**
 * Create a new user with email verification
 * @param {Object} reqBody - User registration data
 * @param {Object} options - Additional options (ipAddress, userAgent)
 * @returns {Promise<Object>} Created user
 */
const createNew = async (reqBody, options = {}) => {
  try {
    const normalizedEmail = reqBody.email.toLowerCase().trim()
    const existingUser = await userModel.findOneByEmail(normalizedEmail)

    if (existingUser) {
      // If existing user is a guest, upgrade them to a member
      if (existingUser.isGuest || existingUser.userType === userModel.USER_TYPE.GUEST) {
        const nameFromEmail = normalizedEmail.split('@')[0]
        const updateData = {
          password: bcryptjs.hashSync(reqBody.password, 10),
          name: reqBody.name || existingUser.name || nameFromEmail,
          verifyToken: uuidv4(),
          isGuest: false,
          userType: userModel.USER_TYPE.MEMBER,
          isVerified: false,
          updatedAt: Date.now(),
        }

        await userModel.update(existingUser._id.toString(), updateData)
        const updatedUser = await userModel.findOneById(existingUser._id.toString())

        // Log account upgrade activity
        try {
          await activityModel.logBillActivity(
            activityModel.ACTIVITY_TYPES.USER_UPDATED,
            existingUser._id.toString(),
            existingUser._id.toString(),
            {
              userEmail: updatedUser.email,
              userName: updatedUser.name,
              ipAddress: options.ipAddress,
              userAgent: options.userAgent,
              description: `Guest account upgraded to member: ${updatedUser.email}`,
            }
          )
        } catch (activityError) {
          console.warn('Failed to log account upgrade activity:', activityError.message)
        }

        // Send verification email with beautiful template
        const verificationLink = `${WEBSITE_DOMAIN}/account/verification?email=${encodeURIComponent(
          updatedUser.email
        )}&token=${updatedUser.verifyToken}`
        const emailContent = verificationEmailTemplate(updatedUser.name, verificationLink)

        let emailSent = true
        let emailError = null

        try {
          await MicrosoftGraphEmailProvider.sendEmail(
            updatedUser.email,
            emailContent.subject,
            emailContent.text,
            emailContent.html
          )
        } catch (error) {
          emailSent = false
          emailError = error.message
          console.error('Failed to send verification email:', error.message)
          console.error('Microsoft Graph Error Details:', { code: error.code, command: error.command })
        }

        return {
          ...pickUser(updatedUser),
          emailSent,
          emailError: emailSent ? null : emailError,
        }
      }

      // If it's already a member (guest=false), throw conflict error
      throw new ApiError(StatusCodes.CONFLICT, 'Email already in use')
    }

    const nameFromEmail = normalizedEmail.split('@')[0]
    const newUser = {
      email: normalizedEmail,
      password: bcryptjs.hashSync(reqBody.password, 10),
      name: reqBody.name || nameFromEmail,
      verifyToken: uuidv4(),
      userType: userModel.USER_TYPE.MEMBER,
      isGuest: false,
    }

    const createdUser = await userModel.createNew(newUser)
    const getNewUser = await userModel.findOneById(createdUser.insertedId.toString())

    // // Log user creation activity
    // try {
    //   await activityModel.logUserActivity(
    //     activityModel.ACTIVITY_TYPES.USER_CREATED,
    //     createdUser.insertedId.toString(),
    //     createdUser.insertedId.toString(),
    //     {
    //       userEmail: newUser.email,
    //       userName: newUser.name,
    //       ipAddress: options.ipAddress,
    //       userAgent: options.userAgent,
    //       description: `New user account created: ${newUser.email}`,
    //     }
    //   )
    // } catch (activityError) {
    //   console.warn('Failed to log user creation activity:', activityError.message)
    // }

    // Send verification email with beautiful template
    const verificationLink = `${WEBSITE_DOMAIN}/account/verification?email=${encodeURIComponent(
      getNewUser.email
    )}&token=${getNewUser.verifyToken}`
    const emailContent = verificationEmailTemplate(getNewUser.name, verificationLink)

    let emailSent = true
    let emailError = null

    try {
      await MicrosoftGraphEmailProvider.sendEmail(getNewUser.email, emailContent.subject, emailContent.text, emailContent.html)
    } catch (error) {
      emailSent = false
      emailError = error.message
      console.error('Failed to send verification email:', error.message)
      console.error('Microsoft Graph Error Details:', { code: error.code, command: error.command })
    }

    return {
      ...pickUser(getNewUser),
      emailSent,
      emailError: emailSent ? null : emailError,
    }
  } catch (error) {
    throw error
  }
}

/**
 * Verify user account with token
 * @param {Object} reqBody - Verification data (email, token)
 * @returns {Promise<Object>} Verified user
 */
const verifyAccount = async (reqBody) => {
  try {
    const email = reqBody.email.toLowerCase().trim()
    const token = reqBody.token.trim()

    const existingUser = await userModel.findOneByEmail(email)
    if (!existingUser) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Account not found with this email')
    }

    if (existingUser.isVerified) {
      throw new ApiError(StatusCodes.CONFLICT, 'Account is already verified')
    }

    if (!existingUser.verifyToken) {
      throw new ApiError(StatusCodes.GONE, 'Verification token has already been used or expired')
    }

    if (existingUser.verifyToken !== token) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid or incorrect verification token')
    }

    const updateData = {
      isVerified: true,
      verifyToken: null,
      updatedAt: Date.now(),
    }

    const updatedUser = await userModel.update(existingUser._id.toString(), updateData)
    return pickUser(updatedUser)
  } catch (error) {
    throw error
  }
}

/**
 * User login with activity logging
 * @param {Object} reqBody - Login credentials (email, password)
 * @param {Object} loginDetails - Login metadata (ipAddress, userAgent)
 * @returns {Promise<Object>} Access token and user info
 */
const login = async (reqBody, loginDetails = {}) => {
  try {
    const existingUser = await userModel.findOneByEmail(reqBody.email)
    if (!existingUser) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'User not found')
    }

    if (!existingUser.isVerified) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, 'Account not verified. Please verify your email first')
    }

    if (existingUser._destroy) {
      throw new ApiError(StatusCodes.FORBIDDEN, 'Account has been deleted')
    }

    if (!bcryptjs.compareSync(reqBody.password, existingUser.password)) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid credentials, your email or password is incorrect')
    }

    await userModel.update(existingUser._id.toString(), {
      lastActivityDate: Date.now(),
      updatedAt: Date.now(),
    })

    // Log login activity
    // try {
    //   await activityModel.logUserActivity(
    //     activityModel.ACTIVITY_TYPES.USER_LOGIN,
    //     existingUser._id.toString(),
    //     existingUser._id.toString(),
    //     {
    //       userEmail: existingUser.email,
    //       userName: existingUser.name,
    //       ipAddress: loginDetails.ipAddress,
    //       userAgent: loginDetails.userAgent,
    //       description: `User logged in: ${existingUser.email}`,
    //     }
    //   )
    // } catch (activityError) {
    //   console.warn('Failed to log user login activity:', activityError.message)
    // }

    const userInfo = {
      _id: existingUser._id,
      email: existingUser.email,
    }
    const accessToken = await JwtProvider.generateToken(userInfo, env.ACCESS_JWT_SECRET_KEY, env.ACCESS_JWT_EXPIRES_IN)

    return {
      accessToken,
      ...pickUser(existingUser),
    }
  } catch (error) {
    throw error
  }
}

/**
 * User logout with activity logging
 * @param {string} userId - User ID
 * @param {Object} logoutDetails - Logout metadata (ipAddress, userAgent)
 * @returns {Promise<void>}
 */
const logout = async (userId, logoutDetails = {}) => {
  try {
    const user = await userModel.findOneById(userId)
    if (!user) return

    // Log logout activity
    // try {
    //   await activityModel.logUserActivity(activityModel.ACTIVITY_TYPES.USER_LOGOUT, userId, userId, {
    //     userEmail: user.email,
    //     userName: user.name,
    //     ipAddress: logoutDetails.ipAddress,
    //     userAgent: logoutDetails.userAgent,
    //     description: `User logged out: ${user.email}`,
    //   })
    // } catch (activityError) {
    //   console.warn('Failed to log user logout activity:', activityError.message)
    // }
  } catch (error) {
    throw error
  }
}

/**
 * Get all users
 * @returns {Promise<Array>} Array of users
 */
const getAll = async () => {
  try {
    const users = await userModel.getAll()
    return users.map((user) => pickUser(user))
  } catch (error) {
    throw error
  }
}

const fetchUsers = async (page = 1, limit = 10, search = '') => {
  try {
    const result = await userModel.fetchUsers(page, limit, search)
    return {
      users: result.users.map((user) => pickUser(user)),
      pagination: result.pagination,
    }
  } catch (error) {
    throw error
  }
}

/**
 * Get user by ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} User object
 */
const findOneById = async (userId) => {
  try {
    const user = await userModel.findOneById(userId)
    if (!user) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'User not found')
    }
    return pickUser(user)
  } catch (error) {
    throw error
  }
}

const findOneByEmail = async (email) => {
  try {
    const user = await userModel.findOneByEmail(email)
    if (!user) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'User not found')
    }
    return pickUser(user)
  } catch (error) {
    throw error
  }
}

const findManyByKeys = async (keys) => {
  try {
    const users = await userModel.findManyByKeys(keys)
    users.map((user) => {
      if (user) {
        return pickUser(user)
      }
    })
    return users
  } catch (error) {
    throw error
  }
}

/**
 * Get multiple users by IDs
 * @param {Array<string>} userIds - Array of user IDs
 * @returns {Promise<Array>} Array of users
 */
const findManyByIds = async (userIds) => {
  try {
    return await userModel.findManyByIds(userIds)
  } catch (error) {
    throw error
  }
}

/**
 * Update user with activity logging
 * @param {string} userId - User ID
 * @param {Object} updateData - Data to update
 * @param {string} updatedBy - User ID who updates
 * @returns {Promise<Object>} Updated user
 */
const update = async (userId, updateData, updatedBy) => {
  try {
    // Get original user data for activity logging
    //const originalUser = await userModel.findOneById(userId)

    const result = await userModel.update(userId, updateData)

    // // Log activity if updatedBy is provided
    // if (updatedBy && originalUser) {
    //   try {
    //     await activityModel.logUserActivity(activityModel.ACTIVITY_TYPES.USER_UPDATED, updatedBy, userId, {
    //       userEmail: originalUser.email,
    //       userName: originalUser.name,
    //       previousValue: {
    //         name: originalUser.name,
    //         phone: originalUser.phone,
    //         avatar: originalUser.avatar,
    //       },
    //       newValue: updateData,
    //       description: `Updated user profile: ${originalUser.email}`,
    //     })
    //   } catch (activityError) {
    //     console.warn('Failed to log user update activity:', activityError.message)
    //   }
    // }
    return result
  } catch (error) {
    throw error
  }
}

/**
 * Delete user by ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Delete result
 */
const deleteOneById = async (userId) => {
  try {
    return await userModel.deleteOneById(userId)
  } catch (error) {
    throw error
  }
}

/**
 * Find user by email, or create if not exists
 * @param {string} email - User email
 * @param {Object} options - Options for logging and metadata
 * @returns {Promise<Object>} User object
 */
const findOrCreateUserByEmail = async (email, options = {}) => {
  try {
    const normalizedEmail = email.toLowerCase().trim()
    let user = await userModel.findOneByEmail(normalizedEmail)

    if (!user) {
      // Extract name from email (everything before '@')
      const name = normalizedEmail.split('@')[0]
      // Generate a random password for guest users
      const randomPassword = uuidv4()

      const newUserData = {
        email: normalizedEmail,
        name: name,
        password: randomPassword,
        isGuest: true,
        userType: userModel.USER_TYPE.GUEST,
      }

      const result = await createNew(newUserData, {
        ipAddress: options.ipAddress,
        userAgent: options.userAgent,
      })
      user = await userModel.findOneById(result._id)
    }

    return user
  } catch (error) {
    throw error
  }
}

/**
 * Edit user profile
 * @param {string} userId - User ID
 * @param {Object} profileData - Profile data to update (name, phone, bankAccount, bankName)
 * @returns {Promise<Object>} Updated user
 */
const editProfile = async (userId, profileData) => {
  try {
    // Validate that user exists
    const existingUser = await userModel.findOneById(userId)
    if (!existingUser) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'User not found')
    }

    // Prepare update data - only include provided fields
    const updateData = {
      updatedAt: Date.now(),
    }

    if (profileData.name !== undefined) updateData.name = profileData.name
    if (profileData.phone !== undefined) updateData.phone = profileData.phone
    if (profileData.bankAccount !== undefined) updateData.bankAccount = profileData.bankAccount
    if (profileData.bankName !== undefined) updateData.bankName = profileData.bankName

    // Use the update function with activity logging
    const updatedUser = await update(userId, updateData, userId)

    return pickUser(updatedUser)
  } catch (error) {
    throw error
  }
}

const createGuestUser = async (reqBody) => {
  try {
    const normalizedEmail = reqBody.email.toLowerCase().trim()
    const existingUser = await userModel.findOneByEmail(normalizedEmail)

    // If user already exists, return the existing user instead of creating a duplicate
    if (existingUser) {
      // If it's already a guest, just return it
      if (existingUser.isGuest || existingUser.userType === userModel.USER_TYPE.GUEST) {
        return pickUser(existingUser)
      }
      // If it's a verified member, throw error
      if (existingUser.isVerified) {
        throw new ApiError(StatusCodes.CONFLICT, 'This email is already registered and verified')
      }
      // If it's an unverified member, return the existing user
      return pickUser(existingUser)
    }

    const nameFromEmail = normalizedEmail.split('@')[0]
    const newUser = {
      email: normalizedEmail,
      name: reqBody.name || nameFromEmail,
      isGuest: true,
      userType: userModel.USER_TYPE.GUEST,
      password: bcryptjs.hashSync(uuidv4(), 10), // Hash the random password
      isVerified: false, // Guest users are not verified
      verifyToken: null, // No verification token for guests
    }

    const createdUser = await userModel.createNew(newUser)
    const getNewUser = await userModel.findOneById(createdUser.insertedId.toString())

    return pickUser(getNewUser)
  } catch (error) {
    throw error
  }
}
//k2
const updateProfile = async (userId, reqBody, userAvatarFile) => {
  try {
    const existUser = await userModel.findOneById(userId)
    if (!existUser) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'User not found')
    }
    if (!existUser.isVerified) {
      throw new ApiError(StatusCodes.NOT_ACCEPTABLE, 'Account is not active')
    }

    let updatedUser = {}
    // case1 change password
    if (reqBody.currentPassword && reqBody.newPassword) {
      // verify current password
      if (!bcryptjs.compareSync(reqBody.currentPassword, existUser.password)) {
        throw new ApiError(StatusCodes.UNAUTHORIZED, 'Current password is incorrect')
      }
      // update to new password
      updatedUser = await userModel.update(existUser._id, {
        password: bcryptjs.hashSync(reqBody.newPassword, 10),
      })
    } else {
      // udpate general info
      updatedUser = await userModel.update(existUser._id, reqBody)
    }

    return pickUser(updatedUser)
  } catch (error) {
    throw error
  }
}

export const userService = {
  createNew,
  verifyAccount,
  login,
  logout,
  getAll,
  findOneById,
  findOneByEmail,
  findManyByIds,
  update,
  deleteOneById,
  findOrCreateUserByEmail,
  fetchUsers,
  editProfile,
  createGuestUser,
  updateProfile,
}
