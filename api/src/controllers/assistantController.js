import { StatusCodes } from "http-status-codes";
import ApiError from "~/utils/APIError.js";
import { ObjectId } from 'mongodb'
import { userModel } from '~/models/index.js'
import { ClovaXClient } from "~/providers/ClovaStudioProvider.js";
import { GeminiClient } from '~/providers/GeminiProvider.js'
import { allTools, categorizeRequestTool } from "~/utils/tools.js";
import { navigateBillCreateForm, getNewPrompt, getDataForAnalysis } from "~/utils/assistantHelpers";

const processAIRequest = async (req, res, next) => {
    try {
        const { userId, messages } = req.body;
        const userIdObj = new ObjectId(userId);
        const user = await userModel.findOneById(userIdObj);
        let navigation = null;

        if (!user) {
            const errorMessage = `User with ID ${userId} not found.`;
            const customError = new ApiError(StatusCodes.NOT_FOUND, errorMessage);
            return next(customError);
        }

        const client = new ClovaXClient();

        if (messages.length === 0 || messages[0].role !== "system") {
            messages.unshift({
                role: "system",
                content: "You are TingTing, a helpful assistant for managing shared expense bills. When the user asks you to create a new bill without providing enough information, request that the user supply all required bill details: bill name, payment deadline, bill-splitting method (split evenly, split by person, split by item), names or emails of the participants, and the total amount of the bill. When the user asks you to create a new bill with complete information, use the tool search_participants_by_key to find user information based on the provided names or emails, and use the tool create_new_bill to create the bill from the information the user provided. Provide concise results for the bills you create. When user ask what you can do, you can help users create new bills through messages or by scanning receipts, inform users and remind them about the payment status of their bills and their friends' bills. Always maintain a positive, friendly, and sociable attitude. All of your responses must always be in Vietnamese plain text.",
            });
        }

        console.log("ClovaX Request Messages:", JSON.stringify(messages, null, 2));

        const request = client.createRequest(messages, allTools);
        const response = await client.createChatCompletion(request);
        const assistantMessage = response.result.message;

        console.log("ClovaX Response:", JSON.stringify(response, null, 2));

        if (
            response.result.finishReason === "tool_calls" &&
            assistantMessage.toolCalls &&
            assistantMessage.toolCalls.length > 0
        ) {
            console.log("Tool calls detected:", JSON.stringify(assistantMessage.toolCalls, null, 2));

            // Execute all tool calls
            for (const toolCall of assistantMessage.toolCalls) {
                const args = toolCall.function.arguments;
                try {
                    if (toolCall.function.name === "create_new_bill") {
                        navigation = navigateBillCreateForm(args)
                        messages.push({
                            role: "tool",
                            content: `Điền thông tin vào hóa đơn thành công:\n ${JSON.stringify(args, null, 2)}`,
                            toolCallId: toolCall.id,
                        });
                    } else if (toolCall.function.name === "search_participants_by_key") {
                        const users = await userModel.findManyByKeys(toolArgs.keys);
                        processMessages.push({
                            role: "tool",
                            content: `User search results:\n ${JSON.stringify(userData, null, 2)}\n ${JSON.stringify(users, null, 2)}`,
                            toolCallId: toolCall.id,
                        });
                    } 
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
                    console.error("Error: ", error);
                    messages.push({
                        role: "tool",
                        content: `Error: ${errorMessage}`,
                        toolCallId: toolCall.id,
                    });
                }
            }
        }

        const finalRequest = {
            ...client.createRequest(messages),
            maxTokens: 1000,
        };
        const finalResponse = await client.createChatCompletion(finalRequest);
        messages.push(finalResponse.result.message);

        res.status(StatusCodes.OK).json({ messages, navigation: navigation });
    } catch (error) {
        const errorMessage = new Error(error).message;
        const customError = new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, errorMessage);
        next(customError);
    }
};

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
        const client = new GeminiClient();
        return await client.analyzeSpending(data);
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
