import { StatusCodes } from 'http-status-codes'
import { debtService } from '~/services/debtService.js'
import ApiError from '~/utils/APIError'

/**
 * Get list of people who owe money to the current user
 */
const getDebtsOwedToMe = async (req, res, next) => {
  try {
    const { userId } = req.params
    
    // Security check: Verify that the authenticated user is requesting their own data
    if (req.jwtDecoded._id !== userId) {
      throw new ApiError(StatusCodes.FORBIDDEN, 'You can only access your own debt data')
    }
    
    const debts = await debtService.getDebtsOwedToMe(userId)
    res.status(StatusCodes.OK).json(debts)
  } catch (error) {
    next(error)
  }
}

/**
 * Get list of people that the current user owes money to
 */
const getDebtsIOwe = async (req, res, next) => {
  try {
    const { userId } = req.params
    
    // Security check: Verify that the authenticated user is requesting their own data
    if (req.jwtDecoded._id !== userId) {
      throw new ApiError(StatusCodes.FORBIDDEN, 'You can only access your own debt data')
    }
    
    const debts = await debtService.getDebtsIOwe(userId)
    res.status(StatusCodes.OK).json(debts)
  } catch (error) {
    next(error)
  }
}

/**
 * Get comprehensive debt summary for the user
 */
const getDebtSummary = async (req, res, next) => {
  try {
    const { userId } = req.params
    
    // Security check: Verify that the authenticated user is requesting their own data
    if (req.jwtDecoded._id !== userId) {
      throw new ApiError(StatusCodes.FORBIDDEN, 'You can only access your own debt data')
    }
    
    const summary = await debtService.getDebtSummary(userId)
    res.status(StatusCodes.OK).json(summary)
  } catch (error) {
    next(error)
  }
}

/**
 * Initiate payment request
 */
const initiatePayment = async (req, res, next) => {
  try {
    const { userId } = req.params
    const { creditorId, amount, note, priorityBill } = req.body
    
    // Security check: Verify that the authenticated user is initiating payment for themselves
    if (req.jwtDecoded._id !== userId) {
      throw new ApiError(StatusCodes.FORBIDDEN, 'You can only initiate payment for yourself')
    }
    
    const result = await debtService.initiatePayment(userId, creditorId, amount, note, priorityBill)
    
    res.status(StatusCodes.OK).json(result)
  } catch (error) {
    next(error)
  }
}

/**
 * Confirm payment (in-app, not via email token)
 * Body: { debtorId, amount, bills: [{ billId, amount }], note, isConfirmed }
 * Only creditor (current user) can confirm
 */
