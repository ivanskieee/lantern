import { useEffect, useState } from "react";
import { Send, MessageCircle, Sparkles } from "lucide-react";
import axios from "axios";

const Dashboard = ({ selectedChat, onNewChat }) => {
  const [message, setMessage] = useState("");
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [conversationId, setConversationId] = useState(null);

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
              },
              {
                type: "bot",
                content: chat.reply,
                timestamp: new Date(chat.created_at),
              },
            ])
            .flat();

          setChatHistory(fullChat);
        });
    } else {
      setConversationId(null);
      setChatHistory([]);
    }
  }, [selectedChat?.conversation_id]);

  const handleSend = async () => {
    if (!message.trim()) return;

    const userMessage = {
      type: "user",
      content: message,
      timestamp: new Date(),
    };
    setChatHistory((prev) => [...prev, userMessage]);

    setLoading(true);
    try {
      const res = await axios.post("http://localhost:3000/chat", {
        message,
        conversation_id: conversationId,
      });

      if (!conversationId && res.data.conversation_id) {
        setConversationId(res.data.conversation_id);
      }

      const botMessage = {
        type: "bot",
        content: res.data.reply,
        timestamp: new Date(),
      };
      setChatHistory((prev) => [...prev, botMessage]);
      setReply(res.data.reply);

      if (!conversationId && res.data.conversation_id) {
        setConversationId(res.data.conversation_id);

        onNewChat({
          message,
          reply: res.data.reply,
          created_at: new Date(),
          conversation_id: res.data.conversation_id,
        });
      }
      
    } catch (error) {
      setReply("Something went wrong!");
    } finally {
      setLoading(false);
      setMessage("");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex-1 bg-gray-50 min-h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="flex items-center space-x-3">
          <div className="relative w-9 h-11 bg-gradient-to-b from-gray-800 rounded-lg flex items-center justify-center border border-gray-600 shadow-lg">
            {/* Central sparkle behind the icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className="w-1.5 h-1.5 bg-white rounded-full opacity-0"
                style={{
                  animation: "twinkle 3s ease-in-out infinite",
                  animationDelay: "0s",
                }}
              ></div>
            </div>

            {/* Top cap with handle */}
            <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-5 h-1 bg-gray-900 rounded-t border border-gray-600"></div>

            {/* Hanging ring */}
            <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-2.5 h-0.5 border border-gray-600 rounded-full border-b-0"></div>

            {/* Window frame - more lantern-like */}
            <div className="absolute inset-1 border border-gray-600 rounded-md opacity-40"></div>

            {/* Vertical bars */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-0.5 h-7 bg-gray-600 opacity-50"></div>
            </div>
            <div className="absolute left-2 top-1.5 w-0.5 h-7 bg-gray-600 opacity-30"></div>
            <div className="absolute right-2 top-1.5 w-0.5 h-7 bg-gray-600 opacity-30"></div>

            {/* Sparkles icon - with subtle animation */}
            <Sparkles
              className="w-4 h-4 text-white relative z-10 drop-shadow-lg"
              style={{
                animation: "sparkle 3s ease-in-out infinite",
                animationDelay: "0s",
              }}
            />

            {/* Bottom cap */}
            <div className="absolute -bottom-0.5 left-1/2 transform -translate-x-1/2 w-6 h-1 bg-gray-900 rounded-b border border-gray-600"></div>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Lantern</h1>
            <p className="text-sm text-gray-500">
              like a light in the dark for your thoughts
            </p>
          </div>
        </div>

        <style jsx>{`
          @keyframes twinkle {
            0%,
            100% {
              opacity: 0;
              transform: scale(0.8);
            }
            50% {
              opacity: 0.8;
              transform: scale(1.2);
              box-shadow: 0 0 12px rgba(255, 255, 255, 0.6);
            }
          }

          @keyframes sparkle {
            0%,
            100% {
              opacity: 0.8;
              transform: scale(1);
            }
            50% {
              opacity: 1;
              transform: scale(1.05);
              filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.5));
            }
          }
        `}</style>
      </div>

      {/* Chat Container */}
      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full p-6">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto space-y-6 mb-6">
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
                key={index}
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
                  {/* Avatar */}
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

                  {/* Message */}
                  <div
                    className={`px-4 py-3 rounded-2xl shadow-sm ${
                      msg.type === "user"
                        ? "bg-black text-white rounded-br-sm"
                        : "bg-white text-gray-900 border border-gray-200 rounded-bl-sm"
                    }`}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-line">
                      {msg.content}
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

        {/* Input Area */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
          <div className="flex items-end space-x-3">
            <div className="flex-1 relative">
              <textarea
                rows="1"
                className="w-full resize-none border-0 bg-transparent focus:outline-none placeholder-gray-500 text-gray-900 text-sm leading-relaxed"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message here..."
                style={{ minHeight: "24px", maxHeight: "120px" }}
              />
            </div>
            <button
              onClick={handleSend}
              disabled={loading || !message.trim()}
              className="p-2.5 bg-black hover:bg-gray-800 disabled:bg-gray-300 text-white rounded-xl transition-colors disabled:cursor-not-allowed flex-shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              Press Enter to send • Shift+Enter for new line
            </p>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-xs text-gray-500">Connected</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
