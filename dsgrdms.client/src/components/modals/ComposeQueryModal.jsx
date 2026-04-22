import { useState } from 'react';
import { X, Send } from 'lucide-react';
import { sendQuery } from '../../services/messagesApi';
import { useNotification } from '../../context/NotificationContext';
import { friendlyError } from '../../utils/apiErrors';
import './ComposeMessageModal.css';

const QUERY_TYPES = [
    { value: 'Compliance & Documentation',  label: 'Compliance & Documentation',  hint: 'Certificates, permits, submission deadlines' },
    { value: 'Pest & Disease Management',   label: 'Pest & Disease Management',   hint: 'Infestations, treatment, surveillance' },
    { value: 'Plantation Management',       label: 'Plantation Management',       hint: 'Pruning, thinning, harvesting schedules' },
    { value: 'Land & Tenure',               label: 'Land & Tenure',               hint: 'Land rights, lease agreements, boundaries' },
    { value: 'Field Visit / Inspection',    label: 'Field Visit / Inspection',    hint: 'Scheduling, outcomes, follow-up actions' },
    { value: 'Fire & Environmental Risk',   label: 'Fire & Environmental Risk',   hint: 'Fire breaks, environmental assessments' },
    { value: 'Financial / Payment',         label: 'Financial / Payment',         hint: 'Subsidies, payments, financial assistance' },
    { value: 'Equipment & Resources',       label: 'Equipment & Resources',       hint: 'Tools, machinery, input supply' },
    { value: 'Training & Support',          label: 'Training & Support',          hint: 'Workshops, extension services, mentoring' },
    { value: 'General Enquiry',             label: 'General Enquiry',             hint: 'Any other question or request' },
];

export default function ComposeQueryModal({ onClose, onSent }) {
    const { showError } = useNotification();

    const [queryType,  setQueryType]  = useState('');
    const [subject,    setSubject]    = useState('');
    const [body,       setBody]       = useState('');
    const [submitting, setSubmitting] = useState(false);

    // When a type is selected, pre-fill subject if blank
    function handleTypeChange(val) {
        setQueryType(val);
        if (!subject.trim() && val) setSubject(val);
    }

    async function handleSubmit(e) {
        e.preventDefault();
        if (!queryType || !subject.trim() || !body.trim()) return;
        setSubmitting(true);
        try {
            await sendQuery(queryType, subject.trim(), body.trim());
            onSent();
        } catch (err) {
            showError(friendlyError(err));
        } finally {
            setSubmitting(false);
        }
    }

    const selectedHint = QUERY_TYPES.find(q => q.value === queryType)?.hint;

    return (
        <div className="cmp-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="cmp-modal" role="dialog" aria-modal="true" aria-label="New query">
                <div className="cmp-modal-header">
                    <h2 className="cmp-modal-title">New Query</h2>
                    <button className="cmp-close-btn" onClick={onClose} aria-label="Close">
                        <X size={18} />
                    </button>
                </div>

                <form className="cmp-form" onSubmit={handleSubmit}>
                    <div className="cmp-field">
                        <label htmlFor="qry-type">Query Type</label>
                        <select
                            id="qry-type"
                            value={queryType}
                            onChange={e => handleTypeChange(e.target.value)}
                            required
                        >
                            <option value="">Select a query type…</option>
                            {QUERY_TYPES.map(q => (
                                <option key={q.value} value={q.value}>{q.label}</option>
                            ))}
                        </select>
                        {selectedHint && (
                            <span className="cmp-field-hint">{selectedHint}</span>
                        )}
                    </div>

                    <div className="cmp-field">
                        <label htmlFor="qry-subject">Subject</label>
                        <input
                            id="qry-subject"
                            type="text"
                            placeholder="Briefly describe your query"
                            value={subject}
                            onChange={e => setSubject(e.target.value)}
                            maxLength={200}
                            required
                        />
                    </div>

                    <div className="cmp-field">
                        <label htmlFor="qry-body">Details</label>
                        <textarea
                            id="qry-body"
                            rows={6}
                            placeholder="Provide as much detail as possible so your field officer can assist you…"
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
                            disabled={submitting || !queryType || !subject.trim() || !body.trim()}
                        >
                            <Send size={14} />
                            {submitting ? 'Sending…' : 'Send Query'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
