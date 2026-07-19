/**
 * History API Routes
 */

import express from 'express'
import { historyController } from '~/controllers/historyController.js'

const Router = express.Router()

Router.get('/bill/:billId', historyController.getBillDetail)

Router.get('/:userId', historyController.getHistoryData)

export const historyRoute = Router
