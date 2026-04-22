import { useState, useEffect } from 'react';
import { Calendar, Clock, User, MapPin, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { fieldVisitsApi } from '../services/fieldVisitsApi';
import { fetchGrowerById } from '../services/growersApi';
import './FieldVisitTimeline.css';

export default function FieldVisitTimeline() {
    const { user } = useAuth();
    const [growerData, setGrowerData] = useState(null);
    const [upcomingVisits, setUpcomingVisits] = useState([]);
    const [pastVisits, setPastVisits] = useState([]);
    const [expandedVisit, setExpandedVisit] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!user?.growerId) {
            setError('No grower found. Please log in.');
            setLoading(false);
            return;
        }

        const fetchVisits = async () => {
            try {
                setLoading(true);
                const [upcoming, past, grower] = await Promise.all([
                    fieldVisitsApi.getUpcoming(user.growerId),
                    fieldVisitsApi.getPast(user.growerId),
                    fetchGrowerById(user.growerId).catch(() => null)
                ]);
                setUpcomingVisits(Array.isArray(upcoming) ? upcoming : []);
                setPastVisits(Array.isArray(past) ? past : []);
                setGrowerData(grower);
                setError(null);
            } catch (err) {
                console.error('Failed to fetch visits:', err);
                setError('Failed to load field visits');
                setUpcomingVisits([]);
                setPastVisits([]);
            } finally {
                setLoading(false);
            }
        };

        fetchVisits();
    }, [user?.growerId]);

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

    // Check which months have visits
    const getVisitsForMonth = (month, year) => {
        return pastVisits.filter(visit => {
            const visitDate = new Date(visit.scheduledDate);
            return visitDate.getMonth() === new Date(`${month} 1, ${year}`).getMonth() &&
                   visitDate.getFullYear() === year;
        });
    };

    const timelineMonths = generateTimelineData();
    const allVisits = [...upcomingVisits, ...pastVisits];

    if (loading) {
        return (
            <div className="field-visit-timeline">
                <div className="timeline-header">
                    <h1>Field Visit Timeline</h1>
                    <p className="timeline-subtitle">Loading field visit data...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="field-visit-timeline">
                <div className="timeline-header">
                    <h1>Field Visit Timeline</h1>
                    <p className="timeline-subtitle" style={{ color: '#d32f2f' }}>{error}</p>
                </div>
            </div>
        );
    }

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
                    <span className="stat-value">{new Set(allVisits.map(v => v.officerName)).size}</span>
                    <span className="stat-label">Active Officers</span>
                </div>
                <div className="stat-box">
                    <span className="stat-value">{upcomingVisits.length}</span>
                    <span className="stat-label">Upcoming Visits</span>
                </div>
                <div className="stat-box">
                    <span className="stat-value">{pastVisits.filter(v => v.status === 'completed').length}/{pastVisits.length}</span>
                    <span className="stat-label">Completed</span>
                </div>
            </div>

            {/* Upcoming Inspections Section */}
            <div className="upcoming-inspections-section">
                <h2 className="section-title">Upcoming Field Inspections</h2>
                <div className="upcoming-inspections-grid">
                    {upcomingVisits.length > 0 ? (
                        upcomingVisits.map((inspection) => (
                            <div key={inspection.fieldVisitId} className="upcoming-inspection-card">
                                <span className={`priority-badge ${inspection.priority || 'normal'}`}>
                                    {inspection.priority || 'normal'}
                                </span>
                                <div className="inspection-date-time">
                                    <Calendar size={16} />
                                    <span>{new Date(inspection.scheduledDate).toLocaleDateString()} • {inspection.scheduledTime}</span>
                                </div>
                                <h3 className="inspection-title">{inspection.title}</h3>
                                <div className="inspection-officer">
                                    <User size={16} />
                                    <span>{inspection.officerName}</span>
                                </div>
                                <div className="inspection-location">
                                    <MapPin size={16} />
                                    <span>
                                        {growerData?.gpsLat && growerData?.gpsLng
                                            ? `${growerData.gpsLat.toFixed(6)}, ${growerData.gpsLng.toFixed(6)}`
                                            : 'Location TBD'}
                                    </span>
                                </div>
                                <p className="inspection-purpose">{inspection.visitType}</p>
                            </div>
                        ))
                    ) : (
                        <p style={{ gridColumn: '1/-1', textAlign: 'center', color: '#999' }}>No upcoming inspections scheduled</p>
                    )}
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
                {pastVisits.length > 0 ? (
                    pastVisits.map((visit) => (
                        <div key={visit.id || visit.fieldVisitId} className={`timeline-visit-card ${expandedVisit === (visit.id || visit.fieldVisitId) ? 'expanded' : ''} ${visit.status === 'completed' ? 'completed' : ''}`}>
                            <div className="visit-timeline-marker"></div>
                            
                            <div className="visit-card-header" onClick={() => toggleVisit(visit.id || visit.fieldVisitId)}>
                                <div className="visit-main-info">
                                    <div className="visit-date-section">
                                        <Calendar size={18} className="text-primary" />
                                        <span className="visit-date">{new Date(visit.scheduledDate).toLocaleDateString()}</span>
                                        <Clock size={14} className="text-secondary" />
                                        <span className="visit-time">{visit.scheduledTime}</span>
                                    </div>
                                    <h3 className="visit-title">{visit.title}</h3>
                                    <div className="visit-meta">
                                        <div className="meta-item">
                                            <User size={14} />
                                            <span>{visit.officerName}</span>
                                        </div>
                                        <div className="meta-item">
                                            <MapPin size={14} />
                                            <span>
                                                {growerData?.gpsLat && growerData?.gpsLng
                                                    ? `${growerData.gpsLat.toFixed(6)}, ${growerData.gpsLng.toFixed(6)}`
                                                    : 'Location TBD'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="visit-expand-btn">
                                    {expandedVisit === (visit.id || visit.fieldVisitId) ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                </div>
                            </div>

                            {expandedVisit === (visit.id || visit.fieldVisitId) && (
                                <div className="visit-card-body">
                                    <div className="visit-section">
                                        <h4>Visit Type</h4>
                                        <p>{visit.visitType}</p>
                                    </div>

                                    {visit.findings && (
                                        <div className="visit-section">
                                            <h4>Findings & Observations</h4>
                                            <p>{visit.findings}</p>
                                        </div>
                                    )}
                                    
                                    {visit.notes && (
                                        <div className="visit-section">
                                            <h4>Notes</h4>
                                            <p>{visit.notes}</p>
                                        </div>
                                    )}

                                    <div className="visit-status">
                                        <span className={`status-badge ${visit.status}`}>
                                            {visit.status === 'completed' ? '✓ COMPLETED' : visit.status || 'scheduled'}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))
                ) : (
                    <p style={{ textAlign: 'center', color: '#999' }}>No past visits to display</p>
                )}
            </div>
        </div>
    );
}
