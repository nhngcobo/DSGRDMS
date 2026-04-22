import { useState, useEffect, useCallback } from 'react';
import { Mail, MailOpen, Send, Plus, Inbox, ChevronLeft, MessageSquarePlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { fetchMessages, markMessageRead } from '../services/messagesApi';
import { useNotification } from '../context/NotificationContext';
import { friendlyError } from '../utils/apiErrors';
import ComposeMessageModal from '../components/modals/ComposeMessageModal';
import ComposeQueryModal from '../components/modals/ComposeQueryModal';
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

    const [messages,    setMessages]    = useState([]);
    const [selected,    setSelected]    = useState(null);
    const [loading,     setLoading]     = useState(true);
    const [showCompose, setShowCompose] = useState(false);
    const [showQuery,   setShowQuery]   = useState(false);
    // Grower tabs: 'inbox' | 'queries'
    const [tab, setTab] = useState('inbox');

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

    // Reset selected when tab changes
    useEffect(() => { setSelected(null); }, [tab]);

    async function openMessage(msg) {
        setSelected(msg);
        if (!msg.isRead) {
            // Grower reads staff→grower msgs; staff reads grower queries
            const shouldMark = isStaff ? msg.sentByGrower : !msg.sentByGrower;
            if (shouldMark) {
                try {
                    await markMessageRead(msg.id, token);
                    setMessages(prev =>
                        prev.map(m => m.id === msg.id ? { ...m, isRead: true } : m)
                    );
                } catch {
                    // non-critical
                }
            }
        }
    }

    // Filtered lists for grower tabs
    const inbox   = messages.filter(m => !m.sentByGrower);
    const queries = messages.filter(m => m.sentByGrower);
    const visibleMessages = isStaff ? messages : (tab === 'inbox' ? inbox : queries);

    const inboxUnread   = inbox.filter(m => !m.isRead).length;
    const queriesUnread = isStaff ? messages.filter(m => m.sentByGrower && !m.isRead).length : 0;

    return (
        <div className="msg-page">
            {/* Header */}
            <div className="msg-header">
                <div>
                    <h1 className="msg-title">
                        {isStaff ? 'Messages' : 'Messages'}
                    </h1>
                    <p className="msg-subtitle">
                        {isStaff
                            ? `Sent messages and grower queries${queriesUnread > 0 ? ` — ${queriesUnread} unread quer${queriesUnread === 1 ? 'y' : 'ies'}` : ''}`
                            : `Communications with your field officer${inboxUnread > 0 ? ` — ${inboxUnread} unread` : ''}`}
                    </p>
                </div>
                {isStaff && (
                    <button className="msg-compose-btn" onClick={() => setShowCompose(true)}>
                        <Plus size={15} /> New Message
                    </button>
                )}
                {!isStaff && (
                    <button className="msg-compose-btn" onClick={() => setShowQuery(true)}>
                        <MessageSquarePlus size={15} /> New Query
                    </button>
                )}
            </div>

            {/* Grower tabs */}
            {!isStaff && (
                <div className="msg-tabs">
                    <button
                        className={`msg-tab${tab === 'inbox' ? ' active' : ''}`}
                        onClick={() => setTab('inbox')}
                    >
                        Inbox
                        {inboxUnread > 0 && <span className="msg-tab-badge">{inboxUnread}</span>}
                    </button>
                    <button
                        className={`msg-tab${tab === 'queries' ? ' active' : ''}`}
                        onClick={() => setTab('queries')}
                    >
                        My Queries
                    </button>
                </div>
            )}

            {/* Two-pane layout */}
            <div className="msg-pane-layout">
                {/* Message list */}
                <div className={`msg-list-pane${selected ? ' hide-mobile' : ''}`}>
                    {loading ? (
                        <div className="msg-list-empty"><p>Loading…</p></div>
                    ) : visibleMessages.length === 0 ? (
                        <div className="msg-list-empty">
                            <Inbox size={36} strokeWidth={1.2} className="msg-empty-icon" />
                            {isStaff && <p>No messages yet</p>}
                            {!isStaff && tab === 'inbox' && <p>No messages from your field officer yet</p>}
                            {!isStaff && tab === 'queries' && (
                                <>
                                    <p>No queries sent yet</p>
                                    <span>Use "New Query" to send a message to your field officer.</span>
                                </>
                            )}
                        </div>
                    ) : (
                        <ul className="msg-list">
                            {visibleMessages.map(msg => {
                                const isUnread = !msg.isRead && (isStaff ? msg.sentByGrower : !msg.sentByGrower);
                                const avatarText = isStaff
                                    ? (msg.sentByGrower
                                        ? msg.growerId?.slice(0, 2).toUpperCase()
                                        : msg.growerId?.slice(0, 2).toUpperCase())
                                    : (tab === 'inbox'
                                        ? msg.senderName?.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
                                        : 'ME');
                                const fromLabel = isStaff
                                    ? (msg.sentByGrower ? `From: ${msg.senderName} (${msg.growerId})` : `To: Grower ${msg.growerId}`)
                                    : (tab === 'inbox' ? msg.senderName : 'Me');

                                return (
                                    <li
                                        key={msg.id}
                                        className={`msg-item${selected?.id === msg.id ? ' active' : ''}${isUnread ? ' unread' : ''}`}
                                        onClick={() => openMessage(msg)}
                                    >
                                        <div className="msg-item-avatar">{avatarText}</div>
                                        <div className="msg-item-body">
                                            <div className="msg-item-top">
                                                <span className="msg-item-from">{fromLabel}</span>
                                                <span className="msg-item-time">{timeAgo(msg.sentAt)}</span>
                                            </div>
                                            <p className="msg-item-subject">
                                                {isUnread && <span className="msg-unread-dot" />}
                                                {msg.subject}
                                            </p>
                                            <p className="msg-item-preview">{msg.body}</p>
                                            {msg.queryType && (
                                                <span className="msg-item-type-tag">{msg.queryType}</span>
                                            )}
                                        </div>
                                    </li>
                                );
                            })}
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
                                    {selected.sentByGrower
                                        ? selected.growerId?.slice(0, 2).toUpperCase()
                                        : selected.senderName?.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}
                                </div>
                                <div>
                                    <p className="msg-detail-from">
                                        {selected.sentByGrower
                                            ? `From: ${selected.senderName} (${selected.growerId})`
                                            : isStaff
                                                ? `To: Grower ${selected.growerId}`
                                                : `From: ${selected.senderName}`}
                                    </p>
                                    <p className="msg-detail-date">
                                        {new Date(selected.sentAt).toLocaleString()}
                                    </p>
                                </div>
                                {selected.sentByGrower
                                    ? <MessageSquarePlus size={18} className="msg-detail-icon" />
                                    : selected.isRead
                                        ? <MailOpen size={18} className="msg-detail-icon" />
                                        : <Mail size={18} className="msg-detail-icon" />}
                            </div>
                            <h2 className="msg-detail-subject">{selected.subject}</h2>
                            {selected.queryType && (
                                <span className="msg-query-type-badge">{selected.queryType}</span>
                            )}
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

            {showCompose && (
                <ComposeMessageModal
                    onClose={() => setShowCompose(false)}
                    onSent={() => { setShowCompose(false); load(); }}
                />
            )}
            {showQuery && (
                <ComposeQueryModal
                    onClose={() => setShowQuery(false)}
                    onSent={() => { setShowQuery(false); setTab('queries'); load(); }}
                />
            )}
        </div>
    );
}
