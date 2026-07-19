import { StatusCodes } from 'http-status-codes'
import { billService } from '~/services/billService.js'
import { JwtProvider } from '~/providers/JwtProvider.js'
import { env } from '~/config/environment.js'
import APIError from '~/utils/APIError.js'
import { WEBSITE_DOMAIN } from '~/utils/constants.js'
import { sendOptOutEmail } from '~/utils/emailService.js'

const createNew = async (req, res, next) => {
  try {
    const createdBill = await billService.createNew({ ...req.body, creatorId: req.jwtDecoded._id })
    res.status(StatusCodes.CREATED).json(createdBill)
  } catch (error) {
    next(error)
  }
}

const getBillsByUserId = async (req, res, next) => {
  try {
    const { userId } = req.params
    const bills = await billService.getBillsByUserId(userId)
    res.status(StatusCodes.OK).json(bills)
  } catch (error) {
    next(error)
  }
}

const scan = async (req, res, next) => {
  try {
    const scannedBill = await billService.scanBill(req.body)
    res.status(StatusCodes.OK).json(scannedBill)

  } catch (error) {next(error)}
}

const getBillById = async (req, res, next) => {
  try {
    const { billId } = req.params
    const bill = await billService.getBillById(billId)
    res.status(StatusCodes.OK).json(bill)
  } catch (error) {
    next(error)
  }
}

const getMutualBills = async (req, res, next) => {
  try {
    const { userId, creditorId } = req.params
    const mutualBills = await billService.getMutualBills(userId, creditorId)
    res.status(StatusCodes.OK).json(mutualBills)
  } catch (error) {
    next(error)
  }
}

const optOut = async (req, res, next) => {
  try {
    const { token } = req.query
    let decoded
    try {
      decoded = await JwtProvider.verifyToken(token, env.ACCESS_JWT_SECRET_KEY)
    } catch (error) {
      console.error('Token verification error in optOut:', error)
      throw new APIError(StatusCodes.UNAUTHORIZED, 'Invalid or expired token')
    }
    if (decoded.type !== 'bill_opt_out') {
      throw new APIError(StatusCodes.BAD_REQUEST, 'Invalid token type')
    }
    const { billId, userId } = decoded
    
    // Check if user has already opted out
    const bill = await billService.findOneById(billId)
    if (!bill) {
      throw new APIError(StatusCodes.NOT_FOUND, 'Bill not found')
    }
    
    const hasOptedOut = bill.optedOutUsers && bill.optedOutUsers.some(u => u.toString() === userId)
    if (hasOptedOut) {
      throw new APIError(StatusCodes.BAD_REQUEST, 'User has already opted out from this bill')
    }
    
    // Get the amount the debtor was supposed to pay BEFORE opting out
    const debtorPaymentStatus = bill.paymentStatus.find(ps => ps.userId.toString() === userId)
    const amount = debtorPaymentStatus ? debtorPaymentStatus.amountOwed : 0
    
    await billService.optOutUser(billId, userId, userId)

    // Send opt-out notification emails
    try {
      // Get updated bill data
      const updatedBill = await billService.findOneById(billId)
      
      // Get debtor (user who opted out) info
      const { userModel } = await import('~/models/userModel.js')
      const debtor = await userModel.findOneById(userId)
      if (!debtor) {
        console.warn('Debtor not found, skipping opt-out email')
        return res.status(StatusCodes.OK).json({ message: 'Successfully opted out from the bill', billId })
      }
      
      // Get creditor (bill creator/payer) info
      const creditor = await userModel.findOneById(updatedBill.payerId.toString())
      if (!creditor) {
        console.warn('Creditor not found, skipping opt-out email')
        return res.status(StatusCodes.OK).json({ message: 'Successfully opted out from the bill', billId })
      }
      
      // Send emails to both debtor and creditor
      await sendOptOutEmail({
        debtorEmail: debtor.email,
        debtorName: debtor.name,
        creditorEmail: creditor.email,
        creditorName: creditor.name,
        billName: updatedBill.billName,
        billDescription: updatedBill.description || '',
        amount: amount,
      })
    } catch (emailError) {
      console.error('Failed to send opt-out emails:', emailError)
      // Don't fail the opt-out operation if email fails
    }

    // Return success response
    res.status(StatusCodes.OK).json({ message: 'Successfully opted out from the bill', billId })
  } catch (error) {
    next(error)
  }
}

const verifyOptOutToken = async (req, res, next) => {
  try {
    const { token } = req.query
    let decoded
    try {
      decoded = await JwtProvider.verifyToken(token, env.ACCESS_JWT_SECRET_KEY)
    } catch (error) {
      throw new APIError(StatusCodes.UNAUTHORIZED, 'Invalid or expired token')
    }
    
    if (decoded.type !== 'bill_opt_out') {
      throw new APIError(StatusCodes.BAD_REQUEST, 'Invalid token type')
    }
    const { billId, userId } = decoded
    
    // Verify bill exists and user is a participant
    const bill = await billService.findOneById(billId)
    if (!bill) {
      throw new APIError(StatusCodes.NOT_FOUND, 'Bill not found')
    }
    
    // Check if user is still a participant (not already opted out)
    const isParticipant = bill.participants.some(p => p.toString() === userId)
    if (!isParticipant) {
      throw new APIError(StatusCodes.BAD_REQUEST, 'User is not a participant in this bill')
    }
    
    // Check if user has already opted out
    const hasOptedOut = bill.optedOutUsers && bill.optedOutUsers.some(u => u.toString() === userId)
    if (hasOptedOut) {
      throw new APIError(StatusCodes.BAD_REQUEST, 'User has already opted out from this bill')
    }
    
    // Return bill info for display
    res.status(StatusCodes.OK).json({ 
      billName: bill.billName,
      billId: bill._id,
      valid: true
    })
  } catch (error) {
    next(error)
  }
}

const updateBill = async (req, res, next) => {
  try {
    const { billId } = req.params
    const updatedBill = await billService.updateBill(billId, req.body)
    res.status(StatusCodes.OK).json(updatedBill)
  } catch (error) {
    next(error)
  }
}

export const billController = {
  createNew, 
  scan,
  getBillsByUserId,
  getBillById,
  getMutualBills,
  updateBill,
  optOut,
  verifyOptOutToken,
}
