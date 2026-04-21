import { useState, useEffect } from 'react';
import { Calendar, User, MapPin, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { fieldVisitsApi } from '../services/fieldVisitsApi';
import './FieldVisits.css';

export default function FieldVisits() {
    const [allVisits, setAllVisits] = useState([]);
    const [upcomingVisits, setUpcomingVisits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [timePeriod, setTimePeriod] = useState('1year');
    const [expandedVisit, setExpandedVisit] = useState(null);
    const [selectedMonthData, setSelectedMonthData] = useState(null);

    // Fetch field visits from database
    useEffect(() => {
        const loadVisits = async () => {
            setLoading(true);
            try {
                const visits = await fieldVisitsApi.getAll();
                if (visits && Array.isArray(visits)) {
                    // Sort by date
                    const sorted = [...visits].sort((a, b) => 
                        new Date(b.scheduledDate) - new Date(a.scheduledDate)
                    );
                    setAllVisits(sorted);

                    // Separate upcoming and past visits
                    const now = new Date();
                    const upcoming = sorted.filter(v => 
                        v.status?.toLowerCase() === 'scheduled' && 
                        new Date(v.scheduledDate) > now
                    ).slice(0, 3); // Show only next 3 scheduled
                    setUpcomingVisits(upcoming);
                }
            } catch (err) {
                console.error('Error loading field visits:', err);
                setAllVisits([]);
                setUpcomingVisits([]);
            } finally {
                setLoading(false);
            }
        };

        loadVisits();
    }, []);

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
            
            const visitsInMonth = allVisits.filter(visit => {
                const visitDate = new Date(visit.scheduledDate);
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
        const sorted = [...allVisits]
            .filter(v => v.status?.toLowerCase() === 'completed')
            .sort((a, b) => new Date(b.scheduledDate) - new Date(a.scheduledDate));
        return sorted.slice(0, 10);
    }

    // Get visits for a specific month
    function getVisitsForMonth(monthData) {
        return allVisits
            .filter(v => v.status?.toLowerCase() === 'completed')
            .filter(visit => {
                const visitDate = new Date(visit.scheduledDate);
                return visitDate.getMonth() === monthData.date.getMonth() && 
                       visitDate.getFullYear() === monthData.date.getFullYear();
            })
            .sort((a, b) => new Date(b.scheduledDate) - new Date(a.scheduledDate));
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
                    <span className="stat-value">{allVisits.length}</span>
                    <span className="stat-label">Total Visits</span>
                </div>
                <div className="stat-box">
                    <span className="stat-value">{new Set(allVisits.map(v => v.officerId)).size}</span>
                    <span className="stat-label">Active Officers</span>
                </div>
                <div className="stat-box">
                    <span className="stat-value">{upcomingVisits.length}</span>
                    <span className="stat-label">Upcoming Visits</span>
                </div>
            </div>

            {/* Upcoming Inspections Section */}
            <div className="upcoming-inspections-section">
                <h2 className="section-title">Upcoming Field Inspections</h2>
                {upcomingVisits.length === 0 ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: '#9ca3af' }}>
                        <p>No upcoming field visits scheduled</p>
                    </div>
                ) : (
                    <div className="upcoming-inspections-grid">
                        {upcomingVisits.map((visit) => (
                            <div key={visit.id} className="upcoming-inspection-card">
                                <span className={`priority-badge ${visit.priority?.toLowerCase() || 'medium'}`}>
                                    {visit.priority || 'normal'}
                                </span>
                                <div className="inspection-date-time">
                                    <Calendar size={16} />
                                    <span>{new Date(visit.scheduledDate).toLocaleDateString()} • {visit.scheduledTime || '—'}</span>
                                </div>
                                <h3 className="inspection-title">{visit.title}</h3>
                                <div className="inspection-officer">
                                    <User size={16} />
                                    <span>{visit.officerName || 'Field Officer'}</span>
                                </div>
                                <div className="inspection-location">
                                    <MapPin size={16} />
                                    <span>{visit.location || 'TBD'}</span>
                                </div>
                                <p className="inspection-purpose">{visit.notes || visit.title}</p>
                            </div>
                        ))}
                    </div>
                )}
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
                                            <span>{new Date(visit.scheduledDate).toLocaleDateString()}</span>
                                        </div>
                                        <div className="visit-meta">
                                            <span className="visit-type-badge">{visit.title}</span>
                                            <button className="expand-btn">
                                                {expandedVisit === visit.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="visit-card-body">
                                        <div className="visit-info-row">
                                            <User size={16} />
                                            <span>{visit.officerName || 'Field Officer'}</span>
                                        </div>
                                        <div className="visit-info-row">
                                            <MapPin size={16} />
                                            <span>{visit.location}</span>
                                        </div>
                                    </div>
                                    {expandedVisit === visit.id && (
                                        <div className="visit-details-expanded">
                                            {visit.findings && (
                                                <div className="visit-section">
                                                    <h4>Findings</h4>
                                                    <p>{visit.findings}</p>
                                                </div>
                                            )}
                                            {visit.notes && (
                                                <div className="visit-section">
                                                    <h4>Notes</h4>
                                                    <p>{visit.notes}</p>
                                                </div>
                                            )}
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
            {loading ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#9ca3af' }}>
                    <p>Loading field visits...</p>
                </div>
            ) : getRecentVisits().length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#9ca3af' }}>
                    <p>No completed field visits found</p>
                </div>
            ) : (
                <div className="past-visits-timeline">
                    {getRecentVisits().map((visit) => (
                        <div key={visit.id} className="visit-card">
                            <div className="visit-card-header" onClick={() => setExpandedVisit(expandedVisit === visit.id ? null : visit.id)}>
                                <div className="visit-date">
                                    <Calendar size={16} />
                                    <span>{new Date(visit.scheduledDate).toLocaleDateString()}</span>
                                </div>
                                <div className="visit-meta">
                                    <span className="visit-type-badge">{visit.title}</span>
                                    <button className="expand-btn">
                                        {expandedVisit === visit.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                    </button>
                                </div>
                            </div>
                            <div className="visit-card-body">
                                <div className="visit-info-row">
                                    <User size={16} />
                                    <span>{visit.officerName || 'Field Officer'}</span>
                                </div>
                                <div className="visit-info-row">
                                    <MapPin size={16} />
                                    <span>{visit.location}</span>
                                </div>
                            </div>
                            {expandedVisit === visit.id && (
                                <div className="visit-details-expanded">
                                    {visit.findings && (
                                        <div className="visit-section">
                                            <h4>Findings</h4>
                                            <p>{visit.findings}</p>
                                        </div>
                                    )}
                                    {visit.notes && (
                                        <div className="visit-section">
                                            <h4>Notes</h4>
                                            <p>{visit.notes}</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
