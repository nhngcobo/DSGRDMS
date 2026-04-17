import { useState } from 'react';
import { X, XCircle, CheckCircle, FileDown } from 'lucide-react';
import { useT } from '../../hooks/useT';
import './ReviewDocumentModal.css';

export default function ReviewDocumentModal({ doc, onClose, onReview }) {
    const t = useT();
    const tm = t.modals.reviewDocument;
    const [reason, setReason] = useState('');
    const [error, setError] = useState('');

    function handleReject() {
        if (!reason.trim()) {
            setError(tm.rejectionRequired);
            return;
        }
        onReview?.({ doc, action: 'rejected', reason });
        onClose();
    }

    function handleApprove() {
        onReview?.({ doc, action: 'approved' });
        onClose();
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
                            <span className="review-doc-name">{doc.document}</span>
                            <span className="badge-pending-review">{tm.pendingBadge}</span>
                        </div>
                        <div className="review-doc-icon">
                            <FileDown size={28} strokeWidth={1.2} />
                        </div>
                    </div>

                    {/* Rejection reason */}
                    <div className="review-form-group">
                        <label>{tm.rejectionReasonLabel}</label>
                        <textarea
                            placeholder={tm.rejectionPlaceholder}
                            value={reason}
                            onChange={e => { setReason(e.target.value); setError(''); }}
                            rows={3}
                        />
                        {error && <span className="review-error">{error}</span>}
                    </div>
                </div>

                {/* Footer */}
                <div className="review-modal-footer">
                    <button type="button" className="btn-cancel" onClick={onClose}>{tm.cancel}</button>
                    <button type="button" className="btn-reject" onClick={handleReject}>
                        <XCircle size={15} />
                        {tm.reject}
                    </button>
                    <button type="button" className="btn-approve" onClick={handleApprove}>
                        <CheckCircle size={15} />
                        {tm.approve}
                    </button>
                </div>
            </div>
        </div>
    );
}
