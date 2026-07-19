/* eslint-disable no-useless-catch */
import { billModel } from '~/models/billModel.js'
import { userModel } from '~/models/userModel.js'
import { activityModel } from '~/models/activityModel.js'
import { sendPaymentEmail } from '~/utils/emailService.js'
import { JwtProvider } from '~/providers/JwtProvider.js'
import { env } from '~/config/environment.js'

/**
 * Calculate debts for people who owe money to the current user
 * @param {string} userId - Current user ID
 * @returns {Promise<Array>} Array of debt objects with user info and total amount
 */
const getDebtsOwedToMe = async (userId) => {
  try {
    // Get all bills where the current user is the payer
    const bills = await billModel.getBillsByUser(userId)
    
    // Filter bills where current user is the payer
    const billsAsPayer = bills.filter(bill => bill.payerId.equals(userId))
    
    // Calculate debts grouped by debtor
    const debtsByUser = {}
    
    billsAsPayer.forEach(bill => {
      bill.paymentStatus?.forEach(payment => {
        // Skip if the debtor has opted out from this bill
        if (bill.optedOutUsers && bill.optedOutUsers.some(id => id.equals(payment.userId))) return
        
        // Skip if it's the current user
        if (payment.userId.equals(userId)) return
        
        const amountPaid = payment.amountPaid || 0
        const remainingAmount = payment.amountOwed - amountPaid
        
        // Skip if fully paid
        if (remainingAmount <= 0) return
        
        // Add to debt total for this user
        if (!debtsByUser[payment.userId]) {
          debtsByUser[payment.userId] = {
            userId: payment.userId,
            totalAmount: 0,
            bills: []
          }
        }
        
        debtsByUser[payment.userId].totalAmount += remainingAmount
        debtsByUser[payment.userId].bills.push({
          billId: bill._id.toString(),
          billName: bill.billName,
          amountOwed: payment.amountOwed,
          amountPaid: amountPaid,
          remainingAmount: remainingAmount
        })
      })
    })
    
    // Get user details for all debtors
    const debtorIds = Object.keys(debtsByUser)
    if (debtorIds.length === 0) {
      return []
    }
    
    const debtorUsers = await userModel.findManyByIds(debtorIds)
    
    // Combine debt info with user info
    const debtsWithUserInfo = debtorIds.map(debtorId => {
      const user = debtorUsers.find(u => u._id.equals(debtorId))
      return {
        userId: debtorId,
        userName: user?.name || 'Unknown User',
        userAvatar: user?.avatar || null,
        userEmail: user?.email || null,
        bankName: user?.bankName || null,
        bankAccount: user?.bankAccount || null,
        totalAmount: Math.round(debtsByUser[debtorId].totalAmount),
        bills: debtsByUser[debtorId].bills
      }
    })
    
    // Sort by total amount descending
    return debtsWithUserInfo.sort((a, b) => b.totalAmount - a.totalAmount)
  } catch (error) {
    throw error
  }
}

/**
 * Calculate debts that the current user owes to others
 * @param {string} userId - Current user ID
 * @returns {Promise<Array>} Array of debt objects with user info and total amount
 */
const getDebtsIOwe = async (userId) => {
  try {
    // Get all bills where the current user is a participant
    const bills = await billModel.getBillsByUser(userId)
    
    // Calculate debts grouped by creditor (payer)
    const debtsByPayer = {}
    
    bills.forEach(bill => {
      // Skip if user has opted out from this bill
      if (bill.optedOutUsers && bill.optedOutUsers.some(id => id.equals(userId))) return
      
      // Find current user's payment status
      const myPayment = bill.paymentStatus?.find(payment => payment.userId.equals(userId))
      
      // Skip if not found or user is the payer
      if (!myPayment || bill.payerId.equals(userId)) return
      
      const amountPaid = myPayment.amountPaid || 0
      const remainingAmount = myPayment.amountOwed - amountPaid
      
      // Skip if fully paid
      if (remainingAmount <= 0) return
      
      // Add to debt total for this payer
      if (!debtsByPayer[bill.payerId]) {
        debtsByPayer[bill.payerId] = {
          userId: bill.payerId,
          totalAmount: 0,
          bills: []
        }
      }
      
      debtsByPayer[bill.payerId].totalAmount += remainingAmount
      debtsByPayer[bill.payerId].bills.push({
        billId: bill._id.toString(),
        billName: bill.billName,
        amountOwed: myPayment.amountOwed,
        amountPaid: amountPaid,
        remainingAmount: remainingAmount
      })
    })
    
    // Get user details for all payers
    const payerIds = Object.keys(debtsByPayer)
    if (payerIds.length === 0) {
      return []
    }
    
    const payerUsers = await userModel.findManyByIds(payerIds)
    
    // Combine debt info with user info
    const debtsWithUserInfo = payerIds.map(payerId => {
      const user = payerUsers.find(u => u._id.equals(payerId))
      return {
        userId: payerId,
        userName: user?.name || 'Unknown User',
        userAvatar: user?.avatar || null,
        userEmail: user?.email || null,
        bankName: user?.bankName || null,
        bankAccount: user?.bankAccount || null,
        totalAmount: Math.round(debtsByPayer[payerId].totalAmount),
        bills: debtsByPayer[payerId].bills
      }
    })
    
    // Sort by total amount descending
    return debtsWithUserInfo.sort((a, b) => b.totalAmount - a.totalAmount)
  } catch (error) {
    throw error
  }
}

