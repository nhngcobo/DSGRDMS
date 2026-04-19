import { useState, useEffect, useCallback } from 'react';
import { CheckCircle2, Upload, FileCheck, AlertCircle, RotateCcw } from 'lucide-react';
import { registerGrower } from '../services/growersApi';
import { fetchComplianceSummary, uploadComplianceDocument } from '../services/complianceApi';
import { useRole } from '../context/RoleContext';
import { useNotification } from '../context/NotificationContext';
import { friendlyError } from '../utils/apiErrors';
import './GrowerApplication.css';

// The 8 required docs from the registration flow
const REG_DOCS = [
    { id: 1, name: 'Plantation Declaration',                         category: 'Registration' },
    { id: 2, name: 'Permit to Occupy / KHONZA Letter / Annexure A',  category: 'Registration' },
    { id: 3, name: 'Water Use License',                              category: 'Registration' },
    { id: 4, name: 'FSC / PEFC Certification',                       category: 'Registration' },
    { id: 5, name: 'ID Document',                                    category: 'Verification' },
    { id: 6, name: 'CIPC Documents',                                 category: 'Verification' },
    { id: 7, name: 'Bank Account Details',                           category: 'Verification' },
    { id: 8, name: 'Grower Intake Form',                             category: 'Verification' },
];

const AGREEMENT_DOC_ID = 14;

const EMPTY_FORM = {
    firstName: '', lastName: '', idNumber: '', phone: '',
    email: '', businessName: '', businessRegNumber: '',
    landTenure: '', treeSpecies: '', plantationSize: '',
    gpsLat: '', gpsLng: '',
};

const STATUS_BADGE = {
    approved:       { cls: 'doc-badge-approved',     text: 'Approved'     },
    pending_review: { cls: 'doc-badge-pending',       text: 'In Review'    },
    not_uploaded:   { cls: 'doc-badge-not-uploaded',  text: 'Not Uploaded' },
    rejected:       { cls: 'doc-badge-rejected',      text: 'Rejected'     },
};

