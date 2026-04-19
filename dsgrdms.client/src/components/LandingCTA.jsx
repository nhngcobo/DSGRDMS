import { LogIn } from 'lucide-react';

export default function LandingCTA({ onAccessClick }) {
    return (
        <section className="lp-cta-section">
            <div className="lp-cta-container">
                <div className="lp-cta-content">
                    <h2 className="lp-cta-title">Ready to standardise your grower data?</h2>
                    <p className="lp-cta-subtitle">Join the network of sustainable foresters using GrowHub for precision management.</p>
                </div>
                <button className="lp-cta-button" onClick={onAccessClick}>
                    Access System
                    <LogIn size={16} />
                </button>
            </div>
        </section>
    );
}
