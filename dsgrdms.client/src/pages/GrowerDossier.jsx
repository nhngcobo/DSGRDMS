import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { MapPin, FileText, BarChart3, Droplet, Clock, Search } from 'lucide-react';
import './GrowerDossier.css';

const mockComplianceDocs = [
    { id: 1, title: 'Organic Certification (USDA)', docId: 'CERT-88219', expiry: 'Jan 2025', status: 'compliant' },
    { id: 2, title: 'Water Extraction Permit', docId: 'WTR-9022', note: 'Annual Review Required', status: 'pending' },
    { id: 3, title: 'Pesticide Use Logbook', docId: 'Updated 4 days ago', status: 'compliant' },
    { id: 4, title: 'Land Title Registry', docId: 'Deed #772-B-991', status: 'compliant' },
];

const mockVisits = [
    { id: 1, date: 'Aug 14, 2023', title: 'Post-Harvest Soil Audit', officer: 'Marcus Thorne', description: 'Observed excellent recovery of nitrogen levels after hazelnut harvest. Recommended minor lime amendment for Plot B.' },
    { id: 2, date: 'May 02, 2023', title: 'Biannual Certification Review', description: 'Full dossier inspection for USDA renewal. All documentation found in order. Parcel boundaries verified via drone telemetry.' },
    { id: 3, date: 'Jan 20, 2023', title: 'Emergency Frost Damage Assessment', description: 'Brief site visit following record low temperatures. Damage localized to young saplings in the northern corridor.' },
];

export default function GrowerDossier() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');

    return (
        <div className="grower-dossier">
            {/* Search Bar */}
            <div className="dossier-search">
                <Search size={18} className="search-icon" />
                <input
                    type="text"
                    placeholder="Search registry, parcels, or reports..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="search-input"
                />
            </div>

            {/* Header */}
            <section className="dossier-header">
                <div className="header-content">
                    <img src="/person1.png" alt="Grower" className="grower-avatar" />
                    <div className="header-info">
                        <h1>{user?.fullName || 'Grower Profile'}</h1>
                        <div className="header-meta">
                            <span className="status-badge">Verified Tier 1 Grower</span>
                            <span className="location">
                                <MapPin size={14} />
                                {user?.location || 'Willamette Valley, OR'}
                            </span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Main Grid */}
            <div className="dossier-grid">
                {/* Identity Records */}
                <div className="card identity-card">
                    <div className="card-header">
                        <h2>Identity Records</h2>
                    </div>
                    <div className="card-body">
                        <div className="record-group">
                            <label>Full Legal Name</label>
                            <p>Nhlanhla Fortune Ngcobo</p>
                        </div>
                        <div className="record-group">
                            <label>Contact Details</label>
                            <p>{user?.email}</p>
                            <p className="text-secondary">{user?.phone || '+1 (503) 555-0192'}</p>
                        </div>
                        <div className="record-group">
                            <label>Primary Residence</label>
                            <p>{user?.address || '4282 Orchard Ridge Rd, Yamhill, OR 97148'}</p>
                        </div>
                        <div className="record-group border-top">
                            <label>Registry ID</label>
                            <p className="registry-id">{user?.registryId || 'GHW-OR-992-04'}</p>
                        </div>
                    </div>
                </div>

                {/* Parcel Intelligence & Stats */}
                <div className="stats-section">
                    {/* Main Parcel Card */}
                    <div className="card parcel-card">
                        <h3>Parcel Intelligence</h3>
                        <div className="parcel-stats">
                            <div className="stat">
                                <span className="stat-value">124.5</span>
                                <span className="stat-label">Total Acres</span>
                            </div>
                            <div className="stat">
                                <span className="stat-value">8.4</span>
                                <span className="stat-label">Mean Soil pH</span>
                            </div>
                            <div className="stat">
                                <span className="stat-value">98%</span>
                                <span className="stat-label">Irrigation Efficiency</span>
                            </div>
                        </div>
                    </div>

                    {/* Small Stat Modules */}
                    <div className="stat-modules">
                        <div className="stat-card">
                            <div className="stat-header">
                                <BarChart3 size={20} className="text-primary" />
                                <span className="badge">Active</span>
                            </div>
                            <p className="stat-title">Hazelnuts</p>
                            <p className="stat-subtitle">Primary Commodity</p>
                        </div>
                        <div className="stat-card">
                            <div className="stat-header">
                                <Droplet size={20} className="text-tertiary" />
                                <span className="badge optimal">Optimal</span>
                            </div>
                            <p className="stat-title">Spring-Fed</p>
                            <p className="stat-subtitle">Water Source</p>
                        </div>
                        <div className="stat-card">
                            <div className="stat-header">
                                <Clock size={20} className="text-secondary" />
                            </div>
                            <p className="stat-title">12 Years</p>
                            <p className="stat-subtitle">Legacy Tenure</p>
                        </div>
                    </div>
                </div>

                {/* Compliance Ledger */}
                <div className="card compliance-card">
                    <div className="card-header">
                        <div>
                            <h2>Compliance Ledger</h2>
                            <p className="card-subtitle">Audit status of legal certifications and permits</p>
                        </div>
                    </div>
                    <div className="compliance-list">
                        {mockComplianceDocs.map(doc => (
                            <div key={doc.id} className="compliance-item">
                                <div className="compliance-info">
                                    <FileText size={20} />
                                    <div>
                                        <p className="compliance-title">{doc.title}</p>
                                        <p className="compliance-meta">{doc.docId} • {doc.expiry || doc.note}</p>
                                    </div>
                                </div>
                                <span className={`status-badge ${doc.status}`}>
                                    {doc.status === 'compliant' ? 'Compliant' : 'Pending'}
                                </span>
                            </div>
                        ))}
                    </div>
                    <button className="btn-view-all" onClick={() => navigate('/compliance')}>View All Documents</button>
                </div>

                {/* Visit Chronology */}
                <div className="card visit-card">
                    <div className="card-header">
                        <h2>Visit Chronology</h2>
                    </div>
                    <div className="visit-timeline">
                        {mockVisits.map((visit, idx) => (
                            <div key={visit.id} className="timeline-item">
                                <div className="timeline-marker" style={{ order: 0 }}></div>
                                <div className="timeline-content">
                                    <p className="visit-date">{visit.date}</p>
                                    <h4>{visit.title}</h4>
                                    <p className="visit-description">{visit.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <button className="btn-view-all" onClick={() => navigate('/field-visits')}>View Complete Timeline</button>
                </div>
            </div>
        </div>
    );
}
