const prepareBillDraftTool = {
  name: 'prepare_bill_draft',

  description:
    'Chuẩn bị bản nháp hóa đơn để người dùng kiểm tra và chỉnh sửa. ' + 'Tool này không lưu hóa đơn vào cơ sở dữ liệu.',

  parametersJsonSchema: {
    type: 'object',

    properties: {
      billName: {
        type: 'string',
        description: 'Tên ngắn gọn và dễ hiểu của hóa đơn.',
      },

      category: {
        type: 'string',
        enum: ['food', 'entertainment', 'transportation', 'shopping', 'utilities', 'other'],
        description: 'Danh mục của hóa đơn.',
      },

      notes: {
        type: 'string',
        description: 'Ghi chú bổ sung. Trả chuỗi rỗng nếu người dùng không cung cấp.',
      },

      paymentDeadline: {
        type: 'string',
        format: 'date-time',
        description: 'Hạn thanh toán theo ISO 8601. Không tự bịa nếu người dùng chưa cung cấp.',
      },

      payerQuery: {
        type: 'string',
        description:
          'Tên hoặc email của người đã ứng tiền. Dùng "current_user" nếu người dùng nói tôi hoặc mình đã trả.',
      },

      splitType: {
        type: 'string',
        enum: ['equal', 'by-person', 'by-item'],
        description: 'Cách chia hóa đơn: chia đều, theo từng người hoặc theo từng món.',
      },

      totalAmount: {
        type: 'integer',
        minimum: 1,
        description: 'Tổng tiền hóa đơn bằng VND, không có dấu phân cách hàng nghìn.',
      },

      participants: {
        type: 'array',
        minItems: 1,

        items: {
          type: 'object',

          properties: {
            query: {
              type: 'string',
              description:
                'Tên hoặc email dùng để backend tìm người tham gia. Dùng "current_user" cho người đang đăng nhập.',
            },

            usedAmount: {
              type: 'integer',
              minimum: 0,
              description: 'Số tiền của người này khi chia theo từng người. Dùng 0 cho cách chia khác.',
            },
          },

          required: ['query', 'usedAmount'],
        },
      },

      items: {
        type: 'array',
        description: 'Danh sách món hàng. Phải là mảng rỗng nếu splitType không phải by-item.',

        items: {
          type: 'object',

          properties: {
            name: {
              type: 'string',
              description: 'Tên món hàng hoặc dịch vụ.',
            },

            quantity: {
              type: 'integer',
              minimum: 1,
              description: 'Số lượng.',
            },

            unitPrice: {
              type: 'integer',
              minimum: 0,
              description: 'Đơn giá bằng VND.',
            },

            allocatedToQueries: {
              type: 'array',
              minItems: 1,

              items: {
                type: 'string',
              },

              description: 'Tên hoặc email của những người được phân bổ món này.',
            },
          },

          required: ['name', 'quantity', 'unitPrice', 'allocatedToQueries'],
        },
      },
    },

    required: [
      'billName',
      'category',
      'notes',
      'paymentDeadline',
      'payerQuery',
      'splitType',
      'totalAmount',
      'participants',
      'items',
    ],
  },
}

const ASSISTANT_TOOLS = [prepareBillDraftTool]

export { ASSISTANT_TOOLS, prepareBillDraftTool }
