/* eslint-disable no-useless-catch */
import { billModel } from '~/models/billModel.js'
import { activityModel } from '~/models/activityModel.js'
import { userModel } from '~/models/userModel.js'
import { paymentModel } from '~/models/paymentModel.js'
import { notificationService } from '~/services/notificationService.js'
import { ClovaXClient } from '~/providers/ClovaStudioProvider'
import { JwtProvider } from '~/providers/JwtProvider.js'
import { env } from '~/config/environment.js'
import { GET_DB } from '~/config/mongodb'
import { ObjectId } from 'mongodb'
import { sendBillCreationEmail } from '~/utils/emailService.js'

const { BILL_COLLECTION_NAME } = billModel

const getAudienceUserIds = (userIds = [], actorId) => [...new Set(
  userIds.filter(Boolean).map((userId) => userId.toString()).filter((userId) => userId !== actorId?.toString())
)]

const createNew = async (reqBody) => {
  try {
    let paymentStatus = []

    if (reqBody.splittingMethod === 'equal') {
      // Equal split: total amount / number of participants
      const amountPerPerson = reqBody.totalAmount / reqBody.participants.length
      paymentStatus = reqBody.participants.map((userId) => {
        const isPayer = userId.toString() === reqBody.payerId.toString()
        return {
          userId: userId,
          amountOwed: amountPerPerson,
          amountPaid: isPayer ? amountPerPerson : 0, // Payer already paid
          paidDate: isPayer ? Date.now() : null,
        }
      })
    } else if (reqBody.splittingMethod === 'item-based') {
      // Item-based split: calculate based on items with discount/tax adjustment
      const sumOfItemAmounts = reqBody.items.reduce((sum, item) => sum + item.amount, 0)
      const adjustmentRatio = reqBody.totalAmount / sumOfItemAmounts

      const userAmounts = {}

      // Calculate total owed by each user with adjustment
      reqBody.items.forEach((item) => {
        const adjustedItemAmount = item.amount * adjustmentRatio
        const amountPerPerson = adjustedItemAmount / item.allocatedTo.length

        item.allocatedTo.forEach((userId) => {
          const userKey = userId.toString() // Use string key for object
          userAmounts[userKey] = (userAmounts[userKey] || 0) + amountPerPerson
        })
      })

      // Create payment status array
      paymentStatus = Object.entries(userAmounts).map(([userIdStr, amount]) => {
        // Use .equals() for proper ObjectId comparison (convert key back to ObjectId for comparison)
        const isPayer = reqBody.payerId.toString() === userIdStr
        return {
          userId: userIdStr,
          amountOwed: Math.round(amount),
          amountPaid: isPayer ? Math.round(amount) : 0,
          paidDate: isPayer ? Date.now() : null,
        }
      })
    } else if (reqBody.splittingMethod === 'people-based') {
      // People-based split: each person has a custom amount
      if (!reqBody.paymentStatus || !Array.isArray(reqBody.paymentStatus)) {
        throw new Error('paymentStatus array is required for people-based splitting')
      }

      // Validate that the sum of amountOwed matches totalAmount
      const totalOwed = reqBody.paymentStatus.reduce((sum, ps) => sum + ps.amountOwed, 0)
      if (Math.abs(totalOwed - reqBody.totalAmount) > 0.01) {
        throw new Error(`Sum of amountOwed (${totalOwed}) must equal totalAmount (${reqBody.totalAmount})`)
      }

      // Set payment status with payer already paid
      paymentStatus = reqBody.paymentStatus.map((ps) => {
        const isPayer = ps.userId.toString() === reqBody.payerId.toString()
        return {
          userId: ps.userId,
          amountOwed: ps.amountOwed,
          amountPaid: isPayer ? ps.amountOwed : 0,
          paidDate: isPayer ? Date.now() : null,
        }
      })
    }

    const newBillData = {
      ...reqBody,
      paymentStatus,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }

    const createdBill = await billModel.createNew(newBillData)
    const getNewBill = await billModel.findOneById(createdBill.insertedId.toString())

    // Log activity if creatorId is provided
    if (reqBody.creatorId) {
      try {
        await activityModel.logBillActivity(
          activityModel.ACTIVITY_TYPES.BILL_CREATED,
          reqBody.creatorId,
          createdBill.insertedId.toString(),
          {
            billName: reqBody.billName,
            amount: reqBody.totalAmount,
            audienceUserIds: getAudienceUserIds(reqBody.participants, reqBody.creatorId),
            description: `Created new bill: ${reqBody.billName}`,
          }
        )
      } catch (activityError) {
        console.warn('Failed to log bill creation activity:', activityError.message)
      }

      // Send notifications to participants (except payer/creator)
      try {
        const creator = await userModel.findOneById(reqBody.creatorId)
        const creatorName = creator?.name || 'Someone'
        const otherParticipants = reqBody.participants
          .filter(id => id.toString() !== reqBody.payerId.toString())
          .map(id => id.toString())
        if (otherParticipants.length > 0) {
          await notificationService.notifyBillAdded(
            reqBody.creatorId,
            creatorName,
            otherParticipants,
            createdBill.insertedId.toString(),
            reqBody.billName,
            reqBody.totalAmount
          )
        }
      } catch (notifError) {
        console.warn('Failed to send bill creation notifications:', notifError.message)
      }
    }

    // Send email notifications to all participants except the payer
    try {
      // Get payer info
      const payer = await userModel.findOneById(reqBody.payerId.toString())
      if (!payer) {
        console.warn('Payer not found, skipping email notifications')
        return getNewBill
      }

      // Get populated bill data with participant details
      const populatedBill = await getBillById(createdBill.insertedId.toString())

      // Filter participants (exclude payer)
      const participantsToEmail = populatedBill.participants.filter(
        (participant) => participant._id.toString() !== reqBody.payerId.toString()
      )

      if (participantsToEmail.length === 0) {
        return getNewBill
      }

      // Send emails to each participant (except payer)
      const emailPromises = participantsToEmail.map(async (participant) => {
        // Create JWT token for bill payment
        const payload = {
          creditorId: reqBody.payerId,
          debtorId: participant._id,
          bills: [
            {
              billId: createdBill.insertedId.toString(),
              billName: reqBody.billName,
              amount: participant.amount,
            },
          ],
          totalAmount: participant.amount,
          type: 'bill_payment',
        }
        const paymentToken = await JwtProvider.generateToken(payload, env.ACCESS_JWT_SECRET_KEY, '30d') // 30 days for bill payments

        // Create payment record for bill payment
        await paymentModel.createNew({
          token: paymentToken,
          creditorId: reqBody.payerId,
          debtorId: participant._id,
        })

        // Create opt-out token
        const optOutPayload = {
          billId: createdBill.insertedId.toString(),
          userId: participant._id.toString(),
          type: 'bill_opt_out',
        }
        const optOutToken = await JwtProvider.generateToken(optOutPayload, env.ACCESS_JWT_SECRET_KEY, '30d')

        return sendBillCreationEmail({
          participantEmail: participant.email,
          participantName: participant.name,
          payerName: payer.name,
          billId: createdBill.insertedId.toString(),
          billName: reqBody.billName,
          billDescription: reqBody.description || '',
          totalAmount: reqBody.totalAmount,
          participantAmount: participant.amount,
          items: reqBody.items || [],
          participants: populatedBill.participants.map((p) => ({
            name: p.name,
            amount: p.amount,
          })),
          optOutToken,
          paymentToken,
          billId: createdBill.insertedId.toString(),
        })
      })

      // Send all emails concurrently
      const emailResults = await Promise.allSettled(emailPromises)
      const successCount = emailResults.filter((result) => result.status === 'fulfilled' && result.value).length
      const failCount = emailResults.length - successCount

      // Log any failures
      emailResults.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.error(`Email failed for ${participantsToEmail[index].email}:`, result.reason)
        }
      })

      if (successCount > 0) {
        // Email sending completed successfully
      }
    } catch (emailError) {
      console.error('Failed to send bill creation emails:', emailError)
    }

    return getNewBill
  } catch (error) {
    throw error
  }
}

