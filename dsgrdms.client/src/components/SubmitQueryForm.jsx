import { useState } from 'react';
import { Send, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { friendlyError } from '../utils/apiErrors';
import './SubmitQueryForm.css';

const QUERY_TYPES = [
    { value: 'plants_not_growing', label: 'Plants Not Growing Well' },
    { value: 'documents', label: 'Document Issues' },
    { value: 'equipment', label: 'Equipment/Supply Problem' },
    { value: 'pests', label: 'Pest/Disease Issues' },
    { value: 'water', label: 'Water/Irrigation Issues' },
    { value: 'general', label: 'General Query' },
];

const PRIORITY_LEVELS = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High - Urgent' },
];

export default function SubmitQueryForm({ onQuerySubmitted }) {
    const { user, token } = useAuth();
    const { showError, showSuccess } = useNotification();
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const [queryType, setQueryType] = useState('general');
    const [priority, setPriority] = useState('medium');
    const [submitting, setSubmitting] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();

        if (!subject.trim() || !body.trim()) {
            showError('Please fill in both subject and description');
            return;
        }

        setSubmitting(true);
        try {
            const response = await fetch('/api/messages/query', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    subject,
                    body,
                    queryType,
                    priority,
                }),
            });

            if (!response.ok) throw new Error('Failed to submit query');

            showSuccess('Query submitted successfully! An officer will be assigned shortly.');
            setSubject('');
            setBody('');
            setQueryType('general');
            setPriority('medium');

            if (onQuerySubmitted) onQuerySubmitted();
        } catch (err) {
            showError(friendlyError(err));
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="query-form-container">
            <div className="query-form-header">
                <h2>Submit a Query</h2>
                <p>Let us know about any issues or concerns on your farm</p>
            </div>

            <form onSubmit={handleSubmit} className="query-form">
                {/* Subject */}
                <div className="form-group">
                    <label htmlFor="subject">Subject *</label>
                    <input
                        id="subject"
                        type="text"
                        placeholder="Brief summary of your query"
                        value={subject}
                        onChange={e => setSubject(e.target.value)}
                        disabled={submitting}
                        maxLength={120}
                    />
                    <span className="char-count">{subject.length}/120</span>
                </div>

                {/* Query Type */}
                <div className="form-group">
                    <label htmlFor="queryType">Issue Category</label>
                    <select
                        id="queryType"
                        value={queryType}
                        onChange={e => setQueryType(e.target.value)}
                        disabled={submitting}
                    >
                        {QUERY_TYPES.map(t => (
                            <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                    </select>
                </div>

                {/* Priority */}
                <div className="form-group">
                    <label htmlFor="priority">Priority</label>
                    <select
                        id="priority"
                        value={priority}
                        onChange={e => setPriority(e.target.value)}
                        disabled={submitting}
                    >
                        {PRIORITY_LEVELS.map(p => (
                            <option key={p.value} value={p.value}>{p.label}</option>
                        ))}
                    </select>
                </div>

                {/* Description */}
                <div className="form-group">
                    <label htmlFor="body">Description *</label>
                    <textarea
                        id="body"
                        placeholder="Please describe the issue in detail. Include when it started, what you've already tried, and any other relevant information..."
                        value={body}
                        onChange={e => setBody(e.target.value)}
                        disabled={submitting}
                        rows={6}
                        maxLength={2000}
                    />
                    <span className="char-count">{body.length}/2000</span>
                </div>

                {/* Info Box */}
                <div className="info-box">
                    <AlertCircle size={16} />
                    <p>A field officer will review your query and be assigned to assist you. You'll receive updates on the status.</p>
                </div>

                {/* Submit Button */}
                <button
                    type="submit"
                    className="btn btn-primary btn-submit"
                    disabled={submitting || !subject.trim() || !body.trim()}
                >
                    <Send size={16} />
                    {submitting ? 'Submitting...' : 'Submit Query'}
                </button>
            </form>
        </div>
    );
}
