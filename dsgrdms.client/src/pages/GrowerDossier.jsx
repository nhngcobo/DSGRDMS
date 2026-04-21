import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { MapPin, FileText, BarChart3, Droplet, Clock, Search, Calendar, User } from 'lucide-react';
import { fetchGrowerById } from '../services/growersApi';
import { fetchComplianceSummary } from '../services/complianceApi';
import { fieldVisitsApi } from '../services/fieldVisitsApi';
import { useNotification } from '../context/NotificationContext';
import { friendlyError } from '../utils/apiErrors';
import './GrowerDossier.css';

export default function GrowerDossier() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { showError } = useNotification();
    const [searchQuery, setSearchQuery] = useState('');
    const [growerData, setGrowerData] = useState(null);
    const [complianceData, setComplianceData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [upcomingVisits, setUpcomingVisits] = useState([]);

    useEffect(() => {
        async function loadData() {
            if (!user?.growerId) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                const [grower, compliance, upcoming] = await Promise.all([
                    fetchGrowerById(user.growerId),
                    fetchComplianceSummary(user.growerId).catch(() => null),
                    fieldVisitsApi.getUpcoming(user.growerId).catch(() => [])
                ]);
                
                setGrowerData(grower);
                setComplianceData(compliance);
                setUpcomingVisits(upcoming);
            } catch (err) {
                showError(friendlyError(err));
            } finally {
                setLoading(false);
            }
        }

        loadData();
    }, [user?.growerId, showError]);

    if (loading) {
        return <div className="grower-dossier"><div className="loading">Loading your profile...</div></div>;
    }

    if (!user?.growerId || !growerData) {
        return (
            <div className="grower-dossier">
                <div className="empty-state">
                    <p>No grower profile found. Please contact support.</p>
                </div>
            </div>
        );
    }

    const fullName = growerData.name || `${growerData.firstName || ''} ${growerData.lastName || ''}`.trim();
    const approvedDocs = complianceData?.documents?.filter(d => d.status === 'approved') || [];
    const pendingDocs = complianceData?.documents?.filter(d => d.status === 'pending_review') || [];
    const complianceRate = complianceData?.complianceScore ?? 0;

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
                    <div className="grower-avatar">
                        {fullName.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </div>
                    <div className="header-info">
                        <h1>{fullName}</h1>
                        {growerData.businessName && (
                            <p style={{ fontSize: '16px', color: '#426468', fontWeight: '400', marginTop: '4px' }}>
                                {growerData.businessName}
                            </p>
                        )}
                        <div className="header-meta">
                            <span className={`status-badge ${growerData.status}`}>
                                {growerData.status === 'approved' ? 'Verified Grower' : growerData.status}
                            </span>
                            {growerData.gpsLat && growerData.gpsLng && (
                                <span className="location">
                                    <MapPin size={14} />
                                    Lat: {growerData.gpsLat.toFixed(6)}, Lng: {growerData.gpsLng.toFixed(6)}
                                </span>
                            )}
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
                            <p>{fullName}</p>
                        </div>
                        <div className="record-group">
                            <label>Contact Details</label>
                            <p>{growerData.email || 'Not provided'}</p>
                            <p className="text-secondary">{growerData.phone}</p>
                        </div>
                        <div className="record-group">
                            <label>ID Number</label>
                            <p>{growerData.idNumber}</p>
                        </div>
                        {growerData.businessName && (
                            <div className="record-group">
                                <label>Business Name</label>
                                <p>{growerData.businessName}</p>
                                {growerData.businessRegNumber && (
                                    <p className="text-secondary">Reg: {growerData.businessRegNumber}</p>
                                )}
                            </div>
                        )}
                        <div className="record-group border-top">
                            <label>Grower ID</label>
                            <p className="registry-id">{growerData.id}</p>
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
                                <span className="stat-value">{growerData.plantationSize ? growerData.plantationSize.toFixed(1) : '0.0'}</span>
                                <span className="stat-label">Hectares (Total Plantation)</span>
                            </div>
                            <div className="stat">
                                <span className="stat-value">{complianceRate}%</span>
                                <span className="stat-label">Compliance Score</span>
                            </div>
                            <div className="stat">
                                <span className="stat-value" style={{ fontSize: growerData.treeSpecies && growerData.treeSpecies.length > 15 ? '1.5rem' : '2rem' }}>
                                    {growerData.treeSpecies || 'Not specified'}
                                </span>
                                <span className="stat-label">Primary Tree Species</span>
                            </div>
                        </div>
                    </div>

                    {/* Small Stat Modules */}
                    <div className="stat-modules">
                        <div className="stat-card">
                            <div className="stat-header">
                                <BarChart3 size={20} className="text-primary" />
                                <span className="badge">{growerData.status}</span>
                            </div>
                            <p className="stat-title">{growerData.landTenure || 'Not specified'}</p>
                            <p className="stat-subtitle">Land Tenure</p>
                        </div>
                        <div className="stat-card">
                            <div className="stat-header">
                                <Droplet size={20} className="text-tertiary" />
                                <span className="badge optimal">{approvedDocs.length}</span>
                            </div>
                            <p className="stat-title">Approved</p>
                            <p className="stat-subtitle">Documents</p>
                        </div>
                        <div className="stat-card">
                            <div className="stat-header">
                                <Clock size={20} className="text-secondary" />
                            </div>
                            <p className="stat-title">
                                {new Date(growerData.registeredAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                            </p>
                            <p className="stat-subtitle">Registered</p>
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
                        {complianceData?.documents && complianceData.documents.length > 0 ? (
                            complianceData.documents.slice(0, 6).map(doc => (
                                <div key={doc.docTypeId} className="compliance-item">
                                    <div className="compliance-info">
                                        <FileText size={20} />
                                        <div>
                                            <p className="compliance-title">{doc.documentName}</p>
                                            <p className="compliance-meta">
                                                {doc.uploadedAt 
                                                    ? `Uploaded ${new Date(doc.uploadedAt).toLocaleDateString()}`
                                                    : 'Not uploaded'}
                                            </p>
                                        </div>
                                    </div>
                                    <span className={`status-badge ${doc.status}`}>
                                        {doc.status === 'approved' ? 'Approved' : 
                                         doc.status === 'pending_review' ? 'Pending' : 
                                         doc.status === 'rejected' ? 'Rejected' : 'Not Uploaded'}
                                    </span>
                                </div>
                            ))
                        ) : (
                            <div className="empty-state">
                                <p>No compliance documents yet</p>
                            </div>
                        )}
                    </div>
                    <button className="btn-view-all" onClick={() => navigate('/compliance')}>View All Documents</button>
                </div>

                {/* Visit Chronology */}
                <div className="card visit-card">
                    <div className="card-header">
                        <h2>Upcoming Visits</h2>
                        <p className="card-subtitle">Scheduled field officer visits</p>
                    </div>
                    <div className="upcoming-visits">
                        {upcomingVisits.length > 0 ? (
                            upcomingVisits.map(visit => (
                                <div key={visit.id} className="visit-item">
                                    <div className="visit-date-badge">
                                        <Calendar size={16} />
                                        <div>
                                            <p className="visit-date">
                                                {new Date(visit.scheduledDate).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }).toUpperCase()}
                                            </p>
                                            <p className="visit-time">{visit.scheduledTime}</p>
                                        </div>
                                    </div>
                                    <div className="visit-details">
                                        <h3>{visit.title}</h3>
                                        <div className="visit-meta">
                                            <span className="visit-officer">
                                                <User size={14} />
                                                {visit.officerName || 'Assigned Officer'}
                                            </span>
                                            <span className="visit-location">
                                                <MapPin size={14} />
                                                {growerData.gpsLat && growerData.gpsLng 
                                                    ? `${growerData.gpsLat.toFixed(6)}, ${growerData.gpsLng.toFixed(6)}`
                                                    : 'Location TBD'}
                                            </span>
                                        </div>
                                    </div>
                                    <span className={`priority-badge ${visit.priority}`}>
                                        {visit.priority === 'high' ? 'HIGH PRIORITY' : visit.priority === 'critical' ? 'CRITICAL' : 'NORMAL'}
                                    </span>
                                </div>
                            ))
                        ) : (
                            <p className="empty-state">No upcoming visits scheduled</p>
                        )}
                    </div>
                </div>

                {/* Farm Location Map */}
                {growerData.gpsLat && growerData.gpsLng && (
                    <div className="card map-card">
                        <div className="card-header">
                            <h2>Farm Location</h2>
                            <p className="card-subtitle">
                                GPS Coordinates: {growerData.gpsLat.toFixed(6)}, {growerData.gpsLng.toFixed(6)}
                            </p>
                        </div>
                        <div className="map-container">
                            <iframe
                                title="Farm Location Map"
                                width="100%"
                                height="450"
                                style={{ border: 0 }}
                                loading="lazy"
                                allowFullScreen
                                referrerPolicy="no-referrer-when-downgrade"
                                src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${growerData.gpsLat},${growerData.gpsLng}&zoom=15&maptype=satellite`}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