/**
 * Get all bills
 * @returns {Promise<Array>} Array of bills
 */
const getAll = async () => {
  try {
    return await billModel.getAll()
  } catch (error) {
    throw error
  }
}

/**
 * Get all bills with pagination
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @returns {Promise<Object>} Bills with pagination info
 */
const getAllWithPagination = async (page = 1, limit = 10) => {
  try {
    return await billModel.getAllWithPagination(page, limit)
  } catch (error) {
    throw error
  }
}

/**
 * Get bills by user ID
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of bills
 */
const getBillsByUser = async (userId) => {
  try {
    return await billModel.getBillsByUser(userId)
  } catch (error) {
    throw error
  }
}

/**
 * Get bills by user with pagination
 * @param {string} userId - User ID
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @returns {Promise<Object>} Bills with pagination info
 */
const getBillsByUserWithPagination = async (userId, page = 1, limit = 10) => {
  try {
    return await billModel.getBillsByUserWithPagination(userId, page, limit)
  } catch (error) {
    throw error
  }
}

/**
 * Get bills by creator ID
 * @param {string} creatorId - Creator user ID
 * @returns {Promise<Array>} Array of bills
 */
const getBillsByCreator = async (creatorId) => {
  try {
    return await billModel.getBillsByCreator(creatorId)
  } catch (error) {
    throw error
  }
}

