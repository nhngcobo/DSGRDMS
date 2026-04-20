import { useState, useEffect, useCallback } from 'react';
import { Eye, Search, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useT } from '../hooks/useT';
import { fetchGrowers } from '../services/growersApi';
import { useNotification } from '../context/NotificationContext';
import { friendlyError } from '../utils/apiErrors';
import ReviewApplicationModal from '../components/modals/ReviewApplicationModal';
import './Applications.css';

const PAGE_SIZE = 15;

export default function Applications() {
    const t = useT();
    const navigate = useNavigate();
    const { showError } = useNotification();
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('All');
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [reviewingAppId, setReviewingAppId] = useState(null);

    // Reset to page 1 whenever search or filter changes
    useEffect(() => { setPage(1); }, [search, filter]);

    const STATUS_FILTERS = ['All', 'Pending', 'Approved', 'Rejected'];

    const loadApplications = useCallback(async () => {
        setLoading(true);
        try {
            const data = await fetchGrowers();
            setApplications(data || []);
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
            (filter === 'Approved' && ['verified', 'approved'].includes(g.status.toLowerCase())) ||
            g.status.toLowerCase() === filter.toLowerCase();
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
        verified: applications.filter(a => ['verified', 'approved'].includes(a.status.toLowerCase())).length,
        rejected: applications.filter(a => a.status.toLowerCase() === 'rejected').length,
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
                    <div className="stat-label">Pending Review</div>
                    <div className="stat-value">{stats.pending}</div>
                </div>
                <div className="stat-card verified">
                    <div className="stat-label">Verified</div>
                    <div className="stat-value">{stats.verified}</div>
                </div>
                <div className="stat-card rejected">
                    <div className="stat-label">Rejected</div>
                    <div className="stat-value">{stats.rejected}</div>
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
        </div>
    );
}
