import { useState } from 'react';
import { Calendar, User, MapPin, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import './FieldVisitTimeline.css';

const mockUpcomingInspections = [
    {
        id: 1,
        date: 'April 28, 2026',
        time: '10:00 AM',
        title: 'Spring Growth Assessment',
        officer: { name: 'Marcus Thorne', role: 'Senior Field Officer' },
        location: 'All Production Areas',
        status: 'scheduled',
        priority: 'high',
        purpose: 'Evaluate spring growth patterns and identify any early-season pest or disease issues.',
    },
    {
        id: 2,
        date: 'May 15, 2026',
        time: '09:30 AM',
        title: 'Irrigation System Evaluation',
        officer: { name: 'Elena Rodriguez', role: 'Water Management Specialist' },
        location: 'All Irrigation Zones',
        status: 'scheduled',
        priority: 'medium',
        purpose: 'Annual inspection of irrigation infrastructure and water usage efficiency.',
    },
    {
        id: 3,
        date: 'June 10, 2026',
        time: '02:00 PM',
        title: 'Mid-Season Compliance Review',
        officer: { name: 'Sarah Chen', role: 'Certification Specialist' },
        location: 'Main Office & Selected Parcels',
        status: 'scheduled',
        priority: 'high',
        purpose: 'Review compliance documentation and conduct spot checks on farming practices.',
    },
];

// Generate mock field visits (120+ visits across 12 months)
function generateMockFieldVisits() {
    const officers = [
        { name: 'Sarah Chen', initials: 'SC' },
        { name: 'Marcus Thorne', initials: 'MT' },
        { name: 'Elena Rodriguez', initials: 'ER' },
        { name: 'James Mbeki', initials: 'JM' },
        { name: 'Aisha Ndlovu', initials: 'AN' },
        { name: 'David van der Merwe', initials: 'DM' },
    ];

    const visitTypes = [
        'Routine Inspection',
        'Compliance Verification',
        'Pest Management Check',
        'Irrigation Assessment',
        'Soil Quality Review',
        'Harvest Oversight',
        'Equipment Inspection',
        'Weather Damage Assessment',
        'Certification Audit',
        'Training Session',
        'Quality Control',
        'Safety Inspection',
    ];

    const locations = [
        'North Fields, Parcels 1-5',
        'South Fields, Parcels 10-15',
        'East Fields, All Parcels',
        'West Fields, Parcels 20-25',
        'Central Zone, Parcels 6-9',
        'Greenhouse Complex A',
        'Greenhouse Complex B',
        'Irrigation Zones 1-3',
        'Storage Facilities',
        'Processing Area',
        'Main Office & Adjacent Fields',
        'Organic Section, Parcels 30-35',
    ];

    const findings = [
        'All crops showing healthy development. Irrigation systems functioning properly.',
        'Excellent compliance with organic farming standards. Record-keeping is exemplary.',
        'Minor pest activity observed. Recommended organic treatment applied.',
        'Soil analysis shows good nutrient levels. Cover crops establishing well.',
        'Equipment maintenance records reviewed and found satisfactory.',
        'All safety protocols being followed correctly. No violations noted.',
        'Harvest quality meets certification standards. Proper handling procedures observed.',
        'Irrigation efficiency at optimal levels. Water conservation measures effective.',
        'Crop rotation schedule on track. Field preparation progressing as planned.',
        'Documentation complete and properly organized. Digital records up to date.',
    ];

    const recommendations = [
        'Continue current pest management protocol. Schedule follow-up in 2 weeks.',
        'Maintain current practices. Consider implementing additional buffer zones.',
        'Begin planning for next planting cycle. Review seed selection.',
        'Monitor weather conditions. Adjust irrigation schedule as needed.',
        'Schedule equipment maintenance before peak season.',
        'Update safety training for seasonal workers.',
        'Implement recommended soil amendments before next planting.',
        'Continue regular monitoring of pest traps.',
    ];

    const visits = [];
    const now = new Date(2026, 3, 20); // April 20, 2026
    let visitId = 1;

    // Generate visits for the past 12 months (average 10 per month = 120 total)
    for (let monthOffset = 0; monthOffset < 12; monthOffset++) {
        const visitsThisMonth = Math.floor(Math.random() * 6) + 8; // 8-13 visits per month
        
        for (let i = 0; i < visitsThisMonth; i++) {
            const visitDate = new Date(now.getFullYear(), now.getMonth() - monthOffset, Math.floor(Math.random() * 28) + 1);
            const hour = Math.floor(Math.random() * 8) + 8; // 8 AM to 4 PM
            const minute = [0, 15, 30, 45][Math.floor(Math.random() * 4)];
            
            visits.push({
                id: visitId++,
                date: visitDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
                time: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')} ${hour < 12 ? 'AM' : 'PM'}`,
                title: visitTypes[Math.floor(Math.random() * visitTypes.length)],
                officer: officers[Math.floor(Math.random() * officers.length)],
                location: locations[Math.floor(Math.random() * locations.length)],
                status: 'completed',
                findings: findings[Math.floor(Math.random() * findings.length)],
                recommendations: recommendations[Math.floor(Math.random() * recommendations.length)],
                documents: Math.random() > 0.5 
                    ? ['Inspection Report.pdf', 'Photo Documentation.zip']
                    : ['Inspection Report.pdf'],
            });
        }
    }

    // Sort by date (newest first)
    return visits.sort((a, b) => new Date(b.date) - new Date(a.date));
}

const mockFieldVisits = generateMockFieldVisits();

export default function FieldVisitTimeline() {
    const [expandedVisit, setExpandedVisit] = useState(null);

    const toggleVisit = (visitId) => {
        setExpandedVisit(expandedVisit === visitId ? null : visitId);
    };

    // Generate timeline data for the last 12 months
    const generateTimelineData = () => {
        const months = [];
        const today = new Date();
        
        for (let i = 11; i >= 0; i--) {
            const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
            months.push({
                month: date.toLocaleString('default', { month: 'short' }),
                year: date.getFullYear(),
                fullDate: date,
            });
        }
        
        return months;
    };

    const timelineMonths = generateTimelineData();

    // Check which months have visits
    const getVisitsForMonth = (month, year) => {
        return mockFieldVisits.filter(visit => {
            const visitDate = new Date(visit.date);
            return visitDate.getMonth() === new Date(`${month} 1, ${year}`).getMonth() &&
                   visitDate.getFullYear() === year;
        });
    };

    return (
        <div className="field-visit-timeline">
            <div className="timeline-header">
                <h1>Field Visit Timeline</h1>
                <p className="timeline-subtitle">Complete chronology of field officer visits and assessments</p>
            </div>

            <div className="timeline-stats">
                <div className="stat-box">
                    <span className="stat-value">{mockFieldVisits.length}</span>
                    <span className="stat-label">Total Visits</span>
                </div>
                <div className="stat-box">
                    <span className="stat-value">6</span>
                    <span className="stat-label">Active Officers</span>
                </div>
                <div className="stat-box">
                    <span className="stat-value">{mockUpcomingInspections.length}</span>
                    <span className="stat-label">Upcoming Visits</span>
                </div>
                <div className="stat-box">
                    <span className="stat-value">100%</span>
                    <span className="stat-label">Compliance Rate</span>
                </div>
            </div>

            {/* Upcoming Inspections Section */}
            <div className="upcoming-inspections-section">
                <h2 className="section-title">Upcoming Field Inspections</h2>
                <div className="upcoming-inspections-grid">
                    {mockUpcomingInspections.map((inspection) => (
                        <div key={inspection.id} className="upcoming-inspection-card">
                            <span className={`priority-badge ${inspection.priority}`}>
                                {inspection.priority}
                            </span>
                            <div className="inspection-date-time">
                                <Calendar size={16} />
                                <span>{inspection.date} • {inspection.time}</span>
                            </div>
                            <h3 className="inspection-title">{inspection.title}</h3>
                            <div className="inspection-officer">
                                <User size={16} />
                                <span>{inspection.officer.name} <span className="officer-role">• {inspection.officer.role}</span></span>
                            </div>
                            <div className="inspection-location">
                                <MapPin size={16} />
                                <span>{inspection.location}</span>
                            </div>
                            <p className="inspection-purpose">{inspection.purpose}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Visual Timeline Graph */}
            <div className="timeline-graph-section">
                <h2 className="section-title">12-Month Visit History</h2>
                <div className="timeline-graph">
                    <div className="timeline-line"></div>
                    {timelineMonths.map((monthData, index) => {
                        const visitsInMonth = getVisitsForMonth(monthData.month, monthData.year);
                        const hasVisits = visitsInMonth.length > 0;
                        
                        return (
                            <div key={index} className="timeline-month">
                                <div className={`timeline-marker ${hasVisits ? 'has-visits' : ''}`}>
                                    {hasVisits && (
                                        <div className="visit-count-badge">{visitsInMonth.length}</div>
                                    )}
                                </div>
                                <div className="timeline-month-label">
                                    <span className="month-name">{monthData.month}</span>
                                    {index % 3 === 0 && <span className="month-year">{monthData.year}</span>}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Past Visits Timeline */}
            <h2 className="section-title">Past Field Visits</h2>
            <div className="timeline-container">
                {mockFieldVisits.map((visit) => (
                    <div key={visit.id} className={`timeline-visit-card ${expandedVisit === visit.id ? 'expanded' : ''}`}>
                        <div className="visit-timeline-marker"></div>
                        
                        <div className="visit-card-header" onClick={() => toggleVisit(visit.id)}>
                            <div className="visit-main-info">
                                <div className="visit-date-section">
                                    <Calendar size={18} className="text-primary" />
                                    <span className="visit-date">{visit.date}</span>
                                    <Clock size={14} className="text-secondary" />
                                    <span className="visit-time">{visit.time}</span>
                                </div>
                                <h3 className="visit-title">{visit.title}</h3>
                                <div className="visit-meta">
                                    <div className="meta-item">
                                        <User size={14} />
                                        <span>{visit.officer.name}</span>
                                        <span className="text-secondary">• {visit.officer.role}</span>
                                    </div>
                                    <div className="meta-item">
                                        <MapPin size={14} />
                                        <span>{visit.location}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="visit-expand-btn">
                                {expandedVisit === visit.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                            </div>
                        </div>

                        {expandedVisit === visit.id && (
                            <div className="visit-card-body">
                                <div className="visit-section">
                                    <h4>Findings</h4>
                                    <p>{visit.findings}</p>
                                </div>
                                
                                <div className="visit-section">
                                    <h4>Recommendations</h4>
                                    <p>{visit.recommendations}</p>
                                </div>

                                <div className="visit-section">
                                    <h4>Documentation</h4>
                                    <div className="document-list">
                                        {visit.documents.map((doc, idx) => (
                                            <div key={idx} className="document-item">
                                                <FileText size={16} />
                                                <span>{doc}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="visit-status">
                                    <span className={`status-badge ${visit.status}`}>
                                        {visit.status === 'completed' ? 'Completed' : visit.status}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
