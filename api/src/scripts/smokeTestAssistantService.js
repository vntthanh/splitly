import assert from 'assert/strict'
import { ObjectId } from 'mongodb'
import { processAssistantTurn } from '~/services/assistantService.js'

const actor = {
  _id: new ObjectId(),
  name: 'Current User',
  email: 'current@example.com',
  _destroy: false,
}

const an = {
  _id: new ObjectId(),
  name: 'An',
  email: 'an@example.com',
  _destroy: false,
}

const binh = {
  _id: new ObjectId(),
  name: 'Bình',
  email: 'binh@example.com',
  _destroy: false,
}

const duplicateAn = {
  _id: new ObjectId(),
  name: 'An',
  email: 'another.an@example.com',
  _destroy: false,
}

const createToolResult = () => ({
  type: 'function_call',
  name: 'prepare_bill_draft',
  args: {
    billName: 'Ăn tối',
    category: 'food',
    notes: '',
    paymentDeadline: '2026-07-25T16:59:59.999Z',
    payerQuery: 'current_user',
    splitType: 'equal',
    totalAmount: 450000,
    participants: [
      { query: 'current_user', usedAmount: 0 },
      { query: 'An', usedAmount: 0 },
      { query: 'Bình', usedAmount: 0 },
    ],
    // The service must discard this because the split type is equal.
    items: [
      {
        name: 'Ăn tối',
        quantity: 1,
        unitPrice: 450000,
        allocatedToQueries: ['current_user', 'An', 'Bình'],
      },
    ],
  },
})

const client = {
  createAssistantTurn: async () => createToolResult(),
}

const createUsers = ({ hasDuplicateAn = false } = {}) => ({
  findOneById: async () => actor,
  findCandidatesByKey: async (query) => {
    const normalizedQuery = query.toLocaleLowerCase('vi-VN')

    if (normalizedQuery === 'an') return hasDuplicateAn ? [an, duplicateAn] : [an]
    if (normalizedQuery === 'bình') return [binh]
    return []
  },
})

const run = async () => {
  const successResult = await processAssistantTurn(
    {
      actorId: actor._id.toString(),
      messages: [{ role: 'user', content: 'Tạo hóa đơn ăn tối.' }],
    },
    { client, users: createUsers() }
  )

  assert.equal(successResult.action.type, 'OPEN_BILL_DRAFT')
  assert.equal(successResult.action.payload.participants.length, 3)
  assert.equal(successResult.action.payload.items.length, 0)
  assert.equal(successResult.action.payload.payer, actor._id.toString())

  const ambiguousResult = await processAssistantTurn(
    {
      actorId: actor._id.toString(),
      messages: [{ role: 'user', content: 'Tạo hóa đơn với An.' }],
    },
    { client, users: createUsers({ hasDuplicateAn: true }) }
  )

  assert.equal(ambiguousResult.action, null)
  assert.match(ambiguousResult.reply, /nhiều người khớp với “an”/i)
  assert.doesNotMatch(ambiguousResult.reply, /another\.an@example\.com/)

  console.log('Assistant service smoke test passed')
}

run().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
