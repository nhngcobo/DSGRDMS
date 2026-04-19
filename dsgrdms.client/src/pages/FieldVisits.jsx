import { useState } from 'react';
import { Plus, ClipboardList } from 'lucide-react';
import LogVisitModal from '../components/modals/LogVisitModal';
import './FieldVisits.css';

const STATUS_TABS = [
    { label: 'All',         filter: null          },
    { label: 'Pending',     filter: 'pending'     },
    { label: 'In Progress', filter: 'in_progress' },
    { label: 'Completed',   filter: 'completed'   },
];

const STATUS_META = {
    pending:     { cls: 'fv-status-pending',     label: 'Pending'      },
    in_progress: { cls: 'fv-status-in-progress', label: 'In Progress'  },
    completed:   { cls: 'fv-status-completed',   label: 'Completed'    },
};

export default function FieldVisits() {
    const [visits, setVisits]       = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [activeTab, setActiveTab] = useState(null);

    const visible = activeTab
        ? visits.filter(v => v.status === activeTab)
        : visits;

    function handleSave(visit) {
        setVisits(prev => [{ ...visit, id: Date.now(), status: 'pending' }, ...prev]);
        setShowModal(false);
    }

    return (
        <div className="fv-page">
            <div className="fv-header">
                <div>
                    <h1 className="fv-title">Field Visits</h1>
                    <p className="fv-subtitle">Log and manage field verification visits</p>
                </div>
                <button className="fv-new-btn" onClick={() => setShowModal(true)}>
                    <Plus size={15} />
                    New Field Visit
                </button>
            </div>

            <div className="fv-tabs">
                {STATUS_TABS.map(tab => (
                    <button
                        key={tab.label}
                        className={`fv-tab${activeTab === tab.filter ? ' active' : ''}`}
                        onClick={() => setActiveTab(tab.filter)}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {visible.length === 0 ? (
                <div className="fv-empty-state">
                    <div className="fv-empty-icon">
                        <ClipboardList size={36} strokeWidth={1.2} />
                    </div>
                    <p className="fv-empty-heading">No field visits yet</p>
                    <span className="fv-empty-body">
                        Click <strong>New Field Visit</strong> to log your first visit.
                    </span>
                </div>
            ) : (
                <div className="fv-grid">
                    {visible.map(visit => {
                        const meta = STATUS_META[visit.status] ?? STATUS_META.pending;
                        return (
                            <div key={visit.id} className="fv-card">
                                <div className="fv-card-top">
                                    <div>
                                        <h3 className="fv-grower-name">{visit.growerName}</h3>
                                        <p className="fv-visit-date">{new Date(visit.visitDate).toLocaleDateString()}</p>
                                    </div>
                                    <span className={`fv-status-badge ${meta.cls}`}>{meta.label}</span>
                                </div>
                                {visit.observations && (
                                    <p className="fv-observations">{visit.observations}</p>
                                )}
                                {visit.activities && (
                                    <p className="fv-activities"><strong>Activities:</strong> {visit.activities}</p>
                                )}
                                {visit.condition && (
                                    <p className="fv-condition"><strong>Condition:</strong> {visit.condition}</p>
                                )}
                                {visit.photoUrl && (
                                    <img src={visit.photoUrl} alt="Visit" className="fv-photo" />
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {showModal && (
                <LogVisitModal
                    onClose={() => setShowModal(false)}
                    onSave={handleSave}
                />
            )}
        </div>
    );
}
