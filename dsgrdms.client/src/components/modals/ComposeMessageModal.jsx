import { useState, useEffect } from 'react';
import { X, Send } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { sendMessage } from '../../services/messagesApi';
import { fetchGrowers } from '../../services/growersApi';
import { useNotification } from '../../context/NotificationContext';
import { friendlyError } from '../../utils/apiErrors';
import './ComposeMessageModal.css';

export default function ComposeMessageModal({ onClose, onSent }) {
    const { token }     = useAuth();
    const { showError } = useNotification();

    const [growers,    setGrowers]    = useState([]);
    const [growerId,   setGrowerId]   = useState('');
    const [subject,    setSubject]    = useState('');
    const [body,       setBody]       = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchGrowers()
            .then(setGrowers)
            .catch(err => showError(friendlyError(err)));
    }, [showError]);

    async function handleSubmit(e) {
        e.preventDefault();
        if (!growerId || !subject.trim() || !body.trim()) return;
        setSubmitting(true);
        try {
            await sendMessage(growerId, subject.trim(), body.trim(), token);
            onSent();
        } catch (err) {
            showError(friendlyError(err));
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="cmp-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="cmp-modal" role="dialog" aria-modal="true" aria-label="Compose message">
                <div className="cmp-modal-header">
                    <h2 className="cmp-modal-title">New Message</h2>
                    <button className="cmp-close-btn" onClick={onClose} aria-label="Close">
                        <X size={18} />
                    </button>
                </div>

                <form className="cmp-form" onSubmit={handleSubmit}>
                    <div className="cmp-field">
                        <label htmlFor="cmp-grower">To (Grower)</label>
                        <select
                            id="cmp-grower"
                            value={growerId}
                            onChange={e => setGrowerId(e.target.value)}
                            required
                        >
                            <option value="">Select a grower…</option>
                            {growers.map(g => (
                                <option key={g.id} value={g.id}>
                                    {g.name} ({g.id})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="cmp-field">
                        <label htmlFor="cmp-subject">Subject</label>
                        <input
                            id="cmp-subject"
                            type="text"
                            placeholder="e.g. Field visit scheduled"
                            value={subject}
                            onChange={e => setSubject(e.target.value)}
                            maxLength={200}
                            required
                        />
                    </div>

                    <div className="cmp-field">
                        <label htmlFor="cmp-body">Message</label>
                        <textarea
                            id="cmp-body"
                            rows={7}
                            placeholder="Type your message here…"
                            value={body}
                            onChange={e => setBody(e.target.value)}
                            required
                        />
                    </div>

                    <div className="cmp-actions">
                        <button type="button" className="cmp-cancel-btn" onClick={onClose}>
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="cmp-send-btn"
                            disabled={submitting || !growerId || !subject.trim() || !body.trim()}
                        >
                            <Send size={14} />
                            {submitting ? 'Sending…' : 'Send Message'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
