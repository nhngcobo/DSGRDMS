import { ArrowRight, Verified } from 'lucide-react';

export default function LandingHero({ onGetStartedClick }) {
    return (
        <header className="lp-hero-section">
            <div className="lp-hero-container">
                {/* Left Content */}
                <div className="lp-hero-left">
                    <div className="lp-hero-badge">
                        <div className="lp-badge-dot"></div>
                        <span>Plat Plantations · Sustainable Forestry</span>
                    </div>

                    <h1 className="lp-hero-title">
                        Grower <span className="lp-hero-highlight">Registration</span> &amp; Development Management
                    </h1>

                    <p className="lp-hero-subtitle">
                        A high-precision digital ledger designed for the modern agronomist. Secure, transparent, and built to manage the complex lifecycle of smallholder timber grower development with scientific accuracy.
                    </p>

                    <div className="lp-hero-buttons">
                        <button className="lp-btn-primary" onClick={onGetStartedClick}>
                            Get Started
                            <ArrowRight size={16} />
                        </button>
                        <button className="lp-btn-secondary" onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })}>
                            See features
                        </button>
                    </div>
                </div>

                {/* Right Grid */}
                <div className="lp-hero-right">
                    <div className="lp-hero-grid-image">
                        <img src="https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600&h=400&fit=crop" alt="Forest" />
                        <div className="lp-hero-grid-overlay"></div>
                    </div>

                    <div className="lp-hero-stat" style={{ backgroundColor: '#e3e2e2' }}>
                        <span className="lp-stat-big">3</span>
                        <p className="lp-stat-label">User Roles</p>
                    </div>

                    <div className="lp-hero-stat" style={{ backgroundColor: '#feccb5' }}>
                        <span className="lp-stat-big" style={{ color: '#795442' }}>12+</span>
                        <p className="lp-stat-label" style={{ color: '#795442' }}>Doc Types</p>
                    </div>

                    <div className="lp-hero-stat-wide" style={{ backgroundColor: '#d7e5e6' }}>
                        <div>
                            <span className="lp-stat-big" style={{ color: '#546162' }}>100%</span>
                            <p className="lp-stat-label" style={{ color: '#546162' }}>Digitised Infrastructure</p>
                        </div>
                        <Verified size={32} color="#546162" />
                    </div>
                </div>
            </div>
        </header>
    );
}
