import { randomUUID } from 'crypto'
import { GeminiClient } from '~/providers/GeminiProvider.js'
import { userModel } from '~/models/userModel.js'
import { validateBillDraftInput } from '~/schemas/billDraftSchema.js'
import { ASSISTANT_TOOLS } from '~/utils/assistantTools.js'
import { createAssistantSystemInstruction } from '~/utils/assistantPrompt.js'

const PREPARE_BILL_DRAFT_TOOL = 'prepare_bill_draft'
const MAX_HISTORY_MESSAGES = 20
const MAX_MESSAGE_LENGTH = 2000
const CURRENT_USER_QUERIES = new Set(['current_user', 'tôi', 'mình', 'bản thân tôi'])

let geminiClient

const getGeminiClient = () => {
  if (!geminiClient) {
    geminiClient = new GeminiClient()
  }

  return geminiClient
}

const createAssistantError = (code, message) => {
  const error = new Error(message)
  error.code = code
  return error
}

const normalizeQuery = (query) => String(query || '').trim().toLocaleLowerCase('vi-VN')

const isCurrentUserQuery = (query) => CURRENT_USER_QUERIES.has(normalizeQuery(query))

const maskEmail = (email = '') => {
  const [localPart = '', domain = ''] = email.split('@')

  if (!localPart || !domain) return 'email không xác định'

  return `${localPart.charAt(0)}***@${domain}`
}

const sanitizeMessages = (messages) => {
  if (!Array.isArray(messages) || messages.length === 0) {
    throw createAssistantError('AI_INVALID_REQUEST', 'Messages must be a non-empty array')
  }

  return messages.slice(-MAX_HISTORY_MESSAGES).map((message) => ({
    role: message.role,
    content: String(message.content || '').trim().slice(0, MAX_MESSAGE_LENGTH),
  }))
}

const callGeminiWithRetry = async (client, request) => {
  try {
    return await client.createAssistantTurn(request)
  } catch (error) {
    if (error.code !== 'AI_UNAVAILABLE') throw error

    const retryDelayMs = 300 + Math.floor(Math.random() * 300)
    await new Promise((resolve) => setTimeout(resolve, retryDelayMs))
    return client.createAssistantTurn(request)
  }
}

const resolveUserQuery = async ({ query, actor, users }) => {
  if (isCurrentUserQuery(query)) {
    return { status: 'resolved', query, user: actor }
  }

  const candidates = await users.findCandidatesByKey(query)

  if (candidates.length === 0) {
    return { status: 'missing', query, candidates: [] }
  }

  if (candidates.length > 1) {
    return { status: 'ambiguous', query, candidates }
  }

  return { status: 'resolved', query, user: candidates[0] }
}

const createClarificationReply = (issues) => {
  const lines = []

  for (const issue of issues) {
    if (issue.status === 'missing') {
      lines.push(`Mình chưa tìm thấy người dùng “${issue.query}”. Bạn hãy cung cấp tên đầy đủ hoặc email.`)
      continue
    }

    const choices = issue.candidates
      .map((candidate) => `${candidate.name} (${maskEmail(candidate.email)})`)
      .join(', ')

    lines.push(`Mình tìm thấy nhiều người khớp với “${issue.query}”: ${choices}. Bạn muốn chọn người nào?`)
  }

  return lines.join('\n')
}

const createWarnings = (draft, participants, items) => {
  const warnings = []

  if (draft.splitType === 'by-person') {
    const allocatedTotal = participants.reduce((sum, participant) => sum + participant.usedAmount, 0)

    if (allocatedTotal !== draft.totalAmount) {
      warnings.push(`Tổng tiền theo người là ${allocatedTotal}, chưa khớp tổng hóa đơn ${draft.totalAmount}.`)
    }
  }

  if (draft.splitType === 'by-item') {
    const itemSubtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)

    if (itemSubtotal !== draft.totalAmount) {
      warnings.push(`Tổng các món là ${itemSubtotal}, chênh lệch với tổng hóa đơn ${draft.totalAmount}.`)
    }
  }

  return warnings
}