/**
 * Get bill by ID (basic)
 * @param {string} billId - Bill ID
 * @returns {Promise<Object>} Bill data
 */
const findOneById = async (billId) => {
  try {
    return await billModel.findOneById(billId)
  } catch (error) {
    throw error
  }
}

/**
 * Get bill by ID with populated user data
 * @param {string} billId - Bill ID
 * @returns {Promise<Object>} Bill data with populated user information
 */
const getBillById = async (billId) => {
  try {
    const bill = await billModel.findOneById(billId)

    if (!bill) {
      throw new Error('Bill not found')
    }

    // Populate payer information
    const payer = await userModel.findOneById(bill.payerId.toString())

    // Populate participants information
    const participantsWithDetails = await Promise.all(
      bill.paymentStatus.map(async (payment) => {
        const user = await userModel.findOneById(payment.userId.toString())
        return {
          _id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          amount: payment.amountOwed,
          paid: payment.amountPaid >= payment.amountOwed,
          amountPaid: payment.amountPaid,
          paidDate: payment.paidDate,
          role: payment.userId.toString() === bill.payerId.toString() ? 'payer' : 'participant',
        }
      })
    )

    // Calculate if bill is settled
    const isSettled = bill.paymentStatus.every((payment) => payment.amountPaid >= payment.amountOwed)

    // Format response
    return {
      _id: bill._id,
      billName: bill.billName,
      description: bill.description || '',
      category: bill.category || 'Khác',
      totalAmount: bill.totalAmount,
      settled: isSettled,
      paymentDate: bill.paymentDate || bill.createdAt,
      paymentDeadline: bill.paymentDeadline || null,
      payer: {
        _id: payer._id,
        name: payer.name,
        email: payer.email,
        avatar: payer.avatar,
      },
      participants: participantsWithDetails,
      splittingMethod: bill.splittingMethod,
      items: bill.items || [],
      createdAt: bill.createdAt,
      updatedAt: bill.updatedAt,
    }
  } catch (error) {
    throw error
  }
}

/**
 * Update bill with activity logging
 * @param {string} billId - Bill ID
 * @param {Object} updateData - Data to update
 * @param {string} updatedBy - User ID who updates
 * @returns {Promise<Object>} Updated bill
 */
const update = async (billId, updateData, updatedBy) => {
  try {
    // Get original bill data for activity logging
    const originalBill = await billModel.findOneById(billId)

    const result = await billModel.update(billId, updateData)

    // Log activity if updatedBy is provided
    if (updatedBy && originalBill) {
      try {
        await activityModel.logBillActivity(activityModel.ACTIVITY_TYPES.BILL_UPDATED, updatedBy, billId, {
          billName: originalBill.billName,
          previousValue: {
            billName: originalBill.billName,
            totalAmount: originalBill.totalAmount,
            description: originalBill.description,
          },
          newValue: updateData,
          audienceUserIds: getAudienceUserIds(originalBill.participants, updatedBy),
          description: `Updated bill: ${originalBill.billName}`,
        })
      } catch (activityError) {
        console.warn('Failed to log bill update activity:', activityError.message)
      }

      // Send notifications to participants (except updater)
      try {
        const updater = await userModel.findOneById(updatedBy)
        const updaterName = updater?.name || 'Someone'
        const otherParticipants = originalBill.participants
          ?.filter(id => id.toString() !== updatedBy)
          ?.map(id => id.toString()) || []
        if (otherParticipants.length > 0) {
          await notificationService.notifyBillUpdated(
            updatedBy,
            updaterName,
            otherParticipants,
            billId,
            originalBill.billName
          )
        }
      } catch (notifError) {
        console.warn('Failed to send bill update notifications:', notifError.message)
      }
    }

    return result
  } catch (error) {
    throw error
  }
}

