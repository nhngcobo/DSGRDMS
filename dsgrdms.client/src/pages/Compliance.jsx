import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
    Upload, Search, FileX, ChevronDown, ExternalLink,
    Shield, AlertTriangle, CheckCircle2, TrendingUp, Info, AlertCircle,
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    RadarChart, PolarGrid, PolarAngleAxis, Radar,
} from 'recharts';
import { useNavigate, useLocation } from 'react-router-dom';
import UploadDocumentModal from '../components/modals/UploadDocumentModal';
import ReviewDocumentModal from '../components/modals/ReviewDocumentModal';
import ComplianceDocuments from '../components/ComplianceDocuments';
import { useT } from '../hooks/useT';
import { useAuth } from '../context/AuthContext';
import { fetchGrowers } from '../services/growersApi';
import {
    fetchComplianceSummary,
    fetchComplianceAnalytics,
    uploadComplianceDocument,
    reviewComplianceDocument,
} from '../services/complianceApi';
import { useNotification } from '../context/NotificationContext';
import { friendlyError } from '../utils/apiErrors';
import './Compliance.css';

const STATUS_META = {
    approved:       { cls: 'status-approved' },
    pending_review: { cls: 'status-pending' },
    not_uploaded:   { cls: 'status-not-uploaded' },
    rejected:       { cls: 'status-rejected' },
};