const confirmPayment = async (req, res, next) => {
  try {
    const { userId } = req.params // creditor
    const { debtorId, amount, bills, note, isConfirmed } = req.body

    // Security: Only creditor can confirm
    if (req.jwtDecoded._id !== userId) {
      throw new ApiError(StatusCodes.FORBIDDEN, 'You can only confirm payments to yourself')
    }
    if (!debtorId || !amount || !Array.isArray(bills) || bills.length === 0) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Missing required fields')
    }

    // Get user info
    const [creditor, debtor] = await Promise.all([
      (await import('~/models/userModel.js')).userModel.findOneById(userId),
      (await import('~/models/userModel.js')).userModel.findOneById(debtorId)
    ])
    if (!creditor || !debtor) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'User not found')
    }

    // Only confirmed payments may alter bill balances.
    let remaining = amount
    const updatedBills = []
    if (isConfirmed) {
      const { billService } = await import('~/services/billService.js')
      for (const billPayment of bills) {
        if (remaining <= 0) break
        const paidAmount = Math.min(billPayment.amount, remaining)
        const result = await billService.markAsPaid(billPayment.billId, debtorId, paidAmount, userId)
        if (result) {
          updatedBills.push({ billId: billPayment.billId, amountPaid: paidAmount })
          remaining -= paidAmount
        }
      }
    }

    // Record payment confirmation (token: null)
    const { paymentConfirmationModel } = await import('~/models/paymentConfirmationModel.js')
    // Generate a unique token for in-app confirmation (not used for validation, just to satisfy schema)
    const token = `inapp_${Date.now()}_${Math.random().toString(36).slice(2)}`
    await paymentConfirmationModel.createNew({
      paymentId: bills[0]?.billId || null,
      token,
      recipientId: userId,
      payerId: debtorId,
      amount,
      isConfirmed: !!isConfirmed
    })

    // Record every approval and rejection as a separate audit event.
    const { activityModel } = await import('~/models/activityModel.js')
    await activityModel.createNew({
      activityType: isConfirmed ? activityModel.ACTIVITY_TYPES.PAYMENT_CONFIRMED : activityModel.ACTIVITY_TYPES.PAYMENT_REJECTED,
      userId,
      resourceType: bills[0]?.billId ? 'bill' : 'user',
      resourceId: bills[0]?.billId || debtorId,
      details: {
        amount,
        note: note || '',
        debtorName: debtor.name,
        creditorName: creditor.name,
        paymentId: bills[0]?.billId,
        billId: bills[0]?.billId || null,
        audienceUserIds: [debtorId],
        description: isConfirmed
          ? `Confirmed payment of ${amount} from ${debtor.name}`
          : `Rejected payment of ${amount} from ${debtor.name}`
      }
    })
    // Send email notification to payer
    const { sendPaymentResponseEmail } = await import('~/utils/emailService.js')
    await sendPaymentResponseEmail({
      payerEmail: debtor.email,
      payerName: debtor.name,
      recipientName: creditor.name,
      amount,
      isConfirmed: !!isConfirmed
    })

    res.status(StatusCodes.OK).json({
      success: true,
      updatedBills,
      message: isConfirmed ? 'Payment confirmed' : 'Payment rejected'
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Send payment reminder to debtor
 * Body: { creditorId, debtorId }
 * Only creditor can send reminder
 */
const remindPayment = async (req, res, next) => {
  try {
    const { creditorId, debtorId, bill } = req.body

    // Security: Only creditor can send reminder
    if (req.jwtDecoded._id !== creditorId) {
      throw new ApiError(StatusCodes.FORBIDDEN, 'You can only send reminders for debts owed to you')
    }

    // Get debts owed to creditor
    const debts = await debtService.getDebtsOwedToMe(creditorId)

    // Find the debt for the debtor
    const debt = debts.find(d => d.userId === debtorId)
    if (!debt || debt.bills.length === 0) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'No outstanding debts found for this user')
    }

    // Get user info
    const [creditor, debtor] = await Promise.all([
      (await import('~/models/userModel.js')).userModel.findOneById(creditorId),
      (await import('~/models/userModel.js')).userModel.findOneById(debtorId)
    ])
    if (!creditor || !debtor) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'User not found')
    }

    // Create JWT token payload
    const payload = {
      creditorId,
      debtorId,
      bills: debt.bills.map(b => ({ billId: b.billId, billName: b.billName, amount: b.remainingAmount })),
      totalAmount: debt.bills.reduce((sum, b) => sum + b.remainingAmount, 0),
      type: 'payment_reminder'
    }

    // Generate JWT token with 7 days expiration
    const { JwtProvider } = await import('~/providers/JwtProvider.js')
    const { env } = await import('~/config/environment.js')
    const token = await JwtProvider.generateToken(
      payload,
      env.ACCESS_JWT_SECRET_KEY,
      '7d' // 7 days
    )

    // Store the token in database to prevent reuse
    const { paymentModel } = await import('~/models/paymentModel.js')
    await paymentModel.createNew({
      token,
      creditorId,
      debtorId
    })

    // Send reminder email
    const { sendPaymentReminderEmail } = await import('~/utils/emailService.js')
    const emailSent = await sendPaymentReminderEmail({
      debtorEmail: debtor.email,
      debtorName: debtor.name,
      creditorName: creditor.name,
      bills: debt.bills.map(b => ({ billName: b.billName, amount: b.remainingAmount })),
      creditorBankName: creditor.bankName,
      creditorBankAccount: creditor.bankAccount,
      reminderToken: token,
      priorityBill: bill
    })

    const reminderBill = debt.bills.find((entry) => entry.billId === bill) || debt.bills[0]
    const { activityModel } = await import('~/models/activityModel.js')
    await activityModel.logBillActivity(activityModel.ACTIVITY_TYPES.BILL_REMINDER_SENT, creditorId, reminderBill.billId, {
      billName: reminderBill.billName,
      amount: reminderBill.remainingAmount,
      reminderType: 'email',
      recipientId: debtorId,
      audienceUserIds: [debtorId],
      description: `Sent a payment reminder to ${debtor.name} for ${reminderBill.billName}`
    })
    res.status(StatusCodes.OK).json({
      success: true,
      emailSent,
      message: 'Payment reminder sent successfully'
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Get payment details by token (public)
 */
const getPaymentByToken = async (req, res, next) => {
  try {
    const { token } = req.params

    // First, try to find in paymentModel (for bill payments)
    const { paymentModel } = await import('~/models/paymentModel.js')
    const paymentRecord = await paymentModel.findByToken(token)

    if (paymentRecord) {
      // It's a bill payment or reminder, token is JWT
      const { JwtProvider } = await import('~/providers/JwtProvider.js')
      const { env } = await import('~/config/environment.js')
      let decoded
      try {
        decoded = await JwtProvider.verifyToken(paymentRecord.token, env.ACCESS_JWT_SECRET_KEY)
      } catch (error) {
        throw new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid or expired token')
      }

      // Check token type
      if (decoded.type !== 'bill_payment' && decoded.type !== 'payment_reminder') {
        throw new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid token type')
      }

      // Get user info
      const [creditor, debtor] = await Promise.all([
        (await import('~/models/userModel.js')).userModel.findOneById(decoded.creditorId),
        (await import('~/models/userModel.js')).userModel.findOneById(decoded.debtorId)
      ])

      if (!creditor || !debtor) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'User not found')
      }

      // Fetch current debts from database - get debts that debtor owes to creditor
      const debts = await debtService.getDebtsIOwe(decoded.debtorId)
      const debt = debts.find(d => d.userId === decoded.creditorId)

      if (!debt) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'No outstanding debts found')
      }

      // Check if token has been used
      if (paymentRecord.usedAt) {
        return res.status(StatusCodes.OK).json({
          isUsed: true,
          usedMessage: `Bạn đã xác nhận thanh toán cho ${creditor.name} trước đó.<br>Vui lòng đăng nhập để xem chi tiết.`,
          creditor: {
            name: creditor.name
          }
        })
      }

      res.status(StatusCodes.OK).json({
        creditor: {
          _id: creditor._id,
          name: creditor.name,
          email: creditor.email,
          bankName: creditor.bankName,
          bankAccount: creditor.bankAccount
        },
        debtor: {
          _id: debtor._id,
          name: debtor.name,
          email: debtor.email
        },
        bills: debt.bills,
        totalAmount: debt.totalAmount,
        token: paymentRecord.token
      })
    } else {
      // Try as JWT token (for reminders)
      const { JwtProvider } = await import('~/providers/JwtProvider.js')
      const { env } = await import('~/config/environment.js')
      let decoded
      try {
        decoded = await JwtProvider.verifyToken(token, env.ACCESS_JWT_SECRET_KEY)
      } catch (error) {
        throw new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid or expired token')
      }

      // Check token type
      if (decoded.type !== 'payment_reminder') {
        throw new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid token type')
      }

      // Check database for usage status
      const reminder = await paymentModel.findByToken(token)

      if (!reminder) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'Reminder not found')
      }

      // Get user info
      const [creditor, debtor] = await Promise.all([
        (await import('~/models/userModel.js')).userModel.findOneById(decoded.creditorId),
        (await import('~/models/userModel.js')).userModel.findOneById(decoded.debtorId)
      ])

      if (!creditor || !debtor) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'User not found')
      }

      // Fetch current debts from database - get debts that debtor owes to creditor
      const debts = await debtService.getDebtsIOwe(decoded.debtorId)
      const debt = debts.find(d => d.userId === decoded.creditorId)

      if (!debt) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'No outstanding debts found')
      }

      // Check if token has been used
      if (reminder.usedAt) {
        return res.status(StatusCodes.OK).json({
          isUsed: true,
          usedMessage: `Bạn đã xác nhận thanh toán cho ${creditor.name} trước đó.<br>Vui lòng đăng nhập để xem chi tiết.`,
          creditor: {
            name: creditor.name
          }
        })
      }

      res.status(StatusCodes.OK).json({
        creditor: {
          _id: creditor._id,
          name: creditor.name,
          email: creditor.email,
          bankName: creditor.bankName,
          bankAccount: creditor.bankAccount
        },
        debtor: {
          _id: debtor._id,
          name: debtor.name,
          email: debtor.email
        },
        bills: debt.bills,
        totalAmount: debt.totalAmount,
        token
      })
    }
  } catch (error) {
    next(error)
  }
}