const updateBill = async (billId, reqBody) => {
  try {
    const originalBill = await billModel.findOneById(billId)
    if (!originalBill) {
      throw new Error('Bill not found')
    }

    if (reqBody.payerId && reqBody.payerId.toString() !== originalBill.payerId.toString()) {
      throw new Error('Changing the payer (người ứng tiền) is not allowed during update.')
    }

    const currentPayerId = originalBill.payerId.toString()

    let paymentStatus = []

    const getPaidAmount = (userId, amountOwed, isPayer) => {
      if (isPayer) return amountOwed

      const existing = originalBill.paymentStatus?.find((ps) => ps.userId.toString() === userId.toString())
      return existing ? existing.amountPaid : 0
    }

    if (reqBody.splittingMethod === 'equal') {
      const amountPerPerson = reqBody.totalAmount / reqBody.participants.length
      // const remainder = reqBody.totalAmount - (amountPerPerson * reqBody.participants.length)

      paymentStatus = reqBody.participants.map((userId, index) => {
        // const finalAmount = index === reqBody.participants.length - 1
        //   ? amountPerPerson + remainder
        //   : amountPerPerson;
        const isPayer = userId.toString() === currentPayerId
        return {
          userId: userId,
          amountOwed: amountPerPerson,
          amountPaid: isPayer ? amountPerPerson : 0,
          paidDate:
            originalBill.paymentStatus?.find((ps) => ps.userId.toString() === userId.toString())?.paidDate || null,
        }
      })
    } else if (reqBody.splittingMethod === 'item-based') {
      const sumOfItemAmounts = reqBody.items.reduce((sum, item) => sum + item.amount, 0)
      const adjustmentRatio = reqBody.totalAmount / sumOfItemAmounts

      const userAmounts = {}

      reqBody.participants.forEach((pId) => (userAmounts[pId.toString()] = 0))

      reqBody.items.forEach((item) => {
        if (item.allocatedTo.length > 0) {
          const adjustedItemAmount = item.amount * adjustmentRatio
          const amountPerPerson = adjustedItemAmount / item.allocatedTo.length

          item.allocatedTo.forEach((userId) => {
            const userKey = userId.toString() // Use string key for object
            userAmounts[userKey] = (userAmounts[userKey] || 0) + amountPerPerson
          })
        }
      })

      paymentStatus = Object.entries(userAmounts).map(([userIdStr, amount]) => {
        // Use .equals() for proper ObjectId comparison (convert key back to ObjectId for comparison)
        const isPayer = reqBody.payerId.toString() === userIdStr
        return {
          userId: userIdStr,
          amountOwed: Math.round(amount),
          amountPaid: isPayer ? Math.round(amount) : 0,
          paidDate: originalBill.paymentStatus?.find((ps) => ps.userId.toString() === userIdStr)?.paidDate || null,
        }
      })
    } else if (reqBody.splittingMethod === 'people-based') {
      paymentStatus = reqBody.paymentStatus.map((ps) => {
        const isPayer = ps.userId.toString() === currentPayerId
        return {
          userId: ps.userId,
          amountOwed: ps.amountOwed,
          amountPaid: getPaidAmount(ps.userId, ps.amountOwed, isPayer),
          paidDate:
            originalBill.paymentStatus?.find((s) => s.userId.toString() === ps.userId.toString())?.paidDate || null,
        }
      })
    }
    const updateData = {
      ...reqBody,
      payerId: originalBill.payerId,
      paymentStatus,
      updatedAt: Date.now(),
    }

    const result = await billModel.update(billId, updateData)

    try {
      await activityModel.logBillActivity(
        activityModel.ACTIVITY_TYPES.BILL_UPDATED,
        currentPayerId,
        billId._id.toString(),
        {
          description: `Cập nhật hóa đơn ${result.billName}`,
        }
      )
    } catch (activityError) {
      console.warn('Failed to log bill upgrade activity:', activityError.message)
    }

    return await billModel.findOneById(billId)
  } catch (error) {
    throw error
  }
}

/**
 * Mark bill as paid for a user (full or partial payment)
 * @param {string} billId - Bill ID
 * @param {string} userId - User ID who paid
 * @param {number} amountPaid - Amount paid
 * @param {string} paidBy - User ID who marked as paid (for logging)
 * @param {boolean} skipNotification - Skip sending notifications (used when called from payment confirmation)
 * @returns {Promise<Object>} Update result
 */
