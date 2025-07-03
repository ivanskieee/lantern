import { useState } from "react";
import { Send, MessageCircle, Sparkles } from "lucide-react";
import axios from "axios";

const Dashboard = () => {
  const [message, setMessage] = useState("");
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);

  const handleSend = async () => {
    if (!message.trim()) return;
    
    // Add user message to chat history
    const userMessage = { type: 'user', content: message, timestamp: new Date() };
    setChatHistory(prev => [...prev, userMessage]);
    
    setLoading(true);
    try {
      const res = await axios.post("http://localhost:3000/chat", {
        message,
      });
      
      const botMessage = { type: 'bot', content: res.data.reply, timestamp: new Date() };
      setChatHistory(prev => [...prev, botMessage]);
      setReply(res.data.reply);
    } catch (error) {
      const errorMessage = { type: 'bot', content: "Something went wrong!", timestamp: new Date() };
      setChatHistory(prev => [...prev, errorMessage]);
      setReply("Something went wrong!");
    } finally {
      setLoading(false);
      setMessage("");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex-1 bg-gray-50 min-h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">The Lantern</h1>
            <p className="text-sm text-gray-500">like a light in the dark for your thoughts</p>
          </div>
        </div>
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
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Start a conversation</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                Ask me anything and I'll provide helpful, professional responses to assist you.
              </p>
            </div>
          ) : (
            chatHistory.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex items-start space-x-3 max-w-2xl ${msg.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                  {/* Avatar */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    msg.type === 'user' ? 'bg-black' : 'bg-white border-2 border-gray-200'
                  }`}>
                    {msg.type === 'user' ? (
                      <div className="w-4 h-4 bg-white rounded-full"></div>
                    ) : (
                      <Sparkles className="w-4 h-4 text-gray-600" />
                    )}
                  </div>
                  
                  {/* Message */}
                  <div className={`px-4 py-3 rounded-2xl shadow-sm ${
                    msg.type === 'user'
                      ? 'bg-black text-white rounded-br-sm'
                      : 'bg-white text-gray-900 border border-gray-200 rounded-bl-sm'
                  }`}>
                    <p className="text-sm leading-relaxed whitespace-pre-line">{msg.content}</p>
                    <p className={`text-xs mt-2 ${msg.type === 'user' ? 'text-gray-300' : 'text-gray-500'}`}>
                      {msg.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
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
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
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
                style={{minHeight: '24px', maxHeight: '120px'}}
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