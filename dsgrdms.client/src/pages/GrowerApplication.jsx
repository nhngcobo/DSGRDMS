import { useState, useEffect } from 'react';
import { CheckCircle2, Upload, FileCheck, AlertCircle, ArrowRight } from 'lucide-react';
import { registerGrower } from '../services/growersApi';
import { fetchComplianceSummary, uploadComplianceDocument } from '../services/complianceApi';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { friendlyError } from '../utils/apiErrors';

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
    approved:       { cls: 'bg-green-100 text-green-700',     text: 'Approved'     },
    pending_review: { cls: 'bg-orange-100 text-orange-700',   text: 'In Review'    },
    not_uploaded:   { cls: 'bg-gray-100 text-gray-700',       text: 'Not Uploaded' },
    rejected:       { cls: 'bg-red-100 text-red-700',         text: 'Rejected'     },
};

export default function GrowerApplication() {
    const { user, linkGrower } = useAuth();
    const growerAppId = user?.growerId ?? null;
    const { showError, showSuccess } = useNotification();

    const [step, setStep]               = useState(user?.growerId ? 2 : 1);
    const [form, setForm]               = useState(EMPTY_FORM);
    const [errors, setErrors]           = useState({});
    const [submitting, setSubmitting]   = useState(false);
    const [summary, setSummary]         = useState(null);
    const [uploading, setUploading]     = useState({});
    const [agreementChecked, setAgreementChecked] = useState(false);
    const [agreementFile, setAgreementFile]       = useState(null);

    // Load form data and compliance summary
    useEffect(() => {
        if (growerAppId) {
            fetchComplianceSummary(growerAppId)
                .then(setSummary)
                .catch(err => console.error('Error fetching summary:', err));
        }
    }, [growerAppId]);

    // Validate step 1 form
    function validate() {
        const errs = {};
        if (!form.firstName.trim()) errs.firstName = 'Required';
        if (!form.lastName.trim())  errs.lastName = 'Required';
        if (!form.idNumber.trim())  errs.idNumber = 'Required';
        if (!form.phone.trim())     errs.phone = 'Required';
        if (!form.landTenure)       errs.landTenure = 'Required';
        if (!form.treeSpecies)      errs.treeSpecies = 'Required';
        if (!form.plantationSize)   errs.plantationSize = 'Required';
        if (form.plantationSize && isNaN(form.plantationSize)) errs.plantationSize = 'Must be a number';
        if (!form.gpsLat)           errs.gpsLat = 'Location (Latitude) is required';
        if (!form.gpsLng)           errs.gpsLng = 'Location (Longitude) is required';
        return errs;
    }

    // Submit step 1 form
    async function handleSubmit(e) {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length) { setErrors(errs); return; }
        setSubmitting(true);
        try {
            const res = await registerGrower(form);
            await linkGrower(res.id);
            setStep(2);
            showSuccess('Registration info saved. Please upload documents.');
        } catch (err) {
            showError(friendlyError(err));
        } finally {
            setSubmitting(false);
        }
    }

    // Handle document upload
    async function handleDocUpload(docId, file) {
        if (!file || !growerAppId) return;
        setUploading(p => ({...p, [docId]: true}));
        try {
            await uploadComplianceDocument(growerAppId, docId, file);
            const updated = await fetchComplianceSummary(growerAppId);
            setSummary(updated);
            showSuccess('Document uploaded successfully');
        } catch (err) {
            showError(friendlyError(err));
        } finally {
            setUploading(p => ({...p, [docId]: false}));
        }
    }

    return (
        <div className="p-6 md:p-10 max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-10">
                <h1 className="text-3xl font-bold text-gray-900">My Registration Application</h1>
                <p className="text-gray-600 mt-1">Complete all steps to register as a plantation grower</p>
            </div>

                        {/* Progress Steps */}
                        <div className="flex items-center justify-between mb-10">
                            <div className="flex-1 flex items-center">
                                {/* Step 1 */}
                                <div className="flex flex-col items-center">
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${
                                        step >= 1 ? 'bg-teal-700' : 'bg-gray-300'
                                    }`}>
                                        1
                                    </div>
                                    <p className="text-xs font-bold mt-2 text-gray-900">Personal Info</p>
                                </div>

                                {/* Connector Line */}
                                <div className={`flex-1 h-1 mx-4 ${step >= 2 ? 'bg-teal-700' : 'bg-gray-300'}`}></div>

                                {/* Step 2 */}
                                <div className="flex flex-col items-center">
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${
                                        step >= 2 ? 'bg-teal-700' : 'bg-gray-300'
                                    }`}>
                                        2
                                    </div>
                                    <p className="text-xs font-bold mt-2 text-gray-900">Documents</p>
                                </div>

                                {/* Connector Line */}
                                <div className={`flex-1 h-1 mx-4 ${step >= 3 ? 'bg-teal-700' : 'bg-gray-300'}`}></div>

                                {/* Step 3 */}
                                <div className="flex flex-col items-center">
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${
                                        step >= 3 ? 'bg-teal-700' : 'bg-gray-300'
                                    }`}>
                                        3
                                    </div>
                                    <p className="text-xs font-bold mt-2 text-gray-900">Agreement</p>
                                </div>
                            </div>
                        </div>

                        {/* Step 1: Personal Info */}
                        {step === 1 && (
                            <div className="bg-white p-8 rounded-xl border border-gray-200">
                                <h2 className="text-xl font-bold text-gray-900 mb-2">Personal & Plantation Information</h2>
                                <p className="text-sm text-gray-600 mb-6">Provide your details to begin the registration process. Required fields are marked with *.</p>

                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* First Name */}
                                        <div>
                                            <label className="block text-sm font-bold text-gray-900 mb-2">First Name *</label>
                                            <input
                                                type="text"
                                                placeholder="Enter first name"
                                                value={form.firstName}
                                                onChange={e => { setForm({...form, firstName: e.target.value}); setErrors({...errors, firstName: ''}) }}
                                                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-600 focus:border-transparent outline-none ${
                                                    errors.firstName ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                            />
                                            {errors.firstName && <p className="text-xs text-red-600 mt-1">{errors.firstName}</p>}
                                        </div>

                                        {/* Last Name */}
                                        <div>
                                            <label className="block text-sm font-bold text-gray-900 mb-2">Last Name *</label>
                                            <input
                                                type="text"
                                                placeholder="Enter last name"
                                                value={form.lastName}
                                                onChange={e => { setForm({...form, lastName: e.target.value}); setErrors({...errors, lastName: ''}) }}
                                                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-600 focus:border-transparent outline-none ${
                                                    errors.lastName ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                            />
                                            {errors.lastName && <p className="text-xs text-red-600 mt-1">{errors.lastName}</p>}
                                        </div>

                                        {/* ID Number */}
                                        <div>
                                            <label className="block text-sm font-bold text-gray-900 mb-2">SA ID Number *</label>
                                            <input
                                                type="text"
                                                placeholder="13-digit ID number"
                                                value={form.idNumber}
                                                onChange={e => { setForm({...form, idNumber: e.target.value}); setErrors({...errors, idNumber: ''}) }}
                                                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-600 focus:border-transparent outline-none ${
                                                    errors.idNumber ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                            />
                                            {errors.idNumber && <p className="text-xs text-red-600 mt-1">{errors.idNumber}</p>}
                                        </div>

                                        {/* Phone */}
                                        <div>
                                            <label className="block text-sm font-bold text-gray-900 mb-2">Phone *</label>
                                            <input
                                                type="tel"
                                                placeholder="e.g. +27821234567"
                                                value={form.phone}
                                                onChange={e => { setForm({...form, phone: e.target.value}); setErrors({...errors, phone: ''}) }}
                                                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-600 focus:border-transparent outline-none ${
                                                    errors.phone ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                            />
                                            {errors.phone && <p className="text-xs text-red-600 mt-1">{errors.phone}</p>}
                                        </div>

                                        {/* Email */}
                                        <div>
                                            <label className="block text-sm font-bold text-gray-900 mb-2">Email</label>
                                            <input
                                                type="email"
                                                placeholder="Optional"
                                                value={form.email}
                                                onChange={e => setForm({...form, email: e.target.value})}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-600 focus:border-transparent outline-none"
                                            />
                                        </div>

                                        {/* Business Name */}
                                        <div>
                                            <label className="block text-sm font-bold text-gray-900 mb-2">Business Name</label>
                                            <input
                                                type="text"
                                                placeholder="Optional"
                                                value={form.businessName}
                                                onChange={e => setForm({...form, businessName: e.target.value})}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-600 focus:border-transparent outline-none"
                                            />
                                        </div>

                                        {/* Business Reg No */}
                                        <div>
                                            <label className="block text-sm font-bold text-gray-900 mb-2">Business Reg. No.</label>
                                            <input
                                                type="text"
                                                placeholder="Optional"
                                                value={form.businessRegNumber}
                                                onChange={e => setForm({...form, businessRegNumber: e.target.value})}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-600 focus:border-transparent outline-none"
                                            />
                                        </div>

                                        {/* Land Tenure */}
                                        <div>
                                            <label className="block text-sm font-bold text-gray-900 mb-2">Land Tenure *</label>
                                            <select
                                                value={form.landTenure}
                                                onChange={e => { setForm({...form, landTenure: e.target.value}); setErrors({...errors, landTenure: ''}) }}
                                                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-600 focus:border-transparent outline-none ${
                                                    errors.landTenure ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                            >
                                                <option value="">Select...</option>
                                                <option value="freehold">Freehold</option>
                                                <option value="leasehold">Leasehold</option>
                                                <option value="communal">Communal</option>
                                            </select>
                                            {errors.landTenure && <p className="text-xs text-red-600 mt-1">{errors.landTenure}</p>}
                                        </div>

                                        {/* Tree Species */}
                                        <div>
                                            <label className="block text-sm font-bold text-gray-900 mb-2">Tree Species *</label>
                                            <select
                                                value={form.treeSpecies}
                                                onChange={e => { setForm({...form, treeSpecies: e.target.value}); setErrors({...errors, treeSpecies: ''}) }}
                                                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-600 focus:border-transparent outline-none ${
                                                    errors.treeSpecies ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                            >
                                                <option value="">Select...</option>
                                                <option value="pine">Pine</option>
                                                <option value="eucalyptus">Eucalyptus</option>
                                                <option value="mixed">Mixed</option>
                                            </select>
                                            {errors.treeSpecies && <p className="text-xs text-red-600 mt-1">{errors.treeSpecies}</p>}
                                        </div>

                                        {/* Plantation Size */}
                                        <div>
                                            <label className="block text-sm font-bold text-gray-900 mb-2">Plantation Size (ha) *</label>
                                            <input
                                                type="number"
                                                placeholder="e.g. 25.5"
                                                value={form.plantationSize}
                                                onChange={e => { setForm({...form, plantationSize: e.target.value}); setErrors({...errors, plantationSize: ''}) }}
                                                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-600 focus:border-transparent outline-none ${
                                                    errors.plantationSize ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                            />
                                            {errors.plantationSize && <p className="text-xs text-red-600 mt-1">{errors.plantationSize}</p>}
                                        </div>

                                        {/* GPS Latitude */}
                                        <div>
                                            <label className="block text-sm font-bold text-gray-900 mb-2">GPS Latitude *</label>
                                            <input
                                                type="number"
                                                step="0.0001"
                                                placeholder="e.g. -29.8587"
                                                value={form.gpsLat}
                                                onChange={e => { setForm({...form, gpsLat: e.target.value}); setErrors({...errors, gpsLat: ''}) }}
                                                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-600 focus:border-transparent outline-none ${
                                                    errors.gpsLat ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                            />
                                            {errors.gpsLat && <p className="text-xs text-red-600 mt-1">{errors.gpsLat}</p>}
                                        </div>

                                        {/* GPS Longitude */}
                                        <div>
                                            <label className="block text-sm font-bold text-gray-900 mb-2">GPS Longitude *</label>
                                            <input
                                                type="number"
                                                step="0.0001"
                                                placeholder="e.g. 30.9823"
                                                value={form.gpsLng}
                                                onChange={e => { setForm({...form, gpsLng: e.target.value}); setErrors({...errors, gpsLng: ''}) }}
                                                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-600 focus:border-transparent outline-none ${
                                                    errors.gpsLng ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                            />
                                            {errors.gpsLng && <p className="text-xs text-red-600 mt-1">{errors.gpsLng}</p>}
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={submitting || Object.keys(errors).length > 0}
                                        className="w-full px-6 py-3 bg-teal-700 text-white font-bold rounded-lg hover:bg-teal-800 transition-colors disabled:bg-gray-400 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        Submit & Continue <ArrowRight size={18} />
                                    </button>
                                </form>
                            </div>
                        )}

                        {/* Step 2: Documents */}
                        {step === 2 && summary && (
                            <div className="space-y-6">
                                <div className="bg-white p-8 rounded-xl border border-gray-200">
                                    <h2 className="text-xl font-bold text-gray-900 mb-6">Upload Required Documents</h2>

                                    <div className="space-y-4">
                                        {REG_DOCS.map(doc => {
                                            const docStatus = summary.documents.find(d => d.documentTypeId === doc.id);
                                            const status = docStatus?.status || 'not_uploaded';
                                            return (
                                                <div key={doc.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex-1">
                                                            <h3 className="text-sm font-bold text-gray-900">{doc.name}</h3>
                                                            <p className="text-xs text-gray-500 mt-1">{doc.category}</p>
                                                        </div>
                                                        <span className={`text-xs font-bold px-3 py-1 rounded-full ${STATUS_BADGE[status]?.cls}`}>
                                                            {STATUS_BADGE[status]?.text}
                                                        </span>
                                                    </div>
                                                    <div className="mt-4">
                                                        <label className="block">
                                                            <input
                                                                type="file"
                                                                onChange={e => handleDocUpload(doc.id, e.target.files?.[0])}
                                                                disabled={uploading[doc.id]}
                                                                className="hidden"
                                                            />
                                                            <button
                                                                onClick={e => e.currentTarget.previousElementSibling?.click()}
                                                                disabled={uploading[doc.id]}
                                                                className="text-sm text-teal-700 font-bold hover:text-teal-800 disabled:opacity-50 flex items-center gap-1"
                                                            >
                                                                <Upload size={16} />
                                                                {uploading[doc.id] ? 'Uploading...' : 'Choose File'}
                                                            </button>
                                                        </label>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <button
                                        onClick={() => setStep(3)}
                                        className="w-full mt-6 px-6 py-3 bg-teal-700 text-white font-bold rounded-lg hover:bg-teal-800 transition-colors flex items-center justify-center gap-2"
                                    >
                                        Continue to Agreement <ArrowRight size={18} />
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Step 3: Agreement */}
                        {step === 3 && (
                            <div className="bg-white p-8 rounded-xl border border-gray-200">
                                <h2 className="text-xl font-bold text-gray-900 mb-6">Terms & Agreement</h2>

                                <div className="bg-gray-50 p-6 rounded-lg mb-6 max-h-96 overflow-y-auto border border-gray-200">
                                    <p className="text-sm text-gray-700 leading-relaxed">
                                        <strong>GrowHub Plantation Grower Agreement</strong><br/><br/>
                                        By registering as a grower on the GrowHub platform, you agree to adhere to all plantation management standards, sustainability practices, and compliance requirements as outlined by relevant regulatory bodies. You acknowledge that all information provided is accurate and complete, and commit to maintaining compliance with all certifications and permits throughout your participation in the program.
                                    </p>
                                </div>

                                <label className="flex items-start gap-3 mb-6">
                                    <input
                                        type="checkbox"
                                        checked={agreementChecked}
                                        onChange={e => setAgreementChecked(e.target.checked)}
                                        className="mt-1 w-5 h-5 rounded border-gray-300 focus:ring-2 focus:ring-teal-600"
                                    />
                                    <span className="text-sm text-gray-700">
                                        I acknowledge and agree to the terms and conditions outlined above. I confirm that all information provided is accurate and complete.
                                    </span>
                                </label>

                                <button
                                    disabled={!agreementChecked}
                                    className="w-full px-6 py-3 bg-teal-700 text-white font-bold rounded-lg hover:bg-teal-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    <CheckCircle2 size={18} />
                                    Complete Registration
                                </button>
                            </div>
                        )}
                    </div>
    );
}
