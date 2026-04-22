import { useState, useEffect, useCallback } from 'react';
import { Mail, MailOpen, Send, Plus, Inbox, ChevronLeft, AlertCircle, UserCheck, Filter } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { fetchMessages, markMessageRead } from '../services/messagesApi';
import { useNotification } from '../context/NotificationContext';
import { friendlyError } from '../utils/apiErrors';
import ComposeMessageModal from '../components/modals/ComposeMessageModal';
import SubmitQueryForm from '../components/SubmitQueryForm';
import './Messages.css';

function timeAgo(dateStr) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins  = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days  = Math.floor(diff / 86400000);
    if (mins  < 1)  return 'Just now';
    if (mins  < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days  < 7)  return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString();
}

export default function Messages() {
    const { user, token } = useAuth();
    const { showError, showSuccess }   = useNotification();

    const isStaff = user?.role === 'admin' || user?.role === 'field_officer';

    const [messages,       setMessages]       = useState([]);
    const [queries,        setQueries]        = useState([]);
    const [selected,       setSelected]       = useState(null);
    const [selectedQuery,  setSelectedQuery]  = useState(null);
    const [loading,        setLoading]        = useState(true);
    const [showCompose,    setShowCompose]     = useState(false);
    const [activeTab,      setActiveTab]      = useState('messages');  // messages or queries (for growers), all (for staff)
    const [messageTypeFilter, setMessageTypeFilter] = useState('all'); // all, direct, queries (for staff)
    const [showAssignModal, setShowAssignModal] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [msgData, queryData] = await Promise.all([
                fetchMessages(token),
                isStaff ? fetch('/api/messages/queries', {
                    headers: { 'Authorization': `Bearer ${token}` },
                }).then(r => r.ok ? r.json() : []) : Promise.resolve([])
            ]);
            setMessages(msgData);
            if (isStaff) setQueries(queryData);
        } catch (err) {
            showError(friendlyError(err));
        } finally {
            setLoading(false);
        }
    }, [token, showError, isStaff]);

    useEffect(() => { load(); }, [load]);

    async function openMessage(msg) {
        setSelected(msg);
        if (!isStaff && !msg.isRead) {
            try {
                await markMessageRead(msg.id, token);
                setMessages(prev =>
                    prev.map(m => m.id === msg.id ? { ...m, isRead: true } : m)
                );
            } catch {
                // non-critical — ignore
            }
        }
    }

    async function handleAssignQuery(fieldOfficerId, fieldOfficerName) {
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
            await load();
            setSelectedQuery(null);
        } catch (err) {
            showError(friendlyError(err));
        }
    }

    async function updateQueryStatus(queryId, newStatus) {
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
            await load();
        } catch (err) {
            showError(friendlyError(err));
        }
    }

    const unreadCount = messages.filter(m => !m.isRead).length;

    return (
        <div className="msg-page">
            {/* Header */}
            <div className="msg-header">
                <div>
                    <h1 className="msg-title">
                        {isStaff ? 'All Messages' : 'Communications'}
                    </h1>
                    <p className="msg-subtitle">
                        {isStaff
                            ? 'View and manage all messages and queries'
                            : 'Messages and queries with your field officer'}
                    </p>
                </div>
                {isStaff && (
                    <button className="msg-compose-btn" onClick={() => setShowCompose(true)}>
                        <Plus size={15} /> New Message
                    </button>
                )}
            </div>

            {/* Tabs for staff to switch between messages and queries */}
            {isStaff && (
                <div className="msg-tabs">
                    <button
                        className={`msg-tab ${activeTab === 'messages' ? 'active' : ''}`}
                        onClick={() => { setActiveTab('messages'); setSelected(null); setSelectedQuery(null); }}
                    >
                        <Mail size={16} />
                        Direct Messages
                    </button>
                    <button
                        className={`msg-tab ${activeTab === 'queries' ? 'active' : ''}`}
                        onClick={() => { setActiveTab('queries'); setSelected(null); setSelectedQuery(null); }}
                    >
                        <AlertCircle size={16} />
                        Queries ({queries.length})
                    </button>
                </div>
            )}

            {/* Tabs for growers */}
            {!isStaff && (
                <div className="msg-tabs">
                    <button
                        className={`msg-tab ${activeTab === 'messages' ? 'active' : ''}`}
                        onClick={() => setActiveTab('messages')}
                    >
                        <Mail size={16} />
                        Messages
                    </button>
                    <button
                        className={`msg-tab ${activeTab === 'queries' ? 'active' : ''}`}
                        onClick={() => setActiveTab('queries')}
                    >
                        <AlertCircle size={16} />
                        Submit Query
                    </button>
                </div>
            )}

            {/* Two-pane layout for messages / queries */}
            {(activeTab === 'messages' || isStaff) ? (
            <div className="msg-pane-layout">
                {/* List pane */}
                <div className={`msg-list-pane${selected || selectedQuery ? ' hide-mobile' : ''}`}>
                    {loading ? (
                        <div className="msg-list-empty"><p>Loading…</p></div>
                    ) : (activeTab === 'queries' && isStaff ? queries : messages).length === 0 ? (
                        <div className="msg-list-empty">
                            <Inbox size={36} strokeWidth={1.2} className="msg-empty-icon" />
                            <p>No {activeTab === 'queries' ? 'queries' : 'messages'} yet</p>
                            {isStaff && activeTab !== 'queries' && (
                                <span>Use "New Message" to send one to a grower.</span>
                            )}
                        </div>
                    ) : (
                        <ul className="msg-list">
                            {(activeTab === 'queries' && isStaff ? queries : messages).map(item => (
                                <li
                                    key={item.id}
                                    className={`msg-item${(activeTab === 'queries' && isStaff) ? ' query-item' : ''}${(activeTab === 'queries' && isStaff ? selectedQuery?.id : selected?.id) === item.id ? ' active' : ''}${!item.isRead && !isStaff ? ' unread' : ''}`}
                                    onClick={() => {
                                        if (activeTab === 'queries' && isStaff) {
                                            setSelectedQuery(item);
                                        } else {
                                            openMessage(item);
                                        }
                                    }}
                                >
                                    <div className="msg-item-avatar">
                                        {isStaff && activeTab !== 'queries'
                                            ? item.growerId?.slice(0, 2).toUpperCase()
                                            : isStaff && activeTab === 'queries'
                                            ? item.growerId?.slice(0, 2).toUpperCase()
                                            : item.senderName?.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}
                                    </div>
                                    <div className="msg-item-body">
                                        <div className="msg-item-top">
                                            <span className="msg-item-from">
                                                {isStaff && activeTab !== 'queries'
                                                    ? item.growerId
                                                    : isStaff && activeTab === 'queries'
                                                    ? item.senderName
                                                    : item.senderName}
                                            </span>
                                            <span className="msg-item-time">{timeAgo(item.sentAt)}</span>
                                        </div>
                                        <p className="msg-item-subject">
                                            {!item.isRead && !isStaff && activeTab !== 'queries' && (
                                                <span className="msg-unread-dot" />
                                            )}
                                            {item.subject}
                                        </p>
                                        <p className="msg-item-preview">{item.body}</p>
                                        {isStaff && activeTab === 'queries' && item.assignedToName && (
                                            <p className="msg-item-assigned">
                                                <UserCheck size={12} /> Assigned to {item.assignedToName}
                                            </p>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* Detail pane */}
                <div className={`msg-detail-pane${(!selected && !selectedQuery) ? ' hide-mobile' : ''}`}>
                    {selectedQuery ? (
                        <div className="msg-detail">
                            <button className="msg-back-btn" onClick={() => setSelectedQuery(null)}>
                                <ChevronLeft size={16} /> Back
                            </button>
                            <div className="msg-detail-header">
                                <div className="msg-detail-avatar">
                                    {selectedQuery.growerId?.slice(0, 2).toUpperCase()}
                                </div>
                                <div>
                                    <p className="msg-detail-from">
                                        From: <strong>{selectedQuery.senderName}</strong> ({selectedQuery.growerId})
                                    </p>
                                    <p className="msg-detail-date">
                                        {new Date(selectedQuery.sentAt).toLocaleString()}
                                    </p>
                                </div>
                                <AlertCircle size={18} className="msg-detail-icon" style={{ color: '#d97706' }} />
                            </div>
                            <h2 className="msg-detail-subject">{selectedQuery.subject}</h2>
                            <div className="msg-detail-body">{selectedQuery.body}</div>
                            
                            {/* Query metadata */}
                            <div className="msg-query-meta">
                                <div className="meta-item">
                                    <span className="meta-label">Type:</span>
                                    <span className="meta-value">{selectedQuery.queryType || 'General'}</span>
                                </div>
                                <div className="meta-item">
                                    <span className="meta-label">Priority:</span>
                                    <span className="meta-value" style={{ color: selectedQuery.priority === 'high' ? '#ef4444' : selectedQuery.priority === 'medium' ? '#f59e0b' : '#3b82f6' }}>
                                        {selectedQuery.priority}
                                    </span>
                                </div>
                                <div className="meta-item">
                                    <span className="meta-label">Status:</span>
                                    <span className="meta-value">{selectedQuery.status}</span>
                                </div>
                            </div>

                            {/* Action buttons for queries */}
                            <div className="msg-actions">
                                {selectedQuery.status === 'open' && (
                                    <button 
                                        className="msg-action-btn assign-btn"
                                        onClick={() => setShowAssignModal(true)}
                                    >
                                        <UserCheck size={16} /> Assign to Field Officer
                                    </button>
                                )}
                                {(selectedQuery.status === 'assigned' || selectedQuery.status === 'open') && (
                                    <button 
                                        className="msg-action-btn progress-btn"
                                        onClick={() => updateQueryStatus(selectedQuery.id, 'in_progress')}
                                    >
                                        Mark as In Progress
                                    </button>
                                )}
                                {selectedQuery.status !== 'resolved' && selectedQuery.status !== 'closed' && (
                                    <button 
                                        className="msg-action-btn resolve-btn"
                                        onClick={() => updateQueryStatus(selectedQuery.id, 'resolved')}
                                    >
                                        Mark as Resolved
                                    </button>
                                )}
                                {selectedQuery.status !== 'closed' && (
                                    <button 
                                        className="msg-action-btn close-btn"
                                        onClick={() => updateQueryStatus(selectedQuery.id, 'closed')}
                                    >
                                        Close Query
                                    </button>
                                )}
                            </div>
                        </div>
                    ) : selected ? (
                        <div className="msg-detail">
                            <button className="msg-back-btn" onClick={() => setSelected(null)}>
                                <ChevronLeft size={16} /> Back
                            </button>
                            <div className="msg-detail-header">
                                <div className="msg-detail-avatar">
                                    {isStaff
                                        ? selected.growerId?.slice(0, 2).toUpperCase()
                                        : selected.senderName?.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}
                                </div>
                                <div>
                                    <p className="msg-detail-from">
                                        {isStaff
                                            ? `To: Grower ${selected.growerId}`
                                            : `From: ${selected.senderName}`}
                                    </p>
                                    <p className="msg-detail-date">
                                        {new Date(selected.sentAt).toLocaleString()}
                                    </p>
                                </div>
                                {isStaff
                                    ? <Send size={18} className="msg-detail-icon" />
                                    : selected.isRead
                                        ? <MailOpen size={18} className="msg-detail-icon" />
                                        : <Mail size={18} className="msg-detail-icon" />}
                            </div>
                            <h2 className="msg-detail-subject">{selected.subject}</h2>
                            <div className="msg-detail-body">{selected.body}</div>
                        </div>
                    ) : (
                        <div className="msg-detail-empty">
                            <Mail size={40} strokeWidth={1.2} className="msg-empty-icon" />
                            <p>Select a {activeTab === 'queries' ? 'query' : 'message'} to read it</p>
                        </div>
                    )}
                </div>
            </div>
            ) : (
            <div className="msg-query-section">
                <SubmitQueryForm onQuerySubmitted={load} />
            </div>
            )}

            {showCompose && (
                <ComposeMessageModal
                    onClose={() => setShowCompose(false)}
                    onSent={() => { setShowCompose(false); load(); }}
                />
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
                            <p className="assign-instruction">Select a field officer to assign this query:</p>
                            <div className="officer-list">
                                <button 
                                    className="officer-btn"
                                    onClick={() => handleAssignQuery(2, 'James Dlamini')}
                                >
                                    <UserCheck size={16} />
                                    James Dlamini
                                </button>
                                <button 
                                    className="officer-btn"
                                    onClick={() => handleAssignQuery(3, 'Sarah Mkize')}
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