/**
 * Submit payment (public)
 */
const submitPayment = async (req, res, next) => {
  try {
    const { token, amount, note, priorityBill } = req.body

    // First, try to find in paymentModel (for bill payments)
    const { paymentModel } = await import('~/models/paymentModel.js')
    const paymentRecord = await paymentModel.findByToken(token)

    if (paymentRecord) {
      // It's a bill payment
      const { creditorId, debtorId } = paymentRecord

      if (paymentRecord.usedAt) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'This payment token has already been used')
      }

      // Mark as used
      await paymentModel.markAsUsed(token)

      // Process the payment
      const result = await debtService.initiatePayment(debtorId.toString(), creditorId.toString(), amount, note, priorityBill)

      res.status(StatusCodes.OK).json({
        success: true,
        message: 'Payment submitted successfully',
        result
      })
    } else {
      // Try as JWT token (for reminders)
      const { JwtProvider } = await import('~/providers/JwtProvider.js')
      const { env } = await import('~/config/environment.js')
      let decoded
      try {
        decoded = await JwtProvider.verifyToken(token, env.ACCESS_JWT_SECRET_KEY)
      } catch (error) {
        throw new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid or expired token')
      }

      // Check token type
      if (decoded.type !== 'payment_reminder') {
        throw new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid token type')
      }

      // Check database for usage status
      const reminder = await paymentModel.findByToken(token)

      if (!reminder) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'Reminder not found')
      }

      if (reminder.usedAt) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'This reminder has already been used')
      }

      // Mark reminder as used
      await paymentModel.markAsUsed(token)

      // Process the payment as if debtor initiated it
      const result = await debtService.initiatePayment(decoded.debtorId, decoded.creditorId, amount, note, priorityBill)

      res.status(StatusCodes.OK).json({
        success: true,
        message: 'Payment submitted successfully',
        result
      })
    }
  } catch (error) {
    next(error)
  }
}

/**
 * Balance debts between two users
 */
const balanceDebts = async (req, res, next) => {
  try {
    const { userId } = req.params // current user
    const { otherUserId } = req.body

    // Security check: Verify that the authenticated user is one of the participants
    if (req.jwtDecoded._id !== userId && req.jwtDecoded._id !== otherUserId) {
      throw new ApiError(StatusCodes.FORBIDDEN, 'You can only balance debts involving yourself')
    }

    const result = await debtService.balanceDebts(userId, otherUserId)

    res.status(StatusCodes.OK).json(result)
  } catch (error) {
    next(error)
  }
}

export const debtController = {
  getDebtsOwedToMe,
  getDebtsIOwe,
  getDebtSummary,
  initiatePayment,
  confirmPayment,
  remindPayment,
  getPaymentByToken,
  submitPayment,
  balanceDebts
}
