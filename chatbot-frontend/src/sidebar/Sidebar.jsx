import { useEffect, useState, useRef } from "react";
import {
  Home,
  BarChart3,
  Settings,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  MessageSquareText,
} from "lucide-react";
import axios from "axios";
import { Link } from "react-router-dom";
import { io } from "socket.io-client";

const Sidebar = ({ onSelectPrompt, onHomeClick }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [promptList, setPromptList] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("Connecting...");
  const socketRef = useRef(null);

  const uniquePromptList = promptList.filter(
    (item, index, self) =>
      index ===
      self.findIndex((p) => p.conversation_id === item.conversation_id)
  );

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
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

      socketRef.current.on("new_prompt", (prompt) => {
        console.log("new_prompt received:", prompt);
        setPromptList((prev) => [prompt, ...prev]);
      });
    };

    initializeSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  return (
    <div
      className={`${
        isCollapsed ? "w-16" : "w-64"
      } h-screen bg-white border-r border-gray-200 flex flex-col transition-all duration-500 ease-in-out`}
    >
      {/* Sidebar Header */}
      <div
        className={`${
          isCollapsed ? "p-4" : "p-6"
        } border-b border-gray-200 transition-all duration-500 ease-in-out`}
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

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          <li>
            <Link
              to="/"
              onClick={onHomeClick}
              className={`flex items-center px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-all duration-300 ease-in-out group ${
                isCollapsed ? "justify-center" : "space-x-3"
              }`}
            >
              <Home className="w-5 h-5 text-gray-400 group-hover:text-gray-600 flex-shrink-0" />
              <span
                className={`text-sm font-medium transition-all duration-500 ease-in-out overflow-hidden whitespace-nowrap ${
                  isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
                }`}
              >
                Home
              </span>
            </Link>
          </li>
          <li>
            <a
              href="#"
              className={`flex items-center px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-all duration-300 ease-in-out group bg-gray-50 ${
                isCollapsed ? "justify-center" : "space-x-3"
              }`}
            >
              <BarChart3 className="w-5 h-5 text-gray-600 flex-shrink-0" />
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
        <div className="mt-6">
          {!isCollapsed && (
            <h2 className="text-xs text-gray-400 uppercase mb-2">
              Prompt History
            </h2>
          )}
          <ul className="space-y-1">
            {uniquePromptList.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => onSelectPrompt(item)}
                  className={`flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-all duration-200 ${
                    isCollapsed ? "justify-center" : "space-x-2"
                  }`}
                >
                  <MessageSquareText className="w-4 h-4 text-gray-400" />
                  {!isCollapsed && (
                    <span className="truncate max-w-[150px] text-left">
                      {item.message.slice(0, 30)}...
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <div
          className={`flex items-center transition-all duration-500 ease-in-out ${
            isCollapsed ? "justify-center" : "space-x-2"
          }`}
        >
          <div 
            className={`w-2 h-2 rounded-full flex-shrink-0 ${
              isConnected ? 'bg-green-500' : 'bg-red-500'
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