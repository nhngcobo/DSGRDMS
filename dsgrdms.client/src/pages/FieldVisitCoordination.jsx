import { useState, useEffect, useCallback } from 'react';
import { Eye, Search, ChevronLeft, ChevronRight, Calendar, Plus, Clock, MapPin, FileText } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { fetchGrowers } from '../services/growersApi';
import { fieldVisitsApi } from '../services/fieldVisitsApi';
import { friendlyError } from '../utils/apiErrors';
import ScheduleVisitModal from '../components/modals/ScheduleVisitModal';
import LogFindingsModal from '../components/modals/LogFindingsModal';
import ViewFindingsModal from '../components/modals/ViewFindingsModal';
import './FieldVisitCoordination.css';

const PAGE_SIZE = 10;

export default function FieldVisitCoordination() {
    const { user } = useAuth();
    const { showError } = useNotification();
    
    const [applications, setApplications] = useState([]);
    const [visits, setVisits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [visitStatusFilter, setVisitStatusFilter] = useState('All'); // All, Pending, Scheduled, Visited, Completed
    const [page, setPage] = useState(1);
    
    const [schedulingAppId, setSchedulingAppId] = useState(null);
    const [loggingVisitId, setLoggingVisitId] = useState(null);
    const [viewingFindingsAppId, setViewingFindingsAppId] = useState(null);

    const VISIT_STATUS_FILTERS = ['All', 'Pending', 'Scheduled', 'Visited', 'Completed'];

    // Reset page when filter/search changes
    useEffect(() => { setPage(1); }, [search, visitStatusFilter]);

    const loadApplications = useCallback(async () => {
        setLoading(true);
        try {
            const [data, allVisits] = await Promise.all([
                fetchGrowers(),
                fieldVisitsApi.getAll().catch(() => []) // Get all field visits
            ]);
            
            setVisits(allVisits || []);
            
            // Add visit status to each application
            const withVisitStatus = (data || []).map(app => {
                const latestVisit = (allVisits || [])
                    .filter(v => v.growerId === app.id)
                    .sort((a, b) => new Date(b.scheduledDate) - new Date(a.scheduledDate))[0];
                
                return {
                    ...app,
                    visitId: latestVisit?.id,
                    visitStatus: latestVisit?.status === 'scheduled' ? 'Scheduled' : 
                               latestVisit?.status === 'in_progress' ? 'Visited' :
                               latestVisit?.status === 'completed' ? 'Completed' :
                               latestVisit ? 'Visited' : 'Pending',
                    scheduledDate: latestVisit?.scheduledDate || null,
                    findings: latestVisit?.findings || null,
                };
            });
            setApplications(withVisitStatus);
        } catch (err) {
            showError(friendlyError(err));
            setApplications([]);
        } finally {
            setLoading(false);
        }
    }, [showError]);

    useEffect(() => { loadApplications(); }, [loadApplications]);

    // Filter applications
    const filtered = applications.filter(app => {
        const matchesFilter =
            visitStatusFilter === 'All' ||
            app.visitStatus === visitStatusFilter;
        
        const q = search.toLowerCase();
        const matchesSearch =
            !q ||
            app.name.toLowerCase().includes(q) ||
            app.id.toLowerCase().includes(q) ||
            (app.email && app.email.toLowerCase().includes(q));
        
        return matchesFilter && matchesSearch;
    });

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    // Statistics
    const stats = {
        total: applications.length,
        pending: applications.filter(a => a.visitStatus === 'Pending').length,
        scheduled: applications.filter(a => a.visitStatus === 'Scheduled').length,
        visited: applications.filter(a => a.visitStatus === 'Visited').length,
        completed: applications.filter(a => a.visitStatus === 'Completed').length,
    };

    const handleScheduleVisit = (appId) => {
        setSchedulingAppId(appId);
    };

    const handleLogFindings = (appId) => {
        const app = applications.find(a => a.id === appId);
        if (app?.visitId) {
            setLoggingVisitId(app.visitId);
        }
    };

    const handleViewFindings = (appId) => {
        setViewingFindingsAppId(appId);
    };

    const handleVisitScheduled = async () => {
        setSchedulingAppId(null);
        await loadApplications(); // Refresh data
    };

    const handleFindingsLogged = async () => {
        setLoggingVisitId(null);
        await loadApplications(); // Refresh data
    };

    const getStatusBadgeClass = (status) => {
        switch (status) {
            case 'Pending': return 'badge-pending';
            case 'Scheduled': return 'badge-scheduled';
            case 'Visited': return 'badge-visited';
            case 'Completed': return 'badge-completed';
            default: return '';
        }
    };

    return (
        <div className="fv-coordination-page">
            <div className="fv-coordination-header">
                <div>
                    <h1>Field Visit Coordination</h1>
                    <p>Schedule and manage field visits for grower applications</p>
                </div>
            </div>

            {/* Statistics overview */}
            <div className="fv-stats">
                <div className="stat-card">
                    <div className="stat-label">Total</div>
                    <div className="stat-value">{stats.total}</div>
                </div>
                <div className="stat-card pending">
                    <div className="stat-label">Pending Visit</div>
                    <div className="stat-value">{stats.pending}</div>
                </div>
                <div className="stat-card scheduled">
                    <div className="stat-label">Scheduled</div>
                    <div className="stat-value">{stats.scheduled}</div>
                </div>
                <div className="stat-card visited">
                    <div className="stat-label">Visited</div>
                    <div className="stat-value">{stats.visited}</div>
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
                        placeholder="Search by grower name or ID..."
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
                            {status}
                        </button>
                    ))}
                </div>
            </div>

            {/* Applications List */}
            <div className="fv-content">
                {loading ? (
                    <div className="fv-loading">Loading agreements...</div>
                ) : paged.length === 0 ? (
                    <div className="fv-empty">
                        <p>No applications found</p>
                    </div>
                ) : (
                    <div className="fv-table-wrapper">
                        <table className="fv-table">
                            <thead>
                                <tr>
                                    <th>Grower</th>
                                    <th>Status</th>
                                    <th>Visit Status</th>
                                    <th>Scheduled Date</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paged.map(app => (
                                    <tr key={app.id}>
                                        <td>
                                            <div className="app-info">
                                                <div className="app-name">{app.name}</div>
                                                <div className="app-id">{app.id}</div>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`badge badge-status-${app.status?.toLowerCase()}`}>
                                                {app.status}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`badge ${getStatusBadgeClass(app.visitStatus)}`}>
                                                {app.visitStatus}
                                            </span>
                                        </td>
                                        <td>
                                            {app.scheduledDate ? (
                                                <div className="visit-date">
                                                    <Calendar size={14} />
                                                    <span>{new Date(app.scheduledDate).toLocaleDateString()}</span>
                                                </div>
                                            ) : (
                                                <span className="text-muted">—</span>
                                            )}
                                        </td>
                                        <td>
                                            <div className="action-buttons">
                                                <button
                                                    className="btn-action btn-schedule"
                                                    onClick={() => handleScheduleVisit(app.id)}
                                                    disabled={app.visitStatus === 'Completed'}
                                                    title={app.visitStatus === 'Completed' ? 'Visit completed' : 'Schedule visit'}
                                                >
                                                    <Plus size={16} />
                                                    Schedule
                                                </button>
                                                {app.visitStatus === 'Scheduled' && (
                                                    <button
                                                        className="btn-action btn-log-findings"
                                                        onClick={() => handleLogFindings(app.id)}
                                                        title="Log visit findings"
                                                    >
                                                        <FileText size={16} />
                                                        Findings
                                                    </button>
                                                )}
                                                {(app.visitStatus === 'Visited' || app.visitStatus === 'Completed') && app.findings && (
                                                    <button
                                                        className="btn-action btn-view-findings"
                                                        onClick={() => handleViewFindings(app.id)}
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

            {/* Schedule Visit Modal */}
            {schedulingAppId && (
                <ScheduleVisitModal
                    applicationId={schedulingAppId}
                    grower={applications.find(a => a.id === schedulingAppId)}
                    onClose={() => setSchedulingAppId(null)}
                    onScheduled={handleVisitScheduled}
                />
            )}

            {/* Log Findings Modal */}
            {loggingVisitId && (
                <LogFindingsModal
                    visitId={loggingVisitId}
                    grower={applications.find(a => a.visitId === loggingVisitId)}
                    onClose={() => setLoggingVisitId(null)}
                    onSaved={handleFindingsLogged}
                />
            )}

            {/* View Findings Modal */}
            {viewingFindingsAppId && (() => {
                const app = applications.find(a => a.id === viewingFindingsAppId);
                return app ? (
                    <ViewFindingsModal
                        visitId={app.visitId}
                        grower={app}
                        findings={app.findings}
                        onClose={() => setViewingFindingsAppId(null)}
                    />
                ) : null;
            })()}
        </div>
    );
}
