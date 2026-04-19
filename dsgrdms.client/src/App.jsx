import { Routes, Route } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar';
import Dashboard from './pages/Dashboard';
import Growers from './pages/Growers';
import GrowerDetail from './pages/GrowerDetail';
import Compliance from './pages/Compliance';
import FieldVisits from './pages/FieldVisits';
import GrowerApplication from './pages/GrowerApplication';
import Settings from './pages/Settings';
import './App.css';

function App() {
    return (
        <div className="app-layout">
            <Sidebar />
            <main className="app-main">
                <Routes>
                    <Route path="/"             element={<Dashboard />} />
                    <Route path="/growers"         element={<Growers />} />
                    <Route path="/growers/:id"     element={<GrowerDetail />} />
                    <Route path="/compliance"    element={<Compliance />} />
                    <Route path="/field-visits"  element={<FieldVisits />} />
                    <Route path="/my-application" element={<GrowerApplication />} />
                    <Route path="/settings"      element={<Settings />} />
                </Routes>
            </main>
        </div>
    );
}

export default App;