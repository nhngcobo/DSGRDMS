import { Users, Gavel, MapPin, MessageSquare, BarChart3, Globe } from 'lucide-react';

const FEATURES = [
    {
        icon: Users,
        title: 'Grower Management',
        body: 'Comprehensive profiles for timber growers including land tenure, mapping coordinates, and historical yields.',
        color: '#dcfce7',
        iconColor: '#16a34a',
    },
    {
        icon: Gavel,
        title: 'Compliance & Risk',
        body: 'Integrated ESG compliance tracking and multi-tier risk assessment for sustainable forestry certification.',
        color: '#dbeafe',
        iconColor: '#1d4ed8',
    },
    {
        icon: MapPin,
        title: 'Field Visits',
        body: 'Offline-first mobile logging for forestry extension officers with GPS verification and photo documentation.',
        color: '#fef3c7',
        iconColor: '#b45309',
    },
    {
        icon: MessageSquare,
        title: 'Messaging',
        body: 'Direct-to-grower communication channel for weather alerts, market pricing, and technical advice.',
        color: '#f3e8ff',
        iconColor: '#a855f7',
    },
    {
        icon: BarChart3,
        title: 'Analytics',
        body: 'Visualise forest growth trends, cohort performance, and regional production forecasts with ease.',
        color: '#fce7f3',
        iconColor: '#be185d',
    },
    {
        icon: Globe,
        title: 'Grower Portal',
        body: 'A dedicated self-service interface for growers to track their own progress and access digital contracts.',
        color: '#ccfbf1',
        iconColor: '#0d9488',
    },
];

export default function LandingFeatures() {
    return (
        <section id="features" className="lp-features-section">
            <div className="lp-features-container">
                <div className="lp-features-header">
                    <h2 className="lp-features-title">Core Ecosystem</h2>
                    <div className="lp-features-line"></div>
                </div>

                <div className="lp-features-grid">
                    {FEATURES.map(({ icon: Icon, title, body, color, iconColor }) => (
                        <div key={title} className="lp-feature-card">
                            <div className="lp-feature-icon" style={{ backgroundColor: color }}>
                                <Icon size={24} color={iconColor} />
                            </div>
                            <h3 className="lp-feature-title">{title}</h3>
                            <p className="lp-feature-body">{body}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
