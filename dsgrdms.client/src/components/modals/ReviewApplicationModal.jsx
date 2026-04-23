import { useState, useEffect } from 'react';
import { X, User, Building2, Leaf, MapPin, CheckCircle, XCircle, AlertCircle, FileCheck, Info } from 'lucide-react';
import { fetchGrowerById } from '../../services/growersApi';
import { fetchComplianceSummary } from '../../services/complianceApi';
import { updateGrower } from '../../services/growersApi';
import { sendMessage } from '../../services/messagesApi';
import { useNotification } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import { friendlyError } from '../../utils/apiErrors';
import './ReviewApplicationModal.css';

export default function ReviewApplicationModal({ applicationId, onClose, onReviewed }) {
    const { showError, showSuccess } = useNotification();
    const { user } = useAuth();
    const isViewOnly = user?.role === 'field_officer';
    
    const [grower, setGrower] = useState(null);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [notes, setNotes] = useState('');
    const [selectedAction, setSelectedAction] = useState(null);
    const [showDocumentsInfo, setShowDocumentsInfo] = useState(false);

    useEffect(() => {
        async function load() {
            setLoading(true);
            try {
                const [g, s] = await Promise.all([
                    fetchGrowerById(applicationId),
                    fetchComplianceSummary(applicationId),
                ]);
                setGrower(g);
                setSummary(s);
            } catch (err) {
                showError(friendlyError(err));
                onClose();
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [applicationId, showError, onClose]);

    async function handleReview(action) {
        if (!selectedAction) {
            setSelectedAction(action);
            return;
        }

        if (selectedAction !== action) {
            setSelectedAction(action);
            return;
        }

        // Map action to status
        const statusMap = {
            approve: 'approved',
            reject: 'rejected',
            pending: 'pending'
        };

        setSubmitting(true);
        try {
            await updateGrower(applicationId, { status: statusMap[action] });
            
            // Send message to grower if marking as pending (requesting more info)
            if (action === 'pending') {
                const messageBody = notes || 'More information is required for your application. Please review the compliance requirements and resubmit.';
                await sendMessage(applicationId, 'More Information Requested', messageBody);
            }
            
            showSuccess(`Application ${action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'marked pending'}.`);
            onReviewed();
            onClose();
        } catch (err) {
            showError(friendlyError(err));
        } finally {
            setSubmitting(false);
        }
    }

    if (loading) {
        return (
            <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
                <div className="review-modal">
                    <div className="review-modal-loading">Loading application...</div>
                </div>
            </div>
        );
    }

    if (!grower) return null;

    const REQUIRED_DOCUMENTS = 8;
    const checklist = summary?.documents ?? [];
    const approvedCount = checklist.filter(d => d.status === 'approved').length;
    const total = checklist.length;
    const missingDocuments = Math.max(0, REQUIRED_DOCUMENTS - approvedCount);
    const hasOutstandingDocuments = approvedCount < REQUIRED_DOCUMENTS;
    
    // Use grower's actual compliance and risk from backend
    const complianceScore = grower.compliance ?? 0;
    const riskLevel = grower.risk ?? 'medium';

    function InfoRow({ icon: Icon, label, value }) {
        if (!value) return null;
        return (
            <div className="review-info-row">
                <div className="review-info-label">
                    {Icon && <Icon size={14} />}
                    <span>{label}</span>
                </div>
                <span className="review-info-value">{value}</span>
            </div>
        );
    }

    return (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="review-modal" role="dialog" aria-modal="true" aria-labelledby="review-modal-title">
                
                {/* Header */}
                <div className="review-modal-header">
                    <div>
                        <h2 id="review-modal-title">Review Application</h2>
                        <p>{grower.name} · {grower.id}</p>
                    </div>
                    <button type="button" className="btn-close" onClick={onClose} aria-label="Close">
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div className="review-modal-body">
                    {/* Application Summary */}
                    <div className="review-section">
                        <div className="review-section-header">
                            <User size={16} />
                            <h3>Applicant Information</h3>
                        </div>
                        <div className="review-info-grid">
                            <InfoRow label="Full Name" value={grower.name} />
                            <InfoRow label="Phone" value={grower.phone} />
                            <InfoRow label="Email" value={grower.email} />
                            <InfoRow label="Registered" value={new Date(grower.registeredAt).toLocaleDateString()} />
                        </div>
                    </div>

                    {/* Business Details */}
                    {(grower.businessName || grower.businessRegNumber) && (
                        <div className="review-section">
                            <div className="review-section-header">
                                <Building2 size={16} />
                                <h3>Business Details</h3>
                            </div>
                            <div className="review-info-grid">
                                <InfoRow label="Business Name" value={grower.businessName} />
                                <InfoRow label="Reg Number" value={grower.businessRegNumber} />
                            </div>
                        </div>
                    )}

                    {/* Farm Details */}
                    <div className="review-section">
                        <div className="review-section-header">
                            <Leaf size={16} />
                            <h3>Farm Details</h3>
                        </div>
                        <div className="review-info-grid">
                            <InfoRow label="Plantation Size" value={grower.farmSize} />
                            <InfoRow label="Land Tenure" value={grower.landTenure} />
                            <InfoRow label="Tree Species" value={grower.treeSpecies} />
                        </div>
                    </div>

                    {/* Location */}
                    {(grower.gpsLat != null || grower.gpsLng != null) && (
                        <div className="review-section">
                            <div className="review-section-header">
                                <MapPin size={16} />
                                <h3>GPS Location</h3>
                            </div>
                            <div className="review-info-grid">
                                <InfoRow label="Latitude" value={grower.gpsLat?.toString()} />
                                <InfoRow label="Longitude" value={grower.gpsLng?.toString()} />
                            </div>
                        </div>
                    )}

                    {/* Compliance Overview */}
                    <div className="review-section review-compliance">
                        <div className="review-section-header">
                            <FileCheck size={16} />
                            <h3>Compliance Overview</h3>
                        </div>
                        
                        <div className="review-compliance-stats">
                            <div className="review-stat">
                                <span className="review-stat-label">Documents Approved</span>
                                <span className="review-stat-value">{approvedCount}/{total}</span>
                            </div>
                            <div className="review-stat">
                                <span className="review-stat-label">Compliance Rate</span>
                                <span className="review-stat-value">{complianceScore}%</span>
                            </div>
                            <div className="review-stat">
                                <span className="review-stat-label">Risk Level</span>
                                <span className={`badge badge-risk-${riskLevel}`}>{riskLevel}</span>
                            </div>
                        </div>

                        <div className="review-progress-track">
                            <div className="review-progress-fill" style={{ width: `${complianceScore}%` }} />
                        </div>
                    </div>

                    {/* Review Notes */}
                    <div className="review-section">
                        <label className="review-notes-label" htmlFor="review-notes">
                            Review Notes (Optional)
                        </label>
                        <textarea
                            id="review-notes"
                            className="review-notes-input"
                            placeholder="Add any notes about this application..."
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            rows={3}
                            disabled={isViewOnly}
                        />
                    </div>
                </div>

                {/* Actions Footer */}
                <div className="review-application-footer">
                    {hasOutstandingDocuments && (
                        <div className="review-documents-warning">
                            <Info size={16} />
                            <div className="review-warning-text">
                                <strong>{missingDocuments} outstanding document{missingDocuments !== 1 ? 's' : ''}</strong>
                                <p>Please ensure all required documents are approved before approving this application</p>
                            </div>
                        </div>
                    )}
                    
                    <div className="review-actions-group">
                        <button
                            type="button"
                            className="btn-review btn-reject"
                            onClick={() => handleReview('reject')}
                            disabled={submitting || isViewOnly}
                        >
                            <XCircle size={16} />
                            {selectedAction === 'reject' ? 'Confirm Reject' : 'Reject'}
                        </button>
                        <button
                            type="button"
                            className="btn-review btn-pending"
                            onClick={() => handleReview('pending')}
                            disabled={submitting || isViewOnly}
                        >
                            <AlertCircle size={16} />
                            {selectedAction === 'pending' ? 'Confirm Pending' : 'Request More Info'}
                        </button>
                        <button
                            type="button"
                            className="btn-review btn-approve"
                            onClick={() => handleReview('approve')}
                            disabled={submitting || isViewOnly || hasOutstandingDocuments}
                            title={hasOutstandingDocuments ? `${missingDocuments} outstanding document${missingDocuments !== 1 ? 's' : ''} - please review compliance` : 'Approve this application'}
                        >
                            <CheckCircle size={16} />
                            {selectedAction === 'approve' ? 'Confirm Approve' : 'Approve'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
