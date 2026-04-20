import { useState } from 'react';
import { Calendar, User, MapPin, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import './FieldVisits.css';

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

export default function FieldVisits() {
    const [timePeriod, setTimePeriod] = useState('1year'); // '3months', '6months', '1year'
    const [expandedVisit, setExpandedVisit] = useState(null);
    const [selectedMonthData, setSelectedMonthData] = useState(null);

    // Generate chart data based on time period
    function generateChartData(period) {
        const now = new Date(2026, 3, 20); // April 20, 2026
        let monthsToShow = 12;
        if (period === '3months') monthsToShow = 3;
        if (period === '6months') monthsToShow = 6;

        const dataPoints = [];
        for (let i = monthsToShow - 1; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthIndex = date.getMonth();
            const year = date.getFullYear();
            
            const visitsInMonth = mockFieldVisits.filter(visit => {
                const visitDate = new Date(visit.date);
                return visitDate.getMonth() === monthIndex && visitDate.getFullYear() === year;
            });

            dataPoints.push({
                month: date.toLocaleString('default', { month: 'short' }),
                year: year,
                fullMonth: date.toLocaleString('default', { month: 'long' }),
                count: visitsInMonth.length,
                date: date,
            });
        }
        return dataPoints;
    }

    const chartData = generateChartData(timePeriod);

    // Generate smooth SVG path for line chart
    function generateSmoothPath(data, width, height, padding) {
        if (data.length === 0) return '';

        const maxValue = Math.max(...data.map(d => d.count));
        const minValue = Math.min(...data.map(d => d.count));
        const valueRange = maxValue - minValue || 1;

        const xStep = (width - padding * 2) / (data.length - 1);
        const yScale = (height - padding * 2) / valueRange;

        // Calculate points
        const points = data.map((d, i) => ({
            x: padding + i * xStep,
            y: height - padding - (d.count - minValue) * yScale,
        }));

        // Create smooth curve using quadratic bezier
        let path = `M ${points[0].x} ${points[0].y}`;
        for (let i = 0; i < points.length - 1; i++) {
            const xMid = (points[i].x + points[i + 1].x) / 2;
            const yMid = (points[i].y + points[i + 1].y) / 2;
            const cpX1 = (xMid + points[i].x) / 2;
            const cpX2 = (xMid + points[i + 1].x) / 2;
            path += ` Q ${cpX1} ${points[i].y}, ${xMid} ${yMid}`;
            path += ` Q ${cpX2} ${points[i + 1].y}, ${points[i + 1].x} ${points[i + 1].y}`;
        }
        return { path, points, minValue, maxValue, valueRange };
    }

    // Get recent past visits for timeline list
    function getRecentVisits() {
        const sorted = [...mockFieldVisits].sort((a, b) => new Date(b.date) - new Date(a.date));
        return sorted.slice(0, 10);
    }

    // Get visits for a specific month
    function getVisitsForMonth(monthData) {
        return mockFieldVisits.filter(visit => {
            const visitDate = new Date(visit.date);
            return visitDate.getMonth() === monthData.date.getMonth() && 
                   visitDate.getFullYear() === monthData.date.getFullYear();
        }).sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    // Handle month point click
    function handleMonthClick(monthData) {
        setSelectedMonthData(monthData);
        setExpandedVisit(null);
    }

    // Close month detail view
    function closeMonthDetail() {
        setSelectedMonthData(null);
        setExpandedVisit(null);
    }

    const recentVisits = getRecentVisits();

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

            {/* Visit Trends Chart */}
            <h2 className="section-title">Visit Trends</h2>
            <div className="chart-container">
                <div className="chart-wrapper">
                    <svg className="line-chart" viewBox="0 0 1000 300" preserveAspectRatio="xMidYMid meet">
                        {(() => {
                            const { path, points, minValue, maxValue } = generateSmoothPath(chartData, 1000, 300, 60);
                            
                            // Y-axis labels
                            const yLabels = [
                                { value: maxValue, y: 60 },
                                { value: Math.round((maxValue + minValue) / 2), y: 150 },
                                { value: minValue, y: 240 },
                            ];

                            return (
                                <>
                                    {/* Y-axis labels */}
                                    {yLabels.map((label, i) => (
                                        <text
                                            key={`y-${i}`}
                                            x="970"
                                            y={label.y}
                                            className="chart-y-label"
                                            textAnchor="start"
                                            dominantBaseline="middle"
                                        >
                                            {label.value}
                                        </text>
                                    ))}

                                    {/* X-axis labels */}
                                    {chartData.map((d, i) => {
                                        const showLabel = timePeriod === '1year' ? i % 3 === 0 : true;
                                        if (!showLabel) return null;
                                        const x = 60 + (i * (1000 - 120) / (chartData.length - 1));
                                        const yearSuffix = d.year === 2025 ? " '25" : (d.year === 2026 && i === chartData.length - 1) ? " '26" : '';
                                        return (
                                            <text
                                                key={`x-${i}`}
                                                x={x}
                                                y="280"
                                                className="chart-x-label"
                                                textAnchor="middle"
                                            >
                                                {d.month}{yearSuffix}
                                            </text>
                                        );
                                    })}

                                    {/* Line path */}
                                    <path
                                        d={path}
                                        className="chart-line"
                                        fill="none"
                                        stroke="#426468"
                                        strokeWidth="2.5"
                                    />

                                    {/* Data points */}
                                    {points.map((point, i) => (
                                        <g key={`point-${i}`}>
                                            <circle
                                                cx={point.x}
                                                cy={point.y}
                                                r="8"
                                                className="chart-dot-hitarea"
                                                fill="transparent"
                                                onClick={() => handleMonthClick(chartData[i])}
                                            />
                                            <circle
                                                cx={point.x}
                                                cy={point.y}
                                                r="4"
                                                className={`chart-dot ${selectedMonthData?.month === chartData[i].month && selectedMonthData?.year === chartData[i].year ? 'active' : ''}`}
                                                fill="#426468"
                                                onClick={() => handleMonthClick(chartData[i])}
                                            />
                                        </g>
                                    ))}
                                </>
                            );
                        })()}
                    </svg>
                </div>

                {/* Time Period Filters */}
                <div className="time-period-filters">
                    <button
                        className={`period-btn ${timePeriod === '3months' ? 'active' : ''}`}
                        onClick={() => setTimePeriod('3months')}
                    >
                        3 months
                    </button>
                    <button
                        className={`period-btn ${timePeriod === '6months' ? 'active' : ''}`}
                        onClick={() => setTimePeriod('6months')}
                    >
                        6 months
                    </button>
                    <button
                        className={`period-btn ${timePeriod === '1year' ? 'active' : ''}`}
                        onClick={() => setTimePeriod('1year')}
                    >
                        1 year
                    </button>
                </div>
            </div>

            {/* Month Detail Modal */}
            {selectedMonthData && (
                <div className="month-detail-modal" onClick={closeMonthDetail}>
                    <div className="month-detail-content" onClick={(e) => e.stopPropagation()}>
                        <div className="month-detail-header">
                            <div>
                                <h2>{selectedMonthData.fullMonth} {selectedMonthData.year}</h2>
                                <p className="month-detail-subtitle">{getVisitsForMonth(selectedMonthData).length} visits this month</p>
                            </div>
                            <button className="close-modal-btn" onClick={closeMonthDetail}>
                                <ChevronUp size={24} />
                            </button>
                        </div>
                        <div className="month-visits-list">
                            {getVisitsForMonth(selectedMonthData).map((visit) => (
                                <div key={visit.id} className="visit-card">
                                    <div className="visit-card-header" onClick={() => setExpandedVisit(expandedVisit === visit.id ? null : visit.id)}>
                                        <div className="visit-date">
                                            <Calendar size={16} />
                                            <span>{visit.date}</span>
                                        </div>
                                        <div className="visit-meta">
                                            <span className="visit-type-badge">{visit.type}</span>
                                            <button className="expand-btn">
                                                {expandedVisit === visit.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="visit-card-body">
                                        <div className="visit-info-row">
                                            <User size={16} />
                                            <span>{visit.officer.name}</span>
                                        </div>
                                        <div className="visit-info-row">
                                            <MapPin size={16} />
                                            <span>{visit.location}</span>
                                        </div>
                                    </div>
                                    {expandedVisit === visit.id && (
                                        <div className="visit-details-expanded">
                                            <div className="visit-section">
                                                <h4>Key Findings</h4>
                                                <p>{visit.findings}</p>
                                            </div>
                                            <div className="visit-section">
                                                <h4>Recommendations</h4>
                                                <p>{visit.recommendations}</p>
                                            </div>
                                            <div className="visit-section">
                                                <h4>Documents</h4>
                                                <div className="document-list">
                                                    {visit.documents.map((doc, i) => (
                                                        <div key={i} className="document-item">
                                                            <FileText size={14} />
                                                            <span>{doc}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Recent Past Visits */}
            <h2 className="section-title">Recent Past Visits</h2>
            <div className="past-visits-timeline">
                {recentVisits.map((visit) => (
                    <div key={visit.id} className="visit-card">
                        <div className="visit-card-header" onClick={() => setExpandedVisit(expandedVisit === visit.id ? null : visit.id)}>
                            <div className="visit-date">
                                <Calendar size={16} />
                                <span>{visit.date}</span>
                            </div>
                            <div className="visit-meta">
                                <span className="visit-type-badge">{visit.type}</span>
                                <button className="expand-btn">
                                    {expandedVisit === visit.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                </button>
                            </div>
                        </div>
                        <div className="visit-card-body">
                            <div className="visit-info-row">
                                <User size={16} />
                                <span>{visit.officer.name}</span>
                            </div>
                            <div className="visit-info-row">
                                <MapPin size={16} />
                                <span>{visit.location}</span>
                            </div>
                        </div>
                        {expandedVisit === visit.id && (
                            <div className="visit-details-expanded">
                                <div className="visit-section">
                                    <h4>Key Findings</h4>
                                    <p>{visit.findings}</p>
                                </div>
                                <div className="visit-section">
                                    <h4>Recommendations</h4>
                                    <p>{visit.recommendations}</p>
                                </div>
                                <div className="visit-section">
                                    <h4>Documents</h4>
                                    <div className="document-list">
                                        {visit.documents.map((doc, i) => (
                                            <div key={i} className="document-item">
                                                <FileText size={14} />
                                                <span>{doc}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