/**
 * Get summary of debts (both owed to me and I owe)
 * @param {string} userId - Current user ID
 * @returns {Promise<Object>} Summary object with both debt types and totals
 */
const getDebtSummary = async (userId) => {
  try {
    const [owedToMe, iOwe] = await Promise.all([
      getDebtsOwedToMe(userId),
      getDebtsIOwe(userId)
    ])
    
    const totalOwedToMe = owedToMe.reduce((sum, debt) => sum + debt.totalAmount, 0)
    const totalIOwe = iOwe.reduce((sum, debt) => sum + debt.totalAmount, 0)
    
    return {
      owedToMe: {
        debts: owedToMe,
        total: totalOwedToMe,
        count: owedToMe.length
      },
      iOwe: {
        debts: iOwe,
        total: totalIOwe,
        count: iOwe.length
      },
      netBalance: totalOwedToMe - totalIOwe
    }
  } catch (error) {
    throw error
  }
}

/**
 * Initiate payment request from debtor to creditor
 * @param {string} debtorId - User ID who is making the payment
 * @param {string} creditorId - User ID who will receive the payment
 * @param {number} amount - Payment amount
 * @param {string} note - Optional payment note
 * @param {string} priorityBill - Optional bill ID to prioritize
 * @returns {Promise<Object>} Payment initiation result
 */
const initiatePayment = async (debtorId, creditorId, amount, note = '', priorityBill = null) => {
  try {
    // Get user details
    const [debtor, creditor] = await Promise.all([
      userModel.findOneById(debtorId),
      userModel.findOneById(creditorId)
    ])

    if (!debtor || !creditor) {
      throw new Error('User not found')
    }

    // Create activity log for payment initiation
    const activity = await activityModel.createNew({
      activityType: activityModel.ACTIVITY_TYPES.PAYMENT_INITIATED,
      userId: debtorId,
      resourceType: 'user',
      resourceId: creditorId,
      details: {
        amount,
        note,
        debtorName: debtor.name,
        creditorName: creditor.name,
        debtorEmail: debtor.email,
        creditorEmail: creditor.email
      }
    })

    // Give the recipient their own activity entry. Activities are retrieved by
    // owner, so recording only the payer's event would leave the recipient with
    // no indication that a confirmation is required.
    await activityModel.createNew({
      activityType: activityModel.ACTIVITY_TYPES.PAYMENT_CONFIRMATION_REQUESTED,
      userId: creditorId,
      resourceType: priorityBill ? 'bill' : 'user',
      resourceId: priorityBill || debtorId,
      details: {
        amount,
        note,
        paymentStatus: 'awaiting_confirmation',
        paymentId: activity.insertedId,
        billId: priorityBill || null,
        debtorId,
        debtorName: debtor.name,
        creditorName: creditor.name,
        debtorEmail: debtor.email,
        creditorEmail: creditor.email
      }
    })
    // Generate payment confirmation token
    const paymentId = activity.insertedId.toString()
    const tokenPayload = {
      paymentId,
      recipientId: creditorId,
      payerId: debtorId,
      amount,
      note: note || '',
      priorityBill: priorityBill || null,
      type: 'payment_confirmation'
    }
    const confirmationToken = await JwtProvider.generateToken(
      tokenPayload,
      env.ACCESS_JWT_SECRET_KEY,
      '3d' // 3 days
    )

    // Send email notification with confirmation link
    const emailSent = await sendPaymentEmail({
      recipientEmail: creditor.email,
      recipientName: creditor.name,
      payerName: debtor.name,
      amount: amount,
      note: note || '',
      confirmationToken
    })

    return {
      success: true,
      activityId: activity.insertedId.toString(),
      emailSent,
      message: 'Payment request initiated successfully'
    }
  } catch (error) {
    throw error
  }
}

