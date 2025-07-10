import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Sidebar from "./sidebar/Sidebar";
import Dashboard from "./dashboard/Dashboard";
import { useState } from "react";

const App = () => {
  const [selectedPrompt, setSelectedPrompt] = useState(null);
  const [sidebarProcessingPrompts, setSidebarProcessingPrompts] = useState(new Set());
  const [sidebarTypingPrompts, setSidebarTypingPrompts] = useState(new Set());

  return (
    <Router>
      <div className="flex">
        <Sidebar
          onSelectPrompt={setSelectedPrompt}
          onHomeClick={() => setSelectedPrompt(null)}
          onProcessingPromptsChange={setSidebarProcessingPrompts}
          onTypingPromptsChange={setSidebarTypingPrompts}
        />
        <Routes>
          <Route
            path="/"
            element={
              <Dashboard 
                selectedChat={selectedPrompt} 
                onNewChat={(newChat) => {
                  console.log('New chat created:', newChat);
                }}
                sidebarProcessingPrompts={sidebarProcessingPrompts}
                sidebarTypingPrompts={sidebarTypingPrompts}
              />
            }
          />
        </Routes>
      </div>
    </Router>
  );
};

export default App;