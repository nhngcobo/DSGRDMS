import { useState, useEffect, useCallback } from 'react';
import { Mail, MailOpen, Send, Plus, Inbox, ChevronLeft, AlertCircle } from 'lucide-react';
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
    const { showError }   = useNotification();

    const isStaff = user?.role === 'admin' || user?.role === 'field_officer';

    const [messages,       setMessages]       = useState([]);
    const [selected,       setSelected]       = useState(null);
    const [loading,        setLoading]        = useState(true);
    const [showCompose,    setShowCompose]     = useState(false);
    const [activeTab,      setActiveTab]      = useState('messages');  // messages or queries

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const data = await fetchMessages(token);
            setMessages(data);
        } catch (err) {
            showError(friendlyError(err));
        } finally {
            setLoading(false);
        }
    }, [token, showError]);

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

    const unreadCount = messages.filter(m => !m.isRead).length;

    return (
        <div className="msg-page">
            {/* Header */}
            <div className="msg-header">
                <div>
                    <h1 className="msg-title">
                        {isStaff ? 'Sent Messages' : 'Communications'}
                    </h1>
                    <p className="msg-subtitle">
                        {isStaff
                            ? 'Messages you have sent to growers'
                            : 'Messages and queries with your field officer'}
                    </p>
                </div>
                {isStaff && (
                    <button className="msg-compose-btn" onClick={() => setShowCompose(true)}>
                        <Plus size={15} /> New Message
                    </button>
                )}
            </div>

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

            {/* Two-pane layout for messages / Query form */}
            {activeTab === 'messages' ? (
            <div className="msg-pane-layout">
                {/* Message list */}
                <div className={`msg-list-pane${selected ? ' hide-mobile' : ''}`}>
                    {loading ? (
                        <div className="msg-list-empty"><p>Loading…</p></div>
                    ) : messages.length === 0 ? (
                        <div className="msg-list-empty">
                            <Inbox size={36} strokeWidth={1.2} className="msg-empty-icon" />
                            <p>No messages yet</p>
                            {isStaff && (
                                <span>Use "New Message" to send one to a grower.</span>
                            )}
                        </div>
                    ) : (
                        <ul className="msg-list">
                            {messages.map(msg => (
                                <li
                                    key={msg.id}
                                    className={`msg-item${selected?.id === msg.id ? ' active' : ''}${!msg.isRead && !isStaff ? ' unread' : ''}`}
                                    onClick={() => openMessage(msg)}
                                >
                                    <div className="msg-item-avatar">
                                        {isStaff
                                            ? msg.growerId?.slice(0, 2).toUpperCase()
                                            : msg.senderName?.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}
                                    </div>
                                    <div className="msg-item-body">
                                        <div className="msg-item-top">
                                            <span className="msg-item-from">
                                                {isStaff ? msg.growerId : msg.senderName}
                                            </span>
                                            <span className="msg-item-time">{timeAgo(msg.sentAt)}</span>
                                        </div>
                                        <p className="msg-item-subject">
                                            {!msg.isRead && !isStaff && (
                                                <span className="msg-unread-dot" />
                                            )}
                                            {msg.subject}
                                        </p>
                                        <p className="msg-item-preview">{msg.body}</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* Detail pane */}
                <div className={`msg-detail-pane${!selected ? ' hide-mobile' : ''}`}>
                    {selected ? (
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
                            <p>Select a message to read it</p>
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
        </div>
    );
}
