import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux'
import { selectCurrentUser } from '~/redux/user/userSlice'
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import CreateIcon from '@mui/icons-material/Create';
import ExploreIcon from '@mui/icons-material/Explore';
import TingTingGif from '~/assets/tingting.gif';
import TingTingPng from '~/assets/tingting.png';
import { toast } from 'react-toastify'
import { getAssistantResponseAPI } from '~/apis';
import { getInitials } from '~/utils/formatters';
import { useNavigate } from 'react-router-dom'

// Quick Replies Configuration
const QUICK_REPLIES = [
  {
    id: 'create-bill',
    message: 'Tạo hóa đơn nhanh cho tôi',
    title: 'Tạo hóa đơn nhanh',
    subtitle: 'Bằng cách nhắn với TingTing',
    icon: CreateIcon,
    borderColor: '#EF9A9A',
    hoverBorderColor: '#E57373',
    hoverBgColor: '#EF9A9A',
    iconColor: '#EF9A9A'
  },
  // {
  //   id: 'warnings',
  //   message: 'Tình hình hóa đơn của tôi thế nào?',
  //   title: 'Điều bạn nên biết',
  //   subtitle: 'Về tình hình hóa đơn của bạn',
  //   icon: WarningIcon,
  //   borderColor: '#F48FB1',
  //   hoverBorderColor: '#F06292',
  //   hoverBgColor: '#F48FB1',
  //   iconColor: '#F48FB1'
  // },
  // {
  //   id: 'payment-suggestion',
  //   message: 'Hôm nay ai nên ứng tiền?',
  //   title: 'Hôm nay ai trả?',
  //   subtitle: 'Gợi ý xem hôm nay ai nên ứng tiền',
  //   icon: LightbulbIcon,
  //   borderColor: '#CE93D8',
  //   hoverBorderColor: '#BA68C8',
  //   hoverBgColor: '#CE93D8',
  //   iconColor: '#CE93D8'
  // },
  {
    id: 'explore',
    message: 'TingTing có thể làm được gì?',
    title: 'Khám phá TingTing',
    subtitle: 'Hiểu thêm về TingTing',
    icon: ExploreIcon,
    borderColor: '#B39DDB',
    hoverBorderColor: '#9575CD',
    hoverBgColor: '#B39DDB',
    iconColor: '#B39DDB'
  }
];

// Suggestion Buttons Configuration
const SUGGESTIONS = [
  {
    id: 'create-bill-quick',
    message: 'Tạo hóa đơn nhanh cho tôi',
    label: 'Tạo hóa đơn nhanh',
    icon: CreateIcon,
    gradient: { from: '#EF9A9A', to: '#CE93D8' }
  },
  // {
  //   id: 'warnings-quick',
  //   message: 'Tình hình hóa đơn của tôi thế nào?',
  //   label: 'Điều bạn nên biết',
  //   icon: WarningIcon,
  //   gradient: { from: '#F48FB1', to: '#E1BEE7' }
  // },
  // {
  //   id: 'payment-quick',
  //   message: 'Hôm nay ai nên ứng tiền?',
  //   label: 'Hôm nay ai trả?',
  //   icon: LightbulbIcon,
  //   gradient: { from: '#CE93D8', to: '#B39DDB' }
  // },
  {
    id: 'explore-quick',
    message: 'TingTing có thể làm được gì?',
    label: 'Khám phá TingTing',
    icon: ExploreIcon,
    gradient: { from: '#B39DDB', to: '#9FA8DA' }
  }
];

const createChatMessage = (role, content) => ({
  id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  content,
  role,
  time:
    new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) +
    ' ' +
    new Date().toLocaleDateString('vi-VN'),
})

