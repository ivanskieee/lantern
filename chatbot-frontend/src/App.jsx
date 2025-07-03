import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Sidebar from "./sidebar/Sidebar";
import Dashboard from "./dashboard/Dashboard";
import { useState } from "react";

const App = () => {
  const [selectedPrompt, setSelectedPrompt] = useState(null);

  return (
    <Router>
      <div className="flex">
        <Sidebar
          onSelectPrompt={setSelectedPrompt}
          onHomeClick={() => setSelectedPrompt(null)}
        />
        <Routes>
          <Route
            path="/"
            element={<Dashboard selectedChat={selectedPrompt} onNewChat={setSelectedPrompt} />}
          />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