const markAsPaid = async (billId, userId, amountPaid, paidBy, skipNotification = false) => {
  try {
    const bill = await billModel.findOneById(billId)
    const result = await billModel.markAsPaid(billId, userId, amountPaid)
    // Log payment activity
    if (paidBy) {
      try {
        await activityModel.logBillActivity(activityModel.ACTIVITY_TYPES.BILL_PAID, paidBy, billId, {
          billName: bill.billName,
          amountPaid: amountPaid,
          paymentStatus: 'paid',
          audienceUserIds: getAudienceUserIds(bill.participants, paidBy),
          description: `Payment of ${amountPaid} for bill: ${bill.billName}`,
        })
      } catch (activityError) {
        console.warn('Failed to log bill payment activity:', activityError.message)
      }
    }

    // Check if all participants have paid
    const updatedBill = await billModel.findOneById(billId)
    const allPaid = updatedBill.paymentStatus.every((status) => {
      const amountPaid = status.amountPaid || 0
      return amountPaid >= status.amountOwed
    })

    if (allPaid) {
      await billModel.update(billId, { isSettled: true })

      // Log bill settlement activity
      if (paidBy) {
        try {
          await activityModel.logBillActivity(activityModel.ACTIVITY_TYPES.BILL_SETTLED, paidBy, billId, {
            billName: bill.billName,
            audienceUserIds: getAudienceUserIds(bill.participants, paidBy),
            description: `Bill fully settled: ${bill.billName}`,
          })
        } catch (activityError) {
          console.warn('Failed to log bill settlement activity:', activityError.message)
        }

        // Send notifications to all participants that bill is settled (skip if called from payment confirmation)
        if (!skipNotification) {
          try {
            const payer = await userModel.findOneById(paidBy)
            const payerName = payer?.name || 'Someone'
            const otherParticipants = bill.participants
              ?.filter(id => id.toString() !== paidBy)
              ?.map(id => id.toString()) || []
            if (otherParticipants.length > 0) {
              await notificationService.notifyBillSettled(
                paidBy,
                payerName,
                otherParticipants,
                billId,
                bill.billName
              )
            }
          } catch (notifError) {
            console.warn('Failed to send bill settled notifications:', notifError.message)
          }
        }
      }
    }

    return result
  } catch (error) {
    throw error
  }
}

/**
 * User opts out from a bill
 * @param {string} billId - Bill ID
 * @param {string} userId - User ID who opts out
 * @param {string} optedOutBy - User ID for logging
 * @returns {Promise<Object>} Update result
 */
const optOutUser = async (billId, userId, optedOutBy) => {
  try {
    const bill = await billModel.findOneById(billId)

    const result = await billModel.optOutUser(billId, userId)

    // Log opt-out activity
    if (optedOutBy) {
      try {
        await activityModel.logBillActivity(activityModel.ACTIVITY_TYPES.BILL_PARTICIPATION_DECLINED, optedOutBy, billId, {
          billName: bill.billName,
          audienceUserIds: getAudienceUserIds(bill.participants, optedOutBy),
          description: `Declined participation in bill: ${bill.billName}`,
        })
      } catch (activityError) {
        console.warn('Failed to log bill opt-out activity:', activityError.message)
      }
    }

    return result
  } catch (error) {
    throw error
  }
}

/**
 * Delete bill by ID with activity logging
 * @param {string} billId - Bill ID
 * @param {string} deletedBy - User ID who deletes
 * @returns {Promise<Object>} Delete result
 */
const deleteOneById = async (billId, deletedBy) => {
  try {
    const bill = await billModel.findOneById(billId)

    const result = await billModel.deleteOneById(billId)

    // Log deletion activity
    if (deletedBy && bill) {
      try {
        await activityModel.logBillActivity(activityModel.ACTIVITY_TYPES.BILL_DELETED, deletedBy, billId, {
          billName: bill.billName,
          amount: bill.totalAmount,
          audienceUserIds: getAudienceUserIds(bill.participants, deletedBy),
          description: `Deleted bill: ${bill.billName}`,
        })
      } catch (activityError) {
        console.warn('Failed to log bill deletion activity:', activityError.message)
      }

      // Send notifications to participants (except deleter)
      try {
        const deleter = await userModel.findOneById(deletedBy)
        const deleterName = deleter?.name || 'Someone'
        const otherParticipants = bill.participants
          ?.filter(id => id.toString() !== deletedBy)
          ?.map(id => id.toString()) || []
        if (otherParticipants.length > 0) {
          await notificationService.notifyBillDeleted(
            deletedBy,
            deleterName,
            otherParticipants,
            billId,
            bill.billName
          )
        }
      } catch (notifError) {
        console.warn('Failed to send bill deletion notifications:', notifError.message)
      }
    }

    return result
  } catch (error) {
    throw error
  }
}

