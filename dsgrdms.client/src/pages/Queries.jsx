import { useState, useEffect, useCallback } from 'react';
import { AlertCircle, CheckCircle, Zap, Clock, Filter, Search, Inbox, UserCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { friendlyError } from '../utils/apiErrors';
import './Queries.css';

const QUERY_TYPES = {
    plants_not_growing: 'Plants Not Growing',
    documents: 'Document Issues',
    equipment: 'Equipment/Supply',
    pests: 'Pest/Disease',
    water: 'Water/Irrigation',
    general: 'General Query',
};

const STATUS_CONFIG = {
    open: { label: 'Open', icon: AlertCircle, color: '#d97706', bgColor: '#fef3c7' },
    assigned: { label: 'Assigned', icon: UserCheck, color: '#3b82f6', bgColor: '#dbeafe' },
    in_progress: { label: 'In Progress', icon: Clock, color: '#f59e0b', bgColor: '#fef3c7' },
    resolved: { label: 'Resolved', icon: CheckCircle, color: '#10b981', bgColor: '#d1fae5' },
    closed: { label: 'Closed', icon: CheckCircle, color: '#6b7280', bgColor: '#f3f4f6' },
};

const PRIORITY_CONFIG = {
    low: { label: 'Low', color: '#3b82f6' },
    medium: { label: 'Medium', color: '#f59e0b' },
    high: { label: 'High', color: '#ef4444' },
};

function timeAgo(dateStr) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString();
}

