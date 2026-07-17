import 'dotenv/config'
import { GeminiClient } from '~/providers/GeminiProvider.js'
import { prepareBillDraftTool } from '~/utils/assistantTools.js'
import { validateBillDraftInput } from '~/schemas/billDraftSchema.js'

const run = async () => {
  const client = new GeminiClient()

  const content = [
    'Tạo hóa đơn ăn tối 450000 đồng.',
    'Chia đều cho tôi, An và Bình.',
    'Tôi đã trả.',
    'Hạn thanh toán là 2026-07-25T16:59:59.999Z.',
  ].join(' ')

  const result = await client.createAssistantTurn({
    systemInstruction: [
      'Bạn là TingTing, trợ lý tạo bản nháp hóa đơn.',
      'Luôn trả lời bằng tiếng Việt.',
      'Khi đã có đủ thông tin, bắt buộc gọi prepare_bill_draft.',
      'Không được nói rằng hóa đơn đã được lưu.',
    ].join('\n'),

    messages: [
      {
        role: 'user',
        content,
      },
    ],

    tools: [prepareBillDraftTool],
  })

  if (result.type !== 'function_call') {
    throw new Error('Expected Gemini to return a function call')
  }

  if (result.name !== 'prepare_bill_draft') {
    throw new Error(`Unexpected function call: ${result.name}`)
  }

  const validatedArgs = await validateBillDraftInput(result.args)

  console.dir(
    {
      ...result,
      args: validatedArgs,
    },
    {
      depth: null,
      colors: true,
    }
  )
}

run().catch((error) => {
  console.error({
    code: error.code,
    message: error.message,
  })

  process.exitCode = 1
})