/**
 * Send bill reminder with activity logging
 * @param {string} billId - Bill ID
 * @param {string} reminderType - Type of reminder ('email', 'sms', 'notification')
 * @param {string} recipientUserId - User ID who receives the reminder
 * @param {string} sentByUserId - User ID who sends the reminder
 * @returns {Promise<Object>} Reminder result
 */
const sendReminder = async (billId, reminderType, recipientUserId, sentByUserId) => {
  try {
    const bill = await billModel.findOneById(billId)

    // Get recipient's payment status to know the amount
    const recipientPayment = bill.paymentStatus.find(ps => ps.userId.toString() === recipientUserId.toString())
    const amountOwed = recipientPayment ? (recipientPayment.amountOwed - (recipientPayment.amountPaid || 0)) : 0

    // Log reminder activity
    if (sentByUserId) {
      try {
        await activityModel.logBillActivity(activityModel.ACTIVITY_TYPES.BILL_REMINDER_SENT, sentByUserId, billId, {
          billName: bill.billName,
          reminderType: reminderType,
          recipientId: recipientUserId,
          audienceUserIds: getAudienceUserIds([recipientUserId], sentByUserId),
          description: `Sent ${reminderType} reminder for bill: ${bill.billName}`,
        })
      } catch (activityError) {
        console.warn('Failed to log bill reminder activity:', activityError.message)
      }

      // Send notification to recipient
      try {
        const sender = await userModel.findOneById(sentByUserId)
        const senderName = sender?.name || 'Someone'
        await notificationService.notifyBillReminder(
          sentByUserId,
          senderName,
          recipientUserId,
          billId,
          bill.billName,
          amountOwed
        )
      } catch (notifError) {
        console.warn('Failed to send bill reminder notification:', notifError.message)
      }
    }

    return { success: true, message: 'Reminder sent successfully' }
  } catch (error) {
    throw error
  }
}

