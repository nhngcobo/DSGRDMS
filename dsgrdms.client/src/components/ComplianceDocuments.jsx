import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, CheckCircle, XCircle, AlertCircle, AlertTriangle, Upload, Users, MapPin, Droplet, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './ComplianceDocuments.css';

const REGISTRATION_REQUIREMENTS = [
    { id: 'plantation', label: 'Plantation Information', icon: MapPin, required: true },
    { id: 'permit', label: 'Permit to Occupy/KHONZA Letter/Annexure A', icon: FileText, required: true },
    { id: 'water', label: 'Water Use Status', icon: Droplet, required: true },
    { id: 'certification', label: 'Certification Status (PEFC or FSC)', icon: Shield, required: true },
];

const FIELD_VISIT_DOCUMENTS = [
    { id: 'intake', label: 'Grower Intake Form', required: true },
    { id: 'id', label: 'ID Documents', required: true },
    { id: 'cipc', label: 'CIPC Documents', required: false },
    { id: 'bank', label: 'Bank Information', required: true },
    { id: 'plantation_info', label: 'Plantation Information', required: true },
];

export default function ComplianceDocuments() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState('registration'); // registration, verification, field_visit, assistance, completed
    const [requirements, setRequirements] = useState(
        REGISTRATION_REQUIREMENTS.reduce((acc, req) => ({ ...acc, [req.id]: false }), {})
    );
    const [fieldVisitDocs, setFieldVisitDocs] = useState(
        FIELD_VISIT_DOCUMENTS.reduce((acc, doc) => ({ ...acc, [doc.id]: false }), {})
    );
    const [needsAssistance, setNeedsAssistance] = useState(false);
    const [agreementSigned, setAgreementSigned] = useState(false);

    const allRequirementsMet = () => {
        return REGISTRATION_REQUIREMENTS.every(req => requirements[req.id]);
    };

    const allFieldVisitDocsMet = () => {
        return FIELD_VISIT_DOCUMENTS.filter(doc => doc.required).every(doc => fieldVisitDocs[doc.id]);
    };

    const handleToggleRequirement = (reqId) => {
        setRequirements(prev => ({ ...prev, [reqId]: !prev[reqId] }));
    };

    const handleToggleFieldDoc = (docId) => {
        setFieldVisitDocs(prev => ({ ...prev, [docId]: !prev[docId] }));
    };

    const handleVerification = () => {
        if (allRequirementsMet()) {
            setCurrentStep('field_visit');
        } else {
            setCurrentStep('assistance_check');
        }
    };

    const handleAssistanceDecision = (needsHelp) => {
        setNeedsAssistance(needsHelp);
        if (needsHelp) {
            setCurrentStep('assistance');
        } else {
            setCurrentStep('completed_incomplete');
        }
    };

    const handleFieldVisitComplete = () => {
        if (allFieldVisitDocsMet() && allRequirementsMet()) {
            setCurrentStep('agreement');
        } else {
            alert('Please complete all required field visit documents before proceeding.');
        }
    };

    const handleAgreementSigned = () => {
        setAgreementSigned(true);
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
    };

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
                        <p><strong>Grower Name:</strong> {user?.fullName || 'Nhlanhla Fortune Ngcobo'}</p>
                        <p><strong>Registry ID:</strong> {user?.registryId || 'GHW-OR-992-04'}</p>
                        <p><strong>Location:</strong> {user?.location || 'Willamette Valley, OR'}</p>
                    </div>
                    <button className="btn btn-primary" onClick={() => setCurrentStep('verification')}>
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
                    <p>Confirm you have the following required documents:</p>
                    
                    <div className="requirements-list">
                        {REGISTRATION_REQUIREMENTS.map(req => {
                            const Icon = req.icon;
                            return (
                                <div key={req.id} className="requirement-item" onClick={() => handleToggleRequirement(req.id)}>
                                    <div className="requirement-info">
                                        <Icon size={20} />
                                        <span>{req.label}</span>
                                        {req.required && <span className="required-badge">Required</span>}
                                    </div>
                                    <div className={`requirement-status ${requirements[req.id] ? 'met' : 'pending'}`}>
                                        {requirements[req.id] ? <CheckCircle size={20} /> : <XCircle size={20} />}
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
                        {FIELD_VISIT_DOCUMENTS.map(doc => (
                            <div key={doc.id} className="requirement-item" onClick={() => handleToggleFieldDoc(doc.id)}>
                                <div className="requirement-info">
                                    <FileText size={20} />
                                    <span>{doc.label}</span>
                                    {doc.required && <span className="required-badge">Required</span>}
                                </div>
                                <div className={`requirement-status ${fieldVisitDocs[doc.id] ? 'met' : 'pending'}`}>
                                    {fieldVisitDocs[doc.id] ? <CheckCircle size={20} /> : <XCircle size={20} />}
                                </div>
                            </div>
                        ))}
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
                        <p><strong>Grower:</strong> {user?.fullName || 'Nhlanhla Fortune Ngcobo'}</p>
                        <p><strong>Registry ID:</strong> {user?.registryId || 'GHW-OR-992-04'}</p>
                        <p><strong>Status:</strong> <span className="status-badge approved">Verified & Compliant</span></p>
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
        </div>
    );
}
