import { useState, useEffect, useCallback, useRef } from 'react';
import { Upload, Search, Filter, FileX, ChevronDown, ExternalLink } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import UploadDocumentModal from '../components/modals/UploadDocumentModal';
import ReviewDocumentModal from '../components/modals/ReviewDocumentModal';
import { useT } from '../hooks/useT';
import { fetchGrowers } from '../services/growersApi';
import {
    fetchComplianceSummary,
    uploadComplianceDocument,
    reviewComplianceDocument,
} from '../services/complianceApi';
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
    const [selectedGrowerId, setSelectedGrowerId]     = useState(initialGrowerId);
    const [growerSearch, setGrowerSearch]             = useState('');
    const [growerDropdownOpen, setGrowerDropdownOpen] = useState(false);
    const growerDropdownRef = useRef(null);
    const [summary, setSummary]               = useState(null);
    const [loading, setLoading]               = useState(false);
    const [statusFilter, setStatusFilter]     = useState(tc.statusOptions.allStatuses);
    const [uploadDoc, setUploadDoc]           = useState(null);
    const [reviewDoc, setReviewDoc]           = useState(null);

    // Load growers list once
    useEffect(() => {
        fetchGrowers().then(setGrowers).catch(() => {});
    }, []);

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
        } catch {
            setSummary(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadSummary(selectedGrowerId); }, [selectedGrowerId, loadSummary]);

    // Upload handler — called by UploadDocumentModal with the File object
    async function handleUpload(file) {
        await uploadComplianceDocument(selectedGrowerId, uploadDoc.docTypeId, file);
        setUploadDoc(null);
        await loadSummary(selectedGrowerId);
    }

    // Review handler — called by ReviewDocumentModal with (action, reason)
    async function handleReview(action, reason) {
        await reviewComplianceDocument(selectedGrowerId, reviewDoc.docTypeId, action, reason);
        setReviewDoc(null);
        await loadSummary(selectedGrowerId);
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

    return (
        <div className="compliance-page">

            {/* Page header */}
            <div className="compliance-header">
                <div>
                    <h1>{tc.title}</h1>
                    <p>{tc.subtitle}</p>
                </div>
                <button className="btn-filter">
                    <Filter size={14} />
                    {tc.filter}
                </button>
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

