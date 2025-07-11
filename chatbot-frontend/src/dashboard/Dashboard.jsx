import { useEffect, useState, useRef } from "react";
import { Send, MessageCircle, Sparkles } from "lucide-react";
import axios from "axios";

const TypingText = ({ text, isTyping, onComplete }) => {
  const [displayText, setDisplayText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (isTyping && text) {
      setDisplayText("");
      setCurrentIndex(0);

      intervalRef.current = setInterval(() => {
        setCurrentIndex((prevIndex) => {
          const newIndex = prevIndex + 1;
          setDisplayText(text.slice(0, newIndex));

          if (newIndex >= text.length) {
            clearInterval(intervalRef.current);
            if (onComplete) {
              setTimeout(onComplete, 500);
            }
            return newIndex;
          }

          return newIndex;
        });
      }, 30);
    } else {
      setDisplayText(text);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [text, isTyping, onComplete]);

  return (
    <span className="whitespace-pre-line break-words">
      {displayText}
      {isTyping && currentIndex < text.length && (
        <span className="animate-pulse">|</span>
      )}
    </span>
  );
};

const Dashboard = ({
  selectedChat,
  onNewChat,
  sidebarProcessingPrompts,
  sidebarTypingPrompts,
}) => {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [typingMessages, setTypingMessages] = useState(new Set());
  const [dashboardIsBusy, setDashboardIsBusy] = useState(false);

  const isAnyMessageTyping = typingMessages.size > 0;
  const isSidebarProcessing =
    sidebarProcessingPrompts.size > 0 || sidebarTypingPrompts.size > 0;
  const isSystemBusy =
    dashboardIsBusy || isAnyMessageTyping || isSidebarProcessing;

  useEffect(() => {
    if (selectedChat?.conversation_id) {
      setConversationId(selectedChat.conversation_id);

      axios
        .get(
          `http://localhost:3000/chat/conversation/${selectedChat.conversation_id}`
        )
        .then((res) => {
          const fullChat = res.data
            .map((chat) => [
              {
                type: "user",
                content: chat.message,
                timestamp: new Date(chat.created_at),
                id: `user-${chat.id}`,
              },
              {
                type: "bot",
                content: chat.reply,
                timestamp: new Date(chat.created_at),
                id: `bot-${chat.id}`,
                isTyping: false,
              },
            ])
            .flat();

          setChatHistory(fullChat);
        })
        .catch((err) => console.error("Error loading chat history:", err));
    } else {
      setConversationId(null);
      setChatHistory([]);
    }
  }, [selectedChat?.conversation_id]);

  const handleTypingComplete = (messageId) => {
    setTypingMessages((prev) => {
      const newSet = new Set(prev);
      newSet.delete(messageId);
      return newSet;
    });

    setChatHistory((prev) =>
      prev.map((msg) =>
        msg.id === messageId ? { ...msg, isTyping: false } : msg
      )
    );
  };

  const handleSend = async () => {
    if (!message.trim()) return;

    if (isSystemBusy) {
      return;
    }

    setDashboardIsBusy(true);

    const userMessage = {
      type: "user",
      content: message,
      timestamp: new Date(),
      id: `user-${Date.now()}`,
    };

    const currentMessage = message;
    setMessage("");

    setChatHistory((prev) => [...prev, userMessage]);

    setLoading(true);

    try {
      const res = await axios.post("http://localhost:3000/chat", {
        message: currentMessage,
        conversation_id: conversationId,
      });

      if (!conversationId && res.data.conversation_id) {
        setConversationId(res.data.conversation_id);
      }

      const botMessageId = `bot-${Date.now()}`;

      setTypingMessages((prev) => new Set(prev).add(botMessageId));

      const botMessage = {
        type: "bot",
        content: res.data.reply,
        timestamp: new Date(),
        id: botMessageId,
        isTyping: true,
      };

      setChatHistory((prev) => [...prev, botMessage]);

      if (!conversationId && res.data.conversation_id && onNewChat) {
        onNewChat({
          message: currentMessage,
          reply: res.data.reply,
          created_at: new Date(),
          conversation_id: res.data.conversation_id,
        });
      }
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage = {
        type: "bot",
        content: "Something went wrong!",
        timestamp: new Date(),
        id: `error-${Date.now()}`,
        isTyping: false,
      };
      setChatHistory((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);

      setDashboardIsBusy(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getStatusMessage = () => {
    if (isSidebarProcessing) {
      return "System is processing other requests...";
    }
    if (isAnyMessageTyping) {
      return "Please wait while I'm typing...";
    }
    if (dashboardIsBusy) {
      return "Processing your request...";
    }
    return "Press Enter to send • Shift+Enter for new line";
  };

  const getPlaceholder = () => {
    if (isSidebarProcessing) {
      return "System is processing other requests...";
    }
    if (isAnyMessageTyping) {
      return "Please wait while I'm typing...";
    }
    if (dashboardIsBusy) {
      return "Processing your request...";
    }
    return "Type your message here...";
  };

  return (
    <div className="flex-1 bg-gray-50 h-screen flex flex-col overflow-hidden">
      <div className="bg-white border-b border-gray-200 px-8 py-6 flex-shrink-0">
        <div className="flex items-center space-x-3">
          <div className="relative w-9 h-11 bg-gradient-to-b from-gray-800 rounded-lg flex items-center justify-center border border-gray-600 shadow-lg">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-white rounded-full opacity-0 animate-pulse"></div>
            </div>

            <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-5 h-1 bg-gray-900 rounded-t border border-gray-600"></div>

            <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-2.5 h-0.5 border border-gray-600 rounded-full border-b-0"></div>

            <div className="absolute inset-1 border border-gray-600 rounded-md opacity-40"></div>

            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-0.5 h-7 bg-gray-600 opacity-50"></div>
            </div>
            <div className="absolute left-2 top-1.5 w-0.5 h-7 bg-gray-600 opacity-30"></div>
            <div className="absolute right-2 top-1.5 w-0.5 h-7 bg-gray-600 opacity-30"></div>

            <Sparkles className="w-4 h-4 text-white relative z-10 drop-shadow-lg" />

            <div className="absolute -bottom-0.5 left-1/2 transform -translate-x-1/2 w-6 h-1 bg-gray-900 rounded-b border border-gray-600"></div>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Lantern</h1>
            <p className="text-sm text-gray-500">
              like a light in the dark for your thoughts
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full p-6 overflow-hidden">
        <div className="flex-1 overflow-y-auto space-y-6 mb-6 pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-400">
          {chatHistory.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Start a conversation
              </h3>
              <p className="text-gray-500 max-w-md mx-auto">
                Ask me anything and I'll provide helpful, professional responses
                to assist you.
              </p>
            </div>
          ) : (
            chatHistory.map((msg, index) => (
              <div
                key={msg.id || index}
                className={`flex ${
                  msg.type === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`flex items-start space-x-3 max-w-2xl ${
                    msg.type === "user"
                      ? "flex-row-reverse space-x-reverse"
                      : ""
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      msg.type === "user"
                        ? "bg-black"
                        : "bg-white border-2 border-gray-200"
                    }`}
                  >
                    {msg.type === "user" ? (
                      <div className="w-4 h-4 bg-white rounded-full"></div>
                    ) : (
                      <Sparkles className="w-4 h-4 text-gray-600" />
                    )}
                  </div>

                  <div
                    className={`px-4 py-3 rounded-2xl shadow-sm ${
                      msg.type === "user"
                        ? "bg-black text-white rounded-br-sm"
                        : "bg-white text-gray-900 border border-gray-200 rounded-bl-sm"
                    }`}
                  >
                    <p className="text-sm leading-relaxed">
                      {msg.type === "bot" && msg.isTyping === true ? (
                        <TypingText
                          text={msg.content}
                          isTyping={true}
                          onComplete={() => handleTypingComplete(msg.id)}
                        />
                      ) : (
                        <span className="whitespace-pre-line break-words">
                          {msg.content}
                        </span>
                      )}
                    </p>
                    <p
                      className={`text-xs mt-2 ${
                        msg.type === "user" ? "text-gray-300" : "text-gray-500"
                      }`}
                    >
                      {msg.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}

          {loading && (
            <div className="flex justify-start">
              <div className="flex items-start space-x-3 max-w-2xl">
                <div className="w-8 h-8 bg-white border-2 border-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-4 h-4 text-gray-600" />
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 flex-shrink-0">
          <div className="flex items-end space-x-3">
            <div className="flex-1 relative">
              <textarea
                rows="1"
                className={`w-full resize-none border-0 bg-transparent focus:outline-none placeholder-gray-500 text-gray-900 text-sm leading-relaxed ${
                  isSystemBusy ? "opacity-50" : ""
                }`}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={getPlaceholder()}
                style={{ minHeight: "24px", maxHeight: "120px" }}
                disabled={isSystemBusy}
              />
            </div>
            <button
              onClick={handleSend}
              disabled={loading || !message.trim() || isSystemBusy}
              className="p-2.5 bg-black hover:bg-gray-800 disabled:bg-gray-300 text-white rounded-xl transition-colors disabled:cursor-not-allowed flex-shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">{getStatusMessage()}</p>
            <div className="flex items-center space-x-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  isSystemBusy ? "bg-yellow-500" : "bg-green-500"
                }`}
              ></div>
              <span className="text-xs text-gray-500">
                {isSystemBusy ? "Busy..." : "Ready"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
