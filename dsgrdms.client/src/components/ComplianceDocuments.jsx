import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, CheckCircle, XCircle, AlertCircle, AlertTriangle, Upload, Users, MapPin, Droplet, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { fetchGrowerById } from '../services/growersApi';
import { fetchComplianceSummary, uploadComplianceDocument } from '../services/complianceApi';
import { useNotification } from '../context/NotificationContext';
import { friendlyError } from '../utils/apiErrors';
import UploadDocumentModal from './modals/UploadDocumentModal';
import './ComplianceDocuments.css';

const REGISTRATION_REQUIREMENTS = [
    { id: 'plantation', label: 'Plantation Information', icon: MapPin, required: true, docTypeId: 1 },
    { id: 'permit', label: 'Permit to Occupy/KHONZA Letter/Annexure A', icon: FileText, required: true, docTypeId: 2 },
    { id: 'water', label: 'Water Use Status', icon: Droplet, required: true, docTypeId: 3 },
    { id: 'certification', label: 'Certification Status (PEFC or FSC)', icon: Shield, required: true, docTypeId: 4 },
];

const FIELD_VISIT_DOCUMENTS = [
    { id: 'intake', label: 'Grower Intake Form', required: true, docTypeId: 8 },
    { id: 'id', label: 'ID Documents', required: true, docTypeId: 5 },
    { id: 'cipc', label: 'CIPC Documents', required: true, docTypeId: 6 },
    { id: 'bank', label: 'Bank Information', required: true, docTypeId: 7 },
    { id: 'plantation_info', label: 'Plantation Information', required: true, docTypeId: 1 },
];