export default function GrowerApplication() {
    const { growerAppId, setGrowerAppId, clearGrowerApp } = useRole();
    const { showError, showSuccess } = useNotification();

    const [step, setStep]               = useState(growerAppId ? 2 : 1);
    const [form, setForm]               = useState(EMPTY_FORM);
    const [errors, setErrors]           = useState({});
    const [submitting, setSubmitting]   = useState(false);
    const [summary, setSummary]         = useState(null);
    const [uploading, setUploading]     = useState({});
    const [agreementChecked, setAgreementChecked] = useState(false);
    const [agreementFile, setAgreementFile]       = useState(null);

    const loadSummary = useCallback(async (id) => {
        if (!id) return;
        try {
            const data = await fetchComplianceSummary(id);
            setSummary(data);
            if (data.growerStatus === 'verified') setStep(s => Math.max(s, 3));
        } catch (err) {
            showError(friendlyError(err));
        }
    }, [showError]);

    useEffect(() => {
        if (growerAppId) loadSummary(growerAppId);
    }, [growerAppId, loadSummary]);

    function field(key) {
        return e => setForm(f => ({ ...f, [key]: e.target.value }));
    }

    function validate() {
        const errs = {};
        if (!form.firstName.trim())    errs.firstName    = 'Required';
        if (!form.lastName.trim())     errs.lastName     = 'Required';
        if (!form.idNumber.trim() || !/^\d{1,13}$/.test(form.idNumber.trim()))
            errs.idNumber = 'Enter a valid SA ID number';
        if (!form.phone.trim())        errs.phone        = 'Required';
        if (!form.landTenure)          errs.landTenure   = 'Required';
        if (!form.treeSpecies)         errs.treeSpecies  = 'Required';
        if (!form.plantationSize.trim() || isNaN(Number(form.plantationSize)))
            errs.plantationSize = 'Enter a valid size in hectares';
        return errs;
    }

    async function handleSubmitStep1(e) {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length) { setErrors(errs); return; }
        setSubmitting(true);
        try {
            const grower = await registerGrower({
                ...form,
                plantationSize: parseFloat(form.plantationSize),
                gpsLat: form.gpsLat !== '' ? parseFloat(form.gpsLat) : null,
                gpsLng: form.gpsLng !== '' ? parseFloat(form.gpsLng) : null,
            });
            setGrowerAppId(grower.id);
            await loadSummary(grower.id);
            setStep(2);
        } catch (err) {
            showError(friendlyError(err));
        } finally {
            setSubmitting(false);
        }
    }

    async function handleDocUpload(docTypeId, file) {
        if (!file) return;
        setUploading(u => ({ ...u, [docTypeId]: true }));
        try {
            await uploadComplianceDocument(growerAppId, docTypeId, file);
            await loadSummary(growerAppId);
        } catch (err) {
            showError(friendlyError(err));
        } finally {
            setUploading(u => ({ ...u, [docTypeId]: false }));
        }
    }

    async function handleSubmitAgreement() {
        if (!agreementChecked) { showError('Please tick the agreement checkbox first.'); return; }
        if (!agreementFile)    { showError('Please upload your signed agreement document.'); return; }
        setSubmitting(true);
        try {
            await uploadComplianceDocument(growerAppId, AGREEMENT_DOC_ID, agreementFile);
            await loadSummary(growerAppId);
            showSuccess('Agreement submitted successfully! Awaiting final approval.');
            setAgreementFile(null);
        } catch (err) {
            showError(friendlyError(err));
        } finally {
            setSubmitting(false);
        }
    }

    const growerStatus = summary?.growerStatus ?? 'pending';
    const docs = summary?.documents ?? [];

    function docStatus(docId) {
        return docs.find(d => d.docTypeId === docId)?.status ?? 'not_uploaded';
    }

    const stepDone = [
        growerAppId !== null,
        REG_DOCS.every(d => docStatus(d.id) !== 'not_uploaded'),
        docStatus(AGREEMENT_DOC_ID) !== 'not_uploaded',
    ];

    const STEPS = [
        { n: 1, label: 'Personal Info' },
        { n: 2, label: 'Documents'     },
        { n: 3, label: 'Agreement'     },
    ];

    function handleReset() {
        clearGrowerApp();
        setStep(1);
        setSummary(null);
        setForm(EMPTY_FORM);
        setErrors({});
        setAgreementChecked(false);
        setAgreementFile(null);
    }

    return (
        <div className="grower-app-page">

            {/* Header */}
            <div className="grower-app-header">
                <div>
                    <h1>My Registration Application</h1>
                    <p>Complete all steps to register as a Mondi Zimele supplier</p>
                </div>
                {growerAppId && (
                    <button className="grower-app-reset" onClick={handleReset}>
                        <RotateCcw size={13} /> Reset (Demo)
                    </button>
                )}
            </div>

            {/* Status banner */}
            {growerAppId && (
                <div className={`grower-status-banner grower-status-${growerStatus}`}>
                    {growerStatus === 'pending'  && <><AlertCircle size={15} /> Application submitted — awaiting review by the agent coordinator.</>}
                    {growerStatus === 'verified' && <><CheckCircle2 size={15} /> Your application has been approved! Please proceed to sign the agreement.</>}
                    {growerStatus === 'rejected' && <><AlertCircle size={15} /> Your application was not approved. Contact your agent coordinator for assistance.</>}
                </div>
            )}

            {/* Step indicator */}
            <div className="grower-app-steps">
                {STEPS.map((s, i) => (
                    <div key={s.n} className="grower-step-wrapper">
                        <div
                            className={`grower-step-dot ${step === s.n ? 'active' : stepDone[i] ? 'done' : ''}`}
                            onClick={() => {
                                if (!growerAppId) return;
                                if (s.n === 3 && growerStatus !== 'verified') return;
                                if (s.n <= 2 || growerStatus === 'verified') setStep(s.n);
                            }}
                            style={{ cursor: growerAppId && (s.n <= 2 || growerStatus === 'verified') ? 'pointer' : 'default' }}
                        >
                            {stepDone[i] ? <CheckCircle2 size={13} /> : s.n}
                        </div>
                        <span className={`grower-step-label ${step === s.n ? 'active' : ''}`}>{s.label}</span>
                        {i < STEPS.length - 1 && <div className={`grower-step-line ${stepDone[i] ? 'done' : ''}`} />}
                    </div>
                ))}
            </div>

            {/* ── Step 1: Personal Info ── */}
            {step === 1 && (
                <form className="grower-app-card" onSubmit={handleSubmitStep1}>
                    <h2 className="grower-card-title">Personal &amp; Plantation Information</h2>
                    <p className="grower-card-subtitle">
                        Provide your details to begin the registration process. Required fields are marked with *.
                    </p>

                    <div className="grower-form-grid">
                        {[
                            { key: 'firstName',    label: 'First Name *',            type: 'text',   placeholder: 'Enter first name'    },
                            { key: 'lastName',     label: 'Last Name *',             type: 'text',   placeholder: 'Enter last name'     },
                            { key: 'idNumber',     label: 'SA ID Number *',          type: 'text',   placeholder: '13-digit ID number', maxLength: 13 },
                            { key: 'phone',        label: 'Phone *',                 type: 'text',   placeholder: 'e.g. +27821234567'   },
                            { key: 'email',        label: 'Email',                   type: 'email',  placeholder: 'Optional'            },
                            { key: 'businessName', label: 'Business Name',           type: 'text',   placeholder: 'Optional'            },
                            { key: 'businessRegNumber', label: 'Business Reg. No.', type: 'text',   placeholder: 'Optional'            },
                            { key: 'plantationSize', label: 'Plantation Size (ha) *', type: 'number', placeholder: 'e.g. 25.5', min: '0', step: '0.1' },
                        ].map(({ key, label, ...inputProps }) => (
                            <div key={key} className={`grower-field ${errors[key] ? 'has-error' : ''}`}>
                                <label>{label}</label>
                                <input value={form[key]} onChange={field(key)} {...inputProps} />
                                {errors[key] && <span className="field-error">{errors[key]}</span>}
                            </div>
                        ))}

                        <div className={`grower-field ${errors.landTenure ? 'has-error' : ''}`}>
                            <label>Land Tenure *</label>
                            <select value={form.landTenure} onChange={field('landTenure')}>
                                <option value="">Select…</option>
                                <option value="owned">Owned</option>
                                <option value="leased">Leased</option>
                                <option value="communal">Communal</option>
                            </select>
                            {errors.landTenure && <span className="field-error">{errors.landTenure}</span>}
                        </div>
                        <div className={`grower-field ${errors.treeSpecies ? 'has-error' : ''}`}>
                            <label>Tree Species *</label>
                            <select value={form.treeSpecies} onChange={field('treeSpecies')}>
                                <option value="">Select…</option>
                                <option value="eucalyptus">Eucalyptus</option>
                                <option value="pine">Pine</option>
                                <option value="wattle">Wattle</option>
                                <option value="mixed">Mixed</option>
                            </select>
                            {errors.treeSpecies && <span className="field-error">{errors.treeSpecies}</span>}
                        </div>
                        <div className={`grower-field ${errors.gpsLat ? 'has-error' : ''}`}>
                            <label>GPS Latitude</label>
                            <input type="number" step="any" value={form.gpsLat} onChange={field('gpsLat')} placeholder="e.g. -29.8587" />
                            {errors.gpsLat && <span className="field-error">{errors.gpsLat}</span>}
                        </div>
                        <div className={`grower-field ${errors.gpsLng ? 'has-error' : ''}`}>
                            <label>GPS Longitude</label>
                            <input type="number" step="any" value={form.gpsLng} onChange={field('gpsLng')} placeholder="e.g. 30.9823" />
                            {errors.gpsLng && <span className="field-error">{errors.gpsLng}</span>}
                        </div>
                    </div>

                    <div className="grower-form-actions">
                        <button type="submit" className="grower-btn-primary" disabled={submitting}>
                            {submitting ? 'Submitting…' : 'Submit & Continue →'}
                        </button>
                    </div>
                </form>
            )}

            {/* ── Step 2: Documents ── */}
            {step === 2 && (
                <div className="grower-app-card">
                    <h2 className="grower-card-title">Required Documents</h2>
                    <p className="grower-card-subtitle">
                        Upload all documents below. Your application will be reviewed by an agent coordinator once submitted.
                    </p>

                    {['Registration', 'Verification'].map(category => (
                        <div key={category} className="grower-doc-group">
                            <h3 className="grower-doc-group-title">{category} Documents</h3>
                            {REG_DOCS.filter(d => d.category === category).map(doc => {
                                const status = docStatus(doc.id);
                                const badge  = STATUS_BADGE[status];
                                const busy   = uploading[doc.id];
                                const done   = status === 'approved';
                                return (
                                    <div key={doc.id} className={`grower-doc-row grower-doc-${status}`}>
                                        <div className="grower-doc-info">
                                            <span className="grower-doc-name">{doc.name}</span>
                                            <span className={`grower-doc-status ${badge.cls}`}>{badge.text}</span>
                                        </div>
                                        <label className={`grower-doc-upload-btn ${done || busy ? 'disabled' : ''}`}>
                                            {busy ? 'Uploading…' : done
                                                ? <><FileCheck size={13} /> Approved</>
                                                : <><Upload size={13} /> {status === 'pending_review' ? 'Re-upload' : 'Upload'}</>
                                            }
                                            <input
                                                type="file"
                                                hidden
                                                disabled={done || busy}
                                                onChange={e => handleDocUpload(doc.id, e.target.files?.[0])}
                                            />
                                        </label>
                                    </div>
                                );
                            })}
                        </div>
                    ))}

                    <div className="grower-form-actions">
                        <button className="grower-btn-secondary" onClick={() => setStep(1)}>← Back</button>
                        {growerStatus === 'verified' && (
                            <button className="grower-btn-primary" onClick={() => setStep(3)}>
                                Proceed to Agreement →
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* ── Step 3: Agreement ── */}
            {step === 3 && (
                <div className="grower-app-card">
                    <h2 className="grower-card-title">Sign Grower Agreement</h2>
                    <p className="grower-card-subtitle">
                        Your application has been approved. Please read, sign and submit the agreement to complete your registration.
                    </p>

                    <div className="grower-agreement-terms">
                        <p className="grower-terms-heading">By signing this agreement, I confirm that:</p>
                        <ul>
                            <li>All information submitted in my application is accurate and complete.</li>
                            <li>I agree to supply timber/fibre to Mondi Zimele as per the agreed terms.</li>
                            <li>I will maintain the required certifications and compliance standards.</li>
                            <li>I consent to scheduled field visits by agent coordinators.</li>
                            <li>I understand that non-compliance may result in suspension from the programme.</li>
                        </ul>
                    </div>

                    <label className="grower-agreement-checkbox">
                        <input
                            type="checkbox"
                            checked={agreementChecked}
                            onChange={e => setAgreementChecked(e.target.checked)}
                        />
                        <span>I have read and agree to the Mondi Zimele Grower Agreement terms and conditions</span>
                    </label>

                    <div className="grower-agreement-upload">
                        <p className="grower-upload-label">Upload Signed Agreement Document *</p>
                        <label className="grower-file-input-label">
                            <Upload size={14} />
                            {agreementFile ? agreementFile.name : 'Choose signed PDF or image…'}
                            <input
                                type="file"
                                hidden
                                accept=".pdf,.jpg,.jpeg,.png"
                                onChange={e => setAgreementFile(e.target.files?.[0] ?? null)}
                            />
                        </label>
                    </div>

                    {docStatus(AGREEMENT_DOC_ID) !== 'not_uploaded' && (
                        <div className={`grower-agreement-submitted ${STATUS_BADGE[docStatus(AGREEMENT_DOC_ID)].cls}`}>
                            Submitted agreement: <strong>{STATUS_BADGE[docStatus(AGREEMENT_DOC_ID)].text}</strong>
                        </div>
                    )}

                    <div className="grower-form-actions">
                        <button className="grower-btn-secondary" onClick={() => setStep(2)}>← Back</button>
                        <button
                            className="grower-btn-primary"
                            onClick={handleSubmitAgreement}
                            disabled={submitting || !agreementChecked || !agreementFile || docStatus(AGREEMENT_DOC_ID) === 'approved'}
                        >
                            {submitting ? 'Submitting…' : docStatus(AGREEMENT_DOC_ID) === 'approved' ? '✓ Agreement Approved' : 'Submit Agreement'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
