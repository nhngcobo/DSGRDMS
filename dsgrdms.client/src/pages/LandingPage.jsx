import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { friendlyError } from '../utils/apiErrors';
import LandingNavigation from '../components/LandingNavigation';
import LandingHero from '../components/LandingHero';
import LandingFeatures from '../components/LandingFeatures';
import LandingCTA from '../components/LandingCTA';
import LandingFooter from '../components/LandingFooter';
import LandingLoginPanel from '../components/LandingLoginPanel';
import './LandingPage.css';

export default function LandingPage() {
    const { login } = useAuth();
    const { showError } = useNotification();
    const [panelOpen, setPanelOpen] = useState(false);

    async function handleLogin(email, password) {
        try {
            await login(email, password);
            setPanelOpen(false);
        } catch (err) {
            showError(friendlyError(err));
            throw err;
        }
    }

    return (
        <div className="lp-root">
            <LandingNavigation onSignInClick={() => setPanelOpen(true)} />
            <LandingHero onGetStartedClick={() => setPanelOpen(true)} />
            <LandingFeatures />
            <LandingCTA onAccessClick={() => setPanelOpen(true)} />
            <LandingFooter />
            <LandingLoginPanel 
                isOpen={panelOpen}
                onClose={() => setPanelOpen(false)}
                onSubmit={handleLogin}
            />
        </div>
    );
}