const balanceDebts = async (userId1, userId2) => {
  try {
    // Get mutual bills
    const { billService } = await import('~/services/billService.js')
    const mutualBills = await billService.getMutualBills(userId1, userId2)

    if (!mutualBills.canBalance) {
      throw new Error('No debts to balance between these users')
    }

    const { user1Bills, user2Bills } = mutualBills

    // Create deep copies of bills for email (preserve original amounts)
    const user1BillsBefore = user1Bills.map(bill => ({ ...bill }))
    const user2BillsBefore = user2Bills.map(bill => ({ ...bill }))

    // Sort bills by remaining amount (smallest first for optimal balancing)
    const sortedUser1Bills = [...user1Bills].sort((a, b) => a.remainingAmount - b.remainingAmount)
    const sortedUser2Bills = [...user2Bills].sort((a, b) => a.remainingAmount - b.remainingAmount)

    let billsMarkedPaid = []
    let user1Index = 0
    let user2Index = 0

    // Balance bills by offsetting smaller amounts first
    while (user1Index < sortedUser1Bills.length && user2Index < sortedUser2Bills.length) {
      const user1Bill = sortedUser1Bills[user1Index]
      const user2Bill = sortedUser2Bills[user2Index]

      const offsetAmount = Math.min(user1Bill.remainingAmount, user2Bill.remainingAmount)

      if (offsetAmount > 0) {
        // Mark both bills as paid by the offset amount
        await billService.markAsPaid(user1Bill._id.toString(), userId1, offsetAmount, userId1)
        await billService.markAsPaid(user2Bill._id.toString(), userId2, offsetAmount, userId1)

        billsMarkedPaid.push({
          billId: user1Bill._id.toString(),
          billName: user1Bill.billName,
          amountPaid: offsetAmount,
          paidBy: userId1,
          paidTo: userId2
        })

        billsMarkedPaid.push({
          billId: user2Bill._id.toString(),
          billName: user2Bill.billName,
          amountPaid: offsetAmount,
          paidBy: userId2,
          paidTo: userId1
        })

        // Update remaining amounts
        user1Bill.remainingAmount -= offsetAmount
        user2Bill.remainingAmount -= offsetAmount

        // Move to next bill if this one is fully paid
        if (user1Bill.remainingAmount === 0) user1Index++
        if (user2Bill.remainingAmount === 0) user2Index++
      } else {
        break
      }
    }

    // Calculate final net debt
    const finalUser1Owes = sortedUser1Bills.reduce((sum, bill) => sum + bill.remainingAmount, 0)
    const finalUser2Owes = sortedUser2Bills.reduce((sum, bill) => sum + bill.remainingAmount, 0)
    const netDebt = finalUser1Owes - finalUser2Owes

    // Filter remaining bills (bills with remaining amounts after balancing)
    const user1BillsRemaining = sortedUser1Bills.filter(bill => bill.remainingAmount > 0)
    const user2BillsRemaining = sortedUser2Bills.filter(bill => bill.remainingAmount > 0)

    // Get user details for email
    const [user1, user2] = await Promise.all([
      userModel.findOneById(userId1),
      userModel.findOneById(userId2)
    ])

    if (!user1 || !user2) {
      throw new Error('User not found')
    }

    // Send email notification
    const { sendDebtBalanceEmail } = await import('~/utils/emailService.js')
    await sendDebtBalanceEmail({
      user1Email: user1.email,
      user1Name: user1.name,
      user2Email: user2.email,
      user2Name: user2.name,
      user1BillsBefore,
      user2BillsBefore,
      user1BillsRemaining,
      user2BillsRemaining,
      billsMarkedPaid,
      netDebt
    })

    // Log activity
    await activityModel.createNew({
      activityType: activityModel.ACTIVITY_TYPES.DEBT_BALANCED,
      userId: userId1,
      resourceType: 'user',
      resourceId: userId2,
      details: {
        user1Name: user1.name,
        user2Name: user2.name,
        totalUser1Owed: mutualBills.totalUser1Owes,
        totalUser2Owed: mutualBills.totalUser2Owes,
        netDebt,
        billsMarkedPaid: billsMarkedPaid.length,
        audienceUserIds: [userId2]
      }
    })

    return {
      success: true,
      message: 'Debts balanced successfully',
      netDebt,
      billsMarkedPaid,
      emailSent: true
    }
  } catch (error) {
    throw error
  }
}

export const debtService = {
  getDebtsOwedToMe,
  getDebtsIOwe,
  getDebtSummary,
  initiatePayment,
  balanceDebts
}