const generateSearchQuery = (searchTerm = '') => {
  try {
    // If no search term, return all bills for the user
    if (!searchTerm || searchTerm.trim() === '') {
      return {}
    }

    const trimmedSearch = searchTerm.trim()

    // Build search query with multiple conditions
    const searchConditions = []

    // 1. Search in billName (case-insensitive)
    searchConditions.push({
      billName: { $regex: trimmedSearch, $options: 'i' },
    })

    // 2. Search in description (case-insensitive)
    searchConditions.push({
      description: { $regex: trimmedSearch, $options: 'i' },
    })

    // 3. Try to parse as date in various formats
    const datePatterns = [
      /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/, // DD/MM/YYYY or DD-MM-YYYY
      /^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/, // YYYY/MM/DD or YYYY-MM-DD
    ]

    for (const pattern of datePatterns) {
      const match = trimmedSearch.match(pattern)
      if (match) {
        let day, month, year
        if (pattern.source.startsWith('^(\\d{4})')) {
          // YYYY-MM-DD format
          ;[, year, month, day] = match
        } else {
          // DD/MM/YYYY format
          ;[, day, month, year] = match
        }

        // Create date range for the entire day
        const startDate = new Date(year, month - 1, day, 0, 0, 0)
        const endDate = new Date(year, month - 1, day, 23, 59, 59)

        if (!isNaN(startDate.getTime())) {
          searchConditions.push({
            paymentDate: {
              $gte: startDate,
              $lte: endDate,
            },
          })
          searchConditions.push({
            createdAt: {
              $gte: startDate,
              $lte: endDate,
            },
          })
          break
        }
      }
    }

    // 4. Search by year (if 4 digits between 2000-2100)
    const yearMatch = trimmedSearch.match(/^(20\d{2})$/)
    if (yearMatch) {
      const year = parseInt(yearMatch[1])
      const startOfYear = new Date(year, 0, 1, 0, 0, 0)
      const endOfYear = new Date(year, 11, 31, 23, 59, 59)

      searchConditions.push({
        paymentDate: {
          $gte: startOfYear,
          $lte: endOfYear,
        },
      })

      searchConditions.push({
        createdAt: {
          $gte: startOfYear,
          $lte: endOfYear,
        },
      })
    }

    // 5. Search by month name (Vietnamese and English)
    const monthNames = {
      'tháng 1': 1,
      'tháng 01': 1,
      january: 1,
      jan: 1,
      'tháng 2': 2,
      'tháng 02': 2,
      february: 2,
      feb: 2,
      'tháng 3': 3,
      'tháng 03': 3,
      march: 3,
      mar: 3,
      'tháng 4': 4,
      'tháng 04': 4,
      april: 4,
      apr: 4,
      'tháng 5': 5,
      'tháng 05': 5,
      may: 5,
      'tháng 6': 6,
      'tháng 06': 6,
      june: 6,
      jun: 6,
      'tháng 7': 7,
      'tháng 07': 7,
      july: 7,
      jul: 7,
      'tháng 8': 8,
      'tháng 08': 8,
      august: 8,
      aug: 8,
      'tháng 9': 9,
      'tháng 09': 9,
      september: 9,
      sep: 9,
      'tháng 10': 10,
      october: 10,
      oct: 10,
      'tháng 11': 11,
      november: 11,
      nov: 11,
      'tháng 12': 12,
      december: 12,
      dec: 12,
    }

    const lowerSearch = trimmedSearch.toLowerCase()
    const monthNumber = monthNames[lowerSearch]

    if (monthNumber) {
      const currentYear = new Date().getFullYear()
      const startOfMonth = new Date(currentYear, monthNumber - 1, 1, 0, 0, 0)
      const endOfMonth = new Date(currentYear, monthNumber, 0, 23, 59, 59)

      searchConditions.push({
        paymentDate: {
          $gte: startOfMonth,
          $lte: endOfMonth,
        },
      })
      searchConditions.push({
        createdAt: {
          $gte: startOfMonth,
          $lte: endOfMonth,
        },
      })
    }

    // Build the custom query with $or condition
    const customQuery = {
      $or: searchConditions,
    }
    // Call the model with the custom query
    return customQuery
  } catch (error) {
    throw error
  }
}

/**
 * Filter bills by user with date range and payer
 * @param {string} userId - User ID
 * @param {string} fromDate - Start date in DD/MM/YYYY format
 * @param {string} toDate - End date in DD/MM/YYYY format
 * @param {boolean} payer - If true, only get bills where user is the payer
 * @param {string} searchDebounced - Search term for billName or description
 * @param {string} status - Payment status filter ('paid', 'unpaid', 'all')
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @returns {Promise<Object>} Bills with pagination info
 */
const getBillsWithConditions = async (
  userId,
  fromDate,
  toDate,
  payer,
  searchDebounced,
  status,
  page = 1,
  limit = 10
) => {
  try {
    const searchQuery = generateSearchQuery(searchDebounced)
    // Use the new comprehensive query function from billModel
    return await billModel.getBillsWithPagination(userId, page, limit, status, fromDate, toDate, payer, searchQuery)
  } catch (error) {
    throw error
  }
}

