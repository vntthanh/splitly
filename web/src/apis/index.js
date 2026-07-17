import authorizedAxiosInstance from '~/utils/authorizeAxios'
import { API_ROOT } from '~/utils/constants'
import { toast } from 'react-toastify'

export const fetchDashboardDataAPI = async (userId) => {
  const response = await authorizedAxiosInstance.get(`${API_ROOT}/v1/dashboard/${userId}`)
  return response.data
}

// ============================================
// REPORT APIs
// ============================================

/**
 * Fetch monthly report data for a user
 * @param {string} userId - User ID
 * @param {number} year - Year (YYYY)
 * @param {number} month - Month (1-12)
 * @returns {Promise<Object>} Report data including metrics, trends, and insights
 */
export const fetchMonthlyReportAPI = async (userId, year, month) => {
  const response = await authorizedAxiosInstance.get(`${API_ROOT}/v1/reports/${userId}?year=${year}&month=${month}`)
  return response.data
}

/**
 * Fetch AI-powered analysis and recommendations for a user
 * @param {string} userId - User ID
 * @returns {Promise<Object>} AI analysis including debt advice, spending predictions, and recommendations
 */
export const fetchAIAnalysisAPI = async (userId) => {
  const response = await authorizedAxiosInstance.get(`${API_ROOT}/v1/assistant/analysis/${userId}`)
  return response.data
}

export const fetchHistoryDataAPI = async (userId, numPage, limit, search, settled) => {
  const response = await authorizedAxiosInstance.get(
    `${API_ROOT}/v1/history/${userId}?page=${numPage}&limit=${limit}&search=${search}&settled=${settled}`
  )
  return response.data
}

export const fetchHistorySearchingAPI = async (userId, numPage, limit, search, settled) => {
  const response = await authorizedAxiosInstance.get(
    `${API_ROOT}/v1/history/search/${userId}?page=${numPage}&limit=${limit}&search=${search}&settled=${settled}`
  )
  return response.data
}

export const fetchHistoryFilterAPI = async (
  userId,
  numPage,
  limit,
  fromDate,
  toDate,
  payer,
  searchDebounced,
  status
) => {
  const params = new URLSearchParams({
    page: numPage,
    limit: limit,
  })

  if (fromDate) params.append('fromDate', fromDate)
  if (toDate) params.append('toDate', toDate)
  if (payer) params.append('payer', payer)
  if (searchDebounced) params.append('search', searchDebounced)
  if (status && status !== 'all') params.append('status', status)

  console.log(params.toString())

  const response = await authorizedAxiosInstance.get(`${API_ROOT}/v1/history/${userId}?${params.toString()}`)
  return response.data
}

export const fetchDebtsOwedToMeAPI = async (userId) => {
  const response = await authorizedAxiosInstance.get(`${API_ROOT}/v1/debts/${userId}/owed-to-me`)
  return response.data
}

export const fetchDebtsIOweAPI = async (userId) => {
  const response = await authorizedAxiosInstance.get(`${API_ROOT}/v1/debts/${userId}/i-owe`)
  return response.data
}

export const fetchDebtSummaryAPI = async (userId) => {
  const response = await authorizedAxiosInstance.get(`${API_ROOT}/v1/debts/${userId}/summary`)
  return response.data
}

export const submitPaymentRequestAPI = async (userId, paymentData) => {
  const response = await authorizedAxiosInstance.post(`${API_ROOT}/v1/debts/${userId}/payment`, paymentData)
  toast.success('Yêu cầu thanh toán đã được gửi thành công!', { theme: 'colored' })
  return response.data
}

export const remindPaymentAPI = async (remindData) => {
  const response = await authorizedAxiosInstance.post(`${API_ROOT}/v1/debts/remind-payment`, remindData)
  toast.success('Nhắc nhở thanh toán đã được gửi thành công!', { theme: 'colored' })
  return response.data
}

export const getReminderByTokenAPI = async (token) => {
  // Use regular axios for public API
  const axios = (await import('axios')).default
  const response = await axios.get(`${API_ROOT}/v1/debts/payment/${token}`)
  return response.data
}

export const submitReminderPaymentAPI = async (paymentData) => {
  // Use regular axios for public API
  const axios = (await import('axios')).default
  const response = await axios.post(`${API_ROOT}/v1/debts/payment/submit`, paymentData)
  return response.data
}

// ============================================
// USERS APIs
// ============================================
export const registerUserAPI = async (userData) => {
  const response = await authorizedAxiosInstance.post(`${API_ROOT}/v1/users/register`, userData)
  toast.success('Registration successful! Please check your email to verify your account.', { theme: 'colored' })
  return response.data
}

export const verifyUserAccountAPI = async (data) => {
  const response = await authorizedAxiosInstance.put(`${API_ROOT}/v1/users/verify_account`, data)
  toast.success('Account verified successfully! Now you can log in.', { theme: 'colored' })
  return response.data
}

export const getUserByEmailAPI = async (email) => {
  const response = await authorizedAxiosInstance.get(`${API_ROOT}/v1/users/email/${email}`)
  return response.data
}

export const getUserByIdAPI = async (userId) => {
  const response = await authorizedAxiosInstance.get(`${API_ROOT}/v1/users/${userId}`)
  return response.data
}

export const fetchUsersAPI = async (page = 1, limit = 10, search = '') => {
  const params = new URLSearchParams({
    page: page,
    limit: limit,
  })

  if (search) params.append('search', search)

  const response = await authorizedAxiosInstance.get(`${API_ROOT}/v1/users?${params.toString()}`)
  return response.data
}

