import { Routes, Route } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar';
import Dashboard from './pages/Dashboard';
import Growers from './pages/Growers';
import Applications from './pages/Applications';
import FieldTasks from './pages/FieldTasks';
import Compliance from './pages/Compliance';
import Development from './pages/Development';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import './App.css';

function App() {
    return (
        <div className="app-layout">
            <Sidebar />
            <main className="app-main">
                <Routes>
                    <Route path="/"             element={<Dashboard />} />
                    <Route path="/growers"       element={<Growers />} />
                    <Route path="/applications"  element={<Applications />} />
                    <Route path="/field-tasks"   element={<FieldTasks />} />
                    <Route path="/compliance"    element={<Compliance />} />
                    <Route path="/development"   element={<Development />} />
                    <Route path="/analytics"     element={<Analytics />} />
                    <Route path="/settings"      element={<Settings />} />
                </Routes>
            </main>
        </div>
    );
}

export default App;