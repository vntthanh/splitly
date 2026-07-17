import { randomUUID } from 'crypto'
import { StatusCodes } from 'http-status-codes'
import ApiError from '~/utils/APIError.js'
import { ClovaXClient } from '~/providers/ClovaStudioProvider.js'
import { processAssistantTurn } from '~/services/assistantService.js'
import { getDataForAnalysis } from '~/utils/assistantHelpers'

const ASSISTANT_ERROR_RESPONSES = {
  AI_INVALID_REQUEST: {
    statusCode: StatusCodes.UNPROCESSABLE_ENTITY,
    message: 'Nội dung trò chuyện không hợp lệ.',
  },
  AI_ACTOR_NOT_FOUND: {
    statusCode: StatusCodes.NOT_FOUND,
    message: 'Không tìm thấy tài khoản đang đăng nhập.',
  },
  AI_INVALID_RESPONSE: {
    statusCode: StatusCodes.BAD_GATEWAY,
    message: 'TingTing trả về dữ liệu không hợp lệ. Vui lòng thử lại.',
  },
  AI_RATE_LIMITED: {
    statusCode: StatusCodes.TOO_MANY_REQUESTS,
    message: 'TingTing đang nhận quá nhiều yêu cầu. Vui lòng thử lại sau.',
  },
  AI_TIMEOUT: {
    statusCode: StatusCodes.GATEWAY_TIMEOUT,
    message: 'TingTing phản hồi quá lâu. Vui lòng thử lại.',
  },
  AI_PERMISSION_DENIED: {
    statusCode: StatusCodes.SERVICE_UNAVAILABLE,
    message: 'TingTing hiện chưa được cấu hình để xử lý yêu cầu.',
  },
  AI_CONFIGURATION_ERROR: {
    statusCode: StatusCodes.SERVICE_UNAVAILABLE,
    message: 'TingTing hiện chưa được cấu hình để xử lý yêu cầu.',
  },
  AI_UNAVAILABLE: {
    statusCode: StatusCodes.SERVICE_UNAVAILABLE,
    message: 'TingTing đang tạm thời không khả dụng. Vui lòng thử lại sau.',
  },
}

const processAIRequest = async (req, res, next) => {
  const requestId = randomUUID()
  res.set('X-Request-ID', requestId)

  try {
    const result = await processAssistantTurn({
      actorId: req.jwtDecoded._id,
      messages: req.body.messages,
    })

    res.status(StatusCodes.OK).json({
      data: result,
      meta: { requestId },
    })
  } catch (error) {
    const response = ASSISTANT_ERROR_RESPONSES[error.code] || {
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      message: 'Không thể xử lý yêu cầu với TingTing.',
    }

    console.error('Assistant request failed', {
      requestId,
      code: error.code || 'UNKNOWN_ERROR',
      statusCode: response.statusCode,
    })

    next(new ApiError(response.statusCode, response.message))
  }
}

// const processAIRequest = async (req, res, next) => {
//     try {
//         let { userId, messages } = req.body;
//         const userIdObj = new ObjectId(userId);
//         const user = await userModel.findOneById(userIdObj);
//         let navigation = null;
        
//         if (!user) {
//             const errorMessage = `User with ID ${userId} not found.`;
//             const customError = new ApiError(StatusCodes.NOT_FOUND, errorMessage);
//             return next(customError);
//         }
        
//         const userData = {
//             _id: user._id,
//             name: user.name,
//             email: user.email
//         }

//         const client = new ClovaXClient();

//         // BƯỚC 1: PHÂN LOẠI YÊU CẦU
//         if (messages.length === 0 || messages[0].role !== "system") {
//             messages.unshift({
//                 role: "system",
//                 content: "You are TingTing, a helpful assistant for managing shared expense bills. Whenever you receive any message from the user, you must use the categorize_request tool to categorize the user's request before performing any further actions.",
//             });
//         }

//         console.log("BƯỚC 1: Phân loại yêu cầu");
//         const categorizeRequest = client.createRequest(messages, [categorizeRequestTool]);
//         const categorizeResponse = await client.createChatCompletion(categorizeRequest);
//         const categorizeMessage = categorizeResponse.result.message;
        
//         console.log("Categorize Response:", JSON.stringify(categorizeResponse, null, 2));

//         if (
//             categorizeResponse.result.finishReason !== "tool_calls" ||
//             !categorizeMessage.toolCalls ||
//             categorizeMessage.toolCalls.length === 0
//         ) {
//             throw new Error("Failed to categorize request");
//         }

//         const categorizeToolCall = categorizeMessage.toolCalls[0];
//         const args = categorizeToolCall.function.arguments;
//         const newPrompt = getNewPrompt(args);
        