export const createGuestUserAPI = async (email, name = null) => {
  const response = await authorizedAxiosInstance.post(`${API_ROOT}/v1/users/guest`, {
    email,
    name,
  })
  toast.success('Guest user created successfully!', { theme: 'colored' })
  return response.data
}

// ============================================
// BILL APIs
// ============================================

// Create a new bill
export const createBillAPI = async (billData) => {
  const response = await authorizedAxiosInstance.post(`${API_ROOT}/v1/bills`, billData)
  toast.success('Hóa đơn đã được tạo thành công!', { theme: 'colored' })
  return response.data
}

// Get all bills for a user
export const fetchUserBillsAPI = async (userId) => {
  const response = await authorizedAxiosInstance.get(`${API_ROOT}/v1/bills/user/${userId}`)
  return response.data
}

// Get a specific bill by ID
export const fetchBillByIdAPI = async (billId) => {
  const response = await authorizedAxiosInstance.get(`${API_ROOT}/v1/bills/${billId}`)
  return response.data
}

// Get mutual bills between two users
export const fetchMutualBillsAPI = async (userId, creditorId) => {
  const response = await authorizedAxiosInstance.get(`${API_ROOT}/v1/bills/mutual/${userId}/${creditorId}`)
  return response.data
}

// Opt out from a bill
export const optOutBillAPI = async (token) => {
  // Use regular axios for public API
  const axios = (await import('axios')).default
  const response = await axios.get(`${API_ROOT}/v1/bills/opt-out?token=${token}`)
  return response.data
}

// Verify opt-out token
export const verifyOptOutTokenAPI = async (token) => {
  // Use regular axios for public API
  const axios = (await import('axios')).default
  const response = await axios.get(`${API_ROOT}/v1/bills/opt-out/verify?token=${token}`)
  return response.data
}

// Balance debts between two users
export const balanceDebtsAPI = async (userId, otherUserId) => {
  const response = await authorizedAxiosInstance.post(`${API_ROOT}/v1/debts/${userId}/balance`, {
    otherUserId,
  })
  toast.success('Cân bằng nợ thành công!', { theme: 'colored' })
  return response.data
}

// ============================================
// GROUP APIs
// ============================================

export const getAllGroupsAndMembersAPI = async () => {
  const response = await authorizedAxiosInstance.get(`${API_ROOT}/v1/groups/getAllGroupAndMembers`)
  return response.data
}

export const getGroupsByUserIdAPI = async (userId) => {
  const response = await authorizedAxiosInstance.get(`${API_ROOT}/v1/groups/user/${userId}`)
  return response.data
}

export const getGroupByIdAPI = async (groupId) => {
  const response = await authorizedAxiosInstance.get(`${API_ROOT}/v1/groups/${groupId}`)
  return response.data
}

export const fetchGroupsAPI = async (page = 1, limit = 10, search = '') => {
  const params = new URLSearchParams({
    page: page,
    limit: limit,
  })

  if (search) params.append('search', search)

  const response = await authorizedAxiosInstance.get(`${API_ROOT}/v1/groups?${params.toString()}`)
  return response.data
}

export const createGroupAPI = async (groupData) => {
  const response = await authorizedAxiosInstance.post(`${API_ROOT}/v1/groups`, groupData)
  toast.success('Nhóm đã được tạo thành công!')
  return response.data
}

export const updateGroupAPI = async (groupId, groupData) => {
  const response = await authorizedAxiosInstance.put(`${API_ROOT}/v1/groups/${groupId}`, groupData)
  toast.success('Nhóm đã được cập nhật thành công!')
  return response.data
}

export const deleteGroupAPI = async (groupId) => {
  const response = await authorizedAxiosInstance.delete(`${API_ROOT}/v1/groups/${groupId}`)
  toast.success('Nhóm đã được xóa thành công!')
  return response.data
}

export const updateGroupMembersAPI = async (groupId, members) => {
  const response = await authorizedAxiosInstance.put(`${API_ROOT}/v1/groups/${groupId}`, { members })
  return response.data
}

export const getGroupAndMembersAPI = async (groupId) => {
  const response = await authorizedAxiosInstance.get(`${API_ROOT}/v1/groups/getGroupAndMembers/${groupId}`)
  return response.data
}

// OCR Bill
export const sendOcrBillAPI = async (imageData, userId) => {
  const response = await authorizedAxiosInstance.post(`${API_ROOT}/v1/bills/scan`, {
    userId: userId,
    imageData: imageData,
  })
  return response.data
}

// ============================================
// Payment Confirmation APIs
// ============================================

// Verify payment confirmation token
export const verifyPaymentTokenAPI = async (token) => {
  // Use regular axios for public API
  const axios = (await import('axios')).default
  const response = await axios.get(`${API_ROOT}/v1/payment-confirmation/verify/${token}`)
  return response.data
}

// Confirm or reject payment
export const confirmPaymentAPI = async (token, isConfirmed) => {
  // Use regular axios for public API
  const axios = (await import('axios')).default
  const response = await axios.post(`${API_ROOT}/v1/payment-confirmation/confirm`, {
    token,
    isConfirmed,
  })
  return response.data
}

// ============================================
// Assistant APIs
// ============================================

export const getAssistantResponseAPI = async (messages) => {
  const reqMessages = messages
    .filter((message) => message.role === 'user' || message.role === 'assistant')
    .map((message) => ({
      role: message.role,
      content: message.content,
    }))

  const response = await authorizedAxiosInstance.post(`${API_ROOT}/v1/assistant`, {
    messages: reqMessages,
  })

  return response.data.data
}

// ============================================
// BANKING APIs
// ============================================
export const fetchBankListAPI = async () => {
  const axios = (await import('axios')).default
  const response = await axios.get(`https://api.vietqr.io/v2/banks`)
  return response.data
}