const ChatbotWindow = ({ setIsOpen }) => {
  const navigate = useNavigate()
  const currentUser = useSelector(selectCurrentUser)
  const [messages, setMessages] = useState(() => {
    const saved = sessionStorage.getItem('chatMessages');
    return saved ? JSON.parse(saved) : [];
  });
  const [inputMessage, setInputMessage] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    sessionStorage.setItem('chatMessages', JSON.stringify(messages));
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleClearMessages = () => {
    setMessages([]);
    sessionStorage.removeItem('chatMessages');
    toast.success('Đã xóa toàn bộ tin nhắn');
  };

  const sendMessage = async (content) => {
    if (isThinking) return;

    const userMessage = createChatMessage('user', content)
    const nextMessages = [...messages, userMessage]

    setMessages(nextMessages);
    setIsThinking(true);

    try {
      const { reply, action } = await getAssistantResponseAPI(nextMessages)
      const assistantMessage = createChatMessage('assistant', reply)

      setMessages([...nextMessages, assistantMessage])

      if (action?.type === 'OPEN_BILL_DRAFT') {
        navigate('/create', {
          state: {
            chatbotWindowOpen: true,
            billFormData: action.payload,
            billDraftWarnings: action.warnings || [],
          },
        })
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Không thể kết nối với TingTing.'
      console.error('Assistant request failed:', errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsThinking(false);
    }
  };

  const handleQuickReply = async (message) => {
    await sendMessage(message)
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (inputMessage.trim() === '' || isThinking) return;

    const content = inputMessage.trim()

    setInputMessage('');
    await sendMessage(content)
  };

  return (
    <div className="w-full h-full flex flex-col p-2">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#EF9A9A] to-[#CE93D8] p-4 rounded-t-xl flex justify-between items-center">
        <h3 className="text-lg font-semibold text-white m-0">TingTing</h3>
        <button
          className="bg-transparent border-none text-white text-2xl cursor-pointer w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/30 transition-colors"
          onClick={handleClose}
        >
          <CloseIcon />
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 bg-gradient-to-r from-[#EF9A9A] to-[#CE93D8] px-1 pb-1 rounded-b-2xl flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto pt-4 px-4 pb-4 bg-[#FEEBEE]">
          <div className="min-h-full flex flex-col justify-end gap-3">
            {/* Welcome message when no messages */}
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center flex-1 py-8">
                <div className="w-24 h-24 rounded-full bg-[#E89AC7] flex items-center justify-center mb-4">
                  <img
                    src={TingTingGif}
                    alt="TingTing"
                    className="w-22 h-22 object-contain"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
                <h2 className="text-xl font-bold text-gray-800 m-0 mb-1">TingTing</h2>
                <p className="text-sm text-gray-600 m-0 mb-2">Trợ lý tài chính của bạn</p>
                <p className="text-xs text-gray-500 text-center px-4 mb-6">
                  Hãy bắt đầu cuộc trò chuyện với TingTing!
                </p>

                {/* Quick Replies */}
                <div className="w-full px-4 flex flex-col gap-2 items-center">
                  {QUICK_REPLIES.map((reply) => {
                    const IconComponent = reply.icon;
                    return (
                      <button
                        key={reply.id}
                        onClick={() => handleQuickReply(reply.message)}
                        disabled={isThinking}
                        className="group relative overflow-hidden bg-transparent border-2 text-gray-800 rounded-xl px-4 py-3 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md active:scale-98 w-full max-w-xs"
                        style={{
                          borderColor: reply.borderColor,
                          '--hover-border': reply.hoverBorderColor,
                          '--hover-bg': reply.hoverBgColor
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = reply.hoverBorderColor;
                          e.currentTarget.style.backgroundColor = `${reply.hoverBgColor}0D`; // 5% opacity
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = reply.borderColor;
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <IconComponent sx={{ fontSize: 24, color: reply.iconColor }} />
                          <div className="flex-1 text-left">
                            <div className="text-sm font-semibold">{reply.title}</div>
                            <div className="text-xs text-gray-500">{reply.subtitle}</div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}



            {/* Messages List */}
            {messages.filter((message) => {
              return message.role === 'user' || message.role === 'assistant' || message.role === 'notification'
            }).map((message) => (
              <div
                key={message.id}
                className={`flex gap-2 items-end animate-fadeIn ${message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
              >
                {/* Assistant avatar - left side */}
                {(message.role === 'assistant' || message.role === 'notification') && (
                  <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center flex-shrink-0 mb-1">
                    <img
                      src={TingTingPng}
                      alt="TingTing"
                      className="w-6 h-6 object-contain"
                    />
                  </div>
                )}

                {/* Message bubble */}
                <div className={`flex flex-col max-w-[75%] ${message.role === 'user' ? 'items-end' : 'items-start'
                  }`}>
                  <div
                    className={`px-4 py-2 rounded-2xl ${message.role === 'user'
                      ? 'bg-gradient-to-r from-[#EF9A9A] to-[#CE93D8] text-white rounded-br-md'
                      : 'bg-white text-gray-800 rounded-bl-md shadow-sm'
                      }`}
                  >
                    <div className="text-sm leading-relaxed break-words whitespace-pre-wrap">
                      {message.content}
                    </div>
                  </div>
                  <span className="text-xs text-gray-500 mt-1 px-2">
                    {message.time}
                  </span>
                </div>

                {/* User avatar - right side */}
                {message.role === 'user' && (
                  <div className="w-7 h-7 rounded-full bg-gradient-to-r from-[#EF9A9A] to-[#CE93D8] flex items-center justify-center flex-shrink-0 mb-1">
                    <span className="text-xs font-semibold text-white">{getInitials(currentUser?.name || '')}</span>
                  </div>
                )}
              </div>
            ))}

            {/* Thinking indicator */}
            {isThinking && (
              <div className="flex gap-2 items-end animate-fadeIn justify-start">
                <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center flex-shrink-0 mb-1">
                  <img
                    src={TingTingPng}
                    alt="TingTing"
                    className="w-6 h-6 object-contain"
                  />
                </div>
                <div className="flex flex-col items-start">
                  <div className="px-4 py-3 rounded-2xl bg-white text-gray-800 rounded-bl-md shadow-sm">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Suggestion Buttons - Above Input */}
        <div className="px-3 py-2 bg-[#FEEBEE] flex gap-2 flex-wrap">
          {messages.length > 0 && (
            <>
              {/* Delete All Button */}
              <button
                onClick={handleClearMessages}
                disabled={isThinking}
                className="px-3 py-2 bg-white hover:bg-red-50 text-red-600 text-xs rounded-full border border-red-200 cursor-pointer flex items-center gap-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                <DeleteSweepIcon sx={{ fontSize: 16 }} />
                <span>Xóa tất cả tin nhắn</span>
              </button>

              {/* Suggestion Buttons */}
              {SUGGESTIONS.map((suggestion) => {
                const IconComponent = suggestion.icon;
                return (
                  <button
                    key={suggestion.id}
                    onClick={() => handleQuickReply(suggestion.message)}
                    disabled={isThinking}
                    className="suggestion-btn px-3 py-2 bg-white text-gray-700 text-xs rounded-full border border-[#D591A6]/30 cursor-pointer flex items-center gap-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                    style={{
                      '--gradient-from': suggestion.gradient.from,
                      '--gradient-to': suggestion.gradient.to
                    }}
                  >
                    <IconComponent sx={{ fontSize: 16 }} />
                    <span>{suggestion.label}</span>
                  </button>
                );
              })}
            </>
          )}
        </div>

        {/* Input Area */}
        <form className="flex p-2 gap-2 bg-[#FEEBEE] rounded-b-xl" onSubmit={handleSendMessage}>
          <input
            type="text"
            placeholder="Nhắn gì đó cho TingTing..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            disabled={isThinking}
            className="flex-1 px-4 py-3 bg-white/50 border border-[#D591A6]/30 rounded-3xl text-sm outline-none focus:border-[#D591A6] focus:bg-white transition-colors placeholder:text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            type="submit"
            disabled={isThinking || inputMessage.trim() === ''}
            className={`w-10 h-10 rounded-full bg-gradient-to-r from-[#EF9A9A] to-[#CE93D8] border-none text-white text-xl font-bold flex items-center justify-center transition-all shadow-md ${isThinking || inputMessage.trim() === ''
              ? 'opacity-50 cursor-not-allowed'
              : 'cursor-pointer hover:bg-[#FF5A8C] active:scale-95'
              }`}
          >
            <SendIcon />
          </button>
        </form>
      </div>

      {/* Custom animations */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease;
        }

        .duration-400 {
          transition-duration: 400ms;
        }

        .suggestion-btn:hover {
          background: linear-gradient(to right, var(--gradient-from), var(--gradient-to));
          color: white;
        }
      `}</style>
    </div>
  );
};

export default ChatbotWindow;