const getMutualBills = async (userId1, userId2) => {
  try {
    const user1ObjectId = new ObjectId(userId1)
    const user2ObjectId = new ObjectId(userId2)

    // Find bills where user1 owes user2 (user1 is participant, user2 is payer)
    const billsUser1Owes = await GET_DB()
      .collection(BILL_COLLECTION_NAME)
      .find({
        payerId: user2ObjectId,
        participants: user1ObjectId,
        optedOutUsers: { $ne: user1ObjectId },
        _destroy: false,
      })
      .toArray()

    // Find bills where user2 owes user1 (user2 is participant, user1 is payer)
    const billsUser2Owes = await GET_DB()
      .collection(BILL_COLLECTION_NAME)
      .find({
        payerId: user1ObjectId,
        participants: user2ObjectId,
        optedOutUsers: { $ne: user2ObjectId },
        _destroy: false,
      })
      .toArray()

    // Filter and populate bills where user1 hasn't paid fully
    const user1UnpaidBills = billsUser1Owes
      .filter((bill) => {
        const paymentStatus = bill.paymentStatus.find((ps) => ps.userId.equals(user1ObjectId))
        return paymentStatus && paymentStatus.amountPaid < paymentStatus.amountOwed && !bill.optedOutUsers?.some(id => id.equals(user1ObjectId))
      })
      .map((bill) => {
        const paymentStatus = bill.paymentStatus.find((ps) => ps.userId.equals(user1ObjectId))
        return {
          _id: bill._id,
          billName: bill.billName,
          description: bill.description || '',
          totalAmount: bill.totalAmount,
          amountOwed: paymentStatus.amountOwed,
          amountPaid: paymentStatus.amountPaid,
          remainingAmount: (paymentStatus.amountOwed || 0) - (paymentStatus.amountPaid || 0),
          paymentDate: bill.paymentDate || bill.createdAt,
          payerId: bill.payerId,
          createdAt: bill.createdAt,
        }
      })

    // Filter and populate bills where user2 hasn't paid fully
    const user2UnpaidBills = billsUser2Owes
      .filter((bill) => {
        const paymentStatus = bill.paymentStatus.find((ps) => ps.userId.equals(user2ObjectId))
        return paymentStatus && paymentStatus.amountPaid < paymentStatus.amountOwed && !bill.optedOutUsers?.some(id => id.equals(user2ObjectId))
      })
      .map((bill) => {
        const paymentStatus = bill.paymentStatus.find((ps) => ps.userId.equals(user2ObjectId))
        return {
          _id: bill._id,
          billName: bill.billName,
          description: bill.description || '',
          totalAmount: bill.totalAmount,
          amountOwed: paymentStatus.amountOwed,
          amountPaid: paymentStatus.amountPaid,
          remainingAmount: (paymentStatus.amountOwed || 0) - (paymentStatus.amountPaid || 0),
          paymentDate: bill.paymentDate || bill.createdAt,
          payerId: bill.payerId,
          createdAt: bill.createdAt,
        }
      })

    // Calculate totals
    const totalUser1Owes = user1UnpaidBills.reduce((sum, bill) => sum + bill.remainingAmount, 0)
    const totalUser2Owes = user2UnpaidBills.reduce((sum, bill) => sum + bill.remainingAmount, 0)

    return {
      user1Bills: user1UnpaidBills,
      user2Bills: user2UnpaidBills,
      totalUser1Owes,
      totalUser2Owes,
      canBalance: user1UnpaidBills.length > 0 && user2UnpaidBills.length > 0,
    }
  } catch (error) {
    throw error
  }
}

const scanBill = async ({ userId, imageData }) => {
  const client = new ClovaXClient()

  const dataUriString = imageData

  const messages = [
    {
      role: 'system',
      content: [
        {
          type: 'text',
          text: `
You are an advanced OCR model specialized in extracting structured information from images of receipts and bills. 
Your goal is to accurately read the text in the image and return a clean, structured JSON object representing the bill details. 
Extract as much information as possible, including:

- billName: The title or store name of the bill
- paymentDate: The date "dd/mm/yyyy" of the transaction (if visible).
- description: Any additional notes or remarks written on the bill
- category: The category of the bill. It must be one of the following: "food", "utilities", "entertainment", "transportation", "shopping", "others".
- items: A list of purchased products, each with:
  - name: Product or service name
  - quantity: Quantity of each item
  - unitPrice: Price per unit
  - amount: Total price per item
- subtotal: The total amount before taxes or discounts
- tax: Tax amount (if applicable)
- discount: Discount amount (if applicable)
- totalAmount: Final total to be paid
- paymentMethod: How the payment was made (cash, card, etc.)

Return only valid JSON. Do not include explanations or extra text.
      `,
        },
      ],
    },
    {
      role: 'user',
      content: [
        {
          type: 'image_url',
          imageUrl: null,
          dataUri: { data: dataUriString },
        },
        {
          type: 'text',
          text: 'Please extract all relevant information from this bill image and return it in JSON format.',
        },
      ],
    },
  ]

  const request = {
    messages,
    topP: 0.8,
    topK: 0,
    maxTokens: 1000,
    temperature: 0.5,
    repetitionPenalty: 1.1,
    stop: [],
  }

  const response = await client.createChatCompletion(request)

  return { response }
}

export const billService = {
  createNew,
  getAll,
  getAllWithPagination,
  getBillsByUser,
  getBillsByUserWithPagination,
  getBillsByCreator,
  findOneById,
  getBillById,
  update,
  updateBill,
  markAsPaid,
  optOutUser,
  deleteOneById,
  sendReminder,
  getMutualBills,
  scanBill,
  getBillsWithConditions,
}
