                            import { useState } from 'react';
import { Eye, Plus, Search } from 'lucide-react';
import NewGrowerModal from '../components/modals/NewGrowerModal';
import { useT } from '../hooks/useT';
import './Growers.css';

const MOCK_GROWERS = [
    { id: 'G001', name: 'James Mwangi',  email: 'james.mwangi@email.com',  location: 'Kiambu County',   farmSize: '2.5 ha', status: 'verified', compliance: 92,  risk: 'low' },
    { id: 'G002', name: 'Mary Wanjiku',  email: 'mary.wanjiku@email.com',   location: "Murang'a County", farmSize: '1.8 ha', status: 'pending',  compliance: null, risk: 'medium' },
    { id: 'G003', name: 'Peter Kamau',   email: 'peter.kamau@email.com',    location: 'Nyeri County',    farmSize: '3.2 ha', status: 'verified', compliance: 87,  risk: 'low' },
    { id: 'G004', name: 'Grace Akinyi',  email: 'grace.akinyi@email.com',   location: 'Kisumu County',   farmSize: '1.2 ha', status: 'returned', compliance: null, risk: 'high' },
    { id: 'G005', name: 'Robert Omondi', email: 'robert.omondi@email.com',  location: 'Siaya County',    farmSize: '0.8 ha', status: 'rejected', compliance: null, risk: 'high' },
];

export default function Growers() {
    const t = useT();
    const tg = t.growers;
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState(tg.filters.all);
    const [showModal, setShowModal] = useState(false);

    const STATUS_FILTERS = [tg.filters.all, tg.filters.pending, tg.filters.verified];

    const visible = MOCK_GROWERS.filter(g => {
        const matchesFilter =
            filter === tg.filters.all ||
            g.status === filter.toLowerCase();
        const q = search.toLowerCase();
        const matchesSearch =
            !q ||
            g.name.toLowerCase().includes(q) ||
            g.id.toLowerCase().includes(q) ||
            g.location.toLowerCase().includes(q);
        return matchesFilter && matchesSearch;
    });

    return (
        <div className="growers-page">
            <div className="growers-header">
                <div>
                    <h1>{tg.title}</h1>
                    <p>{tg.subtitle}</p>
                </div>
                <button className="btn-primary" onClick={() => setShowModal(true)}>
                    <Plus size={16} />
                    {tg.newRegistration}
                </button>
            </div>

            <div className="growers-table-card">
                {/* Toolbar */}
                <div className="growers-toolbar">
                    <div className="search-box">
                        <Search size={15} className="search-icon" />
                        <input
                            type="text"
                            placeholder={tg.searchPlaceholder}
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="filter-group">
                        {STATUS_FILTERS.map(f => (
                            <button
                                key={f}
                                className={'filter-btn' + (filter === f ? ' active' : '')}
                                onClick={() => setFilter(f)}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Table */}
                <table className="growers-table">
                    <thead>
                        <tr>
                            <th>{tg.table.id}</th>
                            <th>{tg.table.name}</th>
                            <th>{tg.table.location}</th>
                            <th>{tg.table.farmSize}</th>
                            <th>{tg.table.status}</th>
                            <th>{tg.table.complianceScore}</th>
                            <th>{tg.table.riskLevel}</th>
                            <th>{tg.table.actions}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {visible.map(g => (
                            <tr key={g.id}>
                                <td className="grower-id">{g.id}</td>
                                <td>
                                    <div className="grower-name">{g.name}</div>
                                    <div className="grower-email">{g.email}</div>
                                </td>
                                <td>{g.location}</td>
                                <td>{g.farmSize}</td>
                                <td><span className={`badge badge-status-${g.status}`}>{g.status}</span></td>
                                <td>
                                    {g.compliance !== null ? (
                                        <div className="compliance-cell">
                                            <div className="compliance-bar">
                                                <div
                                                    className="compliance-fill"
                                                    style={{ width: `${g.compliance}%` }}
                                                />
                                            </div>
                                            <span>{g.compliance}%</span>
                                        </div>
                                    ) : (
                                        <span className="na">{tg.table.na}</span>
                                    )}
                                </td>
                                <td><span className={`badge badge-risk-${g.risk}`}>{g.risk}</span></td>
                                <td>
                                    <button className="btn-view">
                                        <Eye size={14} />
                                        {tg.table.view}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <NewGrowerModal onClose={() => setShowModal(false)} />
            )}
        </div>
    );
}

