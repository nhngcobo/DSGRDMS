import { useState } from 'react';
import { MapPin, Clock, Wifi } from 'lucide-react';
import './FieldVisits.css';

const SAMPLE_VISITS = [
    {
        id: 1,
        grower: 'Mary Wanjiku',
        type: 'field verification',
        location: "Murang'a County",
        due: '2026-04-15',
        status: 'pending',
        priority: 'high',
    },
    {
        id: 2,
        grower: 'Grace Akinyi',
        type: 'document review',
        location: 'Location TBD',
        due: '2026-04-14',
        status: 'in progress',
        priority: 'medium',
    },
    {
        id: 3,
        grower: 'James Mwangi',
        type: 'approval',
        location: 'Location TBD',
        due: '2026-01-28',
        status: 'completed',
        priority: 'low',
    },
];

const TABS = [
    { label: 'All Visits', filter: null },
    { label: 'Pending',    filter: 'pending' },
    { label: 'In Progress', filter: 'in progress' },
    { label: 'Completed',  filter: 'completed' },
];

export default function FieldVisits() {
    const [activeTab, setActiveTab] = useState(null);

    const visible = activeTab
        ? SAMPLE_VISITS.filter(v => v.status === activeTab)
        : SAMPLE_VISITS;

    return (
        <div className="fv-page">
            <div className="fv-header">
                <div>
                    <h1 className="fv-title">Field Visits</h1>
                    <p className="fv-subtitle">Manage field verification visits</p>
                </div>
                <div className="fv-online-badge">
                    <Wifi size={14} className="fv-online-icon" />
                    <span>Online</span>
                </div>
            </div>

            <div className="fv-tabs">
                {TABS.map(tab => (
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
                <p className="fv-empty">No visits found.</p>
            ) : (
                <div className="fv-grid">
                    {visible.map(visit => (
                        <div key={visit.id} className="fv-card">
                            <div className="fv-card-top">
                                <div>
                                    <h3 className="fv-grower-name">{visit.grower}</h3>
                                    <p className="fv-visit-type">{visit.type}</p>
                                </div>
                                <span className={`fv-priority fv-priority-${visit.priority}`}>
                                    {visit.priority}
                                </span>
                            </div>

                            <div className="fv-meta">
                                <span className="fv-meta-item">
                                    <MapPin size={13} />
                                    {visit.location}
                                </span>
                                <span className="fv-meta-item">
                                    <Clock size={13} />
                                    Due: {visit.due}
                                </span>
                            </div>

                            <div className="fv-card-bottom">
                                <span className={`fv-status fv-status-${visit.status.replace(' ', '-')}`}>
                                    {visit.status}
                                </span>
                                {visit.status !== 'completed' && (
                                    <button className="fv-start-btn">Start Visit</button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
