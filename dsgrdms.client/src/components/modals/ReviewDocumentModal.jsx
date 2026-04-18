import { useState } from 'react';
import { X, XCircle, CheckCircle, FileDown, ExternalLink } from 'lucide-react';
import { useT } from '../../hooks/useT';
import './ReviewDocumentModal.css';

export default function ReviewDocumentModal({ doc, onClose, onReview }) {
    const t = useT();
    const tm = t.modals.reviewDocument;
    const [reason, setReason] = useState('');
    const [reasonError, setReasonError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [apiError, setApiError] = useState(null);

    async function handleReject() {
        if (!reason.trim()) { setReasonError(tm.rejectionRequired); return; }
        setSubmitting(true);
        setApiError(null);
        try {
            await onReview('rejected', reason.trim());
        } catch (err) {
            setApiError(err.message);
        } finally {
            setSubmitting(false);
        }
    }

    async function handleApprove() {
        setSubmitting(true);
        setApiError(null);
        try {
            await onReview('approved');
        } catch (err) {
            setApiError(err.message);
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="review-modal" role="dialog" aria-modal="true" aria-labelledby="review-title">

                {/* Header */}
                <div className="review-modal-header">
                    <div>
                        <h2 id="review-title">{tm.title}</h2>
                        <p>{tm.subtitle}</p>
                    </div>
                    <button className="modal-close" onClick={onClose} aria-label={t.modals.close}>
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div className="review-modal-body">

                    {/* Document preview */}
                    <div className="review-doc-preview">
                        <div className="review-doc-meta">
                            <span className="review-doc-name">{doc.documentName}</span>
                            <span className="badge-pending-review">{tm.pendingBadge}</span>
                        </div>
                        <div className="review-doc-icon">
                            {doc.fileUrl ? (
                                <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="btn-view-file" title="Open document">
                                    <ExternalLink size={20} strokeWidth={1.5} />
                                </a>
                            ) : (
                                <FileDown size={28} strokeWidth={1.2} />
                            )}
                        </div>
                    </div>

                    {doc.fileName && (
                        <p className="review-filename">{doc.fileName}</p>
                    )}

                    {/* Rejection reason */}
                    <div className="review-form-group">
                        <label>{tm.rejectionReasonLabel}</label>
                        <textarea
                            placeholder={tm.rejectionPlaceholder}
                            value={reason}
                            onChange={e => { setReason(e.target.value); setReasonError(''); }}
                            rows={3}
                        />
                        {reasonError && <span className="review-error">{reasonError}</span>}
                    </div>
                </div>

                {/* Footer */}
                <div className="review-modal-footer">
                    {apiError && <span className="review-api-error">{apiError}</span>}
                    <button type="button" className="btn-cancel" onClick={onClose} disabled={submitting}>{tm.cancel}</button>
                    <button type="button" className="btn-reject" onClick={handleReject} disabled={submitting}>
                        <XCircle size={15} />
                        {tm.reject}
                    </button>
                    <button type="button" className="btn-approve" onClick={handleApprove} disabled={submitting}>
                        <CheckCircle size={15} />
                        {submitting ? '…' : tm.approve}
                    </button>
                </div>
            </div>
        </div>
    );
}
