import { useEffect, useState, useRef } from "react";
import {
  Home,
  BarChart3,
  Settings,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  MessageSquareText,
  Loader2,
  Trash2,
} from "lucide-react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";

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
      }, 50); 
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
    <span className="truncate block text-left">
      {displayText}
      {isTyping && currentIndex < text.length && (
        <span className="animate-pulse">|</span>
      )}
    </span>
  );
};

const Sidebar = ({ 
  onSelectPrompt, 
  onHomeClick, 
  onProcessingPromptsChange, 
  onTypingPromptsChange,
  selectedPromptId 
}) => {
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [promptList, setPromptList] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("Connecting...");
  const [processingPrompts, setProcessingPrompts] = useState(new Set());
  const [typingPrompts, setTypingPrompts] = useState(new Set());
  const [deletingPrompts, setDeletingPrompts] = useState(new Set());
  const [completedTypingPrompts, setCompletedTypingPrompts] = useState(new Set());
  const socketRef = useRef(null);

  const uniquePromptList = promptList.filter(
    (item, index, self) =>
      index ===
      self.findIndex((p) => p.conversation_id === item.conversation_id)
  );

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const handleHomeClick = () => {
    if (onHomeClick) {
      onHomeClick(); 
    }
    
    updateProcessingPrompts(new Set());
    updateTypingPrompts(new Set());
    
    navigate('/');
  };

  const updateProcessingPrompts = (newProcessingPrompts) => {
    setProcessingPrompts(newProcessingPrompts);
    if (onProcessingPromptsChange) {
      onProcessingPromptsChange(newProcessingPrompts);
    }
  };

  const updateTypingPrompts = (newTypingPrompts) => {
    setTypingPrompts(newTypingPrompts);
    if (onTypingPromptsChange) {
      onTypingPromptsChange(newTypingPrompts);
    }
  };

  const handlePromptTypingComplete = (promptId) => {
    setCompletedTypingPrompts(prev => new Set(prev).add(promptId));
    
    const newTypingPrompts = new Set(typingPrompts);
    newTypingPrompts.delete(promptId);
    updateTypingPrompts(newTypingPrompts);
    
    const newProcessingPrompts = new Set(processingPrompts);
    newProcessingPrompts.delete(promptId);
    updateProcessingPrompts(newProcessingPrompts);
  };

  const handleDeletePrompt = async (promptId, event) => {
    event.stopPropagation();
    
    if (deletingPrompts.has(promptId)) {
      return; 
    }

    try {
      setDeletingPrompts(prev => new Set(prev).add(promptId));
      
      await axios.delete(`http://localhost:3000/chat/${promptId}`);
      
      setPromptList(prev => prev.filter(prompt => prompt.id !== promptId));
      
      const newProcessingPrompts = new Set(processingPrompts);
      newProcessingPrompts.delete(promptId);
      updateProcessingPrompts(newProcessingPrompts);
      
      const newTypingPrompts = new Set(typingPrompts);
      newTypingPrompts.delete(promptId);
      updateTypingPrompts(newTypingPrompts);
      
      // Also remove from completed typing prompts
      setCompletedTypingPrompts(prev => {
        const newSet = new Set(prev);
        newSet.delete(promptId);
        return newSet;
      });
      
    } catch (error) {
      console.error("Failed to delete prompt:", error);
    } finally {
      setDeletingPrompts(prev => {
        const newSet = new Set(prev);
        newSet.delete(promptId);
        return newSet;
      });
    }
  };

  useEffect(() => {
    const fetchPrompts = async () => {
      try {
        const res = await axios.get("http://localhost:3000/chat");
        setPromptList(res.data);
      } catch (err) {
        console.error("Failed to fetch prompt history", err);
      }
    };

    fetchPrompts();

    const initializeSocket = () => {
      socketRef.current = io("http://localhost:4000", {
        transports: ["websocket", "polling"],
        upgrade: true,
        rememberUpgrade: true,
        timeout: 20000,
        forceNew: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        maxReconnectionAttempts: 5,
        randomizationFactor: 0.5,
      });

      socketRef.current.on("connect", () => {
        console.log("Connected to WebSocket server");
        setIsConnected(true);
        setConnectionStatus("System Online");
      });

      socketRef.current.on("connect_error", (err) => {
        console.error("WebSocket connection error:", err);
        setIsConnected(false);
        setConnectionStatus("Connection Failed");
      });

      socketRef.current.on("disconnect", (reason) => {
        console.warn("WebSocket disconnected:", reason);
        setIsConnected(false);
        setConnectionStatus("Disconnected");
      });

      socketRef.current.on("reconnect", (attemptNumber) => {
        console.log("Reconnected after", attemptNumber, "attempts");
        setIsConnected(true);
        setConnectionStatus("System Online");
      });

      socketRef.current.on("reconnect_error", (err) => {
        console.error("Reconnection error:", err);
        setConnectionStatus("Reconnection Failed");
      });

      socketRef.current.on("reconnect_failed", () => {
        console.error("Failed to reconnect");
        setConnectionStatus("Connection Lost");
      });

      socketRef.current.on("init_prompt_list", (data) => {
        console.log("init_prompt_list:", data);
        setPromptList(data);
      });

      socketRef.current.on("prompt_processing", (promptData) => {
        console.log("prompt_processing:", promptData);
        const newProcessingPrompts = new Set(processingPrompts);
        newProcessingPrompts.add(promptData.id);
        updateProcessingPrompts(newProcessingPrompts);
        
        const processingPrompt = {
          ...promptData,
          message: "Processing your request...",
          isProcessing: true
        };
        
        setPromptList((prev) => [processingPrompt, ...prev]);
      });

      socketRef.current.on("new_prompt", (prompt) => {
        console.log("new_prompt received:", prompt);
        
        // Only start typing if it hasn't been completed yet
        if (!completedTypingPrompts.has(prompt.id)) {
          const newTypingPrompts = new Set(typingPrompts);
          newTypingPrompts.add(prompt.id);
          updateTypingPrompts(newTypingPrompts);
        }
        
        setPromptList((prev) => {
          const existingIndex = prev.findIndex(p => p.id === prompt.id);
          if (existingIndex !== -1) {
            const newList = [...prev];
            newList[existingIndex] = { ...prompt, isProcessing: false };
            return newList;
          } else {
            return [{ ...prompt, isProcessing: false }, ...prev];
          }
        });
      });

      socketRef.current.on("prompt_update", (updatedPrompt) => {
        console.log("prompt_update received:", updatedPrompt);
        setPromptList((prev) => {
          const existingIndex = prev.findIndex(p => p.id === updatedPrompt.id);
          if (existingIndex !== -1) {
            const newList = [...prev];
            newList[existingIndex] = { ...updatedPrompt, isProcessing: false };
            return newList;
          }
          return prev;
        });
      });

      socketRef.current.on("prompt_deleted", (deletedPromptId) => {
        console.log("prompt_deleted received:", deletedPromptId);
        setPromptList((prev) => prev.filter(prompt => prompt.id !== deletedPromptId));
      });
    };

    initializeSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [processingPrompts, typingPrompts, completedTypingPrompts]);

  return (
    <div
      className={`${
        isCollapsed ? "w-16" : "w-64"
      } h-screen bg-white border-r border-gray-200 flex flex-col transition-all duration-500 ease-in-out flex-shrink-0 overflow-hidden`}
    >
      {/* Fixed Sidebar Header */}
      <div
        className={`${
          isCollapsed ? "p-4" : "p-6"
        } border-b border-gray-200 transition-all duration-500 ease-in-out flex-shrink-0`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
          </div>
          <button
            onClick={toggleSidebar}
            className="p-1 hover:bg-gray-100 rounded-md transition-all duration-300 ease-in-out flex-shrink-0"
          >
            <div
              className={`transition-transform duration-500 ease-in-out ${
                isCollapsed ? "rotate-180" : "rotate-0"
              }`}
            >
              <ChevronLeft className="w-4 h-4 text-gray-500" />
            </div>
          </button>
        </div>
      </div>

      {/* Navigation - Scrollable */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Fixed Navigation Items */}
        <div className="p-4 flex-shrink-0">
          <ul className="space-y-2">
            <li>
              <button
                onClick={handleHomeClick}
                className={`flex items-center w-full px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-all duration-300 ease-in-out group ${
                  isCollapsed ? "justify-center" : "space-x-3"
                } ${!selectedPromptId ? "bg-gray-50" : ""}`}
              >
                <Home className="w-5 h-5 text-gray-400 group-hover:text-gray-600 flex-shrink-0" />
                <span
                  className={`text-sm font-medium transition-all duration-500 ease-in-out overflow-hidden whitespace-nowrap ${
                    isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
                  }`}
                >
                  Home
                </span>
              </button>
            </li>
            <li>
              <a
                href="#"
                className={`flex items-center px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-all duration-300 ease-in-out group ${
                  isCollapsed ? "justify-center" : "space-x-3"
                }`}
              >
                <BarChart3 className="w-5 h-5 text-gray-400 group-hover:text-gray-600 flex-shrink-0" />
                <span
                  className={`text-sm font-medium transition-all duration-500 ease-in-out overflow-hidden whitespace-nowrap ${
                    isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
                  }`}
                >
                  Dashboard
                </span>
              </a>
            </li>
            <li>
              <a
                href="#"
                className={`flex items-center px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-all duration-300 ease-in-out group ${
                  isCollapsed ? "justify-center" : "space-x-3"
                }`}
              >
                <Settings className="w-5 h-5 text-gray-400 group-hover:text-gray-600 flex-shrink-0" />
                <span
                  className={`text-sm font-medium transition-all duration-500 ease-in-out overflow-hidden whitespace-nowrap ${
                    isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
                  }`}
                >
                  Settings
                </span>
              </a>
            </li>
          </ul>
        </div>

        {/* Prompt History Section - Scrollable */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {!isCollapsed && (
            <div className="px-4 pb-2 flex-shrink-0">
              <h2 className="text-xs text-gray-400 uppercase">
                Prompt History
              </h2>
            </div>
          )}
          <div className="flex-1 overflow-y-auto px-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-400">
            <ul className="space-y-1 pb-4">
              {uniquePromptList.map((item) => {
                const isProcessing = processingPrompts.has(item.id) || item.isProcessing;
                const isTyping = typingPrompts.has(item.id) && !completedTypingPrompts.has(item.id);
                const isDeleting = deletingPrompts.has(item.id);
                const isSelected = selectedPromptId === item.id;
                const displayText = item.message.slice(0, 30) + (item.message.length > 30 ? "..." : "");
                
                return (
                  <li key={item.id} className={`transform transition-all duration-500 ease-in-out ${
                    isProcessing ? 'animate-pulse' : 'animate-none'
                  } ${isDeleting ? 'opacity-50' : 'opacity-100'}`}>
                    <div className="group relative">
                      <button
                        onClick={() => !isProcessing && !isDeleting && onSelectPrompt(item)}
                        disabled={isProcessing || isDeleting}
                        className={`flex items-center w-full px-3 py-2 text-sm rounded-lg transition-all duration-200 ${
                          isCollapsed ? "justify-center" : "justify-start space-x-2"
                        } ${
                          isProcessing || isDeleting
                            ? "text-gray-400 bg-gray-50 cursor-not-allowed" 
                            : isSelected
                            ? "text-blue-700 bg-blue-50 border border-blue-200"
                            : "text-gray-700 hover:bg-gray-100"
                        } ${!isCollapsed ? "pr-8" : ""}`}
                      >
                        {isProcessing ? (
                          <Loader2 className="w-4 h-4 text-gray-400 flex-shrink-0 animate-spin" />
                        ) : isDeleting ? (
                          <Loader2 className="w-4 h-4 text-red-400 flex-shrink-0 animate-spin" />
                        ) : (
                          <MessageSquareText className={`w-4 h-4 flex-shrink-0 ${
                            isSelected ? 'text-blue-500' : 'text-gray-400'
                          }`} />
                        )}
                        {!isCollapsed && (
                          <div className="flex-1 min-w-0 text-left">
                            {isTyping && !isProcessing && !isDeleting ? (
                              <TypingText
                                text={displayText}
                                isTyping={true}
                                onComplete={() => handlePromptTypingComplete(item.id)}
                              />
                            ) : (
                              <span className="truncate block text-left">
                                {displayText}
                              </span>
                            )}
                          </div>
                        )}
                      </button>
                      
                      {/* Delete Button - Only show when not collapsed and not processing */}
                      {!isCollapsed && !isProcessing && !isDeleting && (
                        <button
                          onClick={(e) => handleDeletePrompt(item.id, e)}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 hover:bg-red-100 rounded-md"
                          title="Delete prompt"
                        >
                          <Trash2 className="w-3 h-3 text-red-500 hover:text-red-700" />
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>

      {/* Fixed Footer */}
      <div className="p-4 border-t border-gray-200 flex-shrink-0">
        <div
          className={`flex items-center transition-all duration-500 ease-in-out ${
            isCollapsed ? "justify-center" : "space-x-2"
          }`}
        >
          <div
            className={`w-2 h-2 rounded-full flex-shrink-0 ${
              isConnected ? "bg-green-500" : "bg-red-500"
            }`}
          ></div>
          <span
            className={`text-xs text-gray-500 transition-all duration-500 ease-in-out overflow-hidden whitespace-nowrap ${
              isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
            }`}
          >
            {connectionStatus}
          </span>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;