//         if (!newPrompt) {
//             throw new Error(`Undefined request type - ${args.requestType}`);
//         }

//         // BƯỚC 2: XỬ LÝ YÊU CẦU
//         console.log("BƯỚC 2: Xử lý yêu cầu");
        
//         // Tạo messages mới với system prompt mới và chỉ giữ lại messages có role là user
//         const processMessages = [
//             {
//                 role: "system",
//                 content: newPrompt,
//             },
//             ...messages.filter(msg => msg.role === "user")
//         ];
        
//         const processRequest = client.createRequest(processMessages, allTools);
//         const processResponse = await client.createChatCompletion(processRequest);
//         const processMessage = processResponse.result.message;

//         console.log("Process Response:", JSON.stringify(processResponse, null, 2));

//         // Xử lý tool calls nếu có
//         if (
//             processResponse.result.finishReason === "tool_calls" &&
//             processMessage.toolCalls &&
//             processMessage.toolCalls.length > 0
//         ) {
//             processMessages.push({
//                 role: "assistant",
//                 content: processMessage.content,
//                 toolCalls: processMessage.toolCalls
//             });

//             for (const toolCall of processMessage.toolCalls) {
//                 const toolArgs = toolCall.function.arguments;
//                 try {
//                     if (toolCall.function.name === "create_new_bill") {
//                         navigation = navigateBillCreateForm(toolArgs);
//                         processMessages.push({
//                             role: "tool",
//                             content: `Successfully filled in the bill information:\n ${JSON.stringify(toolArgs, null, 2)}`,
//                             toolCallId: toolCall.id,
//                         });
//                     } else if (toolCall.function.name === "search_participants_by_key") {
//                         const users = await userModel.findManyByKeys(toolArgs.keys);
//                         processMessages.push({
//                             role: "tool",
//                             content: `User search results:\n ${JSON.stringify(userData, null, 2)}\n ${JSON.stringify(users, null, 2)}`,
//                             toolCallId: toolCall.id,
//                         });
//                     } else if (toolCall.function.name === "analysis_by_assistant") {
//                         const analysisResult = await analysisByAssistant(userId);
//                         console.log("Analysis Result:", analysisResult);
//                         processMessages.push({
//                             role: "tool",
//                             content: `Analysis result:\n ${JSON.stringify(analysisResult, null, 2)}`,
//                             toolCallId: toolCall.id,
//                         });
//                     }
//                 } catch (error) {
//                     const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
//                     console.error("Tool execution error:", error);
//                     processMessages.push({
//                         role: "tool",
//                         content: `Error: ${errorMessage}`,
//                         toolCallId: toolCall.id,
//                     });
//                 }
//             }
//         } else {
//             // Nếu không có tool calls, chỉ thêm message
//             processMessages.push({
//                 role: "assistant",
//                 content: processMessage.content
//             });
//         }

//         // BƯỚC 3: TRẢ LỜI BẰNG TIẾNG VIỆT
//         console.log("BƯỚC 3: Trả lời bằng Tiếng Việt");
        
//         // Tạo request mới để tổng hợp và trả lời bằng tiếng Việt
//         const finalRequest = client.createRequest(processMessages);
//         const finalResponse = await client.createChatCompletion(finalRequest);
//         const finalMessage = finalResponse.result.message;
        
//         const vietnameseMessages = [
//             {
//                 role: 'system',
//                 content: "Bạn là TingTing, trợ lý thân thiện quản lý hóa đơn chia tiền. Xem kết quả sau khi thực hiện yêu cầu của người dùng và nhắn lại cho họ bằng Tiếng Việt, ở định dạng plain text. Lời nhắn phải ngắn gọn, rõ ràng, đầy đủ thông tin và dễ hiểu.",
//             },
//             {
//                 role: 'user',
//                 content: `Đây là kết quả xử lý yêu cầu:\n${finalMessage.content || 'Request processed successfully'}`,
//             },
//         ];

//         const vietnameseRequest = {
//             messages: vietnameseMessages,
//             topP: 0.8,
//             topK: 0,
//             maxTokens: 1000,
//             temperature: 0.5,
//             repetitionPenalty: 1.1,
//             stop: [],
//         };

//         const vietnameseResponse = await client.createChatCompletion(vietnameseRequest);
//         const vietnameseContent = vietnameseResponse?.result?.message?.content || 'Yêu cầu đã được xử lý thành công!';

//         messages.push({
//             role: 'assistant',
//             content: vietnameseContent
//         });

