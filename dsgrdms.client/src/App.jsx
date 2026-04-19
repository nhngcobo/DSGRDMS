import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar';
import Dashboard from './pages/Dashboard';
import Growers from './pages/Growers';
import GrowerDetail from './pages/GrowerDetail';
import Compliance from './pages/Compliance';
import FieldVisits from './pages/FieldVisits';
import GrowerApplication from './pages/GrowerApplication';
import Settings from './pages/Settings';
import Messages from './pages/Messages';
import LandingPage from './pages/LandingPage';
import { useAuth } from './context/AuthContext';
import './App.css';

function App() {
    const { user } = useAuth();

    if (!user) {
        return <LandingPage />;
    }

    return (
        <div className="app-layout">
            <Sidebar />
            <main className="app-main">
                <Routes>
                    {/* Admin & Field Officer routes */}
                    {(user.role === 'admin' || user.role === 'field_officer') && <>
                        <Route path="/"             element={<Dashboard />} />
                        <Route path="/growers"      element={<Growers />} />
                        <Route path="/growers/:id"  element={<GrowerDetail />} />
                        <Route path="/compliance"   element={<Compliance />} />
                        <Route path="/field-visits" element={<FieldVisits />} />
                        <Route path="/messages"     element={<Messages />} />
                        <Route path="/settings"     element={<Settings />} />
                    </>}

                    {/* Grower routes */}
                    {user.role === 'grower' && <>
                        <Route path="/my-application" element={<GrowerApplication />} />
                        <Route path="/messages"        element={<Messages />} />
                        <Route path="/settings"        element={<Settings />} />
                    </>}

                    {/* Catch-all redirect to home */}
                    <Route path="*" element={
                        <Navigate to={user.role === 'grower' ? '/my-application' : '/'} replace />
                    } />
                </Routes>
            </main>
        </div>
    );
}

export default App;