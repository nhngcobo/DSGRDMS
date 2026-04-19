import { useState } from 'react';
import { Calendar, Clock, User, MapPin, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import './FieldVisitTimeline.css';

const mockFieldVisits = [
    {
        id: 1,
        date: 'August 14, 2023',
        time: '09:30 AM',
        title: 'Post-Harvest Soil Audit',
        officer: { name: 'Marcus Thorne', role: 'Senior Field Officer' },
        location: 'Plot B, Northern Section',
        status: 'completed',
        findings: 'Observed excellent recovery of nitrogen levels after hazelnut harvest. Soil samples taken from 6 locations across the plot showed pH levels ranging from 8.2-8.6.',
        recommendations: 'Recommended minor lime amendment for Plot B to optimize nutrient uptake. Consider cover crops in rotation zones.',
        documents: ['Soil Analysis Report', 'Site Photography', 'Compliance Certificate'],
    },
    {
        id: 2,
        date: 'May 02, 2023',
        time: '10:00 AM',
        title: 'Biannual Certification Review',
        officer: { name: 'Sarah Chen', role: 'Certification Specialist' },
        location: 'Main Office & All Parcels',
        status: 'completed',
        findings: 'Full dossier inspection for USDA renewal. All documentation found in order. Parcel boundaries verified via drone telemetry. Water usage logs reviewed and approved.',
        recommendations: 'Continue current management practices. Next review scheduled for November 2023.',
        documents: ['USDA Renewal Certificate', 'Drone Survey Data', 'Water Usage Report'],
    },
    {
        id: 3,
        date: 'January 20, 2023',
        time: '02:15 PM',
        title: 'Emergency Frost Damage Assessment',
        officer: { name: 'James Mitchell', role: 'Agricultural Inspector' },
        location: 'Northern Corridor',
        status: 'completed',
        findings: 'Brief site visit following record low temperatures. Damage localized to young saplings in the northern corridor. Approximately 12% of young trees showed frost damage.',
        recommendations: 'Implement frost protection systems for vulnerable areas. Consider windbreak plantings on northern perimeter.',
        documents: ['Damage Assessment Report', 'Insurance Documentation'],
    },
    {
        id: 4,
        date: 'November 18, 2022',
        time: '11:00 AM',
        title: 'Pre-Harvest Inspection',
        officer: { name: 'Marcus Thorne', role: 'Senior Field Officer' },
        location: 'All Production Areas',
        status: 'completed',
        findings: 'Pre-harvest quality assessment conducted. Nut quality graded as premium. Equipment maintenance verified. Harvest timing approved.',
        recommendations: 'Proceed with harvest operations. Maintain moisture monitoring during storage.',
        documents: ['Quality Assessment', 'Equipment Inspection Log'],
    },
    {
        id: 5,
        date: 'August 30, 2022',
        time: '08:45 AM',
        title: 'Irrigation System Evaluation',
        officer: { name: 'Elena Rodriguez', role: 'Water Management Specialist' },
        location: 'All Irrigation Zones',
        status: 'completed',
        findings: 'Comprehensive evaluation of spring-fed irrigation system. Flow rates measured at 98% efficiency. Detection of minor leak in Zone 3.',
        recommendations: 'Repair identified leak in Zone 3. Schedule routine maintenance for fall season.',
        documents: ['Irrigation Audit Report', 'Flow Rate Analysis', 'Maintenance Schedule'],
    },
];

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
                    <span className="stat-value">3</span>
                    <span className="stat-label">Officers</span>
                </div>
                <div className="stat-box">
                    <span className="stat-value">100%</span>
                    <span className="stat-label">Compliance Rate</span>
                </div>
                <div className="stat-box">
                    <span className="stat-value">12 mo</span>
                    <span className="stat-label">Last Visit</span>
                </div>
            </div>

            {/* Visual Timeline Graph */}
            <div className="timeline-graph-section">
                <h3>12-Month Visit Activity</h3>
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