export default function Compliance() {
    const t = useT();
    const tc = t.compliance;
    const navigate = useNavigate();
    const { search } = useLocation();
    const initialGrowerId = new URLSearchParams(search).get('grower') ?? '';
    const { showError } = useNotification();
    const { user } = useAuth();

    // If user is a grower, show the registration workflow instead
    if (user?.role === 'grower') {
        return <ComplianceDocuments />;
    }

    const STATUS_OPTIONS = [
        tc.statusOptions.allStatuses,
        tc.statusOptions.approved,
        tc.statusOptions.pendingReview,
        tc.statusOptions.notUploaded,
        tc.statusOptions.rejected,
    ];

    function statusFilterKey(opt) {
        if (opt === tc.statusOptions.allStatuses)  return null;
        if (opt === tc.statusOptions.approved)      return 'approved';
        if (opt === tc.statusOptions.pendingReview) return 'pending_review';
        if (opt === tc.statusOptions.notUploaded)   return 'not_uploaded';
        return 'rejected';
    }

    const statusLabel = {
        approved:       tc.statusOptions.approved,
        pending_review: tc.statusOptions.pendingReview,
        not_uploaded:   tc.statusOptions.notUploaded,
        rejected:       tc.statusOptions.rejected,
    };

    const [growers, setGrowers]                     = useState([]);
    const [analytics, setAnalytics]                  = useState(null);
    const [selectedGrowerId, setSelectedGrowerId]     = useState(initialGrowerId);
    const [growerSearch, setGrowerSearch]             = useState('');
    const [growerDropdownOpen, setGrowerDropdownOpen] = useState(false);
    const growerDropdownRef = useRef(null);
    const docsSectionRef = useRef(null);
    const [summary, setSummary]               = useState(null);
    const [loading, setLoading]               = useState(false);
    const [statusFilter, setStatusFilter]     = useState(tc.statusOptions.allStatuses);
    const [uploadDoc, setUploadDoc]           = useState(null);
    const [reviewDoc, setReviewDoc]           = useState(null);

    // Load growers list once
    useEffect(() => {
        fetchGrowers().then(setGrowers).catch(err => showError(friendlyError(err)));
    }, [showError]);

    // Load compliance analytics once
    useEffect(() => {
        fetchComplianceAnalytics().then(setAnalytics).catch(err => showError(friendlyError(err)));
    }, [showError]);

    // Close grower dropdown on outside click
    useEffect(() => {
        function handleOutside(e) {
            if (growerDropdownRef.current && !growerDropdownRef.current.contains(e.target)) {
                setGrowerDropdownOpen(false);
            }
        }
        document.addEventListener('mousedown', handleOutside);
        return () => document.removeEventListener('mousedown', handleOutside);
    }, []);

    // Load compliance summary whenever selected grower changes
    const loadSummary = useCallback(async (growerId) => {
        if (!growerId) { setSummary(null); return; }
        setLoading(true);
        try {
            const data = await fetchComplianceSummary(growerId);
            setSummary(data);
        } catch (err) {
            showError(friendlyError(err));
            setSummary(null);
        } finally {
            setLoading(false);
        }
    }, [showError]);

    useEffect(() => { loadSummary(selectedGrowerId); }, [selectedGrowerId, loadSummary]);

    // Upload handler — called by UploadDocumentModal with the File object
    async function handleUpload(file) {
        try {
            await uploadComplianceDocument(selectedGrowerId, uploadDoc.docTypeId, file);
            setUploadDoc(null);
            await loadSummary(selectedGrowerId);
        } catch (err) {
            showError(friendlyError(err));
        }
    }

    // Review handler — called by ReviewDocumentModal with (action, reason)
    async function handleReview(action, reason) {
        try {
            await reviewComplianceDocument(selectedGrowerId, reviewDoc.docTypeId, action, reason);
            setReviewDoc(null);
            await loadSummary(selectedGrowerId);
        } catch (err) {
            showError(friendlyError(err));
        }
    }

    const checklist = summary?.documents ?? [];
    const filtered  = checklist.filter(d => {
        const key = statusFilterKey(statusFilter);
        return !key || d.status === key;
    });

    const approvedCount = checklist.filter(d => d.status === 'approved').length;
    const total         = checklist.length;
    const progressPct   = total ? Math.round((approvedCount / total) * 100) : 0;

    const countByStatus = {
        approved:       checklist.filter(d => d.status === 'approved').length,
        pending_review: checklist.filter(d => d.status === 'pending_review').length,
        not_uploaded:   checklist.filter(d => d.status === 'not_uploaded').length,
        rejected:       checklist.filter(d => d.status === 'rejected').length,
    };

    const selectedGrower = growers.find(g => g.id === selectedGrowerId) ?? null;
    const filteredGrowers = growers.filter(g =>
        g.name.toLowerCase().includes(growerSearch.toLowerCase()) ||
        g.id.toLowerCase().includes(growerSearch.toLowerCase())
    );

    // ── Dashboard computed stats ─────────────────────────────────────────
    const overallCompliance = analytics?.overallComplianceRate ?? 0;
    const highRiskCount     = analytics?.highRiskCount          ?? 0;
    const fullyCompliant    = analytics?.fullyCompliantCount    ?? 0;

    const categoryData = analytics?.categoryScores ?? [];
    const radarData    = categoryData.map(c => ({ subject: c.category, score: c.score }));

    const growersByRisk = useMemo(() => ({
        high:   growers.filter(g => g.risk === 'high'),
        medium: growers.filter(g => g.risk === 'medium'),
        low:    growers.filter(g => g.risk === 'low'),
    }), [growers]);

    const recommendations = useMemo(() => {
        const list = [];
        const certScore = analytics?.categoryScores?.find(c => c.category === 'Certification')?.score ?? 0;
        if (certScore < 70) list.push({
            type: 'info',
            title: 'Strengthen Certification Programs',
            body: `Certification category shows ${certScore}% compliance. Recommend training programs for growers.`,
        });
        if (highRiskCount > 0) list.push({
            type: 'warning',
            title: 'Review High-Risk Growers',
            body: `${highRiskCount} grower${highRiskCount !== 1 ? 's' : ''} require immediate attention and development plans.`,
        });
        const legalScore = analytics?.categoryScores?.find(c => c.category === 'Legal')?.score ?? 0;
        if (legalScore >= 80) list.push({
            type: 'success',
            title: 'Strong Legal Compliance',
            body: `${legalScore}% compliance in legal documentation. Continue current practices.`,
        });
        return list;
    }, [analytics, highRiskCount]);

    const dashStatCards = [
        { title: 'Overall Compliance Rate', value: `${overallCompliance}%`, icon: Shield,        iconCls: 'stat-icon-blue'   },
        { title: 'High Risk Growers',        value: String(highRiskCount),   icon: AlertTriangle, iconCls: 'stat-icon-orange' },
        { title: 'Fully Compliant',          value: String(fullyCompliant),  icon: CheckCircle2,  iconCls: 'stat-icon-green'  },
        { title: 'Improvement Rate',         value: '+8.2%',                 icon: TrendingUp,    iconCls: 'stat-icon-purple' },
    ];

    return (
        <div className="compliance-page">

            {/* ── Dashboard Section ─────────────────────────── */}
            <div className="compliance-header">
                <div>
                    <h1>Compliance &amp; Risk Management</h1>
                    <p>Monitor and manage compliance scores and risk levels</p>
                </div>
            </div>

            {/* Stat cards */}
            <div className="comp-stat-grid">
                {dashStatCards.map(({ title, value, icon: Icon, iconCls }) => (
                    <div key={title} className="comp-stat-card">
                        <div className="comp-stat-body">
                            <div>
                                <p className="comp-stat-title">{title}</p>
                                <p className="comp-stat-value">{value}</p>
                            </div>
                            <div className={`comp-stat-icon ${iconCls}`}>
                                <Icon size={20} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts */}
            <div className="comp-charts-row">
                <div className="comp-chart-card">
                    <h2 className="comp-chart-title">Compliance by Category</h2>
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={categoryData} barSize={40}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                            <XAxis dataKey="category" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                            <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                            <Tooltip formatter={(v) => `${v}%`} contentStyle={{ fontSize: 12 }} />
                            <Bar dataKey="score" fill="#111827" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="comp-chart-card">
                    <h2 className="comp-chart-title">Compliance Radar</h2>
                    <ResponsiveContainer width="100%" height={220}>
                        <RadarChart data={radarData}>
                            <PolarGrid stroke="#e5e7eb" />
                            <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: '#6b7280' }} />
                            <Radar dataKey="score" stroke="#374151" fill="#374151" fillOpacity={0.55} />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Risk cards */}
            <div className="comp-risk-row">
                {[
                    { key: 'high',   label: 'High Risk',   cls: 'risk-high'   },
                    { key: 'medium', label: 'Medium Risk', cls: 'risk-medium' },
                    { key: 'low',    label: 'Low Risk',    cls: 'risk-low'    },
                ].map(({ key, label, cls }) => (
                    <div key={key} className={`comp-risk-card ${cls}`}>
                        <div className="comp-risk-header">
                            <h3 className="comp-risk-title">{label}</h3>
                            <span className={`comp-risk-count comp-risk-count-${key}`}>
                                {growersByRisk[key].length}
                            </span>
                        </div>
                        <div className="comp-risk-list">
                            {growersByRisk[key].length === 0 ? (
                                <p className="comp-risk-empty">No growers</p>
                            ) : (
                                growersByRisk[key].map(g => (
                                    <div key={g.id} className="comp-risk-grower" onClick={() => { setSelectedGrowerId(g.id); docsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}>
                                        <div className="comp-risk-grower-top">
                                            <span className="comp-risk-grower-name">{g.name}</span>
                                            <span className="comp-risk-grower-id">{g.id}</span>
                                        </div>
                                        <div className="comp-risk-grower-bar-row">
                                            <span className="comp-risk-bar-label">Compliance</span>
                                            <span className={`comp-risk-pct comp-risk-pct-${key}`}>
                                                {g.compliance ?? 0}%
                                            </span>
                                        </div>
                                        <div className="comp-risk-bar-track">
                                            <div
                                                className={`comp-risk-bar-fill comp-risk-fill-${key}`}
                                                style={{ width: `${g.compliance ?? 0}%` }}
                                            />
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Recommendations */}
            {recommendations.length > 0 && (
                <div className="comp-recommendations">
                    <h2 className="comp-rec-section-title">Compliance Recommendations</h2>
                    <div className="comp-rec-list">
                        {recommendations.map((rec, i) => (
                            <div key={i} className={`comp-rec-item comp-rec-${rec.type}`}>
                                <div className="comp-rec-icon">
                                    {rec.type === 'info'    && <Info size={16} />}
                                    {rec.type === 'warning' && <AlertCircle size={16} />}
                                    {rec.type === 'success' && <CheckCircle2 size={16} />}
                                </div>
                                <div>
                                    <p className="comp-rec-title">{rec.title}</p>
                                    <p className="comp-rec-body">{rec.body}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── Compliance Documents Section ──────────────── */}
            <div className="comp-docs-divider" ref={docsSectionRef}>
                <h2>{tc.title}</h2>
                <p>{tc.subtitle}</p>
            </div>

            {/* Grower + status selectors */}
            <div className="compliance-selectors">
                <div className="selector-group" ref={growerDropdownRef}>
                    <label>{tc.selectGrowerLabel}</label>
                    <div className="grower-dropdown">
                        <button
                            type="button"
                            className={`grower-dropdown-trigger${growerDropdownOpen ? ' open' : ''}`}
                            onClick={() => {
                                setGrowerDropdownOpen(o => !o);
                                setGrowerSearch('');
                            }}
                        >
                            <span className={selectedGrower ? '' : 'placeholder'}>
                                {selectedGrower ? `${selectedGrower.name} (${selectedGrower.id})` : tc.selectGrowerPlaceholder ?? 'Select a grower…'}
                            </span>
                            <ChevronDown size={14} className={`dropdown-chevron${growerDropdownOpen ? ' flipped' : ''}`} />
                        </button>
                        {selectedGrower && (
                            <button
                                type="button"
                                className="grower-view-profile"
                                onClick={() => navigate(`/growers/${selectedGrower.id}`)}
                            >
                                <ExternalLink size={12} /> View Profile
                            </button>
                        )}

                        {growerDropdownOpen && (
                            <div className="grower-dropdown-menu">
                                <div className="grower-dropdown-search">
                                    <Search size={13} />
                                    <input
                                        type="text"
                                        placeholder="Search growers…"
                                        value={growerSearch}
                                        onChange={e => setGrowerSearch(e.target.value)}
                                        autoFocus
                                    />
                                </div>
                                <ul className="grower-dropdown-list">
                                    <li
                                        className={`grower-dropdown-item${!selectedGrowerId ? ' selected' : ''}`}
                                        onClick={() => { setSelectedGrowerId(''); setGrowerDropdownOpen(false); }}
                                    >
                                        <em>{tc.selectGrowerPlaceholder ?? 'None'}</em>
                                    </li>
                                    {filteredGrowers.length === 0 && (
                                        <li className="grower-dropdown-empty">No growers found</li>
                                    )}
                                    {filteredGrowers.map(g => (
                                        <li
                                            key={g.id}
                                            className={`grower-dropdown-item${g.id === selectedGrowerId ? ' selected' : ''}`}
                                            onClick={() => { setSelectedGrowerId(g.id); setGrowerDropdownOpen(false); }}
                                        >
                                            {g.name}
                                            <span className="grower-dropdown-id">{g.id}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
                <div className="selector-group">
                    <label>{tc.filterByStatusLabel}</label>
                    <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                        {STATUS_OPTIONS.map(o => <option key={o}>{o}</option>)}
                    </select>
                </div>
            </div>

            {/* Progress card */}
            <div className="progress-card">
                <div className="progress-card-top">
                    <div>
                        <h2>
                            {tc.progress.title}
                            {summary?.growerStatus === 'verified' && (
                                <span className="grower-status-badge status-verified">Verified</span>
                            )}
                        </h2>
                    </div>
                    <div className="progress-fraction">
                        <span className="progress-count">{approvedCount}/{total}</span>
                        <span className="progress-label">{tc.progress.approvedLabel}</span>
                    </div>
                </div>
                <div className="progress-bar-track">
                    <div className="progress-bar-fill" style={{ width: `${progressPct}%` }} />
                </div>
                <div className="progress-legend">
                    <span className="legend-dot dot-approved" />  {tc.progress.legend.approved} ({countByStatus.approved})
                    <span className="legend-dot dot-pending" />   {tc.progress.legend.pending} ({countByStatus.pending_review})
                    <span className="legend-dot dot-not-uploaded" /> {tc.progress.legend.notUploaded} ({countByStatus.not_uploaded})
                    <span className="legend-dot dot-rejected" />  {tc.progress.legend.rejected} ({countByStatus.rejected})
                </div>
            </div>

            {/* Document checklist */}
            <div className="checklist-section">
                <div className="checklist-header">
                    <h2>{tc.checklist.title}</h2>
                    <span className="checklist-hint">
                        {tc.checklist.showingOf.replace('{count}', filtered.length).replace('{total}', checklist.length)}
                    </span>
                </div>

                {loading ? (
                    <div className="empty-state"><p>Loading…</p></div>
                ) : selectedGrower ? (
                    <table className="checklist-table">
                        <thead>
                            <tr>
                                <th>{tc.checklist.columns.document}</th>
                                <th>{tc.checklist.columns.required}</th>
                                <th>{tc.checklist.columns.status}</th>
                                <th>{tc.checklist.columns.reviewed}</th>
                                <th>{tc.checklist.columns.actions}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(doc => {
                                const meta    = STATUS_META[doc.status];
                                const canUpload = doc.status !== 'approved';
                                const canReview = doc.status === 'pending_review';
                                return (
                                    <tr key={doc.docTypeId}>
                                        <td className="doc-name">{doc.documentName}</td>
                                        <td>
                                            <span className={doc.isRequired ? 'badge-required' : 'badge-optional'}>
                                                {doc.isRequired ? tc.checklist.required : tc.checklist.optional}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`doc-status ${meta.cls}`}>
                                                {statusLabel[doc.status]}
                                            </span>
                                        </td>
                                        <td className="doc-reviewed">
                                            {doc.reviewedAt
                                                ? new Date(doc.reviewedAt).toLocaleDateString()
                                                : tc.checklist.fallback}
                                        </td>
                                        <td>
                                            <div className="action-buttons">
                                                <button
                                                    className="btn-upload"
                                                    onClick={() => setUploadDoc(doc)}
                                                    disabled={!canUpload}
                                                    title={!canUpload ? 'Document already approved' : undefined}
                                                >
                                                    <Upload size={13} /> {tc.checklist.upload}
                                                </button>
                                                <button
                                                    className="btn-review"
                                                    onClick={() => setReviewDoc(doc)}
                                                    disabled={!canReview}
                                                    title={!canReview ? 'Upload a document first' : undefined}
                                                >
                                                    <Search size={13} /> {tc.checklist.review}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                ) : (
                    <div className="empty-state">
                        <div className="empty-icon"><FileX size={32} strokeWidth={1.2} /></div>
                        <p>{tc.emptyState.heading}</p>
                        <span>{tc.emptyState.body}</span>
                    </div>
                )}
            </div>

            {uploadDoc && (
                <UploadDocumentModal
                    doc={uploadDoc}
                    onClose={() => setUploadDoc(null)}
                    onSubmit={handleUpload}
                />
            )}

            {reviewDoc && (
                <ReviewDocumentModal
                    doc={reviewDoc}
                    onClose={() => setReviewDoc(null)}
                    onReview={handleReview}
                />
            )}
        </div>
    );
}

