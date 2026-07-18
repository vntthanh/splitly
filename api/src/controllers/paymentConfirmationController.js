import { StatusCodes } from 'http-status-codes'
import ApiError from '~/utils/APIError'
import { JwtProvider } from '~/providers/JwtProvider'
import { env } from '~/config/environment'
import { activityModel } from '~/models/activityModel'
import { billModel } from '~/models/billModel'
import { billService } from '~/services/billService'
import { userModel } from '~/models/userModel'
import { paymentConfirmationModel } from '~/models/paymentConfirmationModel'
import { sendPaymentResponseEmail } from '~/utils/emailService'
import { notificationService } from '~/services/notificationService'

/**
 * Generate a payment confirmation token
 * Token contains: paymentId, recipientId, payerId, amount, note
 * Valid for 3 days
 */
const generateConfirmationToken = async (req, res, next) => {
  try {
    const { paymentId, recipientId, payerId, amount, note, priorityBill } = req.body

    // Validate required fields
    if (!paymentId || !recipientId || !payerId || !amount) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Missing required fields')
    }

    // Create token payload
    const payload = {
      paymentId,
      recipientId,
      payerId,
      amount,
      note: note || '',
      priorityBill: priorityBill || null,
      type: 'payment_confirmation'
    }

    // Generate token with 3 days expiration
    const token = await JwtProvider.generateToken(
      payload,
      env.ACCESS_JWT_SECRET_KEY,
      '3d' // 3 days
    )

    res.status(StatusCodes.OK).json({ token })
  } catch (error) {
    next(error)
  }
}

/**
 * Verify payment confirmation token and return payment data
 */
const verifyConfirmationToken = async (req, res, next) => {
  try {
    const { token } = req.params

    if (!token) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Token is required')
    }

    // Check if token has already been used
    const existingConfirmation = await paymentConfirmationModel.findByToken(token)
    if (existingConfirmation) {
      return res.status(StatusCodes.OK).json({
        alreadyUsed: true,
        isConfirmed: existingConfirmation.isConfirmed,
        confirmedAt: existingConfirmation.confirmedAt,
        message: 'Bạn đã phản hồi cho yêu cầu xác nhận này trước đó.\nVui lòng đăng nhập để xem chi tiết.'
      })
    }

    // Verify and decode token
    const decoded = await JwtProvider.verifyToken(token, env.ACCESS_JWT_SECRET_KEY)

    // Check if it's a payment confirmation token
    if (decoded.type !== 'payment_confirmation') {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid token type')
    }

    // Get recipient and payer names
    const recipient = await userModel.findOneById(decoded.recipientId)
    const payer = await userModel.findOneById(decoded.payerId)

    if (!recipient || !payer) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'User not found')
    }

    // Return payment data
    const paymentData = {
      alreadyUsed: false,
      paymentId: decoded.paymentId,
      recipientName: recipient.name,
      recipientId: decoded.recipientId,
      payerName: payer.name,
      payerId: decoded.payerId,
      amount: decoded.amount,
      note: decoded.note,
      priorityBill: decoded.priorityBill
    }

    res.status(StatusCodes.OK).json(paymentData)
  } catch (error) {
    if (error.message === 'Invalid or expired token') {
      next(new ApiError(StatusCodes.UNAUTHORIZED, 'Token đã hết hạn hoặc không hợp lệ'))
    } else {
      next(error)
    }
  }
}

/**
 * Confirm payment received
 */
