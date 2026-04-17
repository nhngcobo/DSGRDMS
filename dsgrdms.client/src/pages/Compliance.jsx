import { useState } from 'react';
import { Upload, Search, Filter, FileX } from 'lucide-react';
import UploadDocumentModal from '../components/modals/UploadDocumentModal';
import ReviewDocumentModal from '../components/modals/ReviewDocumentModal';
import { useT } from '../hooks/useT';
import './Compliance.css';

const GROWERS = [
    { id: 'G001', name: 'James Mwangi' },
    { id: 'G002', name: 'Mary Wanjiku' },
    { id: 'G003', name: 'Peter Kamau' },
    { id: 'G004', name: 'Grace Akinyi' },
    { id: 'G005', name: 'Robert Omondi' },
];

const CHECKLIST = [
    { id: 1, document: 'Proof of Land Ownership / Lease Agreement', required: true, status: 'approved',        reviewed: '2026-03-12' },
    { id: 2, document: 'Environmental Impact Assessment (EIA)',      required: true, status: 'approved',        reviewed: '2026-03-14' },
    { id: 3, document: 'Water Use License',                          required: true, status: 'pending_review',  reviewed: null },
    { id: 4, document: 'FSC / PEFC Certification',                   required: false, status: 'not_uploaded',  reviewed: null },
    { id: 5, document: 'Community Development Plan',                 required: false, status: 'approved',       reviewed: '2026-03-20' },
    { id: 6, document: 'Fire Management Plan',                       required: true, status: 'rejected',        reviewed: '2026-03-18' },
    { id: 7, document: 'Invasive Species Management Plan',           required: true, status: 'not_uploaded',    reviewed: null },
    { id: 8, document: 'Pest & Disease Management Plan',             required: false, status: 'pending_review', reviewed: null },
];

const STATUS_META = {
    approved:       { cls: 'status-approved' },
    pending_review: { cls: 'status-pending' },
    not_uploaded:   { cls: 'status-not-uploaded' },
    rejected:       { cls: 'status-rejected' },
};

export default function Compliance() {
    const t = useT();
    const tc = t.compliance;

    const STATUS_OPTIONS = [
        tc.statusOptions.allStatuses,
        tc.statusOptions.approved,
        tc.statusOptions.pendingReview,
        tc.statusOptions.notUploaded,
        tc.statusOptions.rejected,
    ];

    function statusFilterKey(opt) {
        if (opt === tc.statusOptions.allStatuses)   return null;
        if (opt === tc.statusOptions.approved)       return 'approved';
        if (opt === tc.statusOptions.pendingReview)  return 'pending_review';
        if (opt === tc.statusOptions.notUploaded)    return 'not_uploaded';
        return 'rejected';
    }

    const statusLabel = {
        approved:       tc.statusOptions.approved,
        pending_review: tc.statusOptions.pendingReview,
        not_uploaded:   tc.statusOptions.notUploaded,
        rejected:       tc.statusOptions.rejected,
    };

    const [selectedGrowerId, setSelectedGrowerId] = useState('');
    const [statusFilter, setStatusFilter] = useState(tc.statusOptions.allStatuses);
    const [uploadDoc, setUploadDoc] = useState(null);
    const [reviewDoc, setReviewDoc] = useState(null);

    const selectedGrower = GROWERS.find(g => g.id === selectedGrowerId) ?? null;

    const filtered = CHECKLIST.filter(d => {
        const key = statusFilterKey(statusFilter);
        return !key || d.status === key;
    });

    const approved      = CHECKLIST.filter(d => d.status === 'approved').length;
    const total         = CHECKLIST.length;
    const progressPct   = Math.round((approved / total) * 100);

    const countByStatus = {
        approved:       CHECKLIST.filter(d => d.status === 'approved').length,
        pending_review: CHECKLIST.filter(d => d.status === 'pending_review').length,
        not_uploaded:   CHECKLIST.filter(d => d.status === 'not_uploaded').length,
        rejected:       CHECKLIST.filter(d => d.status === 'rejected').length,
    };

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
                <div className="selector-group">
                    <label>{tc.selectGrowerLabel}</label>
                    <select value={selectedGrowerId} onChange={e => setSelectedGrowerId(e.target.value)}>
                        <option value=""></option>
                        {GROWERS.map(g => (
                            <option key={g.id} value={g.id}>{g.name} ({g.id})</option>
                        ))}
                    </select>
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
                        <h2>Overall Compliance Progress</h2>
                        <p>{selectedGrower ? tc.progress.subtitleFor.replace('{grower}', selectedGrower.name) : tc.progress.subtitleNoGrower}</p>
                    </div>
                    <div className="progress-fraction">
                        <span className="progress-count">{approved}/{total}</span>
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
                    <h2>Document Checklist</h2>
                    <span className="checklist-hint">{tc.checklist.showingOf.replace('{count}', filtered.length).replace('{total}', CHECKLIST.length)}</span>
                </div>

                {selectedGrower ? (
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
                                const meta = STATUS_META[doc.status];
                                return (
                                    <tr key={doc.id}>
                                        <td className="doc-name">{doc.document}</td>
                                        <td>
                                            <span className={doc.required ? 'badge-required' : 'badge-optional'}>
                                                {doc.required ? tc.checklist.required : tc.checklist.optional}
                                            </span>
                                        </td>
                                        <td><span className={`doc-status ${meta.cls}`}>{statusLabel[doc.status]}</span></td>
                                        <td className="doc-reviewed">{doc.reviewed ?? tc.checklist.fallback}</td>
                                        <td>
                                            <div className="action-buttons">
                                                <button className="btn-upload" onClick={() => setUploadDoc(doc)}><Upload size={13} /> {tc.checklist.upload}</button>
                                                <button className="btn-review" onClick={() => setReviewDoc(doc)}><Search size={13} /> {tc.checklist.review}</button>
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
                    checklistItem={uploadDoc.document}
                    onClose={() => setUploadDoc(null)}
                />
            )}

            {reviewDoc && (
                <ReviewDocumentModal
                    doc={reviewDoc}
                    onClose={() => setReviewDoc(null)}
                />
            )}
        </div>
    );
}

