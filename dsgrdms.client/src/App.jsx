import { Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import { Menu } from 'lucide-react';
import Sidebar from './components/layout/Sidebar';
import Dashboard from './pages/Dashboard';
import Growers from './pages/Growers';
import GrowerDetail from './pages/GrowerDetail';
import Applications from './pages/Applications';
import Compliance from './pages/Compliance';
import FieldVisits from './pages/FieldVisits';
import FieldVisitCoordination from './pages/FieldVisitCoordination';
import FieldVisitTimeline from './pages/FieldVisitTimeline';
import Settings from './pages/Settings';
import Messages from './pages/Messages';
import LandingPage from './pages/LandingPage';
import GrowerDossier from './pages/GrowerDossier';
import PlantingRecords from './components/PlantingRecords';
import PlantingRecordsReview from './components/PlantingRecordsReview';
import { useAuth } from './context/AuthContext';
import './App.css';

function App() {
    const { user } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    if (!user) {
        return <LandingPage />;
    }

    return (
        <div className="app-layout">
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} onOpen={() => setSidebarOpen(true)} />
            <main className="app-main">
                <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)}>
                    <Menu size={24} />
                </button>
                <Routes>
                    {/* Admin routes */}
                    {user.role === 'admin' && <>
                        <Route path="/"             element={<Dashboard />} />
                        <Route path="/growers"      element={<Growers />} />
                        <Route path="/growers/:id"  element={<GrowerDetail />} />
                        <Route path="/applications" element={<Applications />} />
                        <Route path="/compliance"   element={<Compliance />} />
                        <Route path="/field-visits" element={<FieldVisits />} />
                        <Route path="/messages"     element={<Messages />} />
                        <Route path="/settings"     element={<Settings />} />
                    </>}

                    {/* Field Officer routes */}
                    {user.role === 'field_officer' && <>
                        <Route path="/"             element={<Dashboard />} />
                        <Route path="/growers"      element={<Growers />} />
                        <Route path="/growers/:id"  element={<GrowerDetail />} />
                        <Route path="/applications" element={<Applications />} />
                        <Route path="/compliance"   element={<Compliance />} />
                        <Route path="/field-visits" element={<FieldVisitCoordination />} />                        <Route path="/planting-records" element={<PlantingRecordsReview />} />                        <Route path="/messages"     element={<Messages />} />
                        <Route path="/settings"     element={<Settings />} />
                    </>}

                    {/* Grower routes */}
                    {user.role === 'grower' && <>
                        <Route path="/" element={<GrowerDossier />} />
                        <Route path="/compliance" element={<Compliance />} />
                        <Route path="/field-visits" element={<FieldVisitTimeline />} />
                        <Route path="/planting-records" element={<PlantingRecords />} />
                        <Route path="/messages" element={<Messages />} />
                        <Route path="/settings" element={<Settings />} />
                    </>}

                    {/* Catch-all redirect to home */}
                    <Route path="*" element={
                        <Navigate to="/" replace />
                    } />
                </Routes>
            </main>
        </div>
    );
}

export default App;