//         res.status(StatusCodes.OK).json({ messages, navigation });
//     } catch (error) {
//         console.error("Error in processAIRequest:", error);
//         const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
//         const customError = new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, errorMessage);
//         next(customError);
//     }
// };

const analysisByAssistant = async (userId) => {
    try {
        const data = await getDataForAnalysis(userId);
        const client = new ClovaXClient();

        const prompts = {
            debtAdvice: {
                prompt: `Bạn là TingTing, trợ lý thân thiện giúp quản lý hóa đơn chia tiền. Hãy đọc dữ liệu về các khoản nợ của người dùng, bao gồm số tiền nợ, hạn thanh toán sắp tới, và các hóa đơn quá hạn. Đưa ra 1-2 lời khuyên ngắn gọn, thiết thực bằng Tiếng Việt để giúp người dùng ưu tiên thanh toán, tránh bị phạt quá hạn, và quản lý nợ hiệu quả. Lời khuyên phải ngắn gọn, rõ ràng và dễ thực hiện.`,
                dataKey: 'debtsIOwe'
            },
            oweAdvice: {
                prompt: `Bạn là TingTing, trợ lý thân thiện giúp quản lý hóa đơn chia tiền. Hãy đọc dữ liệu về những người nợ tiền người dùng, bao gồm hóa đơn quá hạn, số tiền, và số ngày quá hạn. Đưa ra 1-2 lời khuyên ngắn gọn, thiết thực bằng Tiếng Việt để giúp người dùng nhắc nhở lịch sự hoặc thu tiền sớm, ưu tiên các khoản nợ lớn nhất hoặc lâu nhất, và giảm rủi ro không thu được tiền. Lời khuyên phải ngắn gọn, rõ ràng và dễ thực hiện.`,
                dataKey: 'debtsOwedToMe'
            },
            monthlyAdvice: {
                prompt: `Bạn là TingTing, trợ lý thân thiện giúp quản lý hóa đơn chia tiền. Hãy đọc dữ liệu chi tiêu của người dùng trong tháng này, bao gồm danh mục, tổng số tiền, và số lượng hóa đơn. Đưa ra dự đoán ngắn gọn về chi tiêu tháng sau và 1-2 lời khuyên thiết thực bằng Tiếng Việt để giúp người dùng quản lý chi tiêu tốt hơn, tối ưu ngân sách, và tránh chi tiêu quá mức. Lời khuyên phải ngắn gọn, rõ ràng và dễ thực hiện.`,
                dataKey: 'monthlyStats'
            },
            productAdvice: {
                prompt: `Bạn là TingTing, trợ lý thân thiện giúp quản lý hóa đơn chia tiền. Hãy phân tích dữ liệu chi tiêu của người dùng trong tháng này, bao gồm danh mục, tổng số tiền, và số lượng hóa đơn. Xác định những lĩnh vực người dùng đang chi tiêu nhiều nhất và đưa ra 1-2 lời khuyên thiết thực bằng Tiếng Việt để cân bằng chi tiêu, tránh chi tiêu quá mức, và thúc đẩy thói quen tài chính lành mạnh hơn. Lời khuyên phải ngắn gọn, rõ ràng và dễ thực hiện.`,
                dataKey: 'productsThisMonth'
            }
        }
        const results = {};
        for (const [key, prompt] of Object.entries(prompts)) {

            const messages = [
                {
                    role: 'system',
                    content: [
                        {
                            type: 'text',
                            text: prompt.prompt,
                        },
                    ],
                },
                {
                    role: 'user',
                    content: `Here is the data for analysis: ${JSON.stringify(data[prompt.dataKey])}`,
                },
            ];

            const request = {
                messages,
                topP: 0.8,
                topK: 0,
                maxTokens: 1000,
                temperature: 0.5,
                repetitionPenalty: 1.1,
                stop: [],
            };

            const response = await client.createChatCompletion(request);
            const content = response?.result?.message?.content ?? '';
            results[key] = content;
        }

        return results;
    } catch (error) {
        console.error('Error in analysisByAssistant:', error);
        throw error;
    }
};

const getAIAnalysis = async (req, res, next) => {
    try {
        const { userId } = req.params;

        // Security check: Verify that the authenticated user is requesting their own data
        if (req.jwtDecoded._id !== userId) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'You can only access your own analysis data');
        }

        const analysis = await analysisByAssistant(userId);
        res.status(StatusCodes.OK).json(analysis);
    } catch (error) {
        console.error('Error in getAIAnalysis:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        const customError = new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, errorMessage);
        next(customError);
    }
};

export const assistantController = {
    processAIRequest,
    analysisByAssistant: getAIAnalysis
};
