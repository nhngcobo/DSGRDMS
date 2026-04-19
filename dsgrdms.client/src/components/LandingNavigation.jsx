export default function LandingNavigation({ onSignInClick }) {
    return (
        <nav className="lp-nav-wrapper">
            <div className="lp-nav-container">
                <div className="lp-nav-brand">
                    <div className="lp-nav-icon">
                        <img src="/logov2.png" alt="GrowHub Logo" className="lp-nav-logo" />
                    </div>
                    <span className="lp-nav-name">GrowHub Plantation</span>
                </div>
                
                <div className="lp-nav-links">
                    <a href="#platform" className="lp-nav-link active">Platform</a>
                    <a href="#resources" className="lp-nav-link">Resources</a>
                    <a href="#company" className="lp-nav-link">Company</a>
                </div>
                
                <button className="lp-nav-signin" onClick={onSignInClick}>
                    Sign In
                </button>
            </div>
        </nav>
    );
}
