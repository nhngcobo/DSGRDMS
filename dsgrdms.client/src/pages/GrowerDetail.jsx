import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, FileX, User, Building2, Leaf, MapPin, FileCheck } from 'lucide-react';
import { fetchGrowerById } from '../services/growersApi';
import { fetchComplianceSummary } from '../services/complianceApi';
import { useNotification } from '../context/NotificationContext';
import { friendlyError } from '../utils/apiErrors';
import './GrowerDetail.css';

const STATUS_META = {
    approved:       { cls: 'status-approved' },
    pending_review: { cls: 'status-pending' },
    not_uploaded:   { cls: 'status-not-uploaded' },
    rejected:       { cls: 'status-rejected' },
};

const STATUS_LABEL = {
    approved:       'Approved',
    pending_review: 'Pending Review',
    not_uploaded:   'Not Uploaded',
    rejected:       'Rejected',
};

export default function GrowerDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { hash } = useLocation();
    const { showError } = useNotification();

    const [grower, setGrower]   = useState(null);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            setLoading(true);
            try {
                const [g, s] = await Promise.all([
                    fetchGrowerById(id),
                    fetchComplianceSummary(id),
                ]);
                setGrower(g);
                setSummary(s);
            } catch (err) {
                showError(friendlyError(err));
                navigate('/growers');
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [id, showError, navigate]);

    useEffect(() => {
        if (!loading && hash === '#compliance') {
            document.getElementById('compliance-section')?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [loading, hash]);

    if (loading) return <div className="gd-page"><div className="gd-state">Loading…</div></div>;
    if (!grower) return null;

    const checklist     = summary?.documents ?? [];
    const approvedCount = checklist.filter(d => d.status === 'approved').length;
    const total         = checklist.length;
    const progressPct   = total ? Math.round((approvedCount / total) * 100) : 0;

    function InfoRow({ label, value }) {
        if (!value) return null;
        return (
            <div className="gd-info-row">
                <span className="gd-info-label">{label}</span>
                <span className="gd-info-value">{value}</span>
            </div>
        );
    }

    return (
        <div className="gd-page">
            {/* Back + header */}
            <div className="gd-header">
                <button className="gd-back" onClick={() => navigate('/growers')}>
                    <ArrowLeft size={16} /> Back to Growers
                </button>
                <div className="gd-title-row">
                    <div>
                        <h1>{grower.name}</h1>
                        <span className="gd-id">{grower.id}</span>
                    </div>
                    <span className={`gd-status-badge badge-status-${grower.status}`}>{grower.status}</span>
                </div>
            </div>

            <div className="gd-body">
                {/* Left column: info cards */}
                <div className="gd-info-col">
                    {/* Personal */}
                    <div className="gd-card">
                        <div className="gd-card-title"><User size={14} /> Personal Details</div>
                        <InfoRow label="Full Name"     value={grower.name} />
                        <InfoRow label="Phone"         value={grower.phone} />
                        <InfoRow label="Email"         value={grower.email} />
                        <InfoRow label="Registered"    value={new Date(grower.registeredAt).toLocaleDateString()} />
                    </div>

                    {/* Business */}
                    {(grower.businessName || grower.businessRegNumber) && (
                        <div className="gd-card">
                            <div className="gd-card-title"><Building2 size={14} /> Business Details</div>
                            <InfoRow label="Business Name" value={grower.businessName} />
                            <InfoRow label="Reg Number"    value={grower.businessRegNumber} />
                        </div>
                    )}

                    {/* Farm */}
                    <div className="gd-card">
                        <div className="gd-card-title"><Leaf size={14} /> Farm Details</div>
                        <InfoRow label="Plantation Size" value={grower.farmSize} />
                        <InfoRow label="Land Tenure"     value={grower.landTenure} />
                        <InfoRow label="Tree Species"    value={grower.treeSpecies} />
                    </div>

                    {/* GPS */}
                    {(grower.gpsLat != null || grower.gpsLng != null) && (
                        <div className="gd-card">
                            <div className="gd-card-title"><MapPin size={14} /> Location</div>
                            <InfoRow label="Latitude"  value={grower.gpsLat?.toString()} />
                            <InfoRow label="Longitude" value={grower.gpsLng?.toString()} />
                        </div>
                    )}
                </div>

                {/* Right column: compliance */}
                <div className="gd-compliance-col">
                    {/* Progress card */}
                    <div className="gd-card">
                        <div className="gd-card-title">Compliance Overview</div>
                        <div className="gd-compliance-top">
                            <span className="gd-progress-fraction">{approvedCount}/{total} approved</span>
                            {summary?.growerStatus === 'verified' && (
                                <span className="gd-verified-badge">Verified</span>
                            )}
                        </div>
                        <div className="gd-progress-track">
                            <div className="gd-progress-fill" style={{ width: `${progressPct}%` }} />
                        </div>
                    </div>

                    {/* Checklist */}
                    <div className="gd-card gd-card-no-pad" id="compliance-section">
                        <div className="gd-checklist-header">
                            <span>Document Checklist</span>
                            <button className="gd-goto-compliance" onClick={() => navigate(`/compliance?grower=${id}`)}>
                                <FileCheck size={13} /> Manage in Compliance
                            </button>
                        </div>
                        {checklist.length === 0 ? (
                            <div className="gd-empty">
                                <FileX size={28} strokeWidth={1.2} />
                                <p>No documents yet</p>
                            </div>
                        ) : (
                            <table className="gd-table">
                                <thead>
                                    <tr>
                                        <th>Document</th>
                                        <th>Required</th>
                                        <th>Status</th>
                                        <th>Reviewed</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {checklist.map(doc => {
                                        const meta = STATUS_META[doc.status];
                                        return (
                                            <tr key={doc.docTypeId}>
                                                <td className="gd-doc-name">{doc.documentName}</td>
                                                <td>
                                                    <span className={doc.isRequired ? 'gd-badge-req' : 'gd-badge-opt'}>
                                                        {doc.isRequired ? 'Required' : 'Optional'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className={`gd-doc-status ${meta.cls}`}>
                                                        {STATUS_LABEL[doc.status]}
                                                    </span>
                                                </td>
                                                <td className="gd-reviewed">
                                                    {doc.reviewedAt
                                                        ? new Date(doc.reviewedAt).toLocaleDateString()
                                                        : '—'}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