export default function Queries() {
    const { user, token } = useAuth();
    const { showError, showSuccess } = useNotification();
    const [queries, setQueries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedQuery, setSelectedQuery] = useState(null);
    const [showAssignModal, setShowAssignModal] = useState(false);
    
    // Filters
    const [statusFilter, setStatusFilter] = useState('all');
    const [priorityFilter, setPriorityFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    // Load queries
    const loadQueries = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/messages/queries', {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (!response.ok) throw new Error('Failed to load queries');
            const data = await response.json();
            setQueries(data);
        } catch (err) {
            showError(friendlyError(err));
        } finally {
            setLoading(false);
        }
    }, [token, showError]);

    useEffect(() => { loadQueries(); }, [loadQueries]);

    // Filter queries
    const filteredQueries = queries.filter(q => {
        if (statusFilter !== 'all' && q.status !== statusFilter) return false;
        if (priorityFilter !== 'all' && q.priority !== priorityFilter) return false;
        if (searchTerm) {
            const search = searchTerm.toLowerCase();
            return (
                q.subject.toLowerCase().includes(search) ||
                q.body.toLowerCase().includes(search) ||
                q.growerId.toLowerCase().includes(search) ||
                q.senderName.toLowerCase().includes(search)
            );
        }
        return true;
    });

    // Assign query to field officer
    async function handleAssign(fieldOfficerId, fieldOfficerName) {
        if (!selectedQuery) return;
        try {
            const response = await fetch(`/api/messages/${selectedQuery.id}/assign`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    assignedToUserId: fieldOfficerId,
                    assignedToName: fieldOfficerName,
                }),
            });
            if (!response.ok) throw new Error('Failed to assign query');
            showSuccess(`Query assigned to ${fieldOfficerName}`);
            setShowAssignModal(false);
            await loadQueries();
            setSelectedQuery(null);
        } catch (err) {
            showError(friendlyError(err));
        }
    }

    // Update query status
    async function updateStatus(queryId, newStatus) {
        try {
            const response = await fetch(`/api/messages/${queryId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ status: newStatus }),
            });
            if (!response.ok) throw new Error('Failed to update status');
            showSuccess('Query status updated');
            await loadQueries();
        } catch (err) {
            showError(friendlyError(err));
        }
    }

    const openQueries = queries.filter(q => q.status === 'open').length;
    const assignedQueries = queries.filter(q => q.status === 'assigned').length;
    const resolvedQueries = queries.filter(q => q.status === 'resolved').length;

    return (
        <div className="queries-page">
            {/* Header */}
            <div className="queries-header">
                <div>
                    <h1>Grower Queries</h1>
                    <p>Manage queries submitted by growers for field officer assignment</p>
                </div>
            </div>

            {/* Stats */}
            <div className="queries-stats">
                <div className="stat-card">
                    <AlertCircle size={24} style={{ color: '#d97706' }} />
                    <div>
                        <div className="stat-value">{openQueries}</div>
                        <div className="stat-label">Open Queries</div>
                    </div>
                </div>
                <div className="stat-card">
                    <UserCheck size={24} style={{ color: '#3b82f6' }} />
                    <div>
                        <div className="stat-value">{assignedQueries}</div>
                        <div className="stat-label">Assigned</div>
                    </div>
                </div>
                <div className="stat-card">
                    <CheckCircle size={24} style={{ color: '#10b981' }} />
                    <div>
                        <div className="stat-value">{resolvedQueries}</div>
                        <div className="stat-label">Resolved</div>
                    </div>
                </div>
            </div>

            {/* Search & Filters */}
            <div className="queries-controls">
                <div className="search-box">
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder="Search queries..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="filter-controls">
                    <select
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                        className="filter-select"
                    >
                        <option value="all">All Status</option>
                        <option value="open">Open</option>
                        <option value="assigned">Assigned</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                    </select>

                    <select
                        value={priorityFilter}
                        onChange={e => setPriorityFilter(e.target.value)}
                        className="filter-select"
                    >
                        <option value="all">All Priority</option>
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                    </select>
                </div>
            </div>

            {/* Queries List */}
            {loading ? (
                <div className="queries-loading">Loading queries...</div>
            ) : filteredQueries.length === 0 ? (
                <div className="queries-empty">
                    <Inbox size={48} />
                    <h3>No queries found</h3>
                    <p>No queries match your filters</p>
                </div>
            ) : (
                <div className="queries-list">
                    {filteredQueries.map(query => {
                        const statusConfig = STATUS_CONFIG[query.status];
                        const StatusIcon = statusConfig.icon;
                        const priorityConfig = PRIORITY_CONFIG[query.priority];

                        return (
                            <div
                                key={query.id}
                                className="query-card"
                                onClick={() => setSelectedQuery(query)}
                            >
                                <div className="query-header">
                                    <div className="query-title">
                                        <h3>{query.subject}</h3>
                                        <span className="query-type">
                                            {QUERY_TYPES[query.queryType] || query.queryType}
                                        </span>
                                    </div>
                                    <div className="query-meta">
                                        <span
                                            className="status-badge"
                                            style={{
                                                backgroundColor: statusConfig.bgColor,
                                                color: statusConfig.color,
                                            }}
                                        >
                                            <StatusIcon size={14} />
                                            {statusConfig.label}
                                        </span>
                                        <span
                                            className="priority-badge"
                                            style={{ color: priorityConfig.color }}
                                        >
                                            {priorityConfig.label}
                                        </span>
                                    </div>
                                </div>

                                <div className="query-body">
                                    <p>{query.body}</p>
                                </div>

                                <div className="query-footer">
                                    <div className="query-info">
                                        <span className="grower-info">
                                            <strong>{query.senderName}</strong> ({query.growerId})
                                        </span>
                                        <span className="query-time">{timeAgo(query.sentAt)}</span>
                                    </div>
                                    {query.assignedToName && (
                                        <div className="assigned-to">
                                            <UserCheck size={14} />
                                            {query.assignedToName}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Query Detail Modal */}
            {selectedQuery && (
                <div className="modal-overlay" onClick={() => setSelectedQuery(null)}>
                    <div className="query-detail-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{selectedQuery.subject}</h2>
                            <button
                                className="modal-close"
                                onClick={() => setSelectedQuery(null)}
                            >
                                ✕
                            </button>
                        </div>

                        <div className="modal-body">
                            <div className="query-detail-row">
                                <label>Grower:</label>
                                <span>{selectedQuery.senderName} ({selectedQuery.growerId})</span>
                            </div>
                            <div className="query-detail-row">
                                <label>Category:</label>
                                <span>{QUERY_TYPES[selectedQuery.queryType]}</span>
                            </div>
                            <div className="query-detail-row">
                                <label>Status:</label>
                                <span style={{ color: STATUS_CONFIG[selectedQuery.status].color }}>
                                    {STATUS_CONFIG[selectedQuery.status].label}
                                </span>
                            </div>
                            <div className="query-detail-row">
                                <label>Priority:</label>
                                <span style={{ color: PRIORITY_CONFIG[selectedQuery.priority].color }}>
                                    {PRIORITY_CONFIG[selectedQuery.priority].label}
                                </span>
                            </div>
                            {selectedQuery.assignedToName && (
                                <div className="query-detail-row">
                                    <label>Assigned To:</label>
                                    <span>{selectedQuery.assignedToName}</span>
                                </div>
                            )}
                            <div className="query-detail-row">
                                <label>Submitted:</label>
                                <span>{new Date(selectedQuery.sentAt).toLocaleString()}</span>
                            </div>

                            <div className="query-description">
                                <label>Description:</label>
                                <p>{selectedQuery.body}</p>
                            </div>
                        </div>

                        <div className="modal-footer">
                            {selectedQuery.status === 'open' && (
                                <button
                                    className="btn btn-primary"
                                    onClick={() => setShowAssignModal(true)}
                                >
                                    <UserCheck size={16} />
                                    Assign to Officer
                                </button>
                            )}
                            {(selectedQuery.status === 'assigned' || selectedQuery.status === 'in_progress') && (
                                <>
                                    <button
                                        className="btn btn-secondary"
                                        onClick={() => updateStatus(selectedQuery.id, 'in_progress')}
                                    >
                                        Mark as In Progress
                                    </button>
                                    <button
                                        className="btn btn-primary"
                                        onClick={() => updateStatus(selectedQuery.id, 'resolved')}
                                    >
                                        Mark as Resolved
                                    </button>
                                </>
                            )}
                            {selectedQuery.status === 'resolved' && (
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => updateStatus(selectedQuery.id, 'closed')}
                                >
                                    Close Query
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Assignment Modal */}
            {showAssignModal && selectedQuery && (
                <div className="modal-overlay" onClick={() => setShowAssignModal(false)}>
                    <div className="assign-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Assign Query to Field Officer</h2>
                            <button
                                className="modal-close"
                                onClick={() => setShowAssignModal(false)}
                            >
                                ✕
                            </button>
                        </div>
                        <div className="modal-body">
                            <p>Select a field officer to assign this query:</p>
                            <div className="officer-list">
                                {/* TODO: Load field officers from backend */}
                                <button
                                    className="officer-item"
                                    onClick={() => handleAssign(2, 'John Mabuse')}
                                >
                                    <UserCheck size={16} />
                                    John Mabuse
                                </button>
                                <button
                                    className="officer-item"
                                    onClick={() => handleAssign(3, 'Sarah Mkize')}
                                >
                                    <UserCheck size={16} />
                                    Sarah Mkize
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
