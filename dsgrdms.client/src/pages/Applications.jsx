import { useState, useEffect, useCallback } from 'react';
import { Eye, Search, ChevronLeft, ChevronRight, Calendar, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useT } from '../hooks/useT';
import { useAuth } from '../context/AuthContext';
import { fetchGrowers } from '../services/growersApi';
import { fieldVisitsApi } from '../services/fieldVisitsApi';
import { useNotification } from '../context/NotificationContext';
import { friendlyError } from '../utils/apiErrors';
import ReviewApplicationModal from '../components/modals/ReviewApplicationModal';
import ScheduleVisitModal from '../components/modals/ScheduleVisitModal';
import './Applications.css';

const PAGE_SIZE = 15;

export default function Applications() {
    const t = useT();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { showError } = useNotification();
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('All');
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [reviewingAppId, setReviewingAppId] = useState(null);
    const [schedulingGrowerId, setSchedulingGrowerId] = useState(null);
    const [schedulingGrower, setSchedulingGrower] = useState(null);

    // Reset to page 1 whenever search or filter changes
    useEffect(() => { setPage(1); }, [search, filter]);

    const STATUS_FILTERS = ['All', 'Pending', 'Inspection Pending', 'Review Pending', 'Approved', 'Rejected', 'Info Requested'];

    // Map display filter names to actual status values
    const getStatusValue = (filterName) => {
        const mapping = {
            'Pending': 'pending',
            'Inspection Pending': 'inspection_pending',
            'Review Pending': 'review_pending',
            'Approved': 'approved',
            'Rejected': 'rejected',
            'Info Requested': 'info_requested'
        };
        return mapping[filterName] || filterName.toLowerCase();
    };

    const loadApplications = useCallback(async () => {
        setLoading(true);
        try {
            const [growers, visits] = await Promise.all([
                fetchGrowers(),
                fieldVisitsApi.getAll().catch(() => [])
            ]);
            
            // Mark growers that have scheduled visits
            const data = (growers || []).map(grower => ({
                ...grower,
                hasScheduledVisit: visits.some(v => v.growerId === grower.id && v.status?.toLowerCase() === 'scheduled')
            }));
            
            setApplications(data);
        } catch (err) {
            showError(friendlyError(err));
            setApplications([]);
        } finally {
            setLoading(false);
        }
    }, [showError]);

    useEffect(() => { loadApplications(); }, [loadApplications]);

    const visible = applications.filter(g => {
        const matchesFilter =
            filter === 'All' ||
            g.status.toLowerCase() === getStatusValue(filter);
        const q = search.toLowerCase();
        const matchesSearch =
            !q ||
            g.name.toLowerCase().includes(q) ||
            g.id.toLowerCase().includes(q) ||
            (g.email && g.email.toLowerCase().includes(q));
        return matchesFilter && matchesSearch;
    });

    const totalPages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
    const paged = visible.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    // Statistics for overview
    const stats = {
        total: applications.length,
        pending: applications.filter(a => a.status.toLowerCase() === 'pending').length,
        inspectionPending: applications.filter(a => a.status.toLowerCase() === 'inspection_pending').length,
        reviewPending: applications.filter(a => a.status.toLowerCase() === 'review_pending').length,
        approved: applications.filter(a => a.status.toLowerCase() === 'approved').length,
        rejected: applications.filter(a => a.status.toLowerCase() === 'rejected').length,
        infoRequested: applications.filter(a => a.status.toLowerCase() === 'info_requested').length,
    };

    // Format date helper (mock - you can replace with actual date from API)
    const formatDate = (id) => {
        // Extract numeric part and create mock date
        const num = parseInt(id.replace(/\D/g, '')) || 1;
        const daysAgo = num % 30;
        const date = new Date();
        date.setDate(date.getDate() - daysAgo);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    };

    return (
        <div className="applications-page">
            <div className="applications-header">
                <div>
                    <h1>Grower Applications</h1>
                    <p>Review and manage all grower registration applications</p>
                </div>
            </div>

            {/* Statistics overview */}
            <div className="applications-stats">
                <div className="stat-card">
                    <div className="stat-label">Total Applications</div>
                    <div className="stat-value">{stats.total}</div>
                </div>
                <div className="stat-card pending">
                    <div className="stat-label">Awaiting Field Visit</div>
                    <div className="stat-value">{stats.pending}</div>
                </div>
                <div className="stat-card inspection">
                    <div className="stat-label">Under Inspection</div>
                    <div className="stat-value">{stats.inspectionPending}</div>
                </div>
                <div className="stat-card review">
                    <div className="stat-label">Awaiting Review</div>
                    <div className="stat-value">{stats.reviewPending}</div>
                </div>
                <div className="stat-card approved">
                    <div className="stat-label">Approved</div>
                    <div className="stat-value">{stats.approved}</div>
                </div>
                <div className="stat-card rejected">
                    <div className="stat-label">Rejected</div>
                    <div className="stat-value">{stats.rejected}</div>
                </div>
                <div className="stat-card info-needed">
                    <div className="stat-label">Info Requested</div>
                    <div className="stat-value">{stats.infoRequested}</div>
                </div>
            </div>

            <div className="applications-table-card">
                {/* Toolbar */}
                <div className="applications-toolbar">
                    <div className="search-box">
                        <Search size={15} className="search-icon" />
                        <input
                            type="text"
                            placeholder="Search by name, ID, or email..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="filter-group">
                        {STATUS_FILTERS.map(f => (
                            <button
                                key={f}
                                className={'filter-btn' + (filter === f ? ' active' : '')}
                                onClick={() => setFilter(f)}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Loading state */}
                {loading && <div className="applications-state">Loading applications…</div>}

                {/* Table */}
                {!loading && (
                    <div className="table-wrapper">
                        <table className="applications-table">
                            <thead>
                                <tr>
                                    <th>Application ID</th>
                                    <th>Applicant</th>
                                    <th>Submitted</th>
                                    <th>Farm Size</th>
                                    <th>Status</th>
                                    <th>Risk Level</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {visible.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="applications-state">No applications found.</td>
                                    </tr>
                                ) : paged.map(app => (
                                    <tr key={app.id} className="application-row" onClick={() => navigate(`/growers/${app.id}`)}>
                                        <td className="app-id">{app.id}</td>
                                        <td>
                                            <div className="applicant-info">
                                                <div className="applicant-name">{app.name}</div>
                                                <div className="applicant-email">{app.email}</div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="date-cell">
                                                <Calendar size={14} className="date-icon" />
                                                <span>{formatDate(app.id)}</span>
                                            </div>
                                        </td>
                                        <td>{app.farmSize ?? <span className="na">N/A</span>}</td>
                                        <td><span className={`badge badge-status-${app.status}`}>{app.status}</span></td>
                                        <td><span className={`badge badge-risk-${app.risk}`}>{app.risk}</span></td>
                                        <td>
                                            <div className="actions-cell">
                                                {/* Schedule Visit button for field officers - only for pending */}
                                                {user?.role === 'field_officer' && (
                                                    <button 
                                                        className="btn-schedule" 
                                                        onClick={e => { 
                                                            e.stopPropagation(); 
                                                            setSchedulingGrowerId(app.id);
                                                            setSchedulingGrower(app);
                                                        }}
                                                        disabled={app.status.toLowerCase() !== 'pending' || app.hasScheduledVisit}
                                                        title={app.hasScheduledVisit ? 'A visit has already been scheduled for this grower' : (app.status.toLowerCase() === 'pending' ? 'Schedule a field visit for this grower' : 'Can only schedule visits for pending applications')}
                                                    >
                                                        <Clock size={14} />
                                                        Schedule
                                                    </button>
                                                )}
                                                {/* Review button for admins */}
                                                {user?.role !== 'field_officer' && (
                                                    <button 
                                                        className="btn-view" 
                                                        onClick={e => { 
                                                            e.stopPropagation(); 
                                                            setReviewingAppId(app.id); 
                                                        }}
                                                    >
                                                        <Eye size={14} />
                                                        Review
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
                {!loading && visible.length > 0 && (
                    <div className="applications-pagination">
                        <span className="pagination-info">
                            Showing {(page - 1) * PAGE_SIZE + 1} – {Math.min(page * PAGE_SIZE, visible.length)} of {visible.length}
                        </span>
                        <div className="pagination-controls">
                            <button 
                                className="pagination-btn" 
                                disabled={page === 1}
                                onClick={() => setPage(p => p - 1)}
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <span className="pagination-page">Page {page} of {totalPages}</span>
                            <button 
                                className="pagination-btn" 
                                disabled={page === totalPages}
                                onClick={() => setPage(p => p + 1)}
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Review Modal */}
            {reviewingAppId && (
                <ReviewApplicationModal
                    applicationId={reviewingAppId}
                    onClose={() => setReviewingAppId(null)}
                    onReviewed={() => {
                        loadApplications();
                        setReviewingAppId(null);
                    }}
                />
            )}

            {/* Schedule Visit Modal */}
            {schedulingGrowerId && (
                <ScheduleVisitModal
                    applicationId={schedulingGrowerId}
                    grower={schedulingGrower}
                    onClose={() => {
                        setSchedulingGrowerId(null);
                        setSchedulingGrower(null);
                    }}
                    onScheduled={() => {
                        loadApplications();
                        setSchedulingGrowerId(null);
                        setSchedulingGrower(null);
                    }}
                />
            )}
        </div>
    );
}