export default function ComplianceDocuments() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { showError, showSuccess } = useNotification();
    const [growerData, setGrowerData] = useState(null);
    const [complianceData, setComplianceData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentStep, setCurrentStep] = useState('registration'); // registration, verification, field_visit, assistance, completed
    const [requirements, setRequirements] = useState(
        REGISTRATION_REQUIREMENTS.reduce((acc, req) => ({ ...acc, [req.id]: false }), {})
    );
    const [fieldVisitDocs, setFieldVisitDocs] = useState(
        FIELD_VISIT_DOCUMENTS.reduce((acc, doc) => ({ ...acc, [doc.id]: false }), {})
    );
    const [needsAssistance, setNeedsAssistance] = useState(false);
    const [agreementSigned, setAgreementSigned] = useState(false);
    const [uploadDoc, setUploadDoc] = useState(null);

    // Step progression order for persistent state
    const STEP_ORDER = ['registration', 'verification', 'field_visit', 'agreement', 'completed'];

    // Helper to get the furthest step reached from localStorage
    const getFurthestStep = () => {
        const saved = localStorage.getItem(`grower_${user?.growerId}_furthest_step`);
        if (saved && STEP_ORDER.includes(saved)) {
            return saved;
        }
        return 'registration';
    };

    // Helper to update furthest step if current step is further along
    const updateFurthestStep = (step) => {
        const currentIndex = STEP_ORDER.indexOf(step);
        const savedStep = localStorage.getItem(`grower_${user?.growerId}_furthest_step`);
        const savedIndex = savedStep ? STEP_ORDER.indexOf(savedStep) : -1;
        
        if (currentIndex > savedIndex) {
            localStorage.setItem(`grower_${user?.growerId}_furthest_step`, step);
        }
    };

    // Fetch grower data and compliance documents
    useEffect(() => {
        async function loadGrowerData() {
            if (!user?.growerId) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                const [grower, compliance] = await Promise.all([
                    fetchGrowerById(user.growerId),
                    fetchComplianceSummary(user.growerId).catch(() => null)
                ]);
                setGrowerData(grower);
                setComplianceData(compliance);

                // Auto-navigate to furthest step reached (once-off workflow)
                const furthestStep = getFurthestStep();
                setCurrentStep(furthestStep);
            } catch (err) {
                showError(friendlyError(err));
            } finally {
                setLoading(false);
            }
        }

        loadGrowerData();
    }, [user?.growerId, showError]);

    const allRequirementsMet = () => {
        // Check if all required documents are either checked OR uploaded
        return REGISTRATION_REQUIREMENTS.every(req => {
            const compDoc = complianceData?.documents?.find(doc => doc.docTypeId === req.docTypeId);
            const isUploaded = compDoc && compDoc.status !== 'not_uploaded';
            return requirements[req.id] || isUploaded;
        });
    };

    const allFieldVisitDocsMet = () => {
        // Check if all required field visit documents are either checked OR uploaded
        return FIELD_VISIT_DOCUMENTS.filter(doc => doc.required).every(doc => {
            const compDoc = complianceData?.documents?.find(d => d.docTypeId === doc.docTypeId);
            const isUploaded = compDoc && compDoc.status !== 'not_uploaded';
            return fieldVisitDocs[doc.id] || isUploaded;
        });
    };

    const handleToggleRequirement = (reqId) => {
        setRequirements(prev => ({ ...prev, [reqId]: !prev[reqId] }));
    };

    const handleToggleFieldDoc = (docId) => {
        setFieldVisitDocs(prev => ({ ...prev, [docId]: !prev[docId] }));
    };

    const handleVerification = () => {
        if (allRequirementsMet()) {
            updateFurthestStep('field_visit');
            setCurrentStep('field_visit');
        } else {
            updateFurthestStep('verification');
            setCurrentStep('assistance_check');
        }
    };

    const handleAssistanceDecision = (needsHelp) => {
        setNeedsAssistance(needsHelp);
        if (needsHelp) {
            updateFurthestStep('verification');
            setCurrentStep('assistance');
        } else {
            updateFurthestStep('verification');
            setCurrentStep('completed_incomplete');
        }
    };

    const handleFieldVisitComplete = () => {
        if (allFieldVisitDocsMet() && allRequirementsMet()) {
            updateFurthestStep('agreement');
            setCurrentStep('agreement');
        } else {
            alert('Please complete all required field visit documents before proceeding.');
        }
    };

    const handleAgreementSigned = () => {
        setAgreementSigned(true);
        updateFurthestStep('completed');
        setCurrentStep('completed');
    };

    const handleReturnToVerification = () => {
        setCurrentStep('verification');
    };

    const resetFlow = () => {
        setCurrentStep('registration');
        setRequirements(REGISTRATION_REQUIREMENTS.reduce((acc, req) => ({ ...acc, [req.id]: false }), {}));
        setFieldVisitDocs(FIELD_VISIT_DOCUMENTS.reduce((acc, doc) => ({ ...acc, [doc.id]: false }), {}));
        setNeedsAssistance(false);
        setAgreementSigned(false);
        // Clear the step progression tracking
        localStorage.removeItem(`grower_${user.growerId}_furthest_step`);
    };

    // Handle document upload
    const handleUpload = async (file) => {
        if (!uploadDoc || !user?.growerId) return;
        
        try {
            await uploadComplianceDocument(user.growerId, uploadDoc.docTypeId, file);
            showSuccess('Document uploaded successfully!');
            setUploadDoc(null);
            
            // Reload compliance data
            const updatedCompliance = await fetchComplianceSummary(user.growerId);
            setComplianceData(updatedCompliance);
        } catch (err) {
            showError(friendlyError(err));
            throw err;
        }
    };

    // Helper to find compliance document by docTypeId
    const getComplianceDoc = (docTypeId) => {
        return complianceData?.documents?.find(doc => doc.docTypeId === docTypeId) || null;
    };

    // Helper function to format location from grower data
    const formatLocation = () => {
        if (!growerData) return 'Not available';
        
        if (growerData.gpsLat && growerData.gpsLng) {
            return `${growerData.gpsLat.toFixed(4)}°, ${growerData.gpsLng.toFixed(4)}°`;
        }
        return growerData.businessName || 'Not specified';
    };

    const fullName = growerData ? `${growerData.firstName || ''} ${growerData.lastName || ''}`.trim() : user?.name || 'Loading...';
    const registryId = growerData?.id || 'Loading...';
    const location = formatLocation();

    if (loading) {
        return (
            <div className="compliance-documents">
                <div className="compliance-header">
                    <h1>My Compliance Verification</h1>
                    <p className="compliance-subtitle">Loading your information...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="compliance-documents">
            <div className="compliance-header">
                <h1>My Compliance Verification</h1>
                <p className="compliance-subtitle">Submit your documents for compliance verification</p>
            </div>

            {/* Progress Indicator */}
            <div className="workflow-progress">
                <div className={`progress-step ${['registration', 'verification', 'field_visit', 'assistance', 'agreement', 'completed'].includes(currentStep) ? 'active' : ''}`}>
                    <div className="step-number">1</div>
                    <span>Start</span>
                </div>
                <div className="progress-line"></div>
                <div className={`progress-step ${['verification', 'field_visit', 'assistance', 'agreement', 'completed'].includes(currentStep) ? 'active' : ''}`}>
                    <div className="step-number">2</div>
                    <span>Verification</span>
                </div>
                <div className="progress-line"></div>
                <div className={`progress-step ${['field_visit', 'agreement', 'completed'].includes(currentStep) ? 'active' : ''}`}>
                    <div className="step-number">3</div>
                    <span>Field Visit</span>
                </div>
                <div className="progress-line"></div>
                <div className={`progress-step ${['agreement', 'completed'].includes(currentStep) ? 'active' : ''}`}>
                    <div className="step-number">4</div>
                    <span>Agreement</span>
                </div>
                <div className="progress-line"></div>
                <div className={`progress-step ${currentStep === 'completed' ? 'active' : ''}`}>
                    <div className="step-number">5</div>
                    <span>Complete</span>
                </div>
            </div>

            {/* Registration Step */}
            {currentStep === 'registration' && (
                <div className="workflow-card">
                    <div className="card-icon">
                        <Users size={32} className="text-primary" />
                    </div>
                    <h2>Your Information</h2>
                    <p>Review your information and start your compliance verification process.</p>
                    <div className="grower-info">
                        <p><strong>Grower Name:</strong> {fullName}</p>
                        <p><strong>Registry ID:</strong> {registryId}</p>
                        <p><strong>Location:</strong> {location}</p>
                        {growerData?.businessName && (
                            <p><strong>Business:</strong> {growerData.businessName}</p>
                        )}
                    </div>
                    <button className="btn btn-primary" onClick={() => {
                        updateFurthestStep('verification');
                        setCurrentStep('verification');
                    }}>
                        Start Verification
                    </button>
                </div>
            )}

            {/* Verification Step */}
            {currentStep === 'verification' && (
                <div className="workflow-card">
                    <div className="card-icon">
                        <FileText size={32} className="text-primary" />
                    </div>
                    <h2>Document Verification Checklist</h2>
                    <p>Upload and verify the following required documents:</p>
                    
                    <div className="requirements-list">
                        {REGISTRATION_REQUIREMENTS.map(req => {
                            const Icon = req.icon;
                            const compDoc = getComplianceDoc(req.docTypeId);
                            const isUploaded = compDoc && compDoc.status !== 'not_uploaded';
                            const isApproved = compDoc && compDoc.status === 'approved';
                            
                            return (
                                <div key={req.id} className="requirement-item-enhanced">
                                    <div className="requirement-info">
                                        <Icon size={20} />
                                        <div className="requirement-text">
                                            <span className="requirement-label">{req.label}</span>
                                            {req.required && <span className="required-badge">Required</span>}
                                            {compDoc && (
                                                <span className={`doc-status-small ${compDoc.status}`}>
                                                    {compDoc.status === 'approved' ? 'Approved' :
                                                     compDoc.status === 'pending_review' ? 'Pending Review' :
                                                     compDoc.status === 'rejected' ? 'Rejected' :
                                                     'Not Uploaded'}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="requirement-actions">
                                        <div 
                                            className={`requirement-checkbox ${isUploaded ? 'checked' : ''}`}
                                            onClick={() => handleToggleRequirement(req.id)}
                                        >
                                            {isUploaded ? <CheckCircle size={20} /> : <XCircle size={20} />}
                                        </div>
                                        {compDoc && (
                                            <button
                                                className="btn-upload-mini"
                                                onClick={() => setUploadDoc(compDoc)}
                                                disabled={isApproved}
                                            >
                                                <Upload size={14} />
                                                {isUploaded ? 'Re-upload' : 'Upload'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="verification-status">
                        {allRequirementsMet() ? (
                            <div className="status-message success">
                                <CheckCircle size={20} />
                                <span>All documents ready! A field officer will schedule a visit to your property.</span>
                            </div>
                        ) : (
                            <div className="status-message warning">
                                <AlertCircle size={20} />
                                <span>Some documents are missing. You may need assistance.</span>
                            </div>
                        )}
                    </div>

                    <button className="btn btn-primary" onClick={handleVerification}>
                        Continue to Next Step
                    </button>
                </div>
            )}

            {/* Assistance Check */}
            {currentStep === 'assistance_check' && (
                <div className="workflow-card">
                    <div className="card-icon">
                        <AlertTriangle size={32} className="text-warning" />
                    </div>
                    <h2>Requirements Not Met</h2>
                    <p>Would you like assistance to meet the compliance requirements?</p>
                    
                    <div className="decision-buttons">
                        <button className="btn btn-primary" onClick={() => handleAssistanceDecision(true)}>
                            Yes - Provide Assistance
                        </button>
                        <button className="btn btn-secondary" onClick={() => handleAssistanceDecision(false)}>
                            No - End Process
                        </button>
                    </div>
                </div>
            )}

            {/* Assistance Step */}
            {currentStep === 'assistance' && (
                <div className="workflow-card">
                    <div className="card-icon">
                        <Shield size={32} className="text-primary" />
                    </div>
                    <h2>Compliance Assistance</h2>
                    <p>Our team will help you meet the compliance requirements for the following:</p>
                    
                    <div className="assistance-info">
                        <h3>Assistance Areas:</h3>
                        <ul>
                            {REGISTRATION_REQUIREMENTS.filter(req => !requirements[req.id]).map(req => (
                                <li key={req.id}>
                                    <AlertCircle size={16} />
                                    {req.label}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <p className="info-text">Once you've completed these requirements with assistance, return to verification.</p>
                    
                    <button className="btn btn-primary" onClick={handleReturnToVerification}>
                        Return to Verification
                    </button>
                </div>
            )}

            {/* Field Visit Step */}
            {currentStep === 'field_visit' && (
                <div className="workflow-card">
                    <div className="card-icon">
                        <Users size={32} className="text-primary" />
                    </div>
                    <h2>Field Visit Scheduling</h2>
                    <p>A field officer will visit your property to verify the following documents:</p>
                    
                    <div className="requirements-list">
                        {FIELD_VISIT_DOCUMENTS.map(doc => {
                            const compDoc = getComplianceDoc(doc.docTypeId);
                            const isUploaded = compDoc && compDoc.status !== 'not_uploaded';
                            const isApproved = compDoc && compDoc.status === 'approved';
                            
                            return (
                                <div key={doc.id} className="requirement-item-enhanced">
                                    <div className="requirement-info">
                                        <FileText size={20} />
                                        <div className="requirement-text">
                                            <span className="requirement-label">{doc.label}</span>
                                            {doc.required && <span className="required-badge">Required</span>}
                                            {compDoc && (
                                                <span className={`doc-status-small ${compDoc.status}`}>
                                                    {compDoc.status === 'approved' ? 'Approved' :
                                                     compDoc.status === 'pending_review' ? 'Pending Review' :
                                                     compDoc.status === 'rejected' ? 'Rejected' :
                                                     'Not Uploaded'}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="requirement-actions">
                                        <div 
                                            className={`requirement-checkbox ${isUploaded ? 'checked' : ''}`}
                                            onClick={() => handleToggleFieldDoc(doc.id)}
                                        >
                                            {isUploaded ? <CheckCircle size={20} /> : <XCircle size={20} />}
                                        </div>
                                        {compDoc && (
                                            <button
                                                className="btn-upload-mini"
                                                onClick={() => setUploadDoc(compDoc)}
                                                disabled={isApproved}
                                            >
                                                <Upload size={14} />
                                                {isUploaded ? 'Re-upload' : 'Upload'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <button className="btn btn-primary" onClick={handleFieldVisitComplete}>
                        Mark Field Visit Complete
                    </button>
                </div>
            )}

            {/* Agreement Step */}
            {currentStep === 'agreement' && (
                <div className="workflow-card">
                    <div className="card-icon">
                        <FileText size={32} className="text-primary" />
                    </div>
                    <h2>Sign Your Compliance Agreement</h2>
                    <p>Review and sign your compliance agreement to complete the verification process.</p>
                    
                    <div className="agreement-box">
                        <h3>Compliance Agreement</h3>
                        <p>By signing this agreement, you confirm:</p>
                        <ul>
                            <li>All provided information is accurate and complete</li>
                            <li>Compliance with required certifications and permits</li>
                            <li>Agreement to ongoing monitoring and field visits</li>
                            <li>Information will be recorded in the MZ Plantation Management System</li>
                        </ul>
                    </div>

                    <button className="btn btn-primary" onClick={handleAgreementSigned}>
                        Confirm Agreement Signed
                    </button>
                </div>
            )}

            {/* Completed Step */}
            {currentStep === 'completed' && (
                <div className="workflow-card success">
                    <div className="card-icon">
                        <CheckCircle size={48} className="text-success" />
                    </div>
                    <h2>Verification Complete!</h2>
                    <p>Your information has been successfully verified and recorded in the system.</p>
                    
                    <div className="completion-summary">
                        <h3>Summary:</h3>
                        <p><strong>Grower:</strong> {fullName}</p>
                        <p><strong>Registry ID:</strong> {registryId}</p>
                        {growerData?.businessName && (
                            <p><strong>Business:</strong> {growerData.businessName}</p>
                        )}
                        <p><strong>Status:</strong> <span className="status-badge approved">Approved & Compliant</span></p>
                        <p><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
                    </div>

                    <div className="completion-actions">
                        <button className="btn btn-primary" onClick={() => navigate('/')}>
                            Return to Dashboard
                        </button>
                    </div>
                </div>
            )}

            {/* Incomplete Completion */}
            {currentStep === 'completed_incomplete' && (
                <div className="workflow-card error">
                    <div className="card-icon">
                        <XCircle size={48} className="text-error" />
                    </div>
                    <h2>Verification Cannot Be Completed</h2>
                    <p>You do not currently meet all compliance requirements and cannot receive assistance at this time.</p>
                    
                    <div className="completion-actions">
                        <button className="btn btn-primary" onClick={() => navigate('/')}>
                            Return to Dashboard
                        </button>
                    </div>
                </div>
            )}

            {/* Upload Modal */}
            {uploadDoc && (
                <UploadDocumentModal
                    doc={uploadDoc}
                    onClose={() => setUploadDoc(null)}
                    onSubmit={handleUpload}
                />
            )}
        </div>
    );
}
