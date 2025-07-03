import Sidebar from "./sidebar/Sidebar";
import Dashboard from "./dashboard/Dashboard";

const App = () => {
  return (
    <div className="flex">
      <Sidebar />
      <Dashboard />
    </div>
  );
};

export default App;
