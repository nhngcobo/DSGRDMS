import { useState, useEffect, useCallback } from 'react';
import { Eye, Search, ChevronLeft, ChevronRight, Calendar, Plus, FileText } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { fieldVisitsApi } from '../services/fieldVisitsApi';
import { fetchGrowers } from '../services/growersApi';
import { friendlyError } from '../utils/apiErrors';
import ScheduleVisitModal from '../components/modals/ScheduleVisitModal';
import LogFindingsModal from '../components/modals/LogFindingsModal';
import ViewFindingsModal from '../components/modals/ViewFindingsModal';
import './FieldVisitCoordination.css';

const PAGE_SIZE = 10;

export default function FieldVisitCoordination() {
    const { user } = useAuth();
    const { showError } = useNotification();
    
    const [visits, setVisits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [visitStatusFilter, setVisitStatusFilter] = useState('All');
    const [page, setPage] = useState(1);
    
    const [schedulingGrowerId, setSchedulingGrowerId] = useState(null);
    const [loggingVisitId, setLoggingVisitId] = useState(null);
    const [loggingVisitData, setLoggingVisitData] = useState(null);
    const [viewingVisitId, setViewingVisitId] = useState(null);

    const VISIT_STATUS_FILTERS = ['All', 'scheduled', 'in_progress', 'completed'];

    // Reset page when filter/search changes
    useEffect(() => { setPage(1); }, [search, visitStatusFilter]);

    const loadVisits = useCallback(async () => {
        setLoading(true);
        try {
            const [allVisits, growers] = await Promise.all([
                fieldVisitsApi.getAll(),
                fetchGrowers().catch(() => [])
            ]);
            
            // Create a map of growers by ID for quick lookup
            const growerMap = {};
            (growers || []).forEach(g => {
                growerMap[g.id] = g;
            });
            
            // Enrich visits with grower GPS data
            const enrichedVisits = (allVisits || []).map(visit => ({
                ...visit,
                growerGpsLat: growerMap[visit.growerId]?.gpsLat,
                growerGpsLng: growerMap[visit.growerId]?.gpsLng,
            }));
            
            setVisits(enrichedVisits);
        } catch (err) {
            showError(friendlyError(err));
            setVisits([]);
        } finally {
            setLoading(false);
        }
    }, [showError]);

    useEffect(() => { loadVisits(); }, [loadVisits]);

    // Filter visits
    const filtered = visits.filter(visit => {
        const matchesFilter =
            visitStatusFilter === 'All' ||
            visit.status?.toLowerCase() === visitStatusFilter;
        
        const q = search.toLowerCase();
        const matchesSearch =
            !q ||
            visit.title?.toLowerCase().includes(q) ||
            visit.growerId?.toLowerCase().includes(q) ||
            visit.growerName?.toLowerCase().includes(q) ||
            visit.location?.toLowerCase().includes(q);
        
        return matchesFilter && matchesSearch;
    });

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    // Statistics
    const stats = {
        total: visits.length,
        scheduled: visits.filter(v => v.status?.toLowerCase() === 'scheduled').length,
        inProgress: visits.filter(v => v.status?.toLowerCase() === 'in_progress').length,
        completed: visits.filter(v => v.status?.toLowerCase() === 'completed').length,
    };

    const handleScheduleVisit = (growerId) => {
        setSchedulingGrowerId(growerId);
    };

    const handleLogFindings = (visitId, visitData) => {
        setLoggingVisitId(visitId);
        setLoggingVisitData(visitData);
    };

    const handleViewFindings = (visitId) => {
        setViewingVisitId(visitId);
    };

    const handleVisitScheduled = async () => {
        setSchedulingGrowerId(null);
        await loadVisits();
    };

    const handleFindingsLogged = async () => {
        setLoggingVisitId(null);
        setLoggingVisitData(null);
        await loadVisits();
    };

    const getStatusBadgeClass = (status) => {
        switch (status?.toLowerCase()) {
            case 'scheduled': return 'badge-scheduled';
            case 'in_progress': return 'badge-visited';
            case 'completed': return 'badge-completed';
            default: return '';
        }
    };

    const getStatusLabel = (status) => {
        switch (status?.toLowerCase()) {
            case 'scheduled': return 'Scheduled';
            case 'in_progress': return 'In Progress';
            case 'completed': return 'Completed';
            default: return status || 'Unknown';
        }
    };

    const getVisitForModal = (visitId) => {
        return visits.find(v => v.id === visitId);
    };

    return (
        <div className="fv-coordination-page">
            <div className="fv-coordination-header">
                <div>
                    <h1>Field Visit Coordination</h1>
                    <p>Manage all scheduled field visits</p>
                </div>
            </div>

            {/* Statistics overview */}
            <div className="fv-stats">
                <div className="stat-card">
                    <div className="stat-label">Total Visits</div>
                    <div className="stat-value">{stats.total}</div>
                </div>
                <div className="stat-card scheduled">
                    <div className="stat-label">Scheduled</div>
                    <div className="stat-value">{stats.scheduled}</div>
                </div>
                <div className="stat-card visited">
                    <div className="stat-label">In Progress</div>
                    <div className="stat-value">{stats.inProgress}</div>
                </div>
                <div className="stat-card completed">
                    <div className="stat-label">Completed</div>
                    <div className="stat-value">{stats.completed}</div>
                </div>
            </div>

            {/* Search and Filter */}
            <div className="fv-controls">
                <div className="search-box">
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder="Search by grower, visit title, or location..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>

                <div className="filter-buttons">
                    {VISIT_STATUS_FILTERS.map(status => (
                        <button
                            key={status}
                            className={`filter-btn ${visitStatusFilter === status ? 'active' : ''}`}
                            onClick={() => setVisitStatusFilter(status)}
                        >
                            {status === 'All' ? 'All' : getStatusLabel(status)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Visits List */}
            <div className="fv-content">
                {loading ? (
                    <div className="fv-loading">Loading field visits...</div>
                ) : paged.length === 0 ? (
                    <div className="fv-empty">
                        <p>No field visits found</p>
                    </div>
                ) : (
                    <div className="fv-table-wrapper">
                        <table className="fv-table">
                            <thead>
                                <tr>
                                    <th>Grower</th>
                                    <th>Visit Title</th>
                                    <th>Status</th>
                                    <th>Scheduled Date</th>
                                    <th>Location</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paged.map(visit => (
                                    <tr key={visit.id}>
                                        <td>
                                            <div className="app-info">
                                                <div className="app-name">{visit.growerName}</div>
                                                <div className="app-id">{visit.growerId}</div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="visit-title">{visit.title}</div>
                                        </td>
                                        <td>
                                            <span className={`badge ${getStatusBadgeClass(visit.status)}`}>
                                                {getStatusLabel(visit.status)}
                                            </span>
                                        </td>
                                        <td>
                                            {visit.scheduledDate ? (
                                                <div className="visit-date">
                                                    <Calendar size={14} />
                                                    <span>{new Date(visit.scheduledDate).toLocaleDateString()}</span>
                                                </div>
                                            ) : (
                                                <span className="text-muted">—</span>
                                            )}
                                        </td>
                                        <td className="location-cell">
                                            {visit.growerGpsLat && visit.growerGpsLng ? (
                                                <div className="location-info">
                                                    <div className="location-label">Latitude</div>
                                                    <div className="location-value">{visit.growerGpsLat.toFixed(6)}</div>
                                                    <div className="location-label">Longitude</div>
                                                    <div className="location-value">{visit.growerGpsLng.toFixed(6)}</div>
                                                </div>
                                            ) : (
                                                <span className="text-muted">—</span>
                                            )}
                                        </td>
                                        <td>
                                            <div className="action-buttons">
                                                {!visit.status || visit.status?.toLowerCase() === 'pending' ? (
                                                    <button
                                                        className="btn-action btn-schedule"
                                                        onClick={() => handleScheduleVisit(visit.growerId)}
                                                        title="Schedule new visit"
                                                    >
                                                        <Plus size={16} />
                                                        Schedule
                                                    </button>
                                                ) : null}
                                                {visit.status?.toLowerCase() === 'scheduled' && (
                                                    <button
                                                        className="btn-action btn-log-findings"
                                                        onClick={() => handleLogFindings(visit.id, visit)}
                                                        title="Log visit findings"
                                                    >
                                                        <FileText size={16} />
                                                        Log
                                                    </button>
                                                )}
                                                {(visit.status?.toLowerCase() === 'in_progress' || 
                                                  visit.status?.toLowerCase() === 'completed') && 
                                                  visit.findings && (
                                                    <button
                                                        className="btn-action btn-view-findings"
                                                        onClick={() => handleViewFindings(visit.id)}
                                                        title="View findings"
                                                    >
                                                        <Eye size={16} />
                                                        View
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {!loading && totalPages > 1 && (
                    <div className="fv-pagination">
                        <button
                            className="pagination-btn"
                            onClick={() => setPage(p => p - 1)}
                            disabled={page === 1}
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <span className="pagination-page">Page {page} of {totalPages}</span>
                        <button
                            className="pagination-btn"
                            onClick={() => setPage(p => p + 1)}
                            disabled={page === totalPages}
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                )}
            </div>

            {/* Modals */}
            {schedulingGrowerId && (
                <ScheduleVisitModal
                    growerId={schedulingGrowerId}
                    onSuccess={handleVisitScheduled}
                    onClose={() => setSchedulingGrowerId(null)}
                />
            )}

            {loggingVisitId && (
                <LogFindingsModal
                    visitId={loggingVisitId}
                    grower={{
                        id: loggingVisitData?.growerId,
                        name: loggingVisitData?.growerName
                    }}
                    onSuccess={handleFindingsLogged}
                    onClose={() => {
                        setLoggingVisitId(null);
                        setLoggingVisitData(null);
                    }}
                />
            )}

            {viewingVisitId && (() => {
                const visitData = getVisitForModal(viewingVisitId);
                return visitData ? (
                    <ViewFindingsModal
                        visitId={viewingVisitId}
                        grower={{ id: visitData.growerId, name: visitData.growerName }}
                        findings={visitData.findings}
                        onClose={() => setViewingVisitId(null)}
                    />
                ) : null;
            })()}
        </div>
    );
}