const confirmPayment = async (req, res, next) => {
  try {
    const { token } = req.body
    const { isConfirmed } = req.body // true = confirmed, false = not received

    if (!token) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Token is required')
    }

    // Check if token has already been used
    const existingConfirmation = await paymentConfirmationModel.findByToken(token)
    if (existingConfirmation) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Bạn đã phản hồi cho yêu cầu xác nhận này rồi')
    }

    // Verify token
    const decoded = await JwtProvider.verifyToken(token, env.ACCESS_JWT_SECRET_KEY)

    if (decoded.type !== 'payment_confirmation') {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid token type')
    }

    const { paymentId, recipientId, payerId, amount } = decoded
    const priorityBill = decoded.priorityBill

    // Get user information for email
    const recipient = await userModel.findOneById(recipientId)
    const payer = await userModel.findOneById(payerId)

    if (!recipient || !payer) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'User not found')
    }

    // Record the confirmation to prevent reuse
    await paymentConfirmationModel.createNew({
      paymentId,
      token,
      recipientId,
      payerId,
      amount,
      isConfirmed,
      priorityBill
    })

    if (isConfirmed) {
      // Mark payment as confirmed in the bills
      // Find bills where payer owes money to the recipient
      // Payer sent money TO recipient, so find bills where recipient paid and payer owes
      const bills = await billModel.getBillsByUser(payerId)
      
      // Sort bills by oldest first (ascending createdAt)
      bills.sort((a, b) => a.createdAt - b.createdAt)
      
      let remainingAmount = amount
      const updatedBills = []
      
      // If priorityBill is provided, try to pay it first
      if (priorityBill) {
        const priorityBillDoc = bills.find(bill => bill._id.toString() === priorityBill)
        if (priorityBillDoc && priorityBillDoc.payerId.equals(recipientId)) {
          const paymentStatus = priorityBillDoc.paymentStatus.find(ps => ps.userId.equals(payerId))
          if (paymentStatus) {
            const amountOwed = paymentStatus.amountOwed
            const currentAmountPaid = paymentStatus.amountPaid || 0
            const stillOwes = amountOwed - currentAmountPaid
            if (stillOwes > 0) {
              const paymentForThisBill = Math.min(stillOwes, remainingAmount)
              const updateResult = await billService.markAsPaid(
                priorityBillDoc._id.toString(),
                payerId,
                paymentForThisBill,
                recipientId,
                true // skipNotification - notification is sent separately
              )
              if (updateResult) {
                remainingAmount -= paymentForThisBill
                updatedBills.push({
                  billId: priorityBillDoc._id.toString(),
                  billName: priorityBillDoc.billName,
                  amountPaid: paymentForThisBill
                })
              }
            }
          }
        }
      }
      
      // Process remaining bills where payer owes money to recipient and hasn't fully paid
      for (const bill of bills) {
        if (remainingAmount <= 0) break
        
        // Skip if this is the priority bill already processed
        if (priorityBill && bill._id.toString() === priorityBill) continue
        
        // Check if this bill is paid by the recipient and payer owes money
        // Use .equals() for proper ObjectId comparison
        if (bill.payerId.equals(recipientId)) {
          const paymentStatus = bill.paymentStatus.find(ps => ps.userId.equals(payerId))
          
          if (paymentStatus) {
            const amountOwed = paymentStatus.amountOwed
            const currentAmountPaid = paymentStatus.amountPaid || 0
            const stillOwes = amountOwed - currentAmountPaid
            
            if (stillOwes > 0) {
              // Calculate how much to pay for this bill
              const paymentForThisBill = Math.min(stillOwes, remainingAmount)
              
              // Update payment amount for this bill using billService (proper architecture)
              // Pass payerId directly (can be string or ObjectId, model will handle conversion)
              const updateResult = await billService.markAsPaid(
                bill._id.toString(),
                payerId, // The person who owes money (who sent the payment)
                paymentForThisBill,
                recipientId, // paidBy parameter for activity logging (recipient confirms)
                true // skipNotification - notification is sent separately
              )
              
              if (updateResult) {
                remainingAmount -= paymentForThisBill
                updatedBills.push({
                  billId: bill._id.toString(),
                  billName: bill.billName,
                  amountPaid: paymentForThisBill
                })
              }
            }
          }
        }
      }

      // Log activity
      try {
        const activityBillId = priorityBill || updatedBills[0]?.billId || null
        await activityModel.createNew({
          userId: recipientId,
          activityType: 'payment_confirmed',
          resourceType: activityBillId ? 'bill' : 'user',
          resourceId: activityBillId || payerId,
          details: {
            paymentId,
            billId: activityBillId,
            payerId,
            amount,
            updatedBills,
            description: `Đã xác nhận nhận được ${amount.toLocaleString('vi-VN')}₫ từ người dùng`
          }
        })
      } catch (activityError) {
        console.warn('Failed to log payment confirmation activity:', activityError.message)
      }

      // Send notification to payer that payment was confirmed
      try {
        await notificationService.notifyPaymentConfirmed(
          recipientId,
          recipient.name,
          payerId,
          paymentId,
          amount
        )
      } catch (notifError) {
        console.warn('Failed to send payment confirmation notification:', notifError.message)
      }

      // Send email notification to payer
      try {
        await sendPaymentResponseEmail({
          payerEmail: payer.email,
          payerName: payer.name,
          recipientName: recipient.name,
          amount,
          isConfirmed: true
        })
      } catch (emailError) {
        console.error('Failed to send payment response email:', emailError)
      }

      res.status(StatusCodes.OK).json({
        success: true,
        message: 'Payment confirmed successfully',
        updatedBills
      })
    } else {
      // Log rejection
      try {
        await activityModel.createNew({
          userId: recipientId,
          activityType: 'payment_rejected',
          resourceType: priorityBill ? 'bill' : 'user',
          resourceId: priorityBill || payerId,
          details: {
            paymentId,
            billId: priorityBill || null,
            payerId,
            amount,
            description: `Từ chối xác nhận nhận được ${amount.toLocaleString('vi-VN')}₫ từ người dùng`
          }
        })
      } catch (activityError) {
        console.warn('Failed to log payment rejection activity:', activityError.message)
      }

      // Send notification to payer that payment was rejected
      try {
        await notificationService.notifyPaymentRejected(
          recipientId,
          recipient.name,
          payerId,
          paymentId,
          amount
        )
      } catch (notifError) {
        console.warn('Failed to send payment rejection notification:', notifError.message)
      }

      // Send email notification to payer
      try {
        await sendPaymentResponseEmail({
          payerEmail: payer.email,
          payerName: payer.name,
          recipientName: recipient.name,
          amount,
          isConfirmed: false
        })
      } catch (emailError) {
        console.error('Failed to send payment response email:', emailError)
      }

      res.status(StatusCodes.OK).json({
        success: true,
        message: 'Payment rejection recorded'
      })
    }
  } catch (error) {
    if (error.message === 'Invalid or expired token') {
      next(new ApiError(StatusCodes.UNAUTHORIZED, 'Token đã hết hạn hoặc không hợp lệ'))
    } else {
      next(error)
    }
  }
}

export const paymentConfirmationController = {
  generateConfirmationToken,
  verifyConfirmationToken,
  confirmPayment
}
