import { useState } from "react";
import { Home, BarChart3, Settings, Sparkles, ChevronLeft, ChevronRight } from "lucide-react";

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className={`${isCollapsed ? 'w-16' : 'w-64'} h-screen bg-white border-r border-gray-200 flex flex-col transition-all duration-500 ease-in-out`}>
      {/* Sidebar Header */}
      <div className={`${isCollapsed ? 'p-4' : 'p-6'} border-b border-gray-200 transition-all duration-500 ease-in-out`}>
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
            <div className={`transition-transform duration-500 ease-in-out ${isCollapsed ? 'rotate-180' : 'rotate-0'}`}>
              <ChevronLeft className="w-4 h-4 text-gray-500" />
            </div>
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          <li>
            <a href="#" className={`flex items-center px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-all duration-300 ease-in-out group ${isCollapsed ? 'justify-center' : 'space-x-3'}`}>
              <Home className="w-5 h-5 text-gray-400 group-hover:text-gray-600 flex-shrink-0" />
              <span className={`text-sm font-medium transition-all duration-500 ease-in-out overflow-hidden whitespace-nowrap ${isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
                Home
              </span>
            </a>
          </li>
          <li>
            <a href="#" className={`flex items-center px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-all duration-300 ease-in-out group bg-gray-50 ${isCollapsed ? 'justify-center' : 'space-x-3'}`}>
              <BarChart3 className="w-5 h-5 text-gray-600 flex-shrink-0" />
              <span className={`text-sm font-medium transition-all duration-500 ease-in-out overflow-hidden whitespace-nowrap ${isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
                Dashboard
              </span>
            </a>
          </li>
          <li>
            <a href="#" className={`flex items-center px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-all duration-300 ease-in-out group ${isCollapsed ? 'justify-center' : 'space-x-3'}`}>
              <Settings className="w-5 h-5 text-gray-400 group-hover:text-gray-600 flex-shrink-0" />
              <span className={`text-sm font-medium transition-all duration-500 ease-in-out overflow-hidden whitespace-nowrap ${isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
                Settings
              </span>
            </a>
          </li>
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <div className={`flex items-center transition-all duration-500 ease-in-out ${isCollapsed ? 'justify-center' : 'space-x-2'}`}>
          <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
          <span className={`text-xs text-gray-500 transition-all duration-500 ease-in-out overflow-hidden whitespace-nowrap ${isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
            System Online
          </span>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;