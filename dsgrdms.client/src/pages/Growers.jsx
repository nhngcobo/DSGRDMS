import { useState, useEffect, useCallback } from 'react';
import { Eye, Plus, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import NewGrowerModal from '../components/modals/NewGrowerModal';
import { useT } from '../hooks/useT';
import { fetchGrowers } from '../services/growersApi';
import { useNotification } from '../context/NotificationContext';
import { friendlyError } from '../utils/apiErrors';
import './Growers.css';

export default function Growers() {
    const t = useT();
    const tg = t.growers;
    const navigate = useNavigate();
    const { showError } = useNotification();
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState(tg.filters.all);
    const [showModal, setShowModal] = useState(false);
    const [growers, setGrowers] = useState([]);
    const [loading, setLoading] = useState(true);

    const STATUS_FILTERS = [tg.filters.all, tg.filters.pending, tg.filters.verified];

    const loadGrowers = useCallback(async () => {
        setLoading(true);
        try {
            const data = await fetchGrowers();
            setGrowers(data);
        } catch (err) {
            showError(friendlyError(err));
        } finally {
            setLoading(false);
        }
    }, [showError]);

    useEffect(() => { loadGrowers(); }, [loadGrowers]);

    const visible = growers.filter(g => {
        const matchesFilter =
            filter === tg.filters.all ||
            g.status === filter.toLowerCase();
        const q = search.toLowerCase();
        const matchesSearch =
            !q ||
            g.name.toLowerCase().includes(q) ||
            g.id.toLowerCase().includes(q);
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

                {/* States */}
                {loading && <div className="growers-state">Loading growers…</div>}

                {/* Table */}
                {!loading && (
                    <table className="growers-table">
                        <thead>
                            <tr>
                                <th>{tg.table.id}</th>
                                <th>{tg.table.name}</th>
                                <th>{tg.table.farmSize}</th>
                                <th>{tg.table.status}</th>
                                <th>{tg.table.complianceScore}</th>
                                <th>{tg.table.riskLevel}</th>
                                <th>{tg.table.actions}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {visible.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="growers-state">{tg.emptyState ?? 'No growers found.'}</td>
                                </tr>
                            ) : visible.map(g => (
                                <tr key={g.id}>
                                    <td className="grower-id">{g.id}</td>
                                    <td>
                                        <div className="grower-name">{g.name}</div>
                                        <div className="grower-email">{g.email}</div>
                                    </td>
                                    <td>{g.farmSize ?? <span className="na">{tg.table.na}</span>}</td>
                                    <td><span className={`badge badge-status-${g.status}`}>{g.status}</span></td>
                                    <td>
                                        {g.compliance !== null && g.compliance !== undefined ? (
                                            <div className="compliance-cell">
                                                <div className="compliance-bar">
                                                    <div className="compliance-fill" style={{ width: `${g.compliance}%` }} />
                                                </div>
                                                <span>{g.compliance}%</span>
                                            </div>
                                        ) : (
                                            <span className="na">{tg.table.na}</span>
                                        )}
                                    </td>
                                    <td><span className={`badge badge-risk-${g.risk}`}>{g.risk}</span></td>
                                    <td>
                                        <button className="btn-view" onClick={() => navigate(`/growers/${g.id}`)}>                                            
                                            <Eye size={14} />
                                            {tg.table.view}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {showModal && (
                <NewGrowerModal
                    onClose={() => setShowModal(false)}
                    onSubmit={() => loadGrowers()}
                />
            )}
        </div>
    );
}