const processAssistantTurn = async (
  { actorId, messages },
  { client = getGeminiClient(), users = userModel } = {}
) => {
  if (!actorId) {
    throw createAssistantError('AI_INVALID_REQUEST', 'Authenticated actor is required')
  }

  const actor = await users.findOneById(actorId)

  if (!actor || actor._destroy) {
    throw createAssistantError('AI_ACTOR_NOT_FOUND', 'Authenticated user was not found')
  }

  const result = await callGeminiWithRetry(client, {
    messages: sanitizeMessages(messages),
    systemInstruction: createAssistantSystemInstruction(),
    tools: ASSISTANT_TOOLS,
  })

  if (result.type === 'text') {
    return {
      reply: result.text,
      action: null,
    }
  }

  if (result.type !== 'function_call' || result.name !== PREPARE_BILL_DRAFT_TOOL) {
    throw createAssistantError('AI_INVALID_RESPONSE', 'Gemini returned an unsupported tool call')
  }

  let draft

  try {
    draft = await validateBillDraftInput(result.args)
  } catch (error) {
    throw createAssistantError('AI_INVALID_RESPONSE', `Gemini returned invalid bill data: ${error.message}`)
  }

  const queries = [draft.payerQuery, ...draft.participants.map((participant) => participant.query)]

  if (draft.splitType === 'by-item') {
    for (const item of draft.items) {
      queries.push(...item.allocatedToQueries)
    }
  }

  const uniqueQueries = [...new Set(queries.map(normalizeQuery).filter(Boolean))]
  const resolutions = await Promise.all(
    uniqueQueries.map((query) => resolveUserQuery({ query, actor, users }))
  )
  const resolutionMap = new Map(resolutions.map((resolution) => [normalizeQuery(resolution.query), resolution]))
  const issues = resolutions.filter((resolution) => resolution.status !== 'resolved')

  if (issues.length > 0) {
    return {
      reply: createClarificationReply(issues),
      action: null,
    }
  }

  const resolvedUser = (query) => resolutionMap.get(normalizeQuery(query)).user
  const participantMap = new Map()

  for (const participant of draft.participants) {
    const user = resolvedUser(participant.query)
    const id = user._id.toString()
    const existingParticipant = participantMap.get(id)

    participantMap.set(id, {
      id,
      name: user.name,
      email: user.email,
      usedAmount: Math.max(existingParticipant?.usedAmount || 0, participant.usedAmount || 0),
    })
  }

  const payerUser = resolvedUser(draft.payerQuery)
  const payerId = payerUser._id.toString()

  if (!participantMap.has(payerId)) {
    participantMap.set(payerId, {
      id: payerId,
      name: payerUser.name,
      email: payerUser.email,
      usedAmount: 0,
    })
  }

  const participants = [...participantMap.values()]
  const items =
    draft.splitType === 'by-item'
      ? draft.items.map((item) => ({
          id: randomUUID(),
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          allocatedTo: [
            ...new Set(item.allocatedToQueries.map((query) => resolvedUser(query)._id.toString())),
          ],
        }))
      : []
  const warnings = createWarnings(draft, participants, items)

  return {
    reply: 'Mình đã chuẩn bị bản nháp hóa đơn. Bạn hãy kiểm tra lại trước khi lưu nhé.',
    action: {
      type: 'OPEN_BILL_DRAFT',
      payload: {
        billName: draft.billName,
        category: draft.category,
        notes: draft.notes,
        creationDate: new Date().toISOString(),
        paymentDeadline: draft.paymentDeadline,
        payer: payerId,
        splitType: draft.splitType,
        totalAmount: draft.totalAmount,
        participants,
        items,
      },
      warnings,
    },
  }
}

export { processAssistantTurn }
