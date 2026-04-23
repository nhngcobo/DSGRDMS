import { useState } from 'react';
import { X, XCircle, CheckCircle, Download, ZoomIn } from 'lucide-react';
import { useT } from '../../hooks/useT';
import { useNotification } from '../../context/NotificationContext';
import { friendlyError } from '../../utils/apiErrors';
import './ReviewDocumentModal.css';

function getFileType(fileName) {
    if (!fileName) return null;
    const ext = fileName.toLowerCase().split('.').pop();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return 'image';
    return 'file';
}

export default function ReviewDocumentModal({ doc, onClose, onReview }) {
    const t = useT();
    const tm = t.modals.reviewDocument;
    const { showError, showConfirm } = useNotification();
    const [reason, setReason] = useState('');
    const [reasonError, setReasonError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [imageHover, setImageHover] = useState(false);
    const [magnifierPos, setMagnifierPos] = useState({ x: 0, y: 0 });
    const [magnifierOffset, setMagnifierOffset] = useState({ x: 0, y: 0 });
    
    const handleImageMouseMove = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        setMagnifierPos({ x, y });

        // Calculate offset for zoomed background image
        // The magnifier shows 2x zoom, so we need to calculate what portion to show
        const offsetX = (x / rect.width) * 100;
        const offsetY = (y / rect.height) * 100;
        setMagnifierOffset({ x: offsetX, y: offsetY });
    };

    async function handleReject() {
        if (!reason.trim()) { setReasonError(tm.rejectionRequired); return; }
        const confirmed = await showConfirm(
            `Reject "${doc.documentName}"? This action cannot be undone.`,
            { confirmLabel: 'Reject', danger: true }
        );
        if (!confirmed) return;
        setSubmitting(true);
        try {
            await onReview('rejected', reason.trim());
        } catch (err) {
            showError(friendlyError(err));
        } finally {
            setSubmitting(false);
        }
    }

    async function handleApprove() {
        const confirmed = await showConfirm(
            `Approve "${doc.documentName}"?`,
            { confirmLabel: 'Approve' }
        );
        if (!confirmed) return;
        setSubmitting(true);
        try {
            await onReview('approved');
        } catch (err) {
            showError(friendlyError(err));
        } finally {
            setSubmitting(false);
        }
    }

    const fileType = getFileType(doc.fileName);

    return (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className={`review-modal ${fileType === 'image' ? 'review-modal-expanded' : ''}`} role="dialog" aria-modal="true" aria-labelledby="review-title">

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
                {fileType === 'image' ? (
                    <div className="review-modal-main">
                        {/* Image Preview Panel */}
                        <div className="review-preview-panel">
                            {doc.fileUrl && (
                                <div 
                                    className={`image-viewer ${imageHover ? 'image-viewer-hover' : ''}`}
                                    onMouseEnter={() => setImageHover(true)}
                                    onMouseLeave={() => setImageHover(false)}
                                    onMouseMove={handleImageMouseMove}
                                >
                                    <img src={doc.fileUrl} alt={doc.documentName} />
                                    {imageHover && (
                                        <div 
                                            className="image-magnifier"
                                            style={{
                                                left: `${magnifierPos.x}px`,
                                                top: `${magnifierPos.y}px`,
                                                backgroundImage: `url(${doc.fileUrl})`,
                                                backgroundPosition: `${magnifierOffset.x}% ${magnifierOffset.y}%`,
                                                backgroundSize: '400% 400%'
                                            }}
                                        />
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Review Form Panel */}
                        <div className="review-form-panel">
                            {/* Document info */}
                            <div className="review-doc-preview">
                                <div className="review-doc-meta">
                                    <span className="review-doc-name">{doc.documentName}</span>
                                    <span className="badge-pending-review">{tm.pendingBadge}</span>
                                </div>
                                {doc.fileName && (
                                    <p className="review-filename">{doc.fileName}</p>
                                )}
                                {doc.fileUrl && (
                                    <a href={doc.fileUrl} download className="btn-download" title="Download document">
                                        <Download size={14} />
                                        Download image
                                    </a>
                                )}
                            </div>

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
                    </div>
                ) : (
                    <div className="review-modal-body">
                        {/* Document info */}
                        <div className="review-doc-preview">
                            <div className="review-doc-meta">
                                <span className="review-doc-name">{doc.documentName}</span>
                                <span className="badge-pending-review">{tm.pendingBadge}</span>
                            </div>
                            {doc.fileName && (
                                <p className="review-filename">{doc.fileName}</p>
                            )}
                            {doc.fileUrl && (
                                <a href={doc.fileUrl} download className="btn-download" title="Download document">
                                    <Download size={14} />
                                    Download document
                                </a>
                            )}
                        </div>

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
                )}

                {/* Footer */}
                <div className="review-modal-footer">
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
