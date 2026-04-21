import { useState, useEffect } from 'react';
import { ArrowRight, Verified } from 'lucide-react';

const SLIDESHOW_IMAGES = [
    '/SlideShowImageA.jpeg',
    '/SlideShowImageB.jpeg',
    '/SlideShowImageC.jpeg'
];

export default function LandingHero({ onGetStartedClick }) {
    const [currentSlide, setCurrentSlide] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % SLIDESHOW_IMAGES.length);
        }, 4000); // Change slide every 4 seconds

        return () => clearInterval(interval);
    }, []);

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
                        <img 
                            src={SLIDESHOW_IMAGES[currentSlide]} 
                            alt={`Forest slideshow ${currentSlide + 1}`}
                            key={currentSlide}
                            style={{ animation: 'slideIn 0.8s ease-out' }}
                        />
